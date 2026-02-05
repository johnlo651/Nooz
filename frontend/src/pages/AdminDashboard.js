import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { scrapeAPI, analyticsAPI } from '../utils/api';
import { Terminal, Loader2, Activity, Eye, Clock, TrendingUp } from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeCategory, setScrapeCategory] = useState('');
  const [scrapeResults, setScrapeResults] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadStats();
  }, [user, isAdmin]);

  const loadStats = async () => {
    try {
      const res = await analyticsAPI.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setScrapeResults(null);
    try {
      const res = await scrapeAPI.scrape({ category: scrapeCategory || null });
      setScrapeResults(res.data);
      loadStats();
    } catch (error) {
      console.error('Error scraping:', error);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors duration-150">
            <Terminal className="h-5 w-5" />
            <span className="font-heading font-bold text-xl tracking-tight uppercase">NOOZ.NEWS ADMIN</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/sources" 
              className="terminal-text hover:text-primary transition-colors duration-150"
              data-testid="sources-link"
            >
              SOURCES
            </Link>
            <div className="h-4 w-px bg-border"></div>
            <span className="terminal-text text-muted-foreground">{user?.email}</span>
            <button 
              onClick={logout} 
              className="btn-secondary py-2 px-4"
              data-testid="logout-button"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-4xl font-bold uppercase mb-8">DASHBOARD</h1>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card-brutal" data-testid="stat-articles">
              <div className="flex items-center justify-between mb-2">
                <span className="terminal-text text-muted-foreground">ARTICLES</span>
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <p className="font-heading text-3xl font-bold">{stats.total_articles}</p>
            </div>
            
            <div className="card-brutal" data-testid="stat-sources">
              <div className="flex items-center justify-between mb-2">
                <span className="terminal-text text-muted-foreground">SOURCES</span>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="font-heading text-3xl font-bold">{stats.total_sources}</p>
            </div>
            
            <div className="card-brutal" data-testid="stat-views">
              <div className="flex items-center justify-between mb-2">
                <span className="terminal-text text-muted-foreground">PAGE VIEWS</span>
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <p className="font-heading text-3xl font-bold">{stats.page_views}</p>
            </div>
            
            <div className="card-brutal" data-testid="stat-reads">
              <div className="flex items-center justify-between mb-2">
                <span className="terminal-text text-muted-foreground">ARTICLE READS</span>
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <p className="font-heading text-3xl font-bold">{stats.article_reads}</p>
            </div>
          </div>
        )}
        
        <div className="card-brutal">
          <h2 className="font-heading text-2xl font-bold uppercase mb-6">SCRAPE CONTROL</h2>
          
          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">
                CATEGORY (OPTIONAL)
              </label>
              <select
                value={scrapeCategory}
                onChange={(e) => setScrapeCategory(e.target.value)}
                className="input-brutal w-full md:w-64"
                disabled={scraping}
                data-testid="category-select"
              >
                <option value="">All Categories</option>
                <option value="AI">AI</option>
                <option value="Apple">Apple</option>
                <option value="Tesla">Tesla</option>
                <option value="Crypto">Crypto</option>
                <option value="Climate">Climate</option>
                <option value="Politics">Politics</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="btn-primary flex items-center gap-2"
              data-testid="scrape-button"
            >
              {scraping && <Loader2 className="h-4 w-4 animate-spin" />}
              {scraping ? 'SCRAPING...' : 'START SCRAPE'}
            </button>
          </div>
          
          {scrapeResults && (
            <div className="mt-6 p-4 border border-border bg-secondary" data-testid="scrape-results">
              <h3 className="font-mono text-xs uppercase mb-4 text-muted-foreground">SCRAPE RESULTS</h3>
              <div className="space-y-2">
                {scrapeResults.results.map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between terminal-text">
                    <span>{result.source_name}</span>
                    <span className="text-primary">
                      {result.articles_added} / {result.articles_found} added
                    </span>
                  </div>
                ))}
              </div>
              <p className="terminal-text text-muted-foreground mt-4">
                Total sources scraped: {scrapeResults.total_sources}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
