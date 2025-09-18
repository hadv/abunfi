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
  },

  // Get all strategies information
  getAllStrategies: async () => {
    const response = await api.get('/vault/strategies');
    return response.data;
  },

  // Get specific strategy information
  getStrategyInfo: async (strategyAddress) => {
    const response = await api.get(`/vault/strategies/${strategyAddress}`);
    return response.data;
  },

  // Get strategy allocations
  getStrategyAllocations: async () => {
    const response = await api.get('/vault/allocations');
    return response.data;
  },

  // Get protocol comparison data
  getProtocolComparison: async () => {
    const response = await api.get('/vault/protocols/comparison');
    return response.data;
  },

  // Trigger rebalancing
  triggerRebalance: async () => {
    const response = await api.post('/vault/rebalance');
    return response.data;
  },

  // Get rebalancing history
  getRebalanceHistory: async (limit = 10) => {
    const response = await api.get(`/vault/rebalance-history?limit=${limit}`);
    return response.data;
  },

  // Get strategy performance metrics
  getStrategyPerformance: async (period = '30d') => {
    const response = await api.get(`/vault/strategies/performance?period=${period}`);
    return response.data;
  },

  // Get APY history for all strategies
  getStrategiesAPYHistory: async (period = '30d') => {
    const response = await api.get(`/vault/strategies/apy-history?period=${period}`);
    return response.data;
  },

  // ============ NEW BATCHING SYSTEM FUNCTIONS ============

  // Get batching configuration
  getBatchingConfig: async () => {
    const response = await api.get('/vault/batching/config');
    return response.data;
  },

  // Get pending allocations by risk level
  getPendingAllocations: async () => {
    const response = await api.get('/vault/batching/pending');
    return response.data;
  },

  // Check if batch allocation should be triggered
  checkBatchAllocation: async () => {
    const response = await api.get('/vault/batching/check');
    return response.data;
  },

  // Trigger batch allocation manually
  triggerBatchAllocation: async () => {
    const response = await api.post('/vault/batching/trigger');
    return response.data;
  },

  // Get batch allocation history
  getBatchHistory: async (limit = 10) => {
    const response = await api.get(`/vault/batching/history?limit=${limit}`);
    return response.data;
  },

  // Get estimated gas savings from batching
  getGasSavingsEstimate: async (amount) => {
    const response = await api.post('/vault/batching/gas-estimate', { amount });
    return response.data;
  }
};
