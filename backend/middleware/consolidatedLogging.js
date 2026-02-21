/**
 * Consolidated Logging Middleware
 * Uses response interceptor events for logging
 * Consolidates logging from:
 * - logging.js (request/response logging)
 * - alertMiddleware.js (alert tracking)
 * - apiMonitoring.js (API monitoring)
 * - errorTracking.js (error tracking)
 * - adminSecurityMiddleware.js (admin operation logging)
 */

const logger = require('../services/logger');
const alertService = require('../services/alertService');
const apiMonitoring = require('../services/apiMonitoring');
const errorTracker = require('../services/errorTracker');
const auditLoggerService = require('../services/auditLoggerService');
const { responseEvents } = require('./responseInterceptor');
const { getRequestMetadata } = require('./utils/requestUtils');

/**
 * Initialize logging event listeners
 * Sets up listeners for response interceptor events
 */
function initializeLogging() {
  // Log all completed responses
  responseEvents.on('complete', (data) => {
    const { req, res, responseTime, statusCode, metadata } = data;

    // Log the response
    logger.api.response({
      method: req.method,
      url: req.originalUrl,
      statusCode,
      responseTime,
      hospitalId: req.hospital?.id || req.user?.id || 'anonymous'
    });

    // Log slow responses
    if (responseTime > 1000) {
      logger.performance.slowApi({
        endpoint: req.originalUrl,
        method: req.method,
        responseTime,
        hospitalId: req.hospital?.id || req.user?.id || 'anonymous'
      });
    }

    // Track API monitoring for hospital endpoints
    if (req.originalUrl.includes('/api/hospitals/api/') && req.trackingId) {
      apiMonitoring.trackRequestEnd(req.trackingId, {
        method: req.method,
        url: req.originalUrl,
        endpoint: req.originalUrl,
        statusCode,
        responseTime,
        hospitalId: req.hospital?.id
      });
    }

    // Log admin operations
    if (req.admin) {
      setImmediate(async () => {
        try {
          await auditLoggerService.logAdminAction({
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            action: 'ADMIN_OPERATION',
            details: {
              reason: `Admin operation: ${req.method} ${req.originalUrl}`,
              ...metadata,
              additionalData: {
                statusCode,
                success: statusCode < 400,
                suspiciousActivity: req.suspiciousActivity,
                responseTime
              }
            },
            status: statusCode < 400 ? 'success' : 'failed'
          });
        } catch (logError) {
          logger.error('Admin operation logging error', {
            type: 'ADMIN_OPERATION_LOGGING_ERROR',
            error: logError.message,
            adminId: req.admin._id
          });
        }
      });
    }
  });

  // Handle critical errors (5xx)
  responseEvents.on('error:critical', (data) => {
    const { req, res, statusCode, metadata } = data;

    // Send critical error alert
    alertService.sendAlert('CRITICAL_ERROR', {
      message: `Critical error occurred: ${statusCode}`,
      details: {
        statusCode,
        endpoint: req.originalUrl,
        method: req.method,
        ...metadata
      },
      severity: 'critical'
    }).catch(error => {
      logger.error('Failed to send critical error alert', {
        type: 'ALERT_SEND_ERROR',
        error: error.message,
        originalStatusCode: statusCode
      });
    });

    // Track error
    const error = new Error(`HTTP ${statusCode} Error`);
    error.statusCode = statusCode;
    
    errorTracker.trackError({
      category: errorTracker.errorCategories.SYSTEM,
      severity: errorTracker.errorSeverity.HIGH,
      error,
      context: {
        endpoint: req.originalUrl,
        method: req.method,
        statusCode,
        ...metadata
      },
      hospitalId: req.hospital?.id,
      userId: req.user?.id,
      req
    });
  });

  // Handle authentication failures (401)
  responseEvents.on('error:auth', (data) => {
    const { req, metadata } = data;

    // Track authentication failure
    const authFailureData = {
      endpoint: req.originalUrl,
      method: req.method,
      reason: 'Authentication failed',
      ...metadata
    };

    // Store for potential aggregation
    if (!req.authFailures) {
      req.authFailures = [];
    }
    req.authFailures.push(authFailureData);
  });

  // Handle rate limit violations (429)
  responseEvents.on('error:rateLimit', (data) => {
    const { req, metadata } = data;

    // Track rate limit violation
    const rateLimitData = {
      endpoint: req.originalUrl,
      method: req.method,
      ...metadata
    };

    // Store for potential aggregation
    if (!req.rateLimitViolations) {
      req.rateLimitViolations = [];
    }
    req.rateLimitViolations.push(rateLimitData);
  });

  // Handle slow responses (>5s)
  responseEvents.on('performance:slow', (data) => {
    const { req, responseTime, statusCode, metadata } = data;

    // Send slow performance alert
    alertService.sendAlert('SLOW_PERFORMANCE', {
      message: `Very slow response detected: ${responseTime}ms`,
      details: {
        responseTime,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode,
        ...metadata
      },
      severity: 'high'
    }).catch(error => {
      logger.error('Failed to send slow response alert', {
        type: 'ALERT_SEND_ERROR',
        error: error.message,
        responseTime
      });
    });
  });

  // Handle JSON responses for patient data tracking
  responseEvents.on('json', (data) => {
    const { req, res, data: responseData, statusCode } = data;

    // Track patient data access for hospital API
    if (statusCode >= 200 && statusCode < 300 && 
        responseData.success && responseData.patient &&
        req.originalUrl.includes('/api/hospitals/api/')) {
      
      const responseTime = Date.now() - data.startTime;
      
      apiMonitoring.trackPatientDataAccess({
        hospitalId: req.hospital?.id,
        hospitalName: req.hospital?.hospitalName || req.hospital?.name,
        patientId: responseData.patient.id,
        patientEmail: req.body?.patientEmail,
        endpoint: req.originalUrl,
        method: req.method,
        success: true,
        responseTime,
        ...getRequestMetadata(req)
      });
    }
  });

  logger.info('Consolidated logging initialized', {
    type: 'LOGGING_INIT',
    timestamp: new Date().toISOString()
  });
}

