const jwt = require('jsonwebtoken');
const UserRepository = require('../models/postgres/UserRepository');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const authController = {
  // Social login (Google, Apple, Facebook)
  socialLogin: async (req, res) => {
    try {
      const { socialId, socialProvider, email, name, walletAddress, avatar } = req.body;

      // Check if user exists
      let user = await UserRepository.findBySocial(socialId, socialProvider);

      if (!user) {
        // Check if user exists with same email
        user = await UserRepository.findByEmail(email);

        if (user) {
          // Update existing user with social info
          await UserRepository.update(user.id, {
            social_id: socialId,
            social_provider: socialProvider,
            metadata: { ...user.metadata, avatar }
          });
          user = await UserRepository.findById(user.id);
        } else {
          // Create new user
          user = await UserRepository.create({
            email,
            name,
            social_id: socialId,
            social_provider: socialProvider,
            wallet_address: walletAddress.toLowerCase(),
            metadata: { avatar },
            is_email_verified: true // Social login emails are pre-verified
          });
        }
      } else {
        // Update login info
        await UserRepository.updateLoginInfo(user.id);
        user = await UserRepository.findById(user.id);
      }

      const token = generateToken(user.id);

      res.json({
        success: true,
        token,
        user: UserRepository.toPublicJSON(user)
      });
    } catch (error) {
      logger.error('Social login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // Phone login
  phoneLogin: async (req, res) => {
    try {
      const { phone, verificationCode, walletAddress } = req.body;

      // TODO: Verify phone verification code
      // For MVP, we'll skip actual SMS verification

      // Find user by phone in metadata
      const users = await UserRepository.findByPreferences({ phone });
      let user = users.length > 0 ? users[0] : null;

      if (!user) {
        user = await UserRepository.create({
          name: `User ${phone.slice(-4)}`,
          email: `${phone}@abunfi.local`,
          social_provider: 'phone',
          wallet_address: walletAddress.toLowerCase(),
          metadata: { phone }
        });
      } else {
        await UserRepository.updateLoginInfo(user.id);
        user = await UserRepository.findById(user.id);
      }

      const token = generateToken(user.id);

      res.json({
        success: true,
        token,
        user: UserRepository.toPublicJSON(user)
      });
    } catch (error) {
      logger.error('Phone login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // Send phone verification
  sendPhoneVerification: async (req, res) => {
    try {
      const { phone } = req.body;

      // TODO: Implement actual SMS sending
      // For MVP, we'll just return success
      
      logger.info(`Verification code sent to ${phone}`);

      res.json({
        success: true,
        message: 'Verification code sent'
      });
    } catch (error) {
      logger.error('Send verification error:', error);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      // TODO: Implement refresh token logic
      // For MVP, we'll just return a new token

      res.json({
        success: true,
        token: refreshToken
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      // TODO: Implement token blacklisting
      // For MVP, client-side token removal is sufficient

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // Verify email
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;

      const user = await UserRepository.verifyEmail(token);

      if (!user) {
        return res.status(400).json({ error: 'Invalid verification token' });
      }

      res.json({
        success: true,
        message: 'Email verified successfully',
        user: UserRepository.toPublicJSON(user)
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({ error: 'Email verification failed' });
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await UserRepository.findByEmail(email);

      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If email exists, reset instructions have been sent'
        });
      }

      // TODO: Generate reset token and send email
      // For MVP, we'll just log it
      const resetToken = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await UserRepository.setPasswordResetToken(user.id, resetToken, expiresAt);

      logger.info(`Password reset requested for ${email}, token: ${resetToken}`);

      res.json({
        success: true,
        message: 'If email exists, reset instructions have been sent'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      const user = await UserRepository.findByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // TODO: Hash password and update user
      // For MVP, we'll just clear the token
      await UserRepository.clearPasswordResetToken(user.id);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
};

module.exports = authController;
