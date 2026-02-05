import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Bookmark, Headphones } from 'lucide-react';
import { useTTS } from '../utils/tts';

export const ArticleCard = ({ article, featured = false }) => {
  const { speak, isPlaying, currentArticle } = useTTS();
  const summary = article.summary?.executive_summary || article.excerpt || '';
  const isCurrentlyPlaying = isPlaying && currentArticle?.id === article.id;
  
  if (featured) {
    return (
      <Link 
        to={`/article/${article.id}`} 
        className="block relative group overflow-hidden border border-border bg-card hover:border-primary transition-colors duration-150"
        data-testid="featured-article-card"
      >
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          {article.image_url ? (
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-full h-full object-cover grayscale-hover"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="terminal-text text-muted-foreground">NO IMAGE</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="tag-accent" data-testid="article-source">{article.source_name}</span>
            {article.categories?.map(cat => (
              <span key={cat} className="tag" data-testid={`article-category-${cat.toLowerCase()}`}>{cat}</span>
            ))}
          </div>
          
          <h1 className="font-heading text-4xl md:text-6xl font-bold leading-none mb-4 uppercase tracking-tight">
            {article.title}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-4 line-clamp-2">
            {summary}
          </p>
          
          <div className="flex items-center gap-4 terminal-text text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="line-through opacity-50">{article.read_time_minutes || 5} min</span>
              <span className="text-primary">→</span>
              <span className="text-foreground font-bold">{article.summary?.summary_read_time_minutes || 1} min read</span>
              <span className="text-primary">({(article.read_time_minutes || 5) - (article.summary?.summary_read_time_minutes || 1)} min saved)</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                speak(article);
              }}
              className={`flex items-center gap-2 px-3 py-1 border transition-colors duration-150 ${
                isCurrentlyPlaying 
                  ? 'border-primary bg-primary text-black' 
                  : 'border-border hover:border-primary hover:text-primary'
              }`}
              data-testid="tts-button"
            >
              <Headphones className="h-3 w-3" />
              <span>LISTEN</span>
            </button>
          </div>
        </div>
      </Link>
    );
  }
  
  return (
    <Link 
      to={`/article/${article.id}`}
      className="block card-brutal group"
      data-testid="article-card"
    >
      <div className="relative overflow-hidden mb-4 aspect-video">
        {article.image_url ? (
          <img 
            src={article.image_url} 
            alt={article.title}
            className="w-full h-full object-cover grayscale-hover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="terminal-text text-muted-foreground">NO IMAGE</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <span className="tag" data-testid="article-source">{article.source_name}</span>
        {article.categories?.slice(0, 2).map(cat => (
          <span key={cat} className="tag" data-testid={`article-category-${cat.toLowerCase()}`}>{cat}</span>
        ))}
      </div>
      
      <h3 className="font-heading text-xl md:text-2xl font-bold mb-3 uppercase leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-150">
        {article.title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {summary}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 terminal-text text-xs text-muted-foreground">
          <span className="line-through opacity-50">{article.read_time_minutes || 5} min</span>
          <span className="text-primary">→</span>
          <span className="text-foreground">{article.summary?.summary_read_time_minutes || 1} min</span>
        </div>
        
        <button 
          className="p-2 hover:bg-secondary transition-colors duration-150"
          onClick={(e) => {
            e.preventDefault();
            // Bookmark functionality
          }}
          data-testid="bookmark-button"
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
    </Link>
  );
};
