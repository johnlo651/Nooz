import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { sourcesAPI } from '../utils/api';
import { Terminal, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export const AdminSources = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [sources, setSources] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rss_url: '',
    website_url: '',
    description: '',
    priority: 'medium',
    is_active: true,
    scrape_interval_minutes: 60,
    categories: []
  });

  const loadSources = async () => {
    try {
      const res = await sourcesAPI.getSources();
      setSources(res.data);
    } catch (error) {
      console.error('Error loading sources:', error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSource) {
        await sourcesAPI.updateSource(editingSource.id, formData);
      } else {
        await sourcesAPI.createSource(formData);
      }
      setDialogOpen(false);
      setEditingSource(null);
      resetForm();
      loadSources();
    } catch (error) {
      console.error('Error saving source:', error);
    }
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      rss_url: source.rss_url,
      website_url: source.website_url || '',
      description: source.description || '',
      priority: source.priority,
      is_active: source.is_active,
      scrape_interval_minutes: source.scrape_interval_minutes,
      categories: source.categories || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this source?')) return;
    try {
      await sourcesAPI.deleteSource(id);
      loadSources();
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rss_url: '',
      website_url: '',
      description: '',
      priority: 'medium',
      is_active: true,
      scrape_interval_minutes: 60,
      categories: []
    });
  };

  const toggleCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors duration-150">
            <Terminal className="h-5 w-5" />
            <span className="font-heading font-bold text-xl tracking-tight uppercase">NOOZ.NEWS ADMIN</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/dashboard" 
              className="terminal-text hover:text-primary transition-colors duration-150"
              data-testid="dashboard-link"
            >
              DASHBOARD
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-4xl font-bold uppercase">SOURCES</h1>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="btn-primary flex items-center gap-2"
                onClick={() => {
                  setEditingSource(null);
                  resetForm();
                }}
                data-testid="add-source-button"
              >
                <Plus className="h-4 w-4" />
                ADD SOURCE
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl uppercase">
                  {editingSource ? 'EDIT SOURCE' : 'ADD SOURCE'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">NAME *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-brutal w-full"
                    required
                    data-testid="source-name-input"
                  />
                </div>
                
                <div>
                  <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">RSS URL *</label>
                  <input
                    type="url"
                    value={formData.rss_url}
                    onChange={(e) => setFormData({ ...formData, rss_url: e.target.value })}
                    className="input-brutal w-full"
                    required
                    data-testid="source-rss-url-input"
                  />
                </div>
                
                <div>
                  <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">WEBSITE URL</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="input-brutal w-full"
                    data-testid="source-website-url-input"
                  />
                </div>
                
                <div>
                  <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">DESCRIPTION</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-brutal w-full h-20"
                    data-testid="source-description-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">PRIORITY</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input-brutal w-full"
                      data-testid="source-priority-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">SCRAPE INTERVAL (MINS)</label>
                    <input
                      type="number"
                      value={formData.scrape_interval_minutes}
                      onChange={(e) => setFormData({ ...formData, scrape_interval_minutes: parseInt(e.target.value) })}
                      className="input-brutal w-full"
                      min="5"
                      max="1440"
                      data-testid="source-interval-input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">CATEGORIES</label>
                  <div className="flex flex-wrap gap-2">
                    {['AI', 'Apple', 'Tesla', 'Crypto', 'Climate', 'Politics', 'Finance'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={formData.categories.includes(cat) ? 'tag-accent' : 'tag'}
                        data-testid={`category-${cat.toLowerCase()}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4"
                    data-testid="source-active-checkbox"
                  />
                  <label htmlFor="is_active" className="font-mono text-xs uppercase text-muted-foreground">
                    ACTIVE
                  </label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="btn-primary flex-1" data-testid="save-source-button">
                    {editingSource ? 'UPDATE' : 'CREATE'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingSource(null);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                    data-testid="cancel-button"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-4">
          {sources.map(source => (
            <div key={source.id} className="card-brutal" data-testid="source-item">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-heading text-xl font-bold">{source.name}</h3>
                    {!source.is_active && (
                      <span className="tag text-muted-foreground">INACTIVE</span>
                    )}
                    <span className="tag">{source.priority.toUpperCase()}</span>
                  </div>
                  
                  <p className="terminal-text text-sm text-muted-foreground mb-2">
                    {source.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {source.categories?.map(cat => (
                      <span key={cat} className="tag text-xs">{cat}</span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 terminal-text text-xs text-muted-foreground">
                    <span>Interval: {source.scrape_interval_minutes}m</span>
                    {source.last_scrape && (
                      <span>Last: {new Date(source.last_scrape).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {source.website_url && (
                    <a
                      href={source.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-secondary transition-colors duration-150"
                      data-testid="visit-website-button"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(source)}
                    className="p-2 hover:bg-secondary transition-colors duration-150"
                    data-testid="edit-source-button"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-2 hover:bg-secondary hover:text-destructive transition-colors duration-150"
                    data-testid="delete-source-button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {sources.length === 0 && (
            <div className="text-center py-20">
              <p className="terminal-text text-muted-foreground">NO SOURCES FOUND</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
