const apiMonitoring = require('../services/apiMonitoring');
const logger = require('../services/logger');
const { trackError } = require('../middleware/errorTracking');

/**
 * API Monitoring Controller
 * Provides endpoints for accessing API monitoring data and metrics
 */

/**
 * Get real-time API metrics
 * GET /api/admin/monitoring/realtime
 */
exports.getRealTimeMetrics = async (req, res) => {
  try {
    const metrics = apiMonitoring.getRealTimeMetrics();
    
    logger.info('Real-time API metrics requested', {
      type: 'API_MONITORING_ACCESS',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    const errorId = trackError('system')(error, {
      operation: 'get_realtime_metrics',
      adminId: req.user?.id
    }, req);

    logger.error('Error getting real-time API metrics', {
      type: 'API_MONITORING_ERROR',
      errorId: errorId,
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get real-time metrics',
      errorId: errorId
    });
  }
};

/**
 * Get comprehensive API statistics
 * GET /api/admin/monitoring/statistics
 */
exports.getApiStatistics = async (req, res) => {
  try {
    const { startDate, endDate, useCache = 'true' } = req.query;
    
    // Parse dates if provided
    let start = null;
    let end = null;
    
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
        });
      }
    }
    
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
        });
      }
    }
    
    // Validate date range
    if (start && end && start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate cannot be after endDate'
      });
    }

    const statistics = await apiMonitoring.getApiStatistics(
      start, 
      end, 
      useCache === 'true'
    );
    
    logger.info('API statistics requested', {
      type: 'API_MONITORING_ACCESS',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      startDate: start?.toISOString(),
      endDate: end?.toISOString(),
      useCache: useCache === 'true',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    const errorId = trackError('system')(error, {
      operation: 'get_api_statistics',
      adminId: req.user?.id,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    }, req);

    logger.error('Error getting API statistics', {
      type: 'API_MONITORING_ERROR',
      errorId: errorId,
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get API statistics',
      errorId: errorId
    });
  }
};

/**
 * Get API health status
 * GET /api/admin/monitoring/health
 */
exports.getApiHealth = async (req, res) => {
  try {
    const metrics = apiMonitoring.getRealTimeMetrics();
    
    // Determine health status based on metrics
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        errorRate: {
          status: 'healthy',
          value: metrics.requests.errorRate,
          threshold: 5,
          message: 'Error rate is within acceptable limits'
        },
        responseTime: {
          status: 'healthy',
          value: metrics.performance.averageResponseTime,
          threshold: 1000,
          message: 'Response time is within acceptable limits'
        },
        availability: {
          status: 'healthy',
          value: 100,
          threshold: 99,
          message: 'API is available'
        }
      },
      alerts: metrics.alerts
    };

    // Check error rate
    if (metrics.requests.errorRate > 10) {
      health.status = 'unhealthy';
      health.checks.errorRate.status = 'critical';
      health.checks.errorRate.message = 'Error rate is critically high';
    } else if (metrics.requests.errorRate > 5) {
      health.status = 'degraded';
      health.checks.errorRate.status = 'warning';
      health.checks.errorRate.message = 'Error rate is elevated';
    }

    // Check response time
    if (metrics.performance.averageResponseTime > 5000) {
      health.status = 'unhealthy';
      health.checks.responseTime.status = 'critical';
      health.checks.responseTime.message = 'Response time is critically slow';
    } else if (metrics.performance.averageResponseTime > 1000) {
      if (health.status === 'healthy') health.status = 'degraded';
      health.checks.responseTime.status = 'warning';
      health.checks.responseTime.message = 'Response time is slow';
    }

    // Set appropriate HTTP status code
    let statusCode = 200;
    if (health.status === 'degraded') {
      statusCode = 200; // Still operational
    } else if (health.status === 'unhealthy') {
      statusCode = 503; // Service unavailable
    }

    logger.info('API health check requested', {
      type: 'API_HEALTH_CHECK',
      status: health.status,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    const errorId = trackError('system')(error, {
      operation: 'get_api_health',
      adminId: req.user?.id
    }, req);

    logger.error('Error getting API health status', {
      type: 'API_MONITORING_ERROR',
      errorId: errorId,
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get API health status',
      errorId: errorId,
      data: {
        status: 'unknown',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      }
    });
  }
};

/**
 * Clear API monitoring cache
 * POST /api/admin/monitoring/clear-cache
 */
