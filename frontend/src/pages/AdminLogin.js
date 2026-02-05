import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { Terminal } from 'lucide-react';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="noise-overlay"></div>
      
      <Link to="/" className="flex items-center gap-2 mb-8 hover:text-primary transition-colors duration-150">
        <Terminal className="h-6 w-6" />
        <span className="font-heading font-bold text-2xl tracking-tight uppercase">NOOZ.NEWS</span>
      </Link>
      
      <div className="w-full max-w-md card-brutal">
        <h1 className="font-heading text-3xl font-bold uppercase mb-6 text-center">
          ADMIN {isLogin ? 'LOGIN' : 'REGISTER'}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 border border-destructive bg-destructive/10 text-destructive terminal-text" data-testid="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">
              EMAIL
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-brutal w-full"
              required
              data-testid="email-input"
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">
                DISPLAY NAME
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="input-brutal w-full"
                data-testid="display-name-input"
              />
            </div>
          )}
          
          <div>
            <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">
              PASSWORD
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-brutal w-full"
              required
              data-testid="password-input"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            data-testid="submit-button"
          >
            {loading ? 'PROCESSING...' : (isLogin ? 'LOGIN' : 'REGISTER')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="terminal-text text-muted-foreground hover:text-primary transition-colors duration-150"
            data-testid="toggle-mode-button"
          >
            {isLogin ? 'Need an account? REGISTER' : 'Already have an account? LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
};
