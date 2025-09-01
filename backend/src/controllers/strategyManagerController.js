const logger = require('../utils/logger');
const blockchainService = require('../config/blockchain');
const { cacheWithTTL } = require('../utils/cache');

const strategyManagerController = {
  // Get overall strategy statistics and overview
  getStrategiesOverview: async (req, res) => {
    try {
      const overview = await cacheWithTTL(
        'strategies:overview',
        async () => {
          let blockchainData = null;
          
          try {
            if (blockchainService.initialized) {
              // Get data from blockchain
              const strategies = await blockchainService.getAllStrategies();
              const totalAssets = await blockchainService.getTotalAssets();
              
              blockchainData = {
                totalAssets,
                strategiesCount: strategies.length,
                activeStrategies: strategies.filter(s => s.isActive).length,
                totalAPY: strategies.reduce((sum, s) => sum + s.apy, 0) / strategies.length,
                strategies: strategies.map(strategy => ({
                  address: strategy.address,
                  name: strategy.name,
                  totalAssets: strategy.totalAssets,
                  apy: strategy.apy,
                  allocation: strategy.allocation,
                  riskScore: strategy.riskScore,
                  isActive: strategy.isActive,
                  lastUpdate: strategy.lastUpdate
                }))
              };
            }
          } catch (blockchainError) {
            logger.warn('Blockchain service unavailable for strategies overview');
          }

          // Mock data if blockchain is not available
          if (!blockchainData) {
            blockchainData = {
              totalAssets: '75000000', // $75M total
              strategiesCount: 4,
              activeStrategies: 4,
              totalAPY: 8.45,
              strategies: [
                {
                  address: '0x1234...aave',
                  name: 'Aave USDC Strategy',
                  totalAssets: '30000000', // $30M
                  apy: 7.8,
                  allocation: 40.0,
                  riskScore: 25,
                  isActive: true,
                  lastUpdate: new Date().toISOString()
                },
                {
                  address: '0x1234...compound',
                  name: 'Compound V3 USDC Strategy',
                  totalAssets: '25000000', // $25M
                  apy: 8.9,
                  allocation: 33.3,
                  riskScore: 30,
                  isActive: true,
                  lastUpdate: new Date().toISOString()
                },
                {
                  address: '0x1234...lido',
                  name: 'Lido Liquid Staking',
                  totalAssets: '15000000', // $15M
                  apy: 5.2,
                  allocation: 20.0,
                  riskScore: 15,
                  isActive: true,
                  lastUpdate: new Date().toISOString()
                },
                {
                  address: '0x1234...uniswap',
                  name: 'Uniswap V3 LP Strategy',
                  totalAssets: '5000000', // $5M
                  apy: 12.1,
                  allocation: 6.7,
                  riskScore: 65,
                  isActive: true,
                  lastUpdate: new Date().toISOString()
                }
              ]
            };
          }

          return blockchainData;
        },
        120 // 2 minutes cache
      );

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      logger.error('Get strategies overview error:', error);
      res.status(500).json({ error: 'Failed to get strategies overview' });
    }
  },

  // Get current funds distribution across strategies
  getFundsDistribution: async (req, res) => {
    try {
      const distribution = await cacheWithTTL(
        'strategies:distribution',
        async () => {
          let blockchainData = null;
          
          try {
            if (blockchainService.initialized) {
              const strategies = await blockchainService.getAllStrategies();
              const totalAssets = strategies.reduce((sum, s) => sum + parseFloat(s.totalAssets), 0);
              
              blockchainData = strategies.map(strategy => ({
                name: strategy.name,
                value: parseFloat(strategy.totalAssets),
                percentage: (parseFloat(strategy.totalAssets) / totalAssets) * 100,
                apy: strategy.apy,
                riskScore: strategy.riskScore,
                color: getStrategyColor(strategy.name)
              }));
            }
          } catch (blockchainError) {
            logger.warn('Blockchain service unavailable for funds distribution');
          }

          // Mock data if blockchain is not available
          if (!blockchainData) {
            blockchainData = [
              {
                name: 'Aave USDC',
                value: 30000000,
                percentage: 40.0,
                apy: 7.8,
                riskScore: 25,
                color: '#1976d2'
              },
              {
                name: 'Compound V3',
                value: 25000000,
                percentage: 33.3,
                apy: 8.9,
                riskScore: 30,
                color: '#388e3c'
              },
              {
                name: 'Lido Staking',
                value: 15000000,
                percentage: 20.0,
                apy: 5.2,
                riskScore: 15,
                color: '#f57c00'
              },
              {
                name: 'Uniswap V3 LP',
                value: 5000000,
                percentage: 6.7,
                apy: 12.1,
                riskScore: 65,
                color: '#d32f2f'
              }
            ];
          }

          return {
            distribution: blockchainData,
            totalValue: blockchainData.reduce((sum, item) => sum + item.value, 0),
            lastUpdate: new Date().toISOString()
          };
        },
        60 // 1 minute cache
      );

      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      logger.error('Get funds distribution error:', error);
      res.status(500).json({ error: 'Failed to get funds distribution' });
    }
  },

  // Get strategy performance metrics with historical data
  getStrategyPerformance: async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      const performance = await cacheWithTTL(
        `strategies:performance:${period}`,
        async () => {
          let blockchainData = null;
          
          try {
            if (blockchainService.initialized) {
              const strategies = await blockchainService.getAllStrategies();
              const performanceData = await Promise.all(
                strategies.map(async (strategy) => {
                  const history = await blockchainService.getStrategyPerformanceHistory(strategy.address, period);
                  return {
                    address: strategy.address,
                    name: strategy.name,
                    currentAPY: strategy.apy,
                    averageAPY: history.reduce((sum, h) => sum + h.apy, 0) / history.length,
                    totalYield: history.reduce((sum, h) => sum + h.yield, 0),
                    volatility: calculateVolatility(history.map(h => h.apy)),
                    sharpeRatio: calculateSharpeRatio(history.map(h => h.apy)),
                    maxDrawdown: calculateMaxDrawdown(history.map(h => h.apy)),
                    history: history
                  };
                })
              );
              
              blockchainData = performanceData;
            }
          } catch (blockchainError) {
            logger.warn('Blockchain service unavailable for strategy performance');
          }

          // Mock data if blockchain is not available
          if (!blockchainData) {
            blockchainData = generateMockPerformanceData(period);
          }

          return {
            strategies: blockchainData,
            period,
            lastUpdate: new Date().toISOString()
          };
        },
        300 // 5 minutes cache
      );

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      logger.error('Get strategy performance error:', error);
      res.status(500).json({ error: 'Failed to get strategy performance' });
    }
  },

  // Get compound interest calculations and projections
  getCompoundInterest: async (req, res) => {
    try {
      const { period = '1y', principal = 10000 } = req.query;
      
      const compoundData = await cacheWithTTL(
        `strategies:compound:${period}:${principal}`,
        async () => {
          const strategies = await getStrategiesData();
          
          const compoundCalculations = strategies.map(strategy => {
            const projections = calculateCompoundInterest(
              parseFloat(principal),
              strategy.apy / 100,
              period
            );
            
            return {
              strategyName: strategy.name,
              apy: strategy.apy,
              principal: parseFloat(principal),
              projections: projections,
              totalReturn: projections[projections.length - 1].value - parseFloat(principal),
              roi: ((projections[projections.length - 1].value - parseFloat(principal)) / parseFloat(principal)) * 100
            };
          });

          return {
            calculations: compoundCalculations,
            period,
            principal: parseFloat(principal),
            lastUpdate: new Date().toISOString()
          };
        },
        600 // 10 minutes cache
      );

      res.json({
        success: true,
        data: compoundData
      });
    } catch (error) {
      logger.error('Get compound interest error:', error);
      res.status(500).json({ error: 'Failed to get compound interest data' });
    }
  }
};

