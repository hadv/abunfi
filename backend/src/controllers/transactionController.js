const TransactionRepository = require('../models/postgres/TransactionRepository');
const UserRepository = require('../models/postgres/UserRepository');
const databaseService = require('../services/DatabaseService');
const blockchainService = require('../config/blockchain');
const logger = require('../utils/logger');

const transactionController = {
  // Get user transactions
  getUserTransactions: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate
      } = req.query;
      const userId = req.user.id;

      const options = {
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        type,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      };

      // Get transactions and total count
      const [transactions, total] = await Promise.all([
        TransactionRepository.getUserTransactions(userId, options),
        TransactionRepository.countUserTransactions(userId, options)
      ]);

      // Also get recent blockchain transactions if available
      let blockchainTxs = [];
      try {
        if (blockchainService.initialized) {
          const user = await UserRepository.findById(userId);
          blockchainTxs = await blockchainService.getRecentTransactions(user.wallet_address, 10);
        }
      } catch (blockchainError) {
        logger.warn('Could not fetch blockchain transactions:', blockchainError.message);
      }

      res.json({
        success: true,
        data: {
          transactions,
          blockchainTransactions: blockchainTxs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get user transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  },

  // Get transaction by ID
  getTransactionById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const transaction = await TransactionRepository.findById(id);

      if (!transaction || transaction.user_id !== userId) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Get transaction by ID error:', error);
      res.status(500).json({ error: 'Failed to get transaction' });
    }
  },

  // Get user transaction stats
  getUserTransactionStats: async (req, res) => {
    try {
      const userId = req.user.id;

      // Use caching for stats
      const statsData = await databaseService.cache(
        `user_stats:${userId}`,
        async () => {
          // Get detailed stats by type and status
          const stats = await TransactionRepository.getUserStats(userId);

          // Get monthly stats for the last 6 months
          const monthlyStats = await TransactionRepository.getMonthlyStats(userId, 6);

          // Calculate totals
          const totals = {
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalYield: 0,
            totalTransactions: 0
          };

          stats.forEach(stat => {
            if (stat.status === 'confirmed') {
              totals.totalTransactions += parseInt(stat.count);

              switch (stat.type) {
                case 'deposit':
                  totals.totalDeposits += parseFloat(stat.total_amount);
                  break;
                case 'withdraw':
                  totals.totalWithdrawals += parseFloat(stat.total_amount);
                  break;
                case 'yield_harvest':
                  totals.totalYield += parseFloat(stat.total_amount);
                  break;
              }
            }
          });

          return {
            byType: stats,
            total: totals,
            monthly: monthlyStats
          };
        },
        300 // 5 minutes cache
      );

      res.json({
        success: true,
        data: statsData
      });
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      res.status(500).json({ error: 'Failed to get transaction stats' });
    }
  },

  // Create transaction (for testing purposes)
  createTransaction: async (req, res) => {
    try {
      const { type, amount, metadata } = req.body;
      const userId = req.user.id;

      const transactionData = {
        user_id: userId,
        type,
        amount: parseFloat(amount),
        status: 'pending',
        metadata: metadata || {}
      };

      const transaction = await TransactionRepository.create(transactionData);

      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  },

  // Update transaction status (admin only)
  updateTransactionStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, txHash, blockNumber, gasUsed, gasFee, errorMessage } = req.body;

      const additionalData = {};
      if (txHash) additionalData.tx_hash = txHash;
      if (blockNumber) additionalData.block_number = blockNumber;
      if (gasUsed) additionalData.gas_used = gasUsed;
      if (gasFee) additionalData.gas_fee = gasFee;
      if (errorMessage) additionalData.error_message = errorMessage;

      const updatedTransaction = await TransactionRepository.updateStatus(id, status, additionalData);

      if (!updatedTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        success: true,
        data: updatedTransaction
      });
    } catch (error) {
      logger.error('Update transaction status error:', error);
      res.status(500).json({ error: 'Failed to update transaction status' });
    }
  }
};

module.exports = transactionController;
