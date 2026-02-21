/**
 * Cache Monitor Utility
 * Provides monitoring and health check for cache service
 */

const CacheService = require('../services/CacheService');

class CacheMonitor {
  /**
   * Get comprehensive cache health report
   * @returns {Object} Health report
   */
  getHealthReport() {
    const stats = CacheService.getStats();
    const memory = CacheService.getMemoryUsage();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache: {
        size: stats.size,
        maxEntries: stats.maxEntries,
        utilizationPercent: ((stats.size / stats.maxEntries) * 100).toFixed(2),
        hitRate: stats.hitRate,
        evictions: stats.evictions
      },
      memory: {
        heapUsed: memory.heapUsedMB,
        heapTotal: memory.heapTotalMB,
        rss: memory.rssMB,
        estimatedCacheSize: memory.estimatedCacheSizeMB,
        maxCacheMemory: `${memory.maxMemoryMB} MB`,
        pressure: memory.memoryPressure
      },
      performance: {
        hits: stats.hits,
        misses: stats.misses,
        totalRequests: stats.hits + stats.misses
      }
    };

    // Determine overall health status
    if (memory.memoryPressure === 'HIGH') {
      health.status = 'warning';
      health.message = 'High memory pressure detected';
    }

    if (stats.size >= stats.maxEntries * 0.9) {
      health.status = 'warning';
      health.message = 'Cache approaching size limit';
    }

    if (memory.heapUsed > 400) {
      health.status = 'critical';
      health.message = 'Memory usage critical (>400 MB on 512 MB instance)';
    }

    return health;
  }

  /**
   * Log cache statistics to console
   */
  logStats() {
    const report = this.getHealthReport();
    console.log('=== Cache Health Report ===');
    console.log(`Status: ${report.status}`);
    console.log(`Cache Size: ${report.cache.size}/${report.cache.maxEntries} (${report.cache.utilizationPercent}%)`);
    console.log(`Hit Rate: ${report.cache.hitRate}`);
    console.log(`Memory: ${report.memory.heapUsed} / ${report.memory.heapTotal}`);
    console.log(`Cache Memory: ${report.memory.estimatedCacheSize}`);
    console.log(`Memory Pressure: ${report.memory.pressure}`);
    if (report.message) {
      console.log(`⚠️  ${report.message}`);
    }
    console.log('===========================');
  }

  /**
   * Start periodic monitoring
   * @param {Number} intervalMinutes - Monitoring interval in minutes
   */
  startMonitoring(intervalMinutes = 15) {
    console.log(`Starting cache monitoring (every ${intervalMinutes} minutes)`);
    
    // Log initial stats
    this.logStats();

    // Set up periodic logging
    this.monitoringInterval = setInterval(() => {
      this.logStats();
      
      // Auto-evict if memory pressure is high
      if (CacheService.isMemoryPressureHigh()) {
        console.log('⚠️  High memory pressure detected, triggering eviction...');
        CacheService.evictIfNeeded();
      }
    }, intervalMinutes * 60 * 1000);

    return this.monitoringInterval;
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Cache monitoring stopped');
    }
  }

  /**
   * Get cache recommendations based on current state
   * @returns {Array<String>} List of recommendations
   */
  getRecommendations() {
    const report = this.getHealthReport();
    const recommendations = [];

    if (report.memory.memoryPressure === 'HIGH') {
      recommendations.push('Consider reducing cache TTLs to lower memory usage');
      recommendations.push('Consider implementing Redis for external caching');
    }

    if (report.cache.utilizationPercent > 80) {
      recommendations.push('Cache is near capacity, consider increasing maxEntries');
    }

    const hitRate = parseFloat(report.cache.hitRate);
    if (hitRate < 50) {
      recommendations.push('Low cache hit rate, review caching strategy');
    }

    if (report.cache.evictions > 100) {
      recommendations.push('High eviction count, consider increasing cache size or reducing TTLs');
    }

    if (recommendations.length === 0) {
      recommendations.push('Cache is operating optimally');
    }

    return recommendations;
  }
}

module.exports = new CacheMonitor();
