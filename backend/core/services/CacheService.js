/**
 * CacheService - Enhanced in-memory caching with TTL, statistics, and pattern-based operations
 * Provides cache-aside pattern implementation for frequently accessed data
 * Optimized for 512 MB deployment with size limits and LRU eviction
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
    this.accessOrder = new Map(); // Track access order for LRU
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    this.maxEntries = 1000; // Maximum number of cache entries
    this.maxMemoryMB = 100; // Soft limit for cache memory (MB)
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      evictions: 0 // Track LRU evictions
    };
    this.timers = new Map(); // Store timeout references for cleanup
  }

  /**
   * Get a value from cache
   * @param {String} key - Cache key
   * @returns {Promise<any>} Cached value or null if not found/expired
   */
  async get(key) {
    // Check if key exists
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access order for LRU
    this.accessOrder.set(key, Date.now());

    this.stats.hits++;
    return this.cache.get(key);
  }

  /**
   * Set a value in cache with optional TTL
   * @param {String} key - Cache key
   * @param {*} value - Value to cache
   * @param {Number} ttl - Time to live in milliseconds (optional)
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = this.defaultTTL) {
    // Check if we need to evict entries (LRU)
    if (!this.cache.has(key) && this.cache.size >= this.maxEntries) {
      await this.evictLRU();
    }

    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, value);
    this.accessOrder.set(key, Date.now());
    this.stats.sets++;
    
    // Set expiration time
    if (ttl > 0) {
      const expiresAt = Date.now() + ttl;
      this.ttl.set(key, expiresAt);
      
      // Auto-cleanup after TTL
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      
      this.timers.set(key, timer);
    }
  }

  /**
   * Evict least recently used entry
   * @returns {Promise<void>}
   */
  async evictLRU() {
    if (this.accessOrder.size === 0) {
      return;
    }

    // Find the least recently accessed key
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Delete a value from cache
   * @param {String} key - Cache key
   * @returns {Promise<void>}
   */
  async delete(key) {
    // Clear timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    this.cache.delete(key);
    this.ttl.delete(key);
    this.accessOrder.delete(key);
    this.stats.deletes++;
  }

  /**
   * Clear all cache
   * @returns {Promise<void>}
   */
  async clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.ttl.clear();
    this.timers.clear();
    this.accessOrder.clear();
    this.stats.clears++;
  }

  /**
   * Delete all keys matching a pattern
   * @param {String} pattern - Pattern to match (supports wildcards with *)
   * @returns {Promise<void>}
   */
  async deletePattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Cache-aside pattern: Get from cache or fetch and cache
   * @param {String} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not in cache
   * @param {Number} ttl - Time to live in milliseconds (optional)
   * @returns {Promise<any>} Cached or fetched value
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch data
    const data = await fetchFn();
    
    // Cache the result
    if (data !== null && data !== undefined) {
      await this.set(key, data, ttl);
    }

    return data;
  }

  /**
   * Check if key exists in cache and is not expired
   * @param {String} key - Cache key
   * @returns {Boolean}
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    // Check if expired
    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats including hit rate
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 0;

    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      clears: this.stats.clears,
      evictions: this.stats.evictions,
      hitRate: `${hitRate}%`,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage stats
   */
  getMemoryUsage() {
    const used = process.memoryUsage();
    const estimatedCacheSize = this.estimateCacheSize();

    return {
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsedMB: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
      heapTotalMB: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      rss: Math.round(used.rss / 1024 / 1024),
      rssMB: `${Math.round(used.rss / 1024 / 1024)} MB`,
      cacheSize: this.cache.size,
      estimatedCacheSizeMB: `${estimatedCacheSize.toFixed(2)} MB`,
      maxMemoryMB: this.maxMemoryMB,
      memoryPressure: estimatedCacheSize > this.maxMemoryMB * 0.8 ? 'HIGH' : 'NORMAL'
    };
  }

  /**
   * Estimate cache size in MB (rough approximation)
   * @returns {Number} Estimated size in MB
   */
  estimateCacheSize() {
    let totalSize = 0;
    
    for (const [key, value] of this.cache.entries()) {
      // Rough estimation: key size + value size
      totalSize += key.length * 2; // 2 bytes per char
      totalSize += this.estimateObjectSize(value);
    }

    return totalSize / 1024 / 1024; // Convert to MB
  }

  /**
   * Estimate object size in bytes (rough approximation)
   * @param {*} obj - Object to estimate
   * @returns {Number} Estimated size in bytes
   */
  estimateObjectSize(obj) {
    if (obj === null || obj === undefined) return 0;
    
    const type = typeof obj;
    
    if (type === 'string') {
      return obj.length * 2; // 2 bytes per char
    } else if (type === 'number') {
      return 8; // 8 bytes for number
    } else if (type === 'boolean') {
      return 4; // 4 bytes for boolean
    } else if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this.estimateObjectSize(item), 0);
    } else if (type === 'object') {
      return Object.entries(obj).reduce((sum, [key, value]) => {
        return sum + key.length * 2 + this.estimateObjectSize(value);
      }, 0);
    }
    
    return 0;
  }

  /**
   * Check if cache is approaching memory limits
   * @returns {Boolean} True if memory pressure is high
   */
  isMemoryPressureHigh() {
    const estimatedSize = this.estimateCacheSize();
    return estimatedSize > this.maxMemoryMB * 0.8;
  }

  /**
   * Evict entries if memory pressure is high
   * @returns {Promise<void>}
   */
  async evictIfNeeded() {
    while (this.isMemoryPressureHigh() && this.cache.size > 0) {
      await this.evictLRU();
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      evictions: 0
    };
  }

  /**
   * Get all keys in cache
   * @returns {Array<String>}
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   * @returns {Number}
   */
  size() {
    return this.cache.size;
  }
}

// Export singleton instance
module.exports = new CacheService();
