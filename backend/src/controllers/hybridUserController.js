const UserRepository = require('../models/postgres/UserRepository');
const TransactionRepository = require('../models/postgres/TransactionRepository');
const databaseService = require('../services/DatabaseService');
const blockchainService = require('../config/blockchain');
const logger = require('../utils/logger');

// MongoDB models for flexible data (commented out since we're using PostgreSQL only)
// const MongoUser = require('../models/User');

const hybridUserController = {
  // Create user (hybrid approach)
  createUser: async (req, res) => {
    try {
      const { email, walletAddress, name, socialId, socialProvider, preferences } = req.body;

      // Check if user already exists in PostgreSQL
      const existingUser = await UserRepository.findByEmail(email) || 
                           await UserRepository.findByWalletAddress(walletAddress);

      if (existingUser) {
        return res.status(400).json({ 
          error: 'User already exists',
          field: existingUser.email === email ? 'email' : 'walletAddress'
        });
      }

      // Create user in PostgreSQL (core financial data)
      const postgresUser = await UserRepository.create({
        email,
        wallet_address: walletAddress,
        name,
        social_id: socialId,
        social_provider: socialProvider,
        kyc_status: 'pending',
        is_email_verified: false
      });

      // Note: MongoDB usage removed - all data now stored in PostgreSQL
      // Preferences are stored in the PostgreSQL users table as JSONB

      // Generate referral code
      await UserRepository.generateReferralCode(postgresUser.id);

      res.status(201).json({
        success: true,
        user: {
          id: postgresUser.id,
          email: postgresUser.email,
          walletAddress: postgresUser.wallet_address,
          name: postgresUser.name,
          kycStatus: postgresUser.kyc_status,
          preferences: preferences || {}
        }
      });

    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  // Get user profile (hybrid data)
  getUserProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get user data using the hybrid approach
      const user = await databaseService.getUserById(userId, true);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get recent transactions from PostgreSQL
      const recentTransactions = await TransactionRepository.getUserTransactions(userId, { limit: 5 });

      // Get user statistics
      const stats = await TransactionRepository.getUserStats(userId);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            walletAddress: user.wallet_address,
            name: user.name,
            kycStatus: user.kyc_status,
            isEmailVerified: user.is_email_verified,
            twoFactorEnabled: user.two_factor_enabled,
            referralCode: user.referral_code,
            preferences: user.preferences || {},
            balance: {
              total: user.total_balance || 0,
              available: user.available_balance || 0,
              locked: user.locked_balance || 0,
              shares: user.total_shares || 0,
              sharePrice: user.share_price || 1000000,
              totalYield: user.total_yield_earned || 0
            },
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at
          },
          recentTransactions,
          stats
        }
      });

    } catch (error) {
      logger.error('Get user profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  },

  // Update user preferences (MongoDB)
  updatePreferences: async (req, res) => {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;

      // Update in MongoDB
      try {
        await MongoUser.findByIdAndUpdate(
          userId,
          { preferences },
          { new: true, upsert: true }
        );
      } catch (mongoError) {
        logger.warn('Failed to update preferences in MongoDB:', mongoError.message);
      }

      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences
      });

    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  },

  // Update KYC status (PostgreSQL)
  updateKycStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      const { kycStatus, kycData } = req.body;

      const allowedStatuses = ['pending', 'verified', 'rejected'];
      if (!allowedStatuses.includes(kycStatus)) {
        return res.status(400).json({ error: 'Invalid KYC status' });
      }

      // Update in PostgreSQL
      const updatedUser = await UserRepository.update(userId, {
        kyc_status: kycStatus,
        kyc_data: kycData
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        message: 'KYC status updated successfully',
        kycStatus: updatedUser.kyc_status
      });

    } catch (error) {
      logger.error('Update KYC status error:', error);
      res.status(500).json({ error: 'Failed to update KYC status' });
    }
  },

  // Get user dashboard (hybrid data with caching)
  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id;

      // Use caching for dashboard data
      const dashboardData = await databaseService.cache(
        `dashboard:${userId}`,
        async () => {
          // Get user data
          const user = await databaseService.getUserById(userId, false);
          
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

          // Get monthly stats
          const monthlyStats = await TransactionRepository.getMonthlyStats(userId, 6);

          return {
            portfolio,
            recentTransactions,
            monthlyStats,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              kycStatus: user.kyc_status,
              preferences: user.preferences || {}
            }
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

  // Get user transactions with advanced filtering
  getTransactions: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 20, 
        type, 
        status, 
        startDate, 
        endDate 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const options = {
        limit: parseInt(limit),
        offset,
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

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  }
};

module.exports = hybridUserController;
