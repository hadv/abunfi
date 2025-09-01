const logger = require('./logger');

/**
 * Simple in-memory cache implementation
 * Replaces Redis for development simplicity
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = null) {
    try {
      // Clear existing timer if any
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }

      // Set the value
      this.cache.set(key, {
        value,
        createdAt: Date.now(),
        ttl
      });

      // Set expiration timer if TTL is provided
      if (ttl && ttl > 0) {
        const timer = setTimeout(() => {
          this.delete(key);
        }, ttl * 1000);
        
        this.timers.set(key, timer);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      logger.error('Memory cache set error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if not found/expired
   */
  get(key) {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.misses++;
        return null;
      }

      // Check if item has expired
      if (item.ttl && (Date.now() - item.createdAt) > (item.ttl * 1000)) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return item.value;
    } catch (error) {
      logger.error('Memory cache get error:', { key, error: error.message });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted, false otherwise
   */
  delete(key) {
    try {
      // Clear timer if exists
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }

      const deleted = this.cache.delete(key);
      if (deleted) {
        this.stats.deletes++;
      }
      return deleted;
    } catch (error) {
      logger.error('Memory cache delete error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if exists and not expired
   */
  has(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if expired
    if (item.ttl && (Date.now() - item.createdAt) > (item.ttl * 1000)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      
      this.timers.clear();
      this.cache.clear();
      
      logger.info('Memory cache cleared');
      return true;
    } catch (error) {
      logger.error('Memory cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Cache with TTL helper function
   * @param {string} key - Cache key
   * @param {function} fetchFunction - Function to fetch data if not cached
   * @param {number} ttl - Time to live in seconds
   * @returns {any} Cached or fetched data
   */
  async cacheWithTTL(key, fetchFunction, ttl = 300) {
    try {
      // Try to get from cache first
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch the data
      const data = await fetchFunction();
      
      // Store in cache
      this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error('Cache with TTL error:', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Set JSON data in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds
   */
  setJSON(key, value, ttl = null) {
    try {
      const jsonValue = JSON.stringify(value);
      return this.set(key, jsonValue, ttl);
    } catch (error) {
      logger.error('Memory cache setJSON error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get JSON data from cache
   * @param {string} key - Cache key
   * @returns {any} Parsed JSON value or null
   */
  getJSON(key) {
    try {
      const value = this.get(key);
      if (value === null) return null;

      return JSON.parse(value);
    } catch (error) {
      logger.error('Memory cache getJSON error:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Health check for memory cache
   * @returns {boolean} Always true for memory cache
   */
  healthCheck() {
    return true;
  }

  /**
   * Get cache info (similar to Redis INFO)
   * @returns {object} Cache information
   */
  getInfo() {
    const stats = this.getStats();
    return {
      connected: true,
      type: 'memory',
      entries: stats.size,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate.toFixed(2),
      memoryUsage: stats.memoryUsage
    };
  }

  /**
   * Cleanup expired entries (manual cleanup)
   * This is automatically handled by timers, but can be called manually
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.ttl && (now - item.createdAt) > (item.ttl * 1000)) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Memory cache cleanup: removed ${cleaned} expired entries`);
    }

    return cleaned;
  }
}

// Create singleton instance
const memoryCache = new MemoryCache();

// Periodic cleanup every 5 minutes
setInterval(() => {
  memoryCache.cleanup();
}, 5 * 60 * 1000);

// Export both the class and instance
module.exports = {
  MemoryCache,
  memoryCache,
  // Helper function for backward compatibility
  cacheWithTTL: (key, fetchFunction, ttl) => memoryCache.cacheWithTTL(key, fetchFunction, ttl)
};
