const Transaction = require('../models/Transaction');
const blockchainService = require('../config/blockchain');
const logger = require('../utils/logger');

const transactionController = {
  // Get user transactions
  getUserTransactions: async (req, res) => {
    try {
      const { page = 1, limit = 20, type, status } = req.query;
      const user = req.user;

      const query = { user: user._id };
      if (type) query.type = type;
      if (status) query.status = status;

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('user', 'name email');

      const total = await Transaction.countDocuments(query);

      // Also get recent blockchain transactions if available
      let blockchainTxs = [];
      try {
        if (blockchainService.initialized) {
          blockchainTxs = await blockchainService.getRecentTransactions(user.walletAddress, 10);
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
      const user = req.user;

      const transaction = await Transaction.findOne({
        _id: id,
        user: user._id
      }).populate('user', 'name email');

      if (!transaction) {
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
      const user = req.user;

      const stats = await Transaction.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]);

      // Get total stats
      const totalStats = await Transaction.aggregate([
        { $match: { user: user._id, status: 'confirmed' } },
        {
          $group: {
            _id: null,
            totalDeposits: {
              $sum: {
                $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0]
              }
            },
            totalWithdrawals: {
              $sum: {
                $cond: [{ $eq: ['$type', 'withdraw'] }, '$amount', 0]
              }
            },
            totalYield: {
              $sum: {
                $cond: [{ $eq: ['$type', 'yield_harvest'] }, '$amount', 0]
              }
            },
            totalTransactions: { $sum: 1 }
          }
        }
      ]);

      // Get monthly stats for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyStats = await Transaction.aggregate([
        {
          $match: {
            user: user._id,
            status: 'confirmed',
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              type: '$type'
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      res.json({
        success: true,
        data: {
          byType: stats,
          total: totalStats[0] || {
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalYield: 0,
            totalTransactions: 0
          },
          monthly: monthlyStats
        }
      });
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      res.status(500).json({ error: 'Failed to get transaction stats' });
    }
  }
};

module.exports = transactionController;
