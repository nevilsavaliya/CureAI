/**
 * Health Check Service - Comprehensive system health monitoring
 * Checks database, external services, and system resources
 */

const mongoose = require('mongoose');
const os = require('os');
const logger = require('../../services/logger');
const { manager: circuitBreakerManager } = require('./circuitBreaker');

class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.lastCheckTime = null;
    this.lastCheckResults = null;
  }

  /**
   * Register a custom health check
   * @param {string} name - Check name
   * @param {Function} checkFunction - Async function that returns health status
   */
  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
    logger.info(`Health check registered: ${name}`);
  }

  /**
   * Check database connectivity
   * @returns {Promise<Object>} - Database health status
   */
  async checkDatabase() {
    const startTime = Date.now();
    
    try {
      // Check MongoDB connection state
      const state = mongoose.connection.readyState;
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      if (state !== 1) {
        return {
          healthy: false,
          status: stateMap[state] || 'unknown',
          message: 'Database not connected',
          responseTime: Date.now() - startTime
        };
      }

      // Perform a simple query to verify connectivity
      await mongoose.connection.db.admin().ping();

      // Get database stats
      const dbStats = await mongoose.connection.db.stats();

      return {
        healthy: true,
        status: 'connected',
        message: 'Database connection healthy',
        responseTime: Date.now() - startTime,
        details: {
          database: mongoose.connection.name,
          collections: dbStats.collections,
          dataSize: this.formatBytes(dbStats.dataSize),
          indexSize: this.formatBytes(dbStats.indexSize)
        }
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        healthy: false,
        status: 'error',
        message: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check system resources (memory, CPU)
   * @returns {Object} - System resource status
   */
  checkSystemResources() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      // Get process memory usage
      const processMemory = process.memoryUsage();
      const heapUsedPercent = (processMemory.heapUsed / processMemory.heapTotal) * 100;

      // Get CPU load average (1, 5, 15 minutes)
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;

      // Calculate uptime
      const uptime = process.uptime();

      // Determine health status
      const memoryHealthy = memoryUsagePercent < 90;
      const heapHealthy = heapUsedPercent < 90;
      const cpuHealthy = loadAvg[0] < cpuCount * 2; // Load should be less than 2x CPU count

      const healthy = memoryHealthy && heapHealthy && cpuHealthy;

      return {
        healthy,
        status: healthy ? 'healthy' : 'degraded',
        message: healthy ? 'System resources healthy' : 'System resources under pressure',
        details: {
          memory: {
            total: this.formatBytes(totalMemory),
            used: this.formatBytes(usedMemory),
            free: this.formatBytes(freeMemory),
            usagePercent: memoryUsagePercent.toFixed(2),
            healthy: memoryHealthy
          },
          heap: {
            total: this.formatBytes(processMemory.heapTotal),
            used: this.formatBytes(processMemory.heapUsed),
            usagePercent: heapUsedPercent.toFixed(2),
            healthy: heapHealthy
          },
          cpu: {
            count: cpuCount,
            loadAverage: {
              '1min': loadAvg[0].toFixed(2),
              '5min': loadAvg[1].toFixed(2),
              '15min': loadAvg[2].toFixed(2)
            },
            healthy: cpuHealthy
          },
          uptime: {
            seconds: Math.floor(uptime),
            formatted: this.formatUptime(uptime)
          },
          platform: os.platform(),
          nodeVersion: process.version
        }
      };
    } catch (error) {
      logger.error('System resources check failed', { error: error.message });
      return {
        healthy: false,
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Check external services (circuit breakers)
   * @returns {Object} - External services status
   */
  checkExternalServices() {
    try {
      const circuitBreakers = circuitBreakerManager.getAllStates();
      
      const services = circuitBreakers.map(breaker => ({
        name: breaker.name,
        healthy: breaker.state === 'CLOSED',
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastError: breaker.lastError,
        stats: breaker.stats
      }));

      const allHealthy = services.every(service => service.healthy);

      return {
        healthy: allHealthy,
        status: allHealthy ? 'healthy' : 'degraded',
        message: allHealthy ? 'All external services healthy' : 'Some external services degraded',
        services
      };
    } catch (error) {
      logger.error('External services check failed', { error: error.message });
      return {
        healthy: false,
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Run all health checks
   * @returns {Promise<Object>} - Complete health status
   */
  async runAllChecks() {
    const startTime = Date.now();

    try {
      // Run core checks
      const [database, systemResources, externalServices] = await Promise.all([
        this.checkDatabase(),
        Promise.resolve(this.checkSystemResources()),
        Promise.resolve(this.checkExternalServices())
      ]);

      // Run custom checks
      const customChecks = {};
      for (const [name, checkFunction] of this.checks) {
        try {
          customChecks[name] = await checkFunction();
        } catch (error) {
          customChecks[name] = {
            healthy: false,
            status: 'error',
            message: error.message
          };
        }
      }

      // Determine overall health
      const allChecks = {
        database,
        systemResources,
        externalServices,
        ...customChecks
      };

      const overallHealthy = Object.values(allChecks).every(check => check.healthy);

      const result = {
        healthy: overallHealthy,
        status: overallHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        checks: allChecks
      };

      // Cache results
      this.lastCheckTime = Date.now();
      this.lastCheckResults = result;

      return result;
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return {
        healthy: false,
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        message: error.message
      };
    }
  }

  /**
   * Get cached health check results
   * @param {number} maxAge - Maximum age of cached results in milliseconds
   * @returns {Object|null} - Cached results or null if too old
   */
  getCachedResults(maxAge = 30000) {
    if (!this.lastCheckResults || !this.lastCheckTime) {
      return null;
    }

    const age = Date.now() - this.lastCheckTime;
    if (age > maxAge) {
      return null;
    }

    return {
      ...this.lastCheckResults,
      cached: true,
      cacheAge: age
    };
  }

  /**
   * Get health status (with caching)
   * @param {boolean} useCache - Whether to use cached results
   * @returns {Promise<Object>} - Health status
   */
  async getHealthStatus(useCache = true) {
    if (useCache) {
      const cached = this.getCachedResults();
      if (cached) {
        return cached;
      }
    }

    return await this.runAllChecks();
  }

  /**
   * Format bytes to human-readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format uptime to human-readable format
   * @param {number} seconds - Uptime in seconds
   * @returns {string} - Formatted string
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}

// Export singleton instance
module.exports = new HealthCheckService();