/**
 * Request logging middleware
 * Logs incoming requests
 */
function requestLogger(req, res, next) {
  // Log the incoming request
  logger.api.request({
    method: req.method,
    url: req.originalUrl,
    hospitalId: req.hospital?.id || req.user?.id || 'anonymous',
    ...getRequestMetadata(req)
  });

  // Track API request start for hospital endpoints
  if (req.originalUrl.includes('/api/hospitals/api/')) {
    req.trackingId = apiMonitoring.trackRequestStart({
      method: req.method,
      url: req.originalUrl,
      hospitalId: req.hospital?.id,
      ...getRequestMetadata(req)
    });
  }

  next();
}

/**
 * Error logging middleware
 * Logs unhandled errors
 */
function errorLogger(err, req, res, next) {
  logger.error('Unhandled error', {
    type: 'UNHANDLED_ERROR',
    error: err.message,
    stack: err.stack,
    ...getRequestMetadata(req)
  });

  next(err);
}

/**
 * Add logging context to request
 * Provides helper methods for logging
 */
function addLoggingContext(req, res, next) {
  // Add hospital logging context to request
  req.logHospitalAction = (action, data = {}) => {
    const baseData = {
      hospitalId: req.hospital?.id,
      hospitalName: req.hospital?.hospitalName,
      ...getRequestMetadata(req),
      ...data
    };

    switch (action) {
      case 'registration':
        logger.hospital.registration(baseData);
        break;
      case 'login':
        logger.hospital.login(baseData);
        break;
      case 'api_access':
        logger.hospital.apiAccess(baseData);
        break;
      case 'api_error':
        logger.hospital.apiError(baseData);
        break;
      case 'verification':
        logger.hospital.verification(baseData);
        break;
      default:
        logger.info(`Hospital action: ${action}`, baseData);
    }
  };

  // Add security logging context to request
  req.logSecurityEvent = (event, data = {}) => {
    const baseData = {
      hospitalId: req.hospital?.id,
      ...getRequestMetadata(req),
      ...data
    };

    switch (event) {
      case 'invalid_credentials':
        logger.security.invalidApiCredentials(baseData);
        break;
      case 'rate_limit_exceeded':
        logger.security.rateLimitExceeded(baseData);
        break;
      case 'suspicious_activity':
        logger.security.suspiciousActivity(baseData);
        break;
      case 'unauthorized_access':
        logger.security.unauthorizedAccess(baseData);
        break;
      default:
        logger.warn(`Security event: ${event}`, baseData);
    }
  };

  // Add alert tracking methods
  req.sendAlert = (alertType, alertData) => {
    return alertService.sendAlert(alertType, {
      ...alertData,
      details: {
        ...alertData.details,
        ...getRequestMetadata(req)
      }
    });
  };

  // Add error tracking method
  req.trackError = (error, context = {}) => {
    return errorTracker.trackError({
      error,
      context: {
        ...context,
        hospitalId: req.hospital?.id || req.user?.id,
        userId: req.user?.id
      },
      req
    });
  };

  next();
}

module.exports = {
  initializeLogging,
  requestLogger,
  errorLogger,
  addLoggingContext
};
