const { Pool } = require('pg');
const logger = require('../utils/logger');

class PostgresDB {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const databaseUrl = process.env.NODE_ENV === 'test' 
        ? process.env.DATABASE_TEST_URL 
        : process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.info(`PostgreSQL Connected: ${this.pool.options.host || 'localhost'}`);

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('PostgreSQL pool error:', err);
        this.isConnected = false;
      });

      // Handle pool connection events
      this.pool.on('connect', () => {
        logger.debug('PostgreSQL client connected');
      });

      this.pool.on('remove', () => {
        logger.debug('PostgreSQL client removed');
      });

    } catch (error) {
      logger.error('PostgreSQL connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('PostgreSQL disconnected');
    }
  }

  async query(text, params) {
    if (!this.isConnected) {
      throw new Error('PostgreSQL is not connected');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn(`Slow PostgreSQL query (${duration}ms):`, { query: text, params });
      }
      
      return result;
    } catch (error) {
      logger.error('PostgreSQL query error:', { error: error.message, query: text, params });
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.isConnected) {
      throw new Error('PostgreSQL is not connected');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('PostgreSQL transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      logger.error('PostgreSQL health check failed:', error);
      return false;
    }
  }

  // Get connection pool stats
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected
    };
  }
}

// Create singleton instance
const postgresDB = new PostgresDB();

module.exports = postgresDB;
