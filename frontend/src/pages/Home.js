import React, { useState, useEffect } from 'react';
import { Header, Footer } from '../components/Layout';
import { ArticleCard } from '../components/ArticleCard';
import { CategoryNav } from '../components/CategoryNav';
import { TrendingSidebar } from '../components/TrendingSidebar';
import { articlesAPI, analyticsAPI } from '../utils/api';
import { Loader2 } from 'lucide-react';

export const Home = () => {
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    loadArticles();
    analyticsAPI.trackEvent({ event_type: 'page_view', metadata: { page: 'home' } });
  }, [category]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const [featuredRes, articlesRes] = await Promise.all([
        articlesAPI.getFeatured(),
        articlesAPI.getArticles({ category, limit: 20 })
      ]);
      
      setFeaturedArticle(featuredRes.data);
      setArticles(articlesRes.data);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CategoryNav activeCategory={category} onCategoryChange={setCategory} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {featuredArticle && (
                <section className="mb-12">
                  <ArticleCard article={featuredArticle} featured={true} />
                </section>
              )}
              
              <section>
                <h2 className="font-heading text-2xl font-bold uppercase tracking-tight mb-6">
                  LATEST STORIES
                </h2>
                
                <div className="masonry-grid" data-testid="articles-grid">
                  {articles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                
                {articles.length === 0 && (
                  <div className="text-center py-20">
                    <p className="terminal-text text-muted-foreground">NO ARTICLES FOUND</p>
                  </div>
                )}
              </section>
            </div>

            {/* Trending Sidebar */}
            <aside className="hidden xl:block w-80 flex-shrink-0">
              <TrendingSidebar />
            </aside>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};
