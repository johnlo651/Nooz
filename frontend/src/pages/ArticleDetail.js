import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header, Footer } from '../components/Layout';
import { articlesAPI, bookmarksAPI, analyticsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Clock, Eye, ExternalLink, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export const ArticleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const res = await articlesAPI.getArticle(id);
      setArticle(res.data);
      analyticsAPI.trackEvent({ 
        event_type: 'article_read', 
        article_id: id,
        metadata: { title: res.data.title }
      });
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    try {
      if (bookmarked) {
        await bookmarksAPI.removeBookmark(id);
        setBookmarked(false);
      } else {
        await bookmarksAPI.addBookmark(id);
        setBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="terminal-text text-muted-foreground">ARTICLE NOT FOUND</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {article.image_url && (
            <div className="relative mb-8 aspect-video overflow-hidden border border-border">
              <img 
                src={article.image_url} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-4">
            <span className="tag-accent" data-testid="article-source">{article.source_name}</span>
            {article.categories?.map(cat => (
              <span key={cat} className="tag" data-testid={`article-category-${cat.toLowerCase()}`}>{cat}</span>
            ))}
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase leading-tight mb-6" data-testid="article-title">
            {article.title}
          </h1>
          
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-4 terminal-text text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>AI: {article.summary?.summary_read_time_minutes || 1}m</span>
              </div>
              <span className="text-primary">vs</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>ORIG: {article.read_time_minutes || 5}m</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleShare}
                className="p-2 hover:bg-secondary transition-colors duration-150"
                data-testid="share-button"
              >
                <Share2 className="h-5 w-5" />
              </button>
              {user && (
                <button 
                  onClick={handleBookmark}
                  className="p-2 hover:bg-secondary transition-colors duration-150"
                  data-testid="bookmark-button"
                >
                  {bookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
          
          {article.summary && (
            <Tabs defaultValue="summary" className="mb-8">
              <TabsList className="mb-6">
                <TabsTrigger value="summary" data-testid="tab-summary">SUMMARY</TabsTrigger>
                <TabsTrigger value="key-points" data-testid="tab-key-points">KEY POINTS</TabsTrigger>
                <TabsTrigger value="analysis" data-testid="tab-analysis">ANALYSIS</TabsTrigger>
                <TabsTrigger value="takeaways" data-testid="tab-takeaways">TAKEAWAYS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary">
                <div className="card-brutal">
                  <p className="text-lg leading-relaxed">{article.summary.executive_summary}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="key-points">
                <div className="card-brutal">
                  <ul className="space-y-3">
                    {article.summary.key_points?.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-primary font-mono text-sm mt-1">→</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="analysis">
                <div className="card-brutal">
                  <p className="leading-relaxed">{article.summary.analysis}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="takeaways">
                <div className="card-brutal">
                  <ul className="space-y-3">
                    {article.summary.takeaways?.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-primary font-mono text-sm mt-1">✓</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="card-brutal mb-8 bg-secondary" data-testid="source-credits">
            <h3 className="font-mono text-xs uppercase mb-4 text-muted-foreground">SOURCE & CREDITS</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading font-bold mb-1">{article.source_name}</p>
                {article.author && <p className="terminal-text text-muted-foreground">By {article.author}</p>}
              </div>
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2"
                data-testid="read-original-link"
              >
                READ ORIGINAL
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
};
