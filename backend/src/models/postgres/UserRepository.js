const databaseService = require('../../services/DatabaseService');
const logger = require('../../utils/logger');

class UserRepository {
  // Create a new user in PostgreSQL
  async create(userData) {
    const query = `
      INSERT INTO users (
        email, wallet_address, name, social_id, social_provider,
        kyc_status, kyc_data, preferences, metadata, two_factor_enabled,
        is_active, is_email_verified, referral_code, referred_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const defaultPreferences = {
      language: 'vi',
      currency: 'VND',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    };

    const values = [
      userData.email,
      userData.wallet_address.toLowerCase(),
      userData.name,
      userData.social_id,
      userData.social_provider,
      userData.kyc_status || 'pending',
      JSON.stringify(userData.kyc_data || {}),
      JSON.stringify(userData.preferences || defaultPreferences),
      JSON.stringify(userData.metadata || {}),
      userData.two_factor_enabled || false,
      userData.is_active !== false, // Default to true
      userData.is_email_verified || false,
      userData.referral_code,
      userData.referred_by
    ];

    try {
      const result = await databaseService.executeQuery(query, values);
      logger.info(`User created in PostgreSQL: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user in PostgreSQL:', error);
      throw error;
    }
  }

  // Find user by ID
  async findById(userId) {
    const query = `
      SELECT u.*, ub.total_balance, ub.available_balance, ub.locked_balance,
             ub.total_shares, ub.share_price, ub.total_yield_earned,
             ub.last_yield_calculation
      FROM users u
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      WHERE u.id = $1 AND u.is_active = true
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email) {
    const query = `
      SELECT u.*, ub.total_balance, ub.available_balance, ub.locked_balance,
             ub.total_shares, ub.share_price, ub.total_yield_earned
      FROM users u
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      WHERE u.email = $1 AND u.is_active = true
    `;

    try {
      const result = await databaseService.executeQuery(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by wallet address
  async findByWalletAddress(walletAddress) {
    const query = `
      SELECT u.*, ub.total_balance, ub.available_balance, ub.locked_balance,
             ub.total_shares, ub.share_price, ub.total_yield_earned
      FROM users u
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      WHERE u.wallet_address = $1 AND u.is_active = true
    `;

    try {
      const result = await databaseService.executeQuery(query, [walletAddress.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by wallet address:', error);
      throw error;
    }
  }

  // Find user by social login
  async findBySocial(socialId, socialProvider) {
    const query = `
      SELECT u.*, ub.total_balance, ub.available_balance, ub.locked_balance,
             ub.total_shares, ub.share_price, ub.total_yield_earned
      FROM users u
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      WHERE u.social_id = $1 AND u.social_provider = $2 AND u.is_active = true
    `;

    try {
      const result = await databaseService.executeQuery(query, [socialId, socialProvider]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by social login:', error);
      throw error;
    }
  }

  // Update user
  async update(userId, updateData) {
    const allowedFields = [
      'name', 'social_id', 'social_provider', 'kyc_status', 'kyc_data',
      'preferences', 'metadata', 'two_factor_enabled', 'two_factor_secret',
      'is_email_verified', 'email_verification_token', 'password_reset_token',
      'password_reset_expires', 'last_login_at', 'login_count'
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        // Handle JSONB fields
        if (['kyc_data', 'preferences', 'metadata'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND is_active = true
      RETURNING *
    `;

    try {
      const result = await databaseService.executeQuery(query, values);
      
      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Update login info
  async updateLoginInfo(userId) {
    const query = `
      UPDATE users 
      SET last_login_at = NOW(), login_count = login_count + 1, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING last_login_at, login_count
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId]);
      
      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating login info:', error);
      throw error;
    }
  }

  // Generate and set referral code
  async generateReferralCode(userId) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const query = `
      UPDATE users 
      SET referral_code = $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING referral_code
    `;

    try {
      const result = await databaseService.executeQuery(query, [code, userId]);
      
      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);
      
      return result.rows[0]?.referral_code || null;
    } catch (error) {
      // If code already exists, try again
      if (error.code === '23505') { // Unique violation
        return await this.generateReferralCode(userId);
      }
      logger.error('Error generating referral code:', error);
      throw error;
    }
  }

  // Soft delete user
  async softDelete(userId) {
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id, is_active
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId]);
      
      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error soft deleting user:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    const query = `
      SELECT 
        COUNT(CASE WHEN t.type = 'deposit' AND t.status = 'confirmed' THEN 1 END) as total_deposits,
        COUNT(CASE WHEN t.type = 'withdraw' AND t.status = 'confirmed' THEN 1 END) as total_withdrawals,
        COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_deposited,
        COALESCE(SUM(CASE WHEN t.type = 'withdraw' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_withdrawn,
        COALESCE(SUM(CASE WHEN t.type = 'yield_harvest' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_yield,
        COUNT(*) as total_transactions
      FROM transactions t
      WHERE t.user_id = $1
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId]);
      return result.rows[0] || {};
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Check if email exists
  async emailExists(email) {
    const query = `SELECT id FROM users WHERE email = $1 AND is_active = true`;
    
    try {
      const result = await databaseService.executeQuery(query, [email.toLowerCase()]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }

  // Check if wallet address exists
  async walletExists(walletAddress) {
    const query = `SELECT id FROM users WHERE wallet_address = $1 AND is_active = true`;

    try {
      const result = await databaseService.executeQuery(query, [walletAddress.toLowerCase()]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking wallet existence:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(userId, preferences) {
    const query = `
      UPDATE users
      SET preferences = $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING preferences
    `;

    try {
      const result = await databaseService.executeQuery(query, [JSON.stringify(preferences), userId]);

      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);

      return result.rows[0]?.preferences || null;
    } catch (error) {
      logger.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Update user metadata
  async updateMetadata(userId, metadata) {
    const query = `
      UPDATE users
      SET metadata = $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING metadata
    `;

    try {
      const result = await databaseService.executeQuery(query, [JSON.stringify(metadata), userId]);

      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);

      return result.rows[0]?.metadata || null;
    } catch (error) {
      logger.error('Error updating metadata:', error);
      throw error;
    }
  }

  // Set email verification token
  async setEmailVerificationToken(userId, token) {
    const query = `
      UPDATE users
      SET email_verification_token = $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING email_verification_token
    `;

    try {
      const result = await databaseService.executeQuery(query, [token, userId]);
      return result.rows[0]?.email_verification_token || null;
    } catch (error) {
      logger.error('Error setting email verification token:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    const query = `
      UPDATE users
      SET is_email_verified = true, email_verification_token = NULL, updated_at = NOW()
      WHERE email_verification_token = $1 AND is_active = true
      RETURNING id, email, is_email_verified
    `;

    try {
      const result = await databaseService.executeQuery(query, [token]);

      if (result.rows.length > 0) {
        // Invalidate cache
        await databaseService.deleteCache(`user:${result.rows[0].id}`);
      }

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  // Set password reset token
  async setPasswordResetToken(userId, token, expiresAt) {
    const query = `
      UPDATE users
      SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
      WHERE id = $3 AND is_active = true
      RETURNING password_reset_token
    `;

    try {
      const result = await databaseService.executeQuery(query, [token, expiresAt, userId]);
      return result.rows[0]?.password_reset_token || null;
    } catch (error) {
      logger.error('Error setting password reset token:', error);
      throw error;
    }
  }

  // Find user by password reset token
  async findByPasswordResetToken(token) {
    const query = `
      SELECT * FROM users
      WHERE password_reset_token = $1
        AND password_reset_expires > NOW()
        AND is_active = true
    `;

    try {
      const result = await databaseService.executeQuery(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by password reset token:', error);
      throw error;
    }
  }

  // Clear password reset token
  async clearPasswordResetToken(userId) {
    const query = `
      UPDATE users
      SET password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING id
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId]);

      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error clearing password reset token:', error);
      throw error;
    }
  }

  // Set two-factor secret
  async setTwoFactorSecret(userId, secret) {
    const query = `
      UPDATE users
      SET two_factor_secret = $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING two_factor_enabled
    `;

    try {
      const result = await databaseService.executeQuery(query, [secret, userId]);

      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error setting two-factor secret:', error);
      throw error;
    }
  }

  // Enable/disable two-factor authentication
  async setTwoFactorEnabled(userId, enabled) {
    const query = `
      UPDATE users
      SET two_factor_enabled = $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING two_factor_enabled
    `;

    try {
      const result = await databaseService.executeQuery(query, [enabled, userId]);

      // Invalidate cache
      await databaseService.deleteCache(`user:${userId}`);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error setting two-factor enabled:', error);
      throw error;
    }
  }

  // Get users by preferences (e.g., for notifications)
  async findByPreferences(preferenceQuery, limit = 100) {
    const query = `
      SELECT id, email, name, preferences
      FROM users
      WHERE preferences @> $1 AND is_active = true
      LIMIT $2
    `;

    try {
      const result = await databaseService.executeQuery(query, [JSON.stringify(preferenceQuery), limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding users by preferences:', error);
      throw error;
    }
  }

  // Convert to public JSON (remove sensitive fields)
  toPublicJSON(user) {
    if (!user) return null;

    const publicUser = { ...user };
    delete publicUser.two_factor_secret;
    delete publicUser.email_verification_token;
    delete publicUser.password_reset_token;
    delete publicUser.password_reset_expires;

    return publicUser;
  }
}

module.exports = new UserRepository();
