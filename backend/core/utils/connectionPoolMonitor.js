/**
 * Connection Pool Monitor
 * Provides utilities for monitoring MongoDB connection pool health and performance
 */

const mongoose = require('mongoose');

/**
 * Get current connection pool statistics
 * @returns {Object} Connection pool stats
 */
function getPoolStats() {
  try {
    const connection = mongoose.connection;
    
    if (!connection || connection.readyState !== 1) {
      return {
        status: 'disconnected',
        readyState: connection?.readyState || 0,
        message: 'Database not connected'
      };
    }
    
    // Get pool stats from the connection
    const pool = connection.db?.serverConfig?.s?.pool;
    
    if (!pool) {
      return {
        status: 'connected',
        readyState: connection.readyState,
        message: 'Pool stats not available',
        host: connection.host,
        name: connection.name
      };
    }
    
    return {
      status: 'connected',
      readyState: connection.readyState,
      host: connection.host,
      name: connection.name,
      pool: {
        totalConnections: pool.totalConnectionCount || 0,
        availableConnections: pool.availableConnectionCount || 0,
        inUseConnections: pool.inUseConnectionCount || 0,
        waitQueueSize: pool.waitQueueSize || 0
      },
      config: {
        maxPoolSize: connection.client?.options?.maxPoolSize || 'N/A',
        minPoolSize: connection.client?.options?.minPoolSize || 'N/A',
        maxIdleTimeMS: connection.client?.options?.maxIdleTimeMS || 'N/A'
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Check if connection pool is healthy
 * @returns {Object} Health check result
 */
function checkPoolHealth() {
  const stats = getPoolStats();
  
  if (stats.status !== 'connected') {
    return {
      healthy: false,
      reason: stats.message || 'Database not connected',
      stats
    };
  }
  
  if (!stats.pool) {
    return {
      healthy: true,
      reason: 'Connected but pool stats unavailable',
      stats
    };
  }
  
  const { pool, config } = stats;
  const maxPoolSize = config.maxPoolSize;
  
  // Check if pool is exhausted
  if (pool.availableConnections === 0 && pool.waitQueueSize > 0) {
    return {
      healthy: false,
      reason: 'Connection pool exhausted - all connections in use with waiting requests',
      recommendation: 'Consider increasing maxPoolSize',
      stats
    };
  }
  
  // Check if pool utilization is very high
  const utilizationPercent = (pool.inUseConnections / maxPoolSize) * 100;
  if (utilizationPercent > 90) {
    return {
      healthy: true,
      warning: `High pool utilization: ${utilizationPercent.toFixed(1)}%`,
      recommendation: 'Monitor for potential pool exhaustion',
      stats
    };
  }
  
  return {
    healthy: true,
    reason: 'Connection pool is healthy',
    utilizationPercent: utilizationPercent.toFixed(1),
    stats
  };
}

/**
 * Start periodic monitoring of connection pool
 * @param {number} intervalMs - Monitoring interval in milliseconds
 * @param {Function} callback - Callback function to receive stats
 * @returns {NodeJS.Timeout} Interval timer
 */
function startMonitoring(intervalMs = 60000, callback) {
  return setInterval(() => {
    const health = checkPoolHealth();
    callback(health);
  }, intervalMs);
}

/**
 * Stop monitoring
 * @param {NodeJS.Timeout} timer - Interval timer to stop
 */
function stopMonitoring(timer) {
  if (timer) {
    clearInterval(timer);
  }
}

/**
 * Log connection pool stats
 */
function logPoolStats() {
  const stats = getPoolStats();
  console.log('=== Connection Pool Stats ===');
  console.log(JSON.stringify(stats, null, 2));
}

/**
 * Get connection pool recommendations based on current usage
 * @returns {Object} Recommendations
 */
function getPoolRecommendations() {
  const stats = getPoolStats();
  const recommendations = [];
  
  if (stats.status !== 'connected' || !stats.pool) {
    return {
      recommendations: ['Unable to provide recommendations - pool stats unavailable']
    };
  }
  
  const { pool, config } = stats;
  const maxPoolSize = config.maxPoolSize;
  const utilizationPercent = (pool.inUseConnections / maxPoolSize) * 100;
  
  // High utilization
  if (utilizationPercent > 80) {
    recommendations.push({
      type: 'warning',
      message: `High pool utilization (${utilizationPercent.toFixed(1)}%)`,
      action: 'Consider increasing MONGODB_MAX_POOL_SIZE environment variable'
    });
  }
  
  // Pool exhaustion
  if (pool.availableConnections === 0 && pool.waitQueueSize > 0) {
    recommendations.push({
      type: 'critical',
      message: 'Connection pool exhausted',
      action: 'Increase MONGODB_MAX_POOL_SIZE immediately'
    });
  }
  
  // Low utilization
  if (utilizationPercent < 20 && maxPoolSize > 5) {
    recommendations.push({
      type: 'optimization',
      message: `Low pool utilization (${utilizationPercent.toFixed(1)}%)`,
      action: 'Consider decreasing MONGODB_MAX_POOL_SIZE to save resources'
    });
  }
  
  // Waiting requests
  if (pool.waitQueueSize > 0) {
    recommendations.push({
      type: 'warning',
      message: `${pool.waitQueueSize} requests waiting for connections`,
      action: 'Optimize slow queries or increase pool size'
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'info',
      message: 'Connection pool is optimally configured',
      action: 'No action needed'
    });
  }
  
  return {
    stats,
    recommendations
  };
}

module.exports = {
  getPoolStats,
  checkPoolHealth,
  startMonitoring,
  stopMonitoring,
  logPoolStats,
  getPoolRecommendations
};
