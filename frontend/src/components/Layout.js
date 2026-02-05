import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export const Header = () => {
  return (
    <>
      {/* Status Bar */}
      <div className="border-b border-border bg-black">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between terminal-text text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-muted-foreground">SYSTEM STATUS:</span>
              <span className="text-primary">ONLINE</span>
            </div>
            <div>
              <span className="text-muted-foreground">LAST SCRAPE:</span>
              <span className="ml-2">2 MINS AGO</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">ARTICLES PROCESSED:</span>
            <span className="ml-2">847</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors duration-150">
              <span className="font-heading font-bold text-2xl tracking-tight">$/</span>
              <span className="font-heading font-bold text-2xl tracking-tight uppercase">SIFT</span>
            </Link>
            
            <nav className="flex items-center gap-6 terminal-text text-sm">
              <Link to="/" className="hover:text-primary transition-colors duration-150">FEED</Link>
              <Link to="/trending" className="hover:text-primary transition-colors duration-150">TRENDING</Link>
              <Link to="/sources" className="hover:text-primary transition-colors duration-150">SOURCES</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/admin/login" className="terminal-text text-sm hover:text-primary transition-colors duration-150" data-testid="admin-login-link">
                ADMIN
              </Link>
              <button className="btn-primary py-2 px-4 text-xs">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4 uppercase">$/SIFT</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered news curation. Long-form content, delivered in seconds.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase mb-4 text-muted-foreground">CATEGORIES</h4>
            <div className="flex flex-wrap gap-2">
              {['AI', 'Apple', 'Tesla', 'Crypto', 'Climate', 'Politics', 'Finance'].map(cat => (
                <Link key={cat} to={`/?category=${cat}`} className="tag" data-testid={`footer-category-${cat.toLowerCase()}`}>
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase mb-4 text-muted-foreground">POWERED BY</h4>
            <p className="terminal-text">Claude Sonnet 4.5</p>
            <p className="terminal-text text-muted-foreground">Real-time RSS feeds</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border terminal-text text-center text-muted-foreground">
          © 2025 SIFT. Built with Emergent AI.
        </div>
      </div>
    </footer>
  );
};
