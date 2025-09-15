const jwt = require('jsonwebtoken');
const UserRepository = require('../models/postgres/UserRepository');
const databaseService = require('../services/DatabaseService');
const logger = require('../utils/logger');

const generateToken = (userId, isTemporary = false) => {
  const expiresIn = isTemporary ? '10m' : (process.env.JWT_EXPIRE || '7d');
  const payload = { userId };
  if (isTemporary) {
    payload.temporary = true;
    payload.requires2FA = true;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const generateFullToken = (userId) => {
  return jwt.sign({ userId, verified2FA: true }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const authController = {
  // Social login (Google, Apple, Facebook) with 2FA support
  socialLogin: async (req, res) => {
    try {
      const { socialId, socialProvider, email, name, walletAddress, avatar } = req.body;

      // Check if user exists
      let user = await UserRepository.findBySocial(socialId, socialProvider);
      let isNewUser = false;

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
          isNewUser = true;

          // Create security preferences for new user
          await databaseService.executeQuery(
            `INSERT INTO user_security_preferences (user_id, security_level, trust_score)
             VALUES ($1, 'basic', 50)
             ON CONFLICT (user_id) DO NOTHING`,
            [user.id]
          );
        }
      } else {
        // Update login info
        await UserRepository.updateLoginInfo(user.id);
        user = await UserRepository.findById(user.id);
      }

      // Check if 2FA is enabled for this user
      const requires2FA = user.two_factor_enabled && user.two_factor_method === 'passkey';

      if (requires2FA) {
        // Check if user has active passkeys
        const passkeyQuery = `
          SELECT COUNT(*) as count FROM user_passkeys
          WHERE user_id = $1 AND is_active = true
        `;
        const passkeyResult = await databaseService.executeQuery(passkeyQuery, [user.id]);
        const hasPasskeys = parseInt(passkeyResult.rows[0].count) > 0;

        if (hasPasskeys) {
          // Issue temporary token that requires 2FA completion
          const temporaryToken = generateToken(user.id, true);

          // Log 2FA required event
          await this.logSecurityEvent(user.id, 'login_2fa_required', 'attempt', req);

          return res.json({
            success: true,
            requires2FA: true,
            temporaryToken,
            message: 'Please complete passkey authentication',
            user: UserRepository.toPublicJSON(user)
          });
        }
      }

      // Generate full access token (no 2FA required or new user)
      const token = generateFullToken(user.id);

      // Log successful login
      await this.logSecurityEvent(user.id, 'social_login_success', 'success', req, {
        socialProvider,
        isNewUser,
        requires2FA: false
      });

      // For new users, suggest 2FA setup
      const response = {
        success: true,
        token,
        user: UserRepository.toPublicJSON(user)
      };

      if (isNewUser) {
        response.suggestions = {
          setup2FA: {
            title: 'Secure Your Account',
            description: 'Set up passkey authentication for enhanced security and earn rewards!',
            rewards: ['0.005 USDC bonus', '30-day yield boost', 'Enhanced transaction limits'],
            action: 'setup_passkey'
          }
        };
      }

      res.json(response);

    } catch (error) {
      logger.error('Social login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // Complete 2FA authentication after social login
  complete2FA: async (req, res) => {
    try {
      const { temporaryToken } = req.body;

      if (!temporaryToken) {
        return res.status(400).json({ error: 'Temporary token is required' });
      }

      // Verify temporary token
      let decoded;
      try {
        decoded = jwt.verify(temporaryToken, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired temporary token' });
      }

      if (!decoded.temporary || !decoded.requires2FA) {
        return res.status(400).json({ error: 'Invalid token type' });
      }

      const userId = decoded.userId;

      // Get user information
      const user = await UserRepository.findById(userId);
      if (!user || !user.is_active) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify that 2FA was actually completed (this would be set by the passkey verification)
      // For now, we'll check if there's a recent successful passkey authentication
      const recentAuthQuery = `
        SELECT id FROM security_events
        WHERE user_id = $1
        AND event_type = 'passkey_authentication_success'
        AND event_status = 'success'
        AND created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY created_at DESC LIMIT 1
      `;

      const recentAuth = await databaseService.executeQuery(recentAuthQuery, [userId]);

      if (recentAuth.rows.length === 0) {
        return res.status(400).json({
          error: 'Passkey authentication required',
          message: 'Please complete passkey authentication first'
        });
      }

      // Generate full access token
      const fullToken = generateFullToken(userId);

      // Log successful 2FA completion
      await this.logSecurityEvent(userId, 'login_2fa_completed', 'success', req);

      res.json({
        success: true,
        token: fullToken,
        user: UserRepository.toPublicJSON(user),
        message: '2FA authentication completed successfully'
      });

    } catch (error) {
      logger.error('Complete 2FA error:', error);
      res.status(500).json({ error: 'Failed to complete 2FA authentication' });
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
  },

  // Development login (ONLY for development environment)
  devLogin: async (req, res) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          error: 'Development login is only available in development environment'
        });
      }

      const { email } = req.body;

      // Find user by email
      const user = await UserRepository.findByEmail(email);

      if (!user) {
        return res.status(404).json({
          error: 'User not found. Please check the email address.'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          error: 'User account is not active'
        });
      }

      // Update login info
      await UserRepository.updateLoginInfo(user.id);

      // Generate token
      const token = generateToken(user.id);

      logger.info(`Development login successful for user: ${email} (${user.role})`);

      res.json({
        success: true,
        token,
        user: UserRepository.toPublicJSON(user),
        message: 'Development login successful'
      });

    } catch (error) {
      logger.error('Development login error:', error);
      res.status(500).json({ error: 'Development login failed' });
    }
  },

  // Security event logging helper
  logSecurityEvent: async (userId, eventType, eventStatus, req, metadata = {}) => {
    try {
      const eventQuery = `
        INSERT INTO security_events (
          user_id, event_type, event_status, ip_address, user_agent, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await databaseService.executeQuery(eventQuery, [
        userId,
        eventType,
        eventStatus,
        req.ip || req.connection?.remoteAddress,
        req.get('User-Agent'),
        JSON.stringify(metadata)
      ]);
    } catch (error) {
      logger.error('Log security event error:', error);
    }
  }
};

module.exports = authController;
