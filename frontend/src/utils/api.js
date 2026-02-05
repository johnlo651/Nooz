import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const articlesAPI = {
  getArticles: (params) => api.get('/articles', { params }),
  getFeatured: () => api.get('/articles/featured'),
  getArticle: (id) => api.get(`/articles/${id}`),
};

export const sourcesAPI = {
  getSources: (params) => api.get('/sources', { params }),
  createSource: (data) => api.post('/sources', data),
  updateSource: (id, data) => api.put(`/sources/${id}`, data),
  deleteSource: (id) => api.delete(`/sources/${id}`),
};

export const scrapeAPI = {
  scrape: (data) => api.post('/scrape', data),
  summarize: (articleId) => api.post(`/summarize/${articleId}`),
};

export const bookmarksAPI = {
  getBookmarks: () => api.get('/bookmarks'),
  addBookmark: (articleId) => api.post(`/bookmarks/${articleId}`),
  removeBookmark: (articleId) => api.delete(`/bookmarks/${articleId}`),
};

export const analyticsAPI = {
  trackEvent: (data) => api.post('/analytics/event', data),
  getStats: () => api.get('/analytics/stats'),
};
