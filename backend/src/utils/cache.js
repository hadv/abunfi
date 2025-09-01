const { memoryCache } = require('./memoryCache');

/**
 * Cache utility using in-memory storage
 * Simple replacement for Redis-based caching
 */

/**
 * Cache data with TTL
 * @param {string} key - Cache key
 * @param {function} fetchFunction - Function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {any} Cached or fetched data
 */
const cacheWithTTL = async (key, fetchFunction, ttl = 300) => {
  return await memoryCache.cacheWithTTL(key, fetchFunction, ttl);
};

/**
 * Set cache value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {boolean} Success status
 */
const setCache = (key, value, ttl = 300) => {
  return memoryCache.setJSON(key, value, ttl);
};

/**
 * Get cache value
 * @param {string} key - Cache key
 * @returns {any} Cached value or null
 */
const getCache = (key) => {
  return memoryCache.getJSON(key);
};

/**
 * Delete cache value
 * @param {string} key - Cache key
 * @returns {boolean} Success status
 */
const deleteCache = (key) => {
  return memoryCache.delete(key);
};

/**
 * Check if cache key exists
 * @param {string} key - Cache key
 * @returns {boolean} True if exists
 */
const hasCache = (key) => {
  return memoryCache.has(key);
};

/**
 * Clear all cache
 * @returns {boolean} Success status
 */
const clearCache = () => {
  return memoryCache.clear();
};

/**
 * Get cache statistics
 * @returns {object} Cache statistics
 */
const getCacheStats = () => {
  return memoryCache.getStats();
};

/**
 * Cache health check
 * @returns {boolean} Always true for memory cache
 */
const cacheHealthCheck = () => {
  return memoryCache.healthCheck();
};

module.exports = {
  cacheWithTTL,
  setCache,
  getCache,
  deleteCache,
  hasCache,
  clearCache,
  getCacheStats,
  cacheHealthCheck,
  // Export the memory cache instance for direct access if needed
  memoryCache
};
