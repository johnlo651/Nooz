from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import feedparser
import aiohttp
from bs4 import BeautifulSoup
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_MINUTES = int(os.environ.get('JWT_EXPIRE_MINUTES', 10080))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ===================== MODELS =====================

class Source(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rss_url: str
    website_url: Optional[str] = None
    description: Optional[str] = None
    priority: str = "medium"
    is_active: bool = True
    scrape_interval_minutes: int = 60
    last_scrape: Optional[str] = None
    categories: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SourceCreate(BaseModel):
    name: str
    rss_url: str
    website_url: Optional[str] = None
    description: Optional[str] = None
    priority: str = "medium"
    is_active: bool = True
    scrape_interval_minutes: int = 60
    categories: List[str] = []


class SourceUpdate(BaseModel):
    name: Optional[str] = None
    rss_url: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None
    scrape_interval_minutes: Optional[int] = None
    categories: Optional[List[str]] = None


class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    source_id: str
    source_name: str
    content: Optional[str] = None
    excerpt: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[str] = None
    status: str = "pending"
    categories: List[str] = []
    tags: List[str] = []
    read_time_minutes: Optional[int] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Summary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    article_id: str
    executive_summary: str
    key_points: List[str] = []
    analysis: Optional[str] = None
    takeaways: List[str] = []
    summary_read_time_minutes: int = 1
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    display_name: Optional[str] = None
    role: str = "viewer"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Bookmark(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    article_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AnalyticsEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    article_id: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ScrapeRequest(BaseModel):
    category: Optional[str] = None


class ScrapeResult(BaseModel):
    source_name: str
    articles_found: int
    articles_added: int
    status: str


# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[dict]:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except:
        return None


# ===================== RSS SCRAPER =====================

async def fetch_rss_feed(url: str) -> Optional[Dict]:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    content = await response.text()
                    return feedparser.parse(content)
    except Exception as e:
        logger.error(f"Error fetching RSS feed {url}: {e}")
    return None


async def extract_article_content(url: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=20)) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'lxml')
                    
                    # Extract featured image first
                    image_url = None
                    
                    # Try og:image meta tag
                    og_image = soup.find('meta', property='og:image')
                    if og_image and og_image.get('content'):
                        image_url = og_image['content']
                    
                    # Try twitter:image meta tag
                    if not image_url:
                        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
                        if twitter_image and twitter_image.get('content'):
                            image_url = twitter_image['content']
                    
                    # Try article:image meta tag
                    if not image_url:
                        article_image = soup.find('meta', property='article:image')
                        if article_image and article_image.get('content'):
                            image_url = article_image['content']
                    
                    # Try to find first large image in article content
                    if not image_url:
                        article_elem = soup.find(['article', 'main'])
                        if article_elem:
                            img = article_elem.find('img')
                            if img and img.get('src'):
                                img_src = img['src']
                                # Make absolute URL if relative
                                if img_src.startswith('//'):
                                    img_src = 'https:' + img_src
                                elif img_src.startswith('/'):
                                    from urllib.parse import urlparse
                                    parsed = urlparse(url)
                                    img_src = f"{parsed.scheme}://{parsed.netloc}{img_src}"
                                image_url = img_src
                    
                    # Remove script and style elements
                    for script in soup(["script", "style", "nav", "header", "footer"]):
                        script.decompose()
                    
                    # Try to find main content
                    content = None
                    for tag in ['article', 'main', 'div[class*="content"]']:
                        element = soup.find(tag)
                        if element:
                            content = element.get_text(separator='\n', strip=True)
                            break
                    
                    if not content:
                        content = soup.get_text(separator='\n', strip=True)
                    
                    # Clean up content
                    lines = [line.strip() for line in content.split('\n') if line.strip()]
                    content = '\n'.join(lines)
                    
                    # Get excerpt (first 300 chars)
                    excerpt = content[:300] + "..." if len(content) > 300 else content
                    
                    return content[:15000], excerpt, image_url
    except Exception as e:
        logger.error(f"Error extracting content from {url}: {e}")
    return None, None, None


