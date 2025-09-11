import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('abunfi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          // TEMPORARILY DISABLED FOR DEBUGGING
          console.error('🚨 API 401 Error - NOT redirecting for debugging:', {
            url: error.config?.url,
            pathname: window.location.pathname,
            error: error.response?.data
          });

          localStorage.removeItem('abunfi_token');
          toast.error('Authentication failed - check console for details');

          // Temporarily comment out redirect to see what's happening
          // window.location.href = '/login';
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action');
          break;

        case 404:
          toast.error('Resource not found');
          break;

        case 429:
          toast.error('Too many requests, please try again later');
          break;

        case 500:
          toast.error('Server error, please try again later');
          break;
          
        default:
          const errorMessage = data?.error || data?.message || 'Có lỗi xảy ra';
          toast.error(errorMessage);
      }
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Lỗi kết nối mạng');
    } else {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
    
    return Promise.reject(error);
  }
);

export default api;
