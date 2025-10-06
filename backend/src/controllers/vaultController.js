const blockchainService = require('../config/blockchain');
const TransactionRepository = require('../models/postgres/TransactionRepository');
const UserRepository = require('../models/postgres/UserRepository');
const databaseService = require('../services/DatabaseService');
const logger = require('../utils/logger');

const vaultController = {
  // Get vault statistics
  getVaultStats: async (req, res) => {
    try {
      let stats = null;
      
      try {
        if (blockchainService.initialized) {
          stats = await blockchainService.getVaultStats();
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable, using mock data');
      }

      // Mock data if blockchain is not available
      if (!stats) {
        stats = {
          totalAssets: '50000000', // $50M
          currentAPY: 8.2,
          strategyName: 'Aave USDC Lending Strategy'
        };
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get vault stats error:', error);
      res.status(500).json({ error: 'Failed to get vault stats' });
    }
  },

  // Get user portfolio
  getUserPortfolio: async (req, res) => {
    try {
      const user = req.user;
      let portfolio = null;

      try {
        if (blockchainService.initialized) {
          portfolio = await blockchainService.getUserBalance(user.walletAddress);
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable, using mock data');
      }

      // Mock data if blockchain is not available
      if (!portfolio) {
        portfolio = {
          totalBalance: '1250000',
          deposits: '1000000',
          shares: '1.25',
          earnedYield: '250000'
        };
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      logger.error('Get user portfolio error:', error);
      res.status(500).json({ error: 'Failed to get portfolio' });
    }
  },

  // Estimate deposit
  estimateDeposit: async (req, res) => {
    try {
      const { amount } = req.body;
      const user = req.user;

      let estimation = null;

      try {
        if (blockchainService.initialized) {
          estimation = await blockchainService.estimateDepositGas(user.walletAddress, amount);
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable, using mock data');
      }

      // Mock data if blockchain is not available
      if (!estimation) {
        const sharePrice = 1000000; // 1 share = 1,000,000 VND
        const estimatedShares = amount / sharePrice;
        
        estimation = {
          estimatedShares: estimatedShares.toFixed(4),
          gasLimit: '150000',
          gasPrice: '0.1',
          gasCost: '0.000015'
        };
      }

      res.json({
        success: true,
        data: estimation
      });
    } catch (error) {
      logger.error('Estimate deposit error:', error);
      res.status(500).json({ error: 'Failed to estimate deposit' });
    }
  },

  // Estimate withdraw
  estimateWithdraw: async (req, res) => {
    try {
      const { shares } = req.body;
      const user = req.user;

      let estimation = null;

      try {
        if (blockchainService.initialized) {
          estimation = await blockchainService.estimateWithdrawGas(user.walletAddress, shares);
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable, using mock data');
      }

      // Mock data if blockchain is not available
      if (!estimation) {
        const sharePrice = 1000000; // 1 share = 1,000,000 VND
        const estimatedAmount = shares * sharePrice;
        
        estimation = {
          estimatedAmount: estimatedAmount.toFixed(0),
          gasLimit: '120000',
          gasPrice: '0.1',
          gasCost: '0.000012'
        };
      }

      res.json({
        success: true,
        data: estimation
      });
    } catch (error) {
      logger.error('Estimate withdraw error:', error);
      res.status(500).json({ error: 'Failed to estimate withdraw' });
    }
  },

  // Prepare deposit transaction
  prepareDeposit: async (req, res) => {
    try {
      const { amount } = req.body;
      const userId = req.user.id;

      const estimatedShares = (parseFloat(amount) / 1000000).toFixed(4);

      // Create pending transaction record
      const transaction = await TransactionRepository.create({
        user_id: userId,
        type: 'deposit',
        amount: parseFloat(amount),
        status: 'pending',
        metadata: {
          estimatedShares
        }
      });

      res.json({
        success: true,
        data: {
          transactionId: transaction.id,
          amount,
          estimatedShares,
          message: 'Transaction prepared. Please confirm in your wallet.'
        }
      });
    } catch (error) {
      logger.error('Prepare deposit error:', error);
      res.status(500).json({ error: 'Failed to prepare deposit' });
    }
  },

  // Prepare withdraw transaction
  prepareWithdraw: async (req, res) => {
    try {
      const { shares } = req.body;
      const userId = req.user.id;

      const estimatedAmount = parseFloat(shares) * 1000000; // Estimated amount

      // Create pending transaction record
      const transaction = await TransactionRepository.create({
        user_id: userId,
        type: 'withdraw',
        shares: parseFloat(shares),
        amount: estimatedAmount,
        status: 'pending',
        metadata: {
          requestedShares: shares
        }
      });

      res.json({
        success: true,
        data: {
          transactionId: transaction.id,
          shares,
          estimatedAmount,
          message: 'Transaction prepared. Please confirm in your wallet.'
        }
      });
    } catch (error) {
      logger.error('Prepare withdraw error:', error);
      res.status(500).json({ error: 'Failed to prepare withdraw' });
    }
  },

  // Get current APY
  getCurrentAPY: async (req, res) => {
    try {
      let apy = null;

      try {
        if (blockchainService.initialized) {
          const stats = await blockchainService.getVaultStats();
          apy = stats.currentAPY;
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable, using mock data');
      }

      // Mock data if blockchain is not available
      if (!apy) {
        apy = 8.2;
      }

      res.json({
        success: true,
        data: {
          currentAPY: apy,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Get current APY error:', error);
      res.status(500).json({ error: 'Failed to get current APY' });
    }
  },

  // Get yield history
  getYieldHistory: async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      const user = req.user;

      // Mock yield history data
      const mockHistory = [
        { date: '2024-01-01', yield: 50000, apy: 7.8 },
        { date: '2024-01-15', yield: 120000, apy: 8.0 },
        { date: '2024-02-01', yield: 180000, apy: 8.1 },
        { date: '2024-02-15', yield: 250000, apy: 8.2 }
      ];

      res.json({
        success: true,
        data: {
          period,
          history: mockHistory,
          totalYield: 250000,
          averageAPY: 8.0
        }
      });
    } catch (error) {
      logger.error('Get yield history error:', error);
      res.status(500).json({ error: 'Failed to get yield history' });
    }
  },

  // ============ BATCHING SYSTEM ENDPOINTS ============

  // Get batching configuration
  getBatchingConfig: async (req, res) => {
    try {
      let config = null;

      try {
        if (blockchainService.initialized) {
          config = await blockchainService.getBatchingConfig();
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable, using mock data');
      }

      // Mock data if blockchain is not available
      if (!config) {
        config = {
          threshold: 1000, // $1000 USDC
          interval: 14400, // 4 hours in seconds
          emergencyThreshold: 5000, // $5000 USDC
          lastAllocationTime: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
        };
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Get batching config error:', error);
      res.status(500).json({ error: 'Failed to get batching config' });
    }
  },

  // Get pending allocations by risk level
  getPendingAllocations: async (req, res) => {
    try {
      let pending = null;

      try {
        if (blockchainService.initialized) {
          pending = await blockchainService.getPendingAllocations();
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable, using mock data');
      }

      // Mock data if blockchain is not available
      if (!pending) {
        pending = {
          total: 750, // $750 pending
          lowRisk: 300,
          mediumRisk: 350,
          highRisk: 100,
          userCount: 12
        };
      }

      res.json({
        success: true,
        data: pending
      });
    } catch (error) {
      logger.error('Get pending allocations error:', error);
      res.status(500).json({ error: 'Failed to get pending allocations' });
    }
  },

  // Check if batch allocation should be triggered
  checkBatchAllocation: async (req, res) => {
    try {
      let shouldTrigger = false;

      try {
        if (blockchainService.initialized) {
          shouldTrigger = await blockchainService.shouldTriggerAllocation();
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable');
        // Return false if blockchain is not available
        shouldTrigger = false;
      }

      res.json({
        success: true,
        data: {
          shouldTrigger,
          reason: shouldTrigger ? 'Threshold reached or time elapsed' : 'Conditions not met'
        }
      });
    } catch (error) {
      logger.error('Check batch allocation error:', error);
      res.status(500).json({ error: 'Failed to check batch allocation' });
    }
  },

  // Trigger batch allocation manually
  triggerBatchAllocation: async (req, res) => {
    try {
      let result = null;

      try {
        if (blockchainService.initialized) {
          result = await blockchainService.triggerBatchAllocation();
        }
      } catch (blockchainError) {
        logger.warn('Blockchain service unavailable, using mock data');
      }

      // Mock data if blockchain is not available
      if (!result) {
        result = {
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          allocatedAmount: 750,
          gasUsed: '180000',
          timestamp: new Date().toISOString()
        };
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Trigger batch allocation error:', error);
      res.status(500).json({ error: 'Failed to trigger batch allocation' });
    }
  },

  // Get batch allocation history
  getBatchHistory: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      // Mock batch history data
      const mockHistory = [
        {
          id: 1,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          allocatedAmount: 1250,
          userCount: 15,
          gasUsed: '185000',
          transactionHash: '0x1234567890abcdef1234567890abcdef12345678'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          allocatedAmount: 980,
          userCount: 12,
          gasUsed: '178000',
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12'
        }
      ];

      res.json({
        success: true,
        data: {
          history: mockHistory.slice(0, parseInt(limit)),
          totalBatches: mockHistory.length
        }
      });
    } catch (error) {
      logger.error('Get batch history error:', error);
      res.status(500).json({ error: 'Failed to get batch history' });
    }
  },

  // Get estimated gas savings from batching
  getGasSavingsEstimate: async (req, res) => {
    try {
      const { amount } = req.body;

      // Calculate estimated gas savings
      const baseGasCost = 0.005; // ETH
      const batchedGasCost = 0.001; // ETH (shared among users)
      const savedAmount = (baseGasCost - batchedGasCost) * 2000; // Assuming ETH = $2000
      const percentageSaved = ((baseGasCost - batchedGasCost) / baseGasCost) * 100;

      const savings = {
        originalGasCost: baseGasCost.toString(),
        finalGasCost: batchedGasCost.toString(),
        savedAmount: savedAmount.toFixed(2),
        percentageSaved: Math.round(percentageSaved),
        estimatedUsers: Math.floor(Math.random() * 10) + 5 // 5-15 users
      };

      res.json({
        success: true,
        data: savings
      });
    } catch (error) {
      logger.error('Get gas savings estimate error:', error);
      res.status(500).json({ error: 'Failed to estimate gas savings' });
    }
  }
};

module.exports = vaultController;