def calculate_read_time(text: str) -> int:
    words = len(text.split())
    return max(1, words // 200)


async def scrape_source(source: dict) -> ScrapeResult:
    try:
        feed = await fetch_rss_feed(source['rss_url'])
        if not feed or not feed.entries:
            return ScrapeResult(source_name=source['name'], articles_found=0, articles_added=0, status="no_entries")
        
        articles_found = len(feed.entries)
        articles_added = 0
        
        for entry in feed.entries[:10]:
            try:
                article_url = entry.get('link', '')
                if not article_url:
                    continue
                
                # Check if article already exists
                existing = await db.articles.find_one({"url": article_url}, {"_id": 0})
                if existing:
                    continue
                
                # Extract content
                content, excerpt = await extract_article_content(article_url)
                
                # Get image
                image_url = None
                if hasattr(entry, 'media_content') and entry.media_content:
                    image_url = entry.media_content[0].get('url')
                elif hasattr(entry, 'enclosures') and entry.enclosures:
                    image_url = entry.enclosures[0].get('href')
                
                # Create article
                article_data = {
                    "id": str(uuid.uuid4()),
                    "title": entry.get('title', 'Untitled'),
                    "url": article_url,
                    "source_id": source['id'],
                    "source_name": source['name'],
                    "content": content,
                    "excerpt": excerpt,
                    "image_url": image_url,
                    "author": entry.get('author', None),
                    "published_at": datetime(*entry.published_parsed[:6]).isoformat() if hasattr(entry, 'published_parsed') else None,
                    "status": "pending",
                    "categories": source.get('categories', []),
                    "tags": [],
                    "read_time_minutes": calculate_read_time(content) if content else 5,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.articles.insert_one(article_data)
                articles_added += 1
                
            except Exception as e:
                logger.error(f"Error processing article: {e}")
                continue
        
        # Update last_scrape timestamp
        await db.sources.update_one(
            {"id": source['id']},
            {"$set": {"last_scrape": datetime.now(timezone.utc).isoformat()}}
        )
        
        return ScrapeResult(source_name=source['name'], articles_found=articles_found, articles_added=articles_added, status="success")
    
    except Exception as e:
        logger.error(f"Error scraping source {source['name']}: {e}")
        return ScrapeResult(source_name=source['name'], articles_found=0, articles_added=0, status=f"error: {str(e)}")


# ===================== AI SUMMARIZER =====================

async def generate_summary(article_id: str) -> Optional[Summary]:
    try:
        article = await db.articles.find_one({"id": article_id}, {"_id": 0})
        if not article or not article.get('content'):
            return None
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"summarize-{article_id}",
            system_message="You are an expert news summarizer. Generate concise, insightful summaries of news articles."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Analyze and summarize this news article:

Title: {article['title']}
Content: {article['content'][:8000]}

Provide a structured summary in the following JSON format:
{{
    "executive_summary": "A 2-3 sentence overview of the article",
    "key_points": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "analysis": "A brief analysis or context about why this matters",
    "takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
}}

Keep it concise and focused on the most important information."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        import json
        try:
            # Try to extract JSON from response
            response_text = str(response)
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                summary_data = json.loads(response_text[start_idx:end_idx])
            else:
                # Fallback
                summary_data = {
                    "executive_summary": response_text[:300],
                    "key_points": ["Summary generated"],
                    "analysis": "Analysis pending",
                    "takeaways": ["See full article for details"]
                }
        except:
            summary_data = {
                "executive_summary": str(response)[:300],
                "key_points": ["Summary generated"],
                "analysis": "Analysis pending",
                "takeaways": ["See full article for details"]
            }
        
        summary = Summary(
            article_id=article_id,
            executive_summary=summary_data.get('executive_summary', ''),
            key_points=summary_data.get('key_points', []),
            analysis=summary_data.get('analysis', ''),
            takeaways=summary_data.get('takeaways', [])
        )
        
        await db.summaries.insert_one(summary.model_dump())
        await db.articles.update_one({"id": article_id}, {"$set": {"status": "published"}})
        
        return summary
    
    except Exception as e:
        logger.error(f"Error generating summary for article {article_id}: {e}")
        await db.articles.update_one({"id": article_id}, {"$set": {"status": "failed"}})
        return None


# ===================== API ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "NOOZ.NEWS API", "status": "online"}


# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        display_name=user_data.display_name or user_data.email.split('@')[0],
        role="viewer"
    )
    
    user_doc = user.model_dump()
    user_doc['password_hash'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return {"token": token, "user": user.model_dump()}


@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user_doc['id'], "email": user_doc['email']})
    
    user_doc.pop('password_hash', None)
    return {"token": token, "user": user_doc}


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


