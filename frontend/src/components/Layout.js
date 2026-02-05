import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Terminal } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="noise-overlay"></div>
      <div className="flex h-14 items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors duration-150">
          <Terminal className="h-5 w-5" />
          <span className="font-heading font-bold text-xl tracking-tight uppercase">NOOZ.NEWS</span>
        </Link>
        
        <div className="flex items-center gap-4 terminal-text text-muted-foreground">
          <div className="hidden md:flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <Link to="/admin/login" className="hover:text-primary transition-colors duration-150" data-testid="admin-login-link">
            ADMIN
          </Link>
        </div>
      </div>
    </header>
  );
};

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4 uppercase">NOOZ.NEWS</h3>
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
          © 2025 NOOZ.NEWS. Built with Emergent AI.
        </div>
      </div>
    </footer>
  );
};
