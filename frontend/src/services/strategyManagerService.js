import api from './api';

const strategyManagerService = {
  // Get overall strategies overview
  getStrategiesOverview: async () => {
    const response = await api.get('/admin/strategies/overview');
    return response.data;
  },

  // Get current funds distribution across strategies
  getFundsDistribution: async () => {
    const response = await api.get('/admin/strategies/distribution');
    return response.data;
  },

  // Get strategy performance metrics with historical data
  getStrategyPerformance: async (period = '30d') => {
    const response = await api.get(`/admin/strategies/performance?period=${period}`);
    return response.data;
  },

  // Get compound interest calculations and projections
  getCompoundInterest: async (period = '1y', principal = 10000) => {
    const response = await api.get(`/admin/strategies/compound-interest?period=${period}&principal=${principal}`);
    return response.data;
  },

  // Update strategy allocation (future feature)
  updateStrategyAllocation: async (strategyAddress, newAllocation) => {
    const response = await api.post('/admin/strategies/update-allocation', {
      strategyAddress,
      newAllocation
    });
    return response.data;
  },

  // Rebalance strategies (future feature)
  rebalanceStrategies: async () => {
    const response = await api.post('/admin/strategies/rebalance');
    return response.data;
  },

  // Get strategy details
  getStrategyDetails: async (strategyAddress) => {
    const response = await api.get(`/admin/strategies/${strategyAddress}`);
    return response.data;
  },

  // Get APY history for a specific strategy
  getStrategyAPYHistory: async (strategyAddress, period = '30d') => {
    const response = await api.get(`/admin/strategies/${strategyAddress}/apy-history?period=${period}`);
    return response.data;
  },

  // Get risk metrics for all strategies
  getRiskMetrics: async () => {
    const response = await api.get('/admin/strategies/risk-metrics');
    return response.data;
  },

  // Get yield farming opportunities
  getYieldOpportunities: async () => {
    const response = await api.get('/admin/strategies/yield-opportunities');
    return response.data;
  }
};

export default strategyManagerService;
