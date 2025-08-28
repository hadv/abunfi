import api from './api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },

  // Get user dashboard data
  getDashboard: async () => {
    const response = await api.get('/user/dashboard');
    return response.data;
  },

  // Get user portfolio
  getPortfolio: async () => {
    const response = await api.get('/vault/portfolio');
    return response.data;
  },

  // Get referral info
  getReferralInfo: async () => {
    const response = await api.get('/user/referral');
    return response.data;
  }
};
