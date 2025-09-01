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
          // But don't redirect if we're on the login page or if this is a token verification call
          const isLoginPage = window.location.pathname === '/login';
          const isTokenVerification = error.config?.url?.includes('/user/profile');

          localStorage.removeItem('abunfi_token');

          if (!isLoginPage && !isTokenVerification) {
            window.location.href = '/login';
            toast.error('Phiên đăng nhập đã hết hạn');
          }
          break;
          
        case 403:
          toast.error('Bạn không có quyền thực hiện hành động này');
          break;
          
        case 404:
          toast.error('Không tìm thấy tài nguyên');
          break;
          
        case 429:
          toast.error('Quá nhiều yêu cầu, vui lòng thử lại sau');
          break;
          
        case 500:
          toast.error('Lỗi server, vui lòng thử lại sau');
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
