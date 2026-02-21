const alertService = require('../services/alertService');
const logger = require('../services/logger');

/**
 * Alert Middleware
 * Integrates alert system with existing monitoring and error tracking
 */

/**
 * Middleware to track critical errors and send alerts
 */
const trackCriticalErrors = (req, res, next) => {
  // Store original res.status and res.json methods
  const originalStatus = res.status;
  const originalJson = res.json;

  // Override res.status to capture status codes
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return originalStatus.call(this, statusCode);
  };

  // Override res.json to check for errors
  res.json = function (data) {
    // Check for critical errors (5xx status codes)
    if (res.statusCode >= 500) {
      // Send critical error alert
      alertService.sendAlert('CRITICAL_ERROR', {
        message: `Critical error occurred: ${res.statusCode} ${data.message || 'Unknown error'}`,
        details: {
          statusCode: res.statusCode,
          endpoint: req.originalUrl,
          method: req.method,
          error: data.error || data.message,
          hospitalId: req.hospitalId || req.user?.hospitalId,
          userId: req.user?.id,
          ip: logger.getClientIP(req),
          userAgent: logger.getUserAgent(req),
          timestamp: new Date().toISOString()
        },
        severity: 'critical'
      }).catch(error => {
        logger.error('Failed to send critical error alert', {
          type: 'ALERT_SEND_ERROR',
          error: error.message,
          originalError: data.error || data.message,
          timestamp: new Date().toISOString()
        });
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to track database errors and send alerts
 */
const trackDatabaseErrors = (error, req, res, next) => {
  // Check if it's a database-related error
  if (error.name === 'MongoError' ||
    error.name === 'MongooseError' ||
    error.name === 'ValidationError' ||
    error.message.includes('database') ||
    error.message.includes('connection')) {

    alertService.sendAlert('DATABASE_ISSUES', {
      message: `Database error detected: ${error.message}`,
      details: {
        errorName: error.name,
        errorCode: error.code,
        errorMessage: error.message,
        endpoint: req.originalUrl,
        method: req.method,
        hospitalId: req.hospitalId || req.user?.hospitalId,
        userId: req.user?.id,
        ip: logger.getClientIP(req),
        timestamp: new Date().toISOString()
      },
      severity: 'critical'
    }).catch(alertError => {
      logger.error('Failed to send database error alert', {
        type: 'ALERT_SEND_ERROR',
        error: alertError.message,
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  next(error);
};

/**
 * Middleware to track authentication failures and send alerts
 */
const trackAuthFailures = (req, res, next) => {
  // Store original res.status and res.json methods
  const originalStatus = res.status;
  const originalJson = res.json;

  // Override res.status to capture status codes
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return originalStatus.call(this, statusCode);
  };

  // Override res.json to check for auth failures
  res.json = function (data) {
    // Check for authentication failures (401 status codes)
    if (res.statusCode === 401) {
      // Track authentication failure for potential alert
      const authFailureData = {
        endpoint: req.originalUrl,
        method: req.method,
        reason: data.message || 'Authentication failed',
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req),
        timestamp: new Date().toISOString()
      };

      // Store in request for potential aggregation
      if (!req.authFailures) {
        req.authFailures = [];
      }
      req.authFailures.push(authFailureData);

      // Note: Actual alert sending is handled by the alert service's monitoring
      // This just tracks individual failures for aggregation
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to track email service failures
 */
const trackEmailFailures = (req, res, next) => {
  // Add email error tracking to request object
  req.trackEmailError = (error, context = {}) => {
    alertService.sendAlert('EMAIL_FAILURES', {
      message: `Email service failure: ${error.message}`,
      details: {
        errorMessage: error.message,
        emailType: context.emailType || 'unknown',
        recipient: context.recipient || 'unknown',
        template: context.template || 'unknown',
        endpoint: req.originalUrl,
        method: req.method,
        hospitalId: req.hospitalId || req.user?.hospitalId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      },
      severity: 'medium'
    }).catch(alertError => {
      logger.error('Failed to send email failure alert', {
        type: 'ALERT_SEND_ERROR',
        error: alertError.message,
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    });
  };

  next();
};

/**
 * Middleware to track rate limit violations
 */
const trackRateLimitViolations = (req, res, next) => {
  // Store original res.status and res.json methods
  const originalStatus = res.status;
  const originalJson = res.json;

  // Override res.status to capture status codes
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return originalStatus.call(this, statusCode);
  };

  // Override res.json to check for rate limit violations
  res.json = function (data) {
    // Check for rate limit violations (429 status codes)
    if (res.statusCode === 429) {
      // Track rate limit violation for potential alert
      const rateLimitData = {
        endpoint: req.originalUrl,
        method: req.method,
        hospitalId: req.hospitalId || req.user?.hospitalId,
        userId: req.user?.id,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req),
        timestamp: new Date().toISOString()
      };

      // Store in request for potential aggregation
      if (!req.rateLimitViolations) {
        req.rateLimitViolations = [];
      }
      req.rateLimitViolations.push(rateLimitData);

      // Note: Actual alert sending is handled by the alert service's monitoring
      // This just tracks individual violations for aggregation
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to track slow responses and send performance alerts
 */
const trackSlowResponses = (req, res, next) => {
  const startTime = Date.now();

  // Store original res.end method
  const originalEnd = res.end;

  // Override res.end to capture response time
  res.end = function (...args) {
    const responseTime = Date.now() - startTime;

    // Check for slow responses (over 5 seconds)
    if (responseTime > 5000) {
      alertService.sendAlert('SLOW_PERFORMANCE', {
        message: `Very slow response detected: ${responseTime}ms`,
        details: {
          responseTime: responseTime,
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          hospitalId: req.hospitalId || req.user?.hospitalId,
          userId: req.user?.id,
          ip: logger.getClientIP(req),
          timestamp: new Date().toISOString()
        },
        severity: 'high'
      }).catch(error => {
        logger.error('Failed to send slow response alert', {
          type: 'ALERT_SEND_ERROR',
          error: error.message,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        });
      });
    }

    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Global error handler with alert integration
 */
const globalErrorHandler = (error, req, res, next) => {
  // Determine status code and error details
  const statusCode = error.statusCode || error.status || 500;
  const isOperational = error.isOperational || false;

  // Log the error (only log as error for 5xx, warn for 4xx)
  if (statusCode >= 500) {
    logger.error('Unhandled error', {
      type: 'UNHANDLED_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      hospitalId: req.hospitalId || req.user?.hospitalId,
      userId: req.user?.id,
      ip: logger.getClientIP(req),
      timestamp: new Date().toISOString()
    });

    // Send critical error alert only for 5xx errors
    alertService.sendAlert('CRITICAL_ERROR', {
      message: `Unhandled error: ${error.message}`,
      details: {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
        method: req.method,
        hospitalId: req.hospitalId || req.user?.hospitalId,
        userId: req.user?.id,
        ip: logger.getClientIP(req),
        timestamp: new Date().toISOString()
      },
      severity: 'critical'
    }).catch(alertError => {
      logger.error('Failed to send unhandled error alert', {
        type: 'ALERT_SEND_ERROR',
        error: alertError.message,
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Send error response with appropriate status code
  res.status(statusCode).json({
    success: false,
    message: error.message || (statusCode >= 500 ? 'Internal server error' : 'Request failed'),
    error: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      stack: error.stack,
      code: error.code
    } : error.message
  });
};

/**
 * Middleware to add alert tracking methods to request object
 */
const addAlertTracking = (req, res, next) => {
  // Add method to manually send alerts from controllers
  req.sendAlert = (alertType, alertData) => {
    return alertService.sendAlert(alertType, {
      ...alertData,
      details: {
        ...alertData.details,
        endpoint: req.originalUrl,
        method: req.method,
        hospitalId: req.hospitalId || req.user?.hospitalId,
        userId: req.user?.id,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req),
        timestamp: new Date().toISOString()
      }
    });
  };

  // Add method to track hospital-specific alerts
  req.sendHospitalAlert = (alertType, alertData) => {
    return alertService.sendAlert(alertType, {
      ...alertData,
      details: {
        ...alertData.details,
        hospitalId: req.hospitalId || req.user?.hospitalId,
        hospitalName: req.hospital?.hospitalName || req.user?.hospitalName,
        endpoint: req.originalUrl,
        method: req.method,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req),
        timestamp: new Date().toISOString()
      }
    });
  };

  next();
};

module.exports = {
  trackCriticalErrors,
  trackDatabaseErrors,
  trackAuthFailures,
  trackEmailFailures,
  trackRateLimitViolations,
  trackSlowResponses,
  globalErrorHandler,
  addAlertTracking
};