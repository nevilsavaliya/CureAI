/**
 * Cache Initialization
 * Sets up cache monitoring and warming on application startup
 */

const CacheMonitor = require('./cacheMonitor');
const CacheInvalidation = require('../services/CacheInvalidation');

/**
 * Initialize cache system
 * @param {Object} options - Initialization options
 */
function initializeCache(options = {}) {
  const {
    enableMonitoring = process.env.NODE_ENV === 'production',
    monitoringInterval = 15, // minutes
    warmCache = true
  } = options;

  console.log('🚀 Initializing cache system...');

  // Warm up cache with critical data
  if (warmCache) {
    console.log('🔥 Warming up cache...');
    CacheInvalidation.warmUpCache()
      .then(() => console.log('✅ Cache warmed up successfully'))
      .catch(err => console.error('❌ Cache warming failed:', err.message));
  }

  // Start monitoring in production
  if (enableMonitoring) {
    console.log(`📊 Starting cache monitoring (interval: ${monitoringInterval} minutes)`);
    CacheMonitor.startMonitoring(monitoringInterval);
  }

  // Log initial health report
  setTimeout(() => {
    CacheMonitor.logStats();
  }, 2000);

  console.log('✅ Cache system initialized');
}

/**
 * Shutdown cache system gracefully
 */
function shutdownCache() {
  console.log('🛑 Shutting down cache system...');
  CacheMonitor.stopMonitoring();
  console.log('✅ Cache system shut down');
}

module.exports = {
  initializeCache,
  shutdownCache
};
