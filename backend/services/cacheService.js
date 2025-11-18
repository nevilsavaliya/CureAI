/**
 * Cache Service
 * Simple in-memory caching for frequently accessed data
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each cache entry
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Set a value in cache with optional TTL
   * @param {String} key - Cache key
   * @param {*} value - Value to cache
   * @param {Number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value);
    
    // Set expiration time
    const expiresAt = Date.now() + ttl;
    this.ttl.set(key, expiresAt);
    
    // Auto-cleanup after TTL
    setTimeout(() => {
      this.delete(key);
    }, ttl);
  }

  /**
   * Get a value from cache
   * @param {String} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    // Check if key exists
    if (!this.cache.has(key)) {
      return null;
    }

    // Check if expired
    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Delete a value from cache
   * @param {String} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  /**
   * Check if key exists in cache
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
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Generate cache key for case list
   * @param {String} userId - User ID
   * @param {String} status - Case status filter
   * @returns {String} Cache key
   */
  getCaseListKey(userId, status = 'all') {
    return `cases:${userId}:${status}`;
  }

  /**
   * Generate cache key for case details
   * @param {String} caseId - Case ID
   * @returns {String} Cache key
   */
  getCaseKey(caseId) {
    return `case:${caseId}`;
  }

  /**
   * Generate cache key for unread notification count
   * @param {String} userId - User ID
   * @returns {String} Cache key
   */
  getUnreadCountKey(userId) {
    return `unread:${userId}`;
  }

  /**
   * Invalidate case-related caches
   * @param {String} caseId - Case ID
   * @param {String} patientId - Patient ID
   * @param {String} doctorId - Doctor ID
   */
  invalidateCaseCache(caseId, patientId, doctorId) {
    // Invalidate case details
    this.delete(this.getCaseKey(caseId));
    
    // Invalidate case lists for both patient and doctor
    if (patientId) {
      ['all', 'pending', 'ongoing', 'treated', 'rejected'].forEach(status => {
        this.delete(this.getCaseListKey(patientId, status));
      });
    }
    
    if (doctorId) {
      ['all', 'pending', 'ongoing', 'treated', 'rejected'].forEach(status => {
        this.delete(this.getCaseListKey(doctorId, status));
      });
    }
  }

  /**
   * Invalidate notification cache
   * @param {String} userId - User ID
   */
  invalidateNotificationCache(userId) {
    this.delete(this.getUnreadCountKey(userId));
  }
}

// Export singleton instance
module.exports = new CacheService();
