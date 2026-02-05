import React, { useState, useEffect } from 'react';
import { Header, Footer } from '../components/Layout';
import { ArticleCard } from '../components/ArticleCard';
import { CategoryNav } from '../components/CategoryNav';
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
      
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {featuredArticle && (
              <section className="mb-8">
                <ArticleCard article={featuredArticle} featured={true} />
              </section>
            )}
            
            <section className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-bold uppercase tracking-tight">
                  {category ? `${category} NEWS` : 'LATEST STORIES'}
                </h2>
                <span className="terminal-text text-muted-foreground">{articles.length} ARTICLES</span>
              </div>
              
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
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};
