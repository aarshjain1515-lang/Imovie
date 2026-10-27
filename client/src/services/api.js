import axios from 'axios';

let rawBase = import.meta.env.VITE_API_URL || '';
if (rawBase) {
  rawBase = rawBase.replace(/\/$/, '');
  if (!rawBase.endsWith('/api')) {
    rawBase += '/api';
  }
} else {
  rawBase = '/api';
}

const api = axios.create({
  baseURL: rawBase,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 gracefully without broken page reloads
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't loop or navigate if the user is already on auth pages or checking /auth/login
      const isAuthCall = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      const isOnAuthPage = window.location.hash.includes('/login') || window.location.hash.includes('/signup');
      if (!isAuthCall && !isOnAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('imovies_current_user');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
