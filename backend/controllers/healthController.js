/**
 * Health Check Controller
 * Provides health check endpoints for monitoring and load balancers
 */

const healthCheck = require('../core/utils/healthCheck');
const logger = require('../services/logger');

/**
 * Basic health check endpoint
 * Returns simple status for load balancers
 */
exports.basicHealthCheck = async (req, res) => {
  try {
    // Quick check - just verify server is responding
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Basic health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Detailed health check endpoint
 * Returns comprehensive health status
 */
exports.detailedHealthCheck = async (req, res) => {
  try {
    const useCache = req.query.cache !== 'false';
    const healthStatus = await healthCheck.getHealthStatus(useCache);

    const statusCode = healthStatus.healthy ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(503).json({
      healthy: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message
    });
  }
};

/**
 * Readiness check endpoint
 * Checks if application is ready to serve traffic
 */
exports.readinessCheck = async (req, res) => {
  try {
    // Check critical dependencies
    const dbCheck = await healthCheck.checkDatabase();

    if (!dbCheck.healthy) {
      return res.status(503).json({
        ready: false,
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Database not ready',
        details: dbCheck
      });
    }

    res.status(200).json({
      ready: true,
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      ready: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message
    });
  }
};

/**
 * Liveness check endpoint
 * Checks if application is alive (for Kubernetes)
 */
exports.livenessCheck = async (req, res) => {
  try {
    // Simple check - just verify process is running
    res.status(200).json({
      alive: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Liveness check failed', { error: error.message });
    res.status(503).json({
      alive: false,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
};
