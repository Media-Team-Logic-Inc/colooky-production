import axios from 'axios';

// Use custom domain for API in production, fallback to Railway URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.colooky.com'
    : 'https://colooky-production-production.up.railway.app'
  );

// Debug logging for deployment
if (typeof window === 'undefined') {
  console.log('🔧 API_BASE_URL during build:', API_BASE_URL);
  console.log('🔧 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
}

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on 401
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Note: These endpoints are handled by NextAuth, not our backend
  // Keeping for compatibility but should use NextAuth session instead
  githubCallback: (code: string) => api.post('/auth/github/callback', { code }),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const repositoryAPI = {
  getAll: () => api.get('/repositories'),
  sync: () => api.post('/repositories/sync'),
  analyze: (id: string, branch?: string) => 
    api.post(`/repositories/${id}/analyze`, { branch }),
  getAnalysis: (id: string, analysisId: string) => 
    api.get(`/repositories/${id}/analysis/${analysisId}`),
};

export const subscriptionAPI = {
  createCheckout: (data: {
    tier: string;
    interval?: string;
    promoCode?: string;
    affiliateCode?: string;
  }) => api.post('/subscriptions/checkout', data),
  getUsage: () => api.get('/subscriptions/usage'),
  createPortalSession: () => api.post('/subscriptions/portal'),
  validatePromoCode: (code: string, tier: string) => 
    api.post('/subscriptions/validate-promo', { code, tier }),
};