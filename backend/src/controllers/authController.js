const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
      let user = await User.findBySocial(socialId, socialProvider);
      
      if (!user) {
        // Check if user exists with same email
        user = await User.findOne({ email });
        
        if (user) {
          // Update existing user with social info
          user.socialId = socialId;
          user.socialProvider = socialProvider;
          user.walletAddress = walletAddress.toLowerCase();
          user.avatar = avatar;
          await user.save();
        } else {
          // Create new user
          user = new User({
            email,
            name,
            socialId,
            socialProvider,
            walletAddress: walletAddress.toLowerCase(),
            avatar,
            isEmailVerified: true // Social login emails are pre-verified
          });
          await user.save();
        }
      } else {
        // Update login info
        await user.updateLoginInfo();
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: user.toPublicJSON()
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

      let user = await User.findOne({ phone });
      
      if (!user) {
        user = new User({
          phone,
          name: `User ${phone.slice(-4)}`,
          email: `${phone}@abunfi.local`,
          socialProvider: 'phone',
          walletAddress: walletAddress.toLowerCase()
        });
        await user.save();
      } else {
        await user.updateLoginInfo();
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: user.toPublicJSON()
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

      const user = await User.findOne({ emailVerificationToken: token });
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid verification token' });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Email verified successfully'
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

      const user = await User.findOne({ email });
      
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If email exists, reset instructions have been sent'
        });
      }

      // TODO: Generate reset token and send email
      // For MVP, we'll just log it

      logger.info(`Password reset requested for ${email}`);

      res.json({
        success: true,
        message: 'If email exists, reset instructions have been sent'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
};

module.exports = authController;
