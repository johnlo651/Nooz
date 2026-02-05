import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { articlesAPI } from '../utils/api';

export const TrendingSidebar = () => {
  const [trendingArticles, setTrendingArticles] = useState([]);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const res = await articlesAPI.getArticles({ limit: 5 });
      setTrendingArticles(res.data);
    } catch (error) {
      console.error('Error loading trending:', error);
    }
  };

  return (
    <div className="sticky top-20">
      <div className="card-brutal">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-bold uppercase text-lg">TRENDING NOW</h3>
        </div>

        <div className="space-y-4">
          {trendingArticles.map((article, idx) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="block group"
              data-testid={`trending-article-${idx + 1}`}
            >
              <div className="flex gap-3">
                <span className="font-heading text-2xl font-bold text-primary">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors duration-150 mb-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 terminal-text text-xs text-muted-foreground">
                    <span className="uppercase">{article.source_name}</span>
                    {article.categories?.[0] && (
                      <>
                        <span>•</span>
                        <span>{article.categories[0]}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories Overview */}
      <div className="card-brutal mt-4">
        <h3 className="font-mono text-xs uppercase mb-4 text-muted-foreground">CATEGORIES</h3>
        <div className="space-y-2 terminal-text text-sm">
          {[
            { name: 'AI', count: 12 },
            { name: 'Apple', count: 8 },
            { name: 'Tesla', count: 5 },
            { name: 'Crypto', count: 4 },
            { name: 'Climate', count: 3 },
            { name: 'Politics', count: 6 },
            { name: 'Finance', count: 7 }
          ].map(cat => (
            <Link
              key={cat.name}
              to={`/?category=${cat.name}`}
              className="flex items-center justify-between hover:text-primary transition-colors duration-150"
            >
              <span>{cat.name}</span>
              <span className="text-muted-foreground">{cat.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