// Helper functions
function getStrategyColor(strategyName) {
  const colors = {
    'Aave USDC Strategy': '#1976d2',
    'Compound V3 USDC Strategy': '#388e3c',
    'Lido Liquid Staking': '#f57c00',
    'Uniswap V3 LP Strategy': '#d32f2f'
  };
  return colors[strategyName] || '#757575';
}

function calculateVolatility(apyHistory) {
  if (apyHistory.length < 2) return 0;
  const mean = apyHistory.reduce((sum, apy) => sum + apy, 0) / apyHistory.length;
  const variance = apyHistory.reduce((sum, apy) => sum + Math.pow(apy - mean, 2), 0) / apyHistory.length;
  return Math.sqrt(variance);
}

function calculateSharpeRatio(apyHistory) {
  if (apyHistory.length < 2) return 0;
  const mean = apyHistory.reduce((sum, apy) => sum + apy, 0) / apyHistory.length;
  const volatility = calculateVolatility(apyHistory);
  const riskFreeRate = 2.0; // Assume 2% risk-free rate
  return volatility > 0 ? (mean - riskFreeRate) / volatility : 0;
}

function calculateMaxDrawdown(apyHistory) {
  if (apyHistory.length < 2) return 0;
  let maxDrawdown = 0;
  let peak = apyHistory[0];
  
  for (let i = 1; i < apyHistory.length; i++) {
    if (apyHistory[i] > peak) {
      peak = apyHistory[i];
    } else {
      const drawdown = (peak - apyHistory[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown * 100; // Return as percentage
}

function calculateCompoundInterest(principal, annualRate, period) {
  const projections = [];
  const periodsPerYear = period === '1y' ? 12 : period === '6m' ? 6 : 3;
  const monthlyRate = annualRate / 12;
  
  for (let month = 0; month <= periodsPerYear; month++) {
    const value = principal * Math.pow(1 + monthlyRate, month);
    projections.push({
      period: month,
      value: value,
      interest: value - principal,
      date: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return projections;
}

async function getStrategiesData() {
  // This would normally fetch from blockchain, using mock data for now
  return [
    { name: 'Aave USDC Strategy', apy: 7.8 },
    { name: 'Compound V3 USDC Strategy', apy: 8.9 },
    { name: 'Lido Liquid Staking', apy: 5.2 },
    { name: 'Uniswap V3 LP Strategy', apy: 12.1 }
  ];
}

function generateMockPerformanceData(period) {
  const strategies = [
    { name: 'Aave USDC Strategy', baseAPY: 7.8, volatility: 0.5 },
    { name: 'Compound V3 USDC Strategy', baseAPY: 8.9, volatility: 0.7 },
    { name: 'Lido Liquid Staking', baseAPY: 5.2, volatility: 0.3 },
    { name: 'Uniswap V3 LP Strategy', baseAPY: 12.1, volatility: 2.1 }
  ];

  const days = period === '30d' ? 30 : period === '7d' ? 7 : 90;
  
  return strategies.map(strategy => {
    const history = [];
    let currentAPY = strategy.baseAPY;
    
    for (let i = 0; i < days; i++) {
      // Add some random variation
      const variation = (Math.random() - 0.5) * strategy.volatility;
      currentAPY = Math.max(0, currentAPY + variation);
      
      history.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString(),
        apy: currentAPY,
        yield: currentAPY * 1000 * (1 + Math.random() * 0.1) // Mock yield calculation
      });
    }
    
    return {
      address: `0x${strategy.name.slice(0, 8).toLowerCase()}`,
      name: strategy.name,
      currentAPY: currentAPY,
      averageAPY: history.reduce((sum, h) => sum + h.apy, 0) / history.length,
      totalYield: history.reduce((sum, h) => sum + h.yield, 0),
      volatility: strategy.volatility,
      sharpeRatio: (currentAPY - 2.0) / strategy.volatility,
      maxDrawdown: Math.random() * 5, // Random drawdown 0-5%
      history: history
    };
  });
}

module.exports = strategyManagerController;
