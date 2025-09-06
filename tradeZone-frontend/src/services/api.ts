import axios from 'axios';
import config from '../config/env';

const API_BASE_URL = config.API_BASE_URL;

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get JWT token first, fallback to testToken
    const jwtToken = localStorage.getItem('token');
    const testToken = localStorage.getItem('testToken');
    const token = jwtToken || testToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token,
      tokenType: jwtToken ? 'JWT' : 'testToken'
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized, clearing tokens...');
      localStorage.removeItem('token');
      localStorage.removeItem('testToken');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      // Don't redirect for login requests to avoid page refresh
      if (!error.config?.url?.includes('/auth/login')) {
        window.location.href = '/login';
      }
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Backend connection refused. Make sure the backend is running on port 3000');
    }
    
    return Promise.reject(error);
  }
);

export default api;
