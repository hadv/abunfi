const redis = require('redis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 50, 1000);
          }
        }
      });

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis client connected and ready');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis client error:', err);
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.info('Redis client disconnected');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();

    } catch (error) {
      logger.error('Redis connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  // Basic Redis operations
  async get(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping get operation');
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, options = {}) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping set operation');
      return false;
    }

    try {
      const args = [key, value];
      if (options.EX) {
        args.push('EX', options.EX);
      }
      if (options.PX) {
        args.push('PX', options.PX);
      }
      if (options.NX) {
        args.push('NX');
      }
      if (options.XX) {
        args.push('XX');
      }

      await this.client.set(...args);
      return true;
    } catch (error) {
      logger.error('Redis set error:', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping del operation');
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', { key, error: error.message });
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', { key, error: error.message });
      return false;
    }
  }

  async expire(key, seconds) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', { key, seconds, error: error.message });
      return false;
    }
  }

  // JSON operations
  async setJSON(key, value, ttl = null) {
    const jsonValue = JSON.stringify(value);
    const options = ttl ? { EX: ttl } : {};
    return await this.set(key, jsonValue, options);
  }

  async getJSON(key) {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error('Redis JSON parse error:', { key, error: error.message });
      return null;
    }
  }

  // Cache operations with fallback
  async cache(key, fetchFunction, ttl = 300) {
    // Try to get from cache first
    const cached = await this.getJSON(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch the data
    try {
      const data = await fetchFunction();
      await this.setJSON(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('Cache fetch function error:', { key, error: error.message });
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Get Redis info
  async getInfo() {
    if (!this.isConnected) {
      return null;
    }

    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Redis info error:', error);
      return null;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
