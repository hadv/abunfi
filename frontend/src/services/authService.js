import api from './api';

export const authService = {
  // Social login (Google, Apple, Facebook)
  socialLogin: async (loginData) => {
    const response = await api.post('/auth/social-login', loginData);
    return response.data;
  },

  // Phone login
  phoneLogin: async (phoneData) => {
    const response = await api.post('/auth/phone-login', phoneData);
    return response.data;
  },

  // Send phone verification
  sendPhoneVerification: async (phone) => {
    const response = await api.post('/auth/send-phone-verification', { phone });
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }
};
