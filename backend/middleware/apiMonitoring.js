const apiMonitoring = require('../services/apiMonitoring');
const logger = require('../services/logger');

/**
 * API Monitoring Middleware
 * Tracks API requests, responses, and performance metrics
 */

/**
 * Middleware to track API request start
 */
exports.trackApiRequestStart = (req, res, next) => {
  try {
    // Record request start time
    req.apiStartTime = Date.now();
    
    // Generate tracking ID for this request
    req.trackingId = apiMonitoring.trackRequestStart({
      method: req.method,
      url: req.originalUrl,
      hospitalId: req.hospital?.id,
      ip: logger.getClientIP(req),
      userAgent: logger.getUserAgent(req)
    });

    next();
  } catch (error) {
    logger.error('API monitoring request start error', {
      type: 'API_MONITORING_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    // Continue without monitoring on error
    next();
  }
};

/**
 * Middleware to track API request completion
 */
exports.trackApiRequestEnd = (req, res, next) => {
  try {
    // Override res.end to capture response data
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
      try {
        const responseTime = Date.now() - (req.apiStartTime || Date.now());
        
        // Track request completion
        if (req.trackingId) {
          apiMonitoring.trackRequestEnd(req.trackingId, {
            method: req.method,
            url: req.originalUrl,
            endpoint: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: responseTime,
            hospitalId: req.hospital?.id
          });
        }
      } catch (error) {
        logger.error('API monitoring request end error', {
          type: 'API_MONITORING_ERROR',
          error: error.message,
          endpoint: req.originalUrl,
          timestamp: new Date().toISOString()
        });
      }
      
      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };

    next();
  } catch (error) {
    logger.error('API monitoring request end setup error', {
      type: 'API_MONITORING_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    // Continue without monitoring on error
    next();
  }
};

/**
 * Middleware to track patient data access
 */
exports.trackPatientDataAccess = (req, res, next) => {
  try {
    // Override res.json to capture successful patient data responses
    const originalJson = res.json;
    
    res.json = function(data) {
      try {
        // Only track if this is a successful patient data response
        if (res.statusCode >= 200 && res.statusCode < 300 && data.success && data.patient) {
          const responseTime = Date.now() - (req.apiStartTime || Date.now());
          
          apiMonitoring.trackPatientDataAccess({
            hospitalId: req.hospital?.id,
            hospitalName: req.hospital?.hospitalName || req.hospital?.name,
            patientId: data.patient.id,
            patientEmail: req.body?.patientEmail,
            endpoint: req.originalUrl,
            method: req.method,
            success: true,
            responseTime: responseTime,
            ip: logger.getClientIP(req),
            userAgent: logger.getUserAgent(req)
          });
        }
      } catch (error) {
        logger.error('Patient data access tracking error', {
          type: 'API_MONITORING_ERROR',
          error: error.message,
          endpoint: req.originalUrl,
          timestamp: new Date().toISOString()
        });
      }
      
      // Call original json method
      originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Patient data access tracking setup error', {
      type: 'API_MONITORING_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    // Continue without monitoring on error
    next();
  }
};

/**
 * Middleware to track authentication errors
 */
exports.trackAuthenticationError = (error, context, req) => {
  try {
    apiMonitoring.trackAuthenticationError({
      hospitalId: context.hospitalId,
      apiKey: context.apiKey,
      endpoint: req.originalUrl,
      reason: error.message,
      ip: logger.getClientIP(req),
      userAgent: logger.getUserAgent(req)
    });
  } catch (monitoringError) {
    logger.error('Authentication error tracking error', {
      type: 'API_MONITORING_ERROR',
      error: monitoringError.message,
      originalError: error.message,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to track rate limit exceeded events
 */
exports.trackRateLimitExceeded = (rateLimitData, req) => {
  try {
    apiMonitoring.trackRateLimitExceeded({
      hospitalId: rateLimitData.hospitalId || req.hospital?.id,
      hospitalName: rateLimitData.hospitalName || req.hospital?.hospitalName,
      endpoint: req.originalUrl,
      requestCount: rateLimitData.requestCount,
      limit: rateLimitData.limit,
      ip: logger.getClientIP(req)
    });
  } catch (error) {
    logger.error('Rate limit tracking error', {
      type: 'API_MONITORING_ERROR',
      error: error.message,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Combined middleware for hospital API monitoring
 * Combines request start, end, and patient data tracking
 */
exports.hospitalApiMonitoring = [
  exports.trackApiRequestStart,
  exports.trackApiRequestEnd,
  exports.trackPatientDataAccess
];

/**
 * Error handling middleware for API monitoring
 */
exports.apiMonitoringErrorHandler = (err, req, res, next) => {
  try {
    // Track the error if it's related to API operations
    if (req.originalUrl && req.originalUrl.includes('/api/hospitals/api/')) {
      const responseTime = Date.now() - (req.apiStartTime || Date.now());
      
      // Track as failed request
      if (req.trackingId) {
        apiMonitoring.trackRequestEnd(req.trackingId, {
          method: req.method,
          url: req.originalUrl,
          endpoint: req.originalUrl,
          statusCode: err.status || 500,
          responseTime: responseTime,
          hospitalId: req.hospital?.id
        });
      }
    }
  } catch (monitoringError) {
    logger.error('API monitoring error handler error', {
      type: 'API_MONITORING_ERROR',
      error: monitoringError.message,
      originalError: err.message,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
  
  // Continue with normal error handling
  next(err);
};

module.exports = {
  trackApiRequestStart: exports.trackApiRequestStart,
  trackApiRequestEnd: exports.trackApiRequestEnd,
  trackPatientDataAccess: exports.trackPatientDataAccess,
  trackAuthenticationError: exports.trackAuthenticationError,
  trackRateLimitExceeded: exports.trackRateLimitExceeded,
  hospitalApiMonitoring: exports.hospitalApiMonitoring,
  apiMonitoringErrorHandler: exports.apiMonitoringErrorHandler
};