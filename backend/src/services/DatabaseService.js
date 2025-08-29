const postgresDB = require('../config/postgres');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Database Service - PostgreSQL + Redis architecture
 *
 * Data Distribution Strategy:
 * - PostgreSQL: All application data with JSONB for flexible fields
 * - Redis: Caching, sessions, temporary data - High performance needed
 */
class DatabaseService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      logger.info('Initializing Database Service...');

      // Initialize PostgreSQL
      await postgresDB.connect();
      logger.info('✓ PostgreSQL connected');

      // Initialize Redis
      await redisClient.connect();
      logger.info('✓ Redis connected');

      this.isInitialized = true;
      logger.info('Database Service initialized successfully');

    } catch (error) {
      logger.error('Database Service initialization failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await postgresDB.disconnect();
      await redisClient.disconnect();
      this.isInitialized = false;
      logger.info('Database Service disconnected');
    } catch (error) {
      logger.error('Database Service disconnect error:', error);
    }
  }

  // Health check for all databases
  async healthCheck() {
    const health = {
      postgres: await postgresDB.healthCheck(),
      redis: await redisClient.healthCheck(),
      overall: false
    };

    health.overall = health.postgres; // Redis is optional
    return health;
  }

  // Get database statistics
  async getStats() {
    return {
      postgres: postgresDB.getPoolStats(),
      redis: await redisClient.getInfo()
    };
  }

  // PostgreSQL operations (for financial data)
  async executeQuery(query, params = []) {
    return await postgresDB.query(query, params);
  }

  async executeTransaction(callback) {
    return await postgresDB.transaction(callback);
  }

  // Redis operations (for caching)
  async cache(key, fetchFunction, ttl = 300) {
    return await redisClient.cache(key, fetchFunction, ttl);
  }

  async setCache(key, value, ttl = 300) {
    return await redisClient.setJSON(key, value, ttl);
  }

  async getCache(key) {
    return await redisClient.getJSON(key);
  }

  async deleteCache(key) {
    return await redisClient.del(key);
  }

  // Session management
  async setSession(sessionId, data, ttl = 86400) { // 24 hours default
    return await redisClient.setJSON(`session:${sessionId}`, data, ttl);
  }

  async getSession(sessionId) {
    return await redisClient.getJSON(`session:${sessionId}`);
  }

  async deleteSession(sessionId) {
    return await redisClient.del(`session:${sessionId}`);
  }

  // Rate limiting
  async checkRateLimit(key, limit, window) {
    const current = await redisClient.get(`rate_limit:${key}`);
    
    if (!current) {
      await redisClient.set(`rate_limit:${key}`, '1', { EX: window });
      return { allowed: true, remaining: limit - 1 };
    }

    const count = parseInt(current);
    if (count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    await redisClient.set(`rate_limit:${key}`, (count + 1).toString(), { XX: true });
    return { allowed: true, remaining: limit - count - 1 };
  }

  // User data operations
  async getUserById(userId, useCache = true) {
    const cacheKey = `user:${userId}`;

    if (useCache) {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Get user data from PostgreSQL (includes preferences in JSONB)
    const userQuery = `
      SELECT u.*, ub.total_balance, ub.available_balance, ub.locked_balance,
             ub.total_shares, ub.share_price, ub.total_yield_earned
      FROM users u
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      WHERE u.id = $1
    `;

    const result = await this.executeQuery(userQuery, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // Cache the result
    if (useCache) {
      await this.setCache(cacheKey, user, 300); // 5 minutes
    }

    return user;
  }

  // Transaction operations (PostgreSQL only for ACID compliance)
  async createTransaction(transactionData) {
    const query = `
      INSERT INTO transactions (
        user_id, type, amount, shares, tx_hash, block_number,
        gas_used, gas_fee, exchange_rate, amount_vnd, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      transactionData.user_id,
      transactionData.type,
      transactionData.amount,
      transactionData.shares || 0,
      transactionData.tx_hash,
      transactionData.block_number,
      transactionData.gas_used,
      transactionData.gas_fee,
      JSON.stringify(transactionData.exchange_rate || {}),
      transactionData.amount_vnd,
      JSON.stringify(transactionData.metadata || {})
    ];

    const result = await this.executeQuery(query, values);
    
    // Invalidate user cache
    await this.deleteCache(`user:${transactionData.user_id}`);
    
    return result.rows[0];
  }

  // Get user transactions with caching
  async getUserTransactions(userId, limit = 20, offset = 0, useCache = true) {
    const cacheKey = `user_transactions:${userId}:${limit}:${offset}`;
    
    if (useCache) {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const query = `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const result = await this.executeQuery(query, [userId, limit, offset]);
    
    if (useCache) {
      await this.setCache(cacheKey, result.rows, 60); // 1 minute cache
    }

    return result.rows;
  }

  // Update user balance (atomic operation)
  async updateUserBalance(userId, balanceChanges) {
    return await this.executeTransaction(async (client) => {
      // Lock the user balance row
      const lockQuery = `
        SELECT * FROM user_balances 
        WHERE user_id = $1 
        FOR UPDATE
      `;
      
      const currentBalance = await client.query(lockQuery, [userId]);
      
      if (currentBalance.rows.length === 0) {
        throw new Error('User balance not found');
      }

      const current = currentBalance.rows[0];
      
      // Calculate new balances
      const newTotalBalance = parseFloat(current.total_balance) + (balanceChanges.total_balance || 0);
      const newAvailableBalance = parseFloat(current.available_balance) + (balanceChanges.available_balance || 0);
      const newLockedBalance = parseFloat(current.locked_balance) + (balanceChanges.locked_balance || 0);
      const newTotalShares = parseFloat(current.total_shares) + (balanceChanges.total_shares || 0);

      // Validate balance constraints
      if (newTotalBalance < 0 || newAvailableBalance < 0 || newLockedBalance < 0 || newTotalShares < 0) {
        throw new Error('Invalid balance: cannot be negative');
      }

      if (Math.abs(newTotalBalance - (newAvailableBalance + newLockedBalance)) > 0.000001) {
        throw new Error('Balance consistency check failed');
      }

      // Update the balance
      const updateQuery = `
        UPDATE user_balances 
        SET total_balance = $1, available_balance = $2, locked_balance = $3, 
            total_shares = $4, updated_at = NOW()
        WHERE user_id = $5
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        newTotalBalance, newAvailableBalance, newLockedBalance, newTotalShares, userId
      ]);

      // Invalidate cache
      await this.deleteCache(`user:${userId}`);

      return result.rows[0];
    });
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;