# Source Routes
@api_router.get("/sources", response_model=List[Source])
async def get_sources(is_active: Optional[bool] = None):
    query = {}
    if is_active is not None:
        query['is_active'] = is_active
    sources = await db.sources.find(query, {"_id": 0}).to_list(1000)
    return sources


@api_router.post("/sources", response_model=Source)
async def create_source(source_data: SourceCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    source = Source(**source_data.model_dump())
    await db.sources.insert_one(source.model_dump())
    return source


@api_router.put("/sources/{source_id}", response_model=Source)
async def update_source(source_id: str, update_data: SourceUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.sources.find_one_and_update(
        {"id": source_id},
        {"$set": update_dict},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Source not found")
    
    result.pop('_id', None)
    return result


@api_router.delete("/sources/{source_id}")
async def delete_source(source_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.sources.delete_one({"id": source_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Source not found")
    
    return {"message": "Source deleted"}


# Article Routes
@api_router.get("/articles")
async def get_articles(
    category: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    query = {}
    if category:
        query['categories'] = category
    if status:
        query['status'] = status
    else:
        query['status'] = "published"
    
    articles = await db.articles.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    # Attach summaries
    for article in articles:
        summary = await db.summaries.find_one({"article_id": article['id']}, {"_id": 0})
        if summary:
            article['summary'] = summary
    
    return articles


@api_router.get("/articles/featured")
async def get_featured_article():
    article = await db.articles.find_one({"status": "published"}, {"_id": 0}, sort=[("created_at", -1)])
    if article:
        summary = await db.summaries.find_one({"article_id": article['id']}, {"_id": 0})
        if summary:
            article['summary'] = summary
    return article


@api_router.get("/articles/{article_id}")
async def get_article(article_id: str):
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    summary = await db.summaries.find_one({"article_id": article_id}, {"_id": 0})
    if summary:
        article['summary'] = summary
    
    return article


# Scraping Routes
@api_router.post("/scrape")
async def scrape_news(request: ScrapeRequest, background_tasks: BackgroundTasks, current_user: Optional[dict] = Depends(get_optional_user)):
    if current_user and current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"is_active": True}
    if request.category:
        query['categories'] = request.category
    
    sources = await db.sources.find(query, {"_id": 0}).to_list(1000)
    if not sources:
        raise HTTPException(status_code=404, detail="No active sources found")
    
    results = []
    for source in sources[:5]:  # Limit to 5 sources per request
        result = await scrape_source(source)
        results.append(result.model_dump())
        
        # Summarize new articles
        if result.articles_added > 0:
            articles = await db.articles.find({"source_id": source['id'], "status": "pending"}, {"_id": 0}).limit(result.articles_added).to_list(result.articles_added)
            for article in articles:
                background_tasks.add_task(generate_summary, article['id'])
    
    return {"results": results, "total_sources": len(sources)}


@api_router.post("/summarize/{article_id}")
async def summarize_article(article_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    summary = await generate_summary(article_id)
    if not summary:
        raise HTTPException(status_code=400, detail="Could not generate summary")
    
    return summary


# Bookmark Routes
@api_router.get("/bookmarks")
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    bookmarks = await db.bookmarks.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    
    # Fetch article details
    article_ids = [b['article_id'] for b in bookmarks]
    articles = await db.articles.find({"id": {"$in": article_ids}}, {"_id": 0}).to_list(len(article_ids))
    
    return articles


@api_router.post("/bookmarks/{article_id}")
async def add_bookmark(article_id: str, current_user: dict = Depends(get_current_user)):
    existing = await db.bookmarks.find_one({"user_id": current_user['id'], "article_id": article_id}, {"_id": 0})
    if existing:
        return {"message": "Already bookmarked"}
    
    bookmark = Bookmark(user_id=current_user['id'], article_id=article_id)
    await db.bookmarks.insert_one(bookmark.model_dump())
    return {"message": "Bookmarked"}


@api_router.delete("/bookmarks/{article_id}")
async def remove_bookmark(article_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.bookmarks.delete_one({"user_id": current_user['id'], "article_id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark removed"}


# Analytics Routes
@api_router.post("/analytics/event")
async def track_event(event: AnalyticsEvent, current_user: Optional[dict] = Depends(get_optional_user)):
    if current_user:
        event.user_id = current_user['id']
    await db.analytics_events.insert_one(event.model_dump())
    return {"message": "Event tracked"}


@api_router.get("/analytics/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_articles = await db.articles.count_documents({"status": "published"})
    total_sources = await db.sources.count_documents({"is_active": True})
    total_users = await db.users.count_documents({})
    
    # Recent analytics
    page_views = await db.analytics_events.count_documents({"event_type": "page_view"})
    article_reads = await db.analytics_events.count_documents({"event_type": "article_read"})
    
    return {
        "total_articles": total_articles,
        "total_sources": total_sources,
        "total_users": total_users,
        "page_views": page_views,
        "article_reads": article_reads
    }


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_db():
    # Create indexes
    await db.articles.create_index("url", unique=True)
    await db.articles.create_index("status")
    await db.articles.create_index("categories")
    await db.users.create_index("email", unique=True)
    await db.bookmarks.create_index([("user_id", 1), ("article_id", 1)], unique=True)
    
    # Seed default sources if none exist
    count = await db.sources.count_documents({})
    if count == 0:
        default_sources = [
            {
                "id": str(uuid.uuid4()),
                "name": "TechCrunch",
                "rss_url": "https://techcrunch.com/feed/",
                "website_url": "https://techcrunch.com",
                "description": "Technology news and analysis",
                "priority": "high",
                "is_active": True,
                "scrape_interval_minutes": 60,
                "categories": ["AI", "Apple", "Tesla", "Crypto"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "The Verge",
                "rss_url": "https://www.theverge.com/rss/index.xml",
                "website_url": "https://www.theverge.com",
                "description": "Technology and culture",
                "priority": "high",
                "is_active": True,
                "scrape_interval_minutes": 60,
                "categories": ["AI", "Apple", "Tesla", "Climate"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Wired",
                "rss_url": "https://www.wired.com/feed/rss",
                "website_url": "https://www.wired.com",
                "description": "Technology and science",
                "priority": "high",
                "is_active": True,
                "scrape_interval_minutes": 60,
                "categories": ["AI", "Crypto", "Climate"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Ars Technica",
                "rss_url": "https://feeds.arstechnica.com/arstechnica/index",
                "website_url": "https://arstechnica.com",
                "description": "Technology and science news",
                "priority": "medium",
                "is_active": True,
                "scrape_interval_minutes": 60,
                "categories": ["AI", "Apple", "Tesla"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Reuters",
                "rss_url": "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
                "website_url": "https://www.reuters.com",
                "description": "Global news",
                "priority": "medium",
                "is_active": True,
                "scrape_interval_minutes": 60,
                "categories": ["Politics", "Finance", "Climate"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.sources.insert_many(default_sources)
        logger.info("Seeded default news sources")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