exports.clearCache = async (req, res) => {
  try {
    apiMonitoring.clearCache();
    
    logger.info('API monitoring cache cleared', {
      type: 'API_MONITORING_CACHE_CLEARED',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'API monitoring cache cleared successfully'
    });
  } catch (error) {
    const errorId = trackError('system')(error, {
      operation: 'clear_monitoring_cache',
      adminId: req.user?.id
    }, req);

    logger.error('Error clearing API monitoring cache', {
      type: 'API_MONITORING_ERROR',
      errorId: errorId,
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      errorId: errorId
    });
  }
};

/**
 * Get API monitoring configuration
 * GET /api/admin/monitoring/config
 */
exports.getMonitoringConfig = async (req, res) => {
  try {
    const config = {
      performanceThresholds: apiMonitoring.performanceThresholds,
      alertThresholds: apiMonitoring.alertThresholds,
      cacheDuration: apiMonitoring.cacheDuration,
      rateLimits: {
        requestsPerHour: 100,
        windowMs: 60 * 60 * 1000
      }
    };

    logger.info('API monitoring configuration requested', {
      type: 'API_MONITORING_CONFIG_ACCESS',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    const errorId = trackError('system')(error, {
      operation: 'get_monitoring_config',
      adminId: req.user?.id
    }, req);

    logger.error('Error getting monitoring configuration', {
      type: 'API_MONITORING_ERROR',
      errorId: errorId,
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get monitoring configuration',
      errorId: errorId
    });
  }
};

/**
 * Export metrics in Prometheus format (for external monitoring systems)
 * GET /api/admin/monitoring/prometheus
 */
exports.getPrometheusMetrics = async (req, res) => {
  try {
    const metrics = apiMonitoring.getRealTimeMetrics();
    
    // Convert metrics to Prometheus format
    const prometheusMetrics = [
      '# HELP hospital_api_requests_total Total number of API requests',
      '# TYPE hospital_api_requests_total counter',
      `hospital_api_requests_total{status="total"} ${metrics.requests.total}`,
      `hospital_api_requests_total{status="successful"} ${metrics.requests.successful}`,
      `hospital_api_requests_total{status="failed"} ${metrics.requests.failed}`,
      '',
      '# HELP hospital_api_response_time_seconds Average API response time in seconds',
      '# TYPE hospital_api_response_time_seconds gauge',
      `hospital_api_response_time_seconds ${metrics.performance.averageResponseTime / 1000}`,
      '',
      '# HELP hospital_api_error_rate_percent API error rate percentage',
      '# TYPE hospital_api_error_rate_percent gauge',
      `hospital_api_error_rate_percent ${metrics.requests.errorRate}`,
      '',
      '# HELP hospital_api_slow_requests_total Total number of slow API requests',
      '# TYPE hospital_api_slow_requests_total counter',
      `hospital_api_slow_requests_total ${metrics.performance.slowRequests}`,
      '',
      '# HELP hospital_api_auth_errors_total Total number of authentication errors',
      '# TYPE hospital_api_auth_errors_total counter',
      `hospital_api_auth_errors_total ${metrics.security.authenticationErrors}`,
      '',
      '# HELP hospital_api_rate_limit_exceeded_total Total number of rate limit exceeded events',
      '# TYPE hospital_api_rate_limit_exceeded_total counter',
      `hospital_api_rate_limit_exceeded_total ${metrics.security.rateLimitExceeded}`,
      '',
      '# HELP hospital_api_unique_hospitals_gauge Number of unique hospitals accessing API today',
      '# TYPE hospital_api_unique_hospitals_gauge gauge',
      `hospital_api_unique_hospitals_gauge ${metrics.usage.uniqueHospitals}`,
      '',
      '# HELP hospital_api_patient_data_requests_total Total number of patient data requests',
      '# TYPE hospital_api_patient_data_requests_total counter',
      `hospital_api_patient_data_requests_total ${metrics.usage.patientDataRequests}`,
      ''
    ].join('\n');

    logger.info('Prometheus metrics requested', {
      type: 'API_MONITORING_PROMETHEUS_ACCESS',
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(prometheusMetrics);
  } catch (error) {
    const errorId = trackError('system')(error, {
      operation: 'get_prometheus_metrics',
      adminId: req.user?.id
    }, req);

    logger.error('Error getting Prometheus metrics', {
      type: 'API_MONITORING_ERROR',
      errorId: errorId,
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get Prometheus metrics',
      errorId: errorId
    });
  }
};

module.exports = {
  getRealTimeMetrics: exports.getRealTimeMetrics,
  getApiStatistics: exports.getApiStatistics,
  getApiHealth: exports.getApiHealth,
  clearCache: exports.clearCache,
  getMonitoringConfig: exports.getMonitoringConfig,
  getPrometheusMetrics: exports.getPrometheusMetrics
};