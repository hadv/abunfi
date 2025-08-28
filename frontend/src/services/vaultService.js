import api from './api';

export const vaultService = {
  // Get vault statistics
  getVaultStats: async () => {
    const response = await api.get('/vault/stats');
    return response.data;
  },

  // Estimate deposit
  estimateDeposit: async (amount) => {
    const response = await api.post('/vault/estimate-deposit', { amount });
    return response.data;
  },

  // Estimate withdraw
  estimateWithdraw: async (shares) => {
    const response = await api.post('/vault/estimate-withdraw', { shares });
    return response.data;
  },

  // Prepare deposit transaction
  prepareDeposit: async (amount) => {
    const response = await api.post('/vault/prepare-deposit', { amount });
    return response.data;
  },

  // Prepare withdraw transaction
  prepareWithdraw: async (shares) => {
    const response = await api.post('/vault/prepare-withdraw', { shares });
    return response.data;
  },

  // Get current APY
  getCurrentAPY: async () => {
    const response = await api.get('/vault/apy');
    return response.data;
  },

  // Get yield history
  getYieldHistory: async (period = '30d') => {
    const response = await api.get(`/vault/yield-history?period=${period}`);
    return response.data;
  }
};
