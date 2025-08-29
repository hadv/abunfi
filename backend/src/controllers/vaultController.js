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
  }
};

module.exports = vaultController;
