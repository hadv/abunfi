const User = require('../models/User');
const Transaction = require('../models/Transaction');
const blockchainService = require('../config/blockchain');
const logger = require('../utils/logger');

const userController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      res.json({
        success: true,
        user: req.user.toPublicJSON()
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, phone, preferences } = req.body;
      const user = req.user;

      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (preferences) {
        user.preferences = { ...user.preferences, ...preferences };
      }

      await user.save();

      res.json({
        success: true,
        user: user.toPublicJSON()
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Get user dashboard data
  getDashboard: async (req, res) => {
    try {
      const user = req.user;

      // Get portfolio data from blockchain
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

      // Get recent transactions
      const recentTransactions = await Transaction.getUserTransactions(user._id, 5);

      // Get user stats
      const stats = await Transaction.getUserStats(user._id);

      res.json({
        success: true,
        data: {
          portfolio,
          recentTransactions,
          stats,
          user: user.toPublicJSON()
        }
      });
    } catch (error) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  },

  // Get referral info
  getReferralInfo: async (req, res) => {
    try {
      const user = req.user;

      // Generate referral code if not exists
      if (!user.referralCode) {
        user.generateReferralCode();
        await user.save();
      }

      // Get referred users count
      const referredUsers = await User.countDocuments({ referredBy: user._id });

      res.json({
        success: true,
        data: {
          referralCode: user.referralCode,
          referralCount: referredUsers,
          referralLink: `${process.env.FRONTEND_URL || 'https://abunfi.com'}/ref/${user.referralCode}`
        }
      });
    } catch (error) {
      logger.error('Get referral info error:', error);
      res.status(500).json({ error: 'Failed to get referral info' });
    }
  }
};

module.exports = userController;
