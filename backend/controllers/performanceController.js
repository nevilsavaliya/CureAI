/**
 * Performance Monitoring Controller
 * Provides endpoints for monitoring system performance
 */

const { getPoolStats, checkPoolHealth, getPoolRecommendations } = require('../core/utils/connectionPoolMonitor');
const { getCompressionConfig } = require('../middleware/compressionMiddleware');

/**
 * Get connection pool statistics
 */
exports.getPoolStats = async (req, res) => {
  try {
    const stats = getPoolStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting pool stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection pool statistics',
      error: error.message
    });
  }
};

/**
 * Get connection pool health check
 */
exports.getPoolHealth = async (req, res) => {
  try {
    const health = checkPoolHealth();
    
    const statusCode = health.healthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.healthy,
      data: health
    });
  } catch (error) {
    console.error('Error checking pool health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection pool health',
      error: error.message
    });
  }
};

/**
 * Get connection pool recommendations
 */
exports.getPoolRecommendations = async (req, res) => {
  try {
    const recommendations = getPoolRecommendations();
    
    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting pool recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection pool recommendations',
      error: error.message
    });
  }
};

/**
 * Get performance configuration
 */
exports.getPerformanceConfig = async (req, res) => {
  try {
    const config = {
      connectionPool: {
        maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE || 10,
        minPoolSize: process.env.MONGODB_MIN_POOL_SIZE || 2,
        maxIdleTimeMS: process.env.MONGODB_MAX_IDLE_TIME_MS || 30000
      },
      compression: getCompressionConfig(),
      pagination: {
        defaultLimit: 10,
        maxLimit: 100
      }
    };
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting performance config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance configuration',
      error: error.message
    });
  }
};

/**
 * Get system performance metrics
 */
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const poolStats = getPoolStats();
    const poolHealth = checkPoolHealth();
    const memoryUsage = process.memoryUsage();
    
    const metrics = {
      connectionPool: {
        stats: poolStats,
        health: poolHealth
      },
      memory: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
      },
      uptime: {
        seconds: process.uptime(),
        formatted: formatUptime(process.uptime())
      },
      nodeVersion: process.version,
      platform: process.platform
    };
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error.message
    });
  }
};

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
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
