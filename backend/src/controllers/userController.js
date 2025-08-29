const UserRepository = require('../models/postgres/UserRepository');
const TransactionRepository = require('../models/postgres/TransactionRepository');
const databaseService = require('../services/DatabaseService');
const blockchainService = require('../config/blockchain');
const logger = require('../utils/logger');

const userController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await UserRepository.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: UserRepository.toPublicJSON(user)
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, preferences, metadata } = req.body;
      const userId = req.user.id;

      const updateData = {};
      if (name) updateData.name = name;
      if (preferences) updateData.preferences = preferences;
      if (metadata) updateData.metadata = metadata;

      const updatedUser = await UserRepository.update(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: UserRepository.toPublicJSON(updatedUser)
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Update user preferences
  updatePreferences: async (req, res) => {
    try {
      const { preferences } = req.body;
      const userId = req.user.id;

      const updatedPreferences = await UserRepository.updatePreferences(userId, preferences);

      if (!updatedPreferences) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: updatedPreferences
      });
    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  },

  // Get user dashboard data
  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id;

      // Use caching for dashboard data
      const dashboardData = await databaseService.cache(
        `dashboard:${userId}`,
        async () => {
          // Get user data with balance
          const user = await UserRepository.findById(userId);

          if (!user) {
            throw new Error('User not found');
          }

          // Get portfolio data from blockchain
          let portfolio = null;
          try {
            if (blockchainService.initialized) {
              portfolio = await blockchainService.getUserBalance(user.wallet_address);
            }
          } catch (blockchainError) {
            logger.warn('Blockchain service unavailable, using database data');
          }

          // Use database balance if blockchain is not available
          if (!portfolio) {
            portfolio = {
              totalBalance: user.total_balance || 0,
              deposits: user.total_balance || 0,
              shares: user.total_shares || 0,
              earnedYield: user.total_yield_earned || 0
            };
          }

          // Get recent transactions
          const recentTransactions = await TransactionRepository.getUserTransactions(userId, { limit: 5 });

          // Get user stats
          const stats = await TransactionRepository.getUserStats(userId);

          // Get monthly stats
          const monthlyStats = await TransactionRepository.getMonthlyStats(userId, 6);

          return {
            portfolio,
            recentTransactions,
            stats,
            monthlyStats,
            user: UserRepository.toPublicJSON(user)
          };
        },
        300 // 5 minutes cache
      );

      res.json({
        success: true,
        data: dashboardData
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
