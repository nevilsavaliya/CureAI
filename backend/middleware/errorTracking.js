const errorTracker = require('../services/errorTracker');
const logger = require('../services/logger');

/**
 * Error tracking middleware for hospital feature
 * Automatically tracks and categorizes errors
 */

/**
 * Hospital-specific error tracking middleware
 */
const hospitalErrorTracking = (req, res, next) => {
  // Add error tracking methods to request object
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

  req.trackHospitalError = (error, context = {}) => {
    const baseContext = {
      hospitalId: req.hospital?.id,
      hospitalName: req.hospital?.hospitalName,
      ...context
    };

    // Determine error category based on endpoint
    const endpoint = req.originalUrl;
    
    if (endpoint.includes('/register')) {
      return errorTracker.trackHospitalRegistrationError(error, baseContext, req);
    } else if (endpoint.includes('/login')) {
      return errorTracker.trackHospitalLoginError(error, baseContext, req);
    } else if (endpoint.includes('/api/patient-data')) {
      return errorTracker.trackHospitalApiError(error, baseContext, req);
    } else if (endpoint.includes('/verify') || endpoint.includes('/reject')) {
      return errorTracker.trackError({
        category: errorTracker.errorCategories.HOSPITAL_VERIFICATION,
        severity: errorTracker.errorSeverity.HIGH,
        error,
        context: baseContext,
        hospitalId: baseContext.hospitalId,
        req
      });
    } else {
      return errorTracker.trackError({
        category: errorTracker.errorCategories.HOSPITAL_API,
        error,
        context: baseContext,
        hospitalId: baseContext.hospitalId,
        req
      });
    }
  };

  next();
};

/**
 * Global error tracking middleware
 * Catches unhandled errors and tracks them
 */
const globalErrorTracking = (err, req, res, next) => {
  // Determine error category and severity
  let category = errorTracker.errorCategories.SYSTEM;
  let severity = errorTracker.errorSeverity.MEDIUM;
  let context = {};

  // Categorize based on error type and request path
  if (err.name === 'ValidationError') {
    category = errorTracker.errorCategories.VALIDATION;
    severity = errorTracker.errorSeverity.LOW;
    context.validationErrors = err.errors;
  } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
    category = errorTracker.errorCategories.DATABASE;
    severity = errorTracker.errorSeverity.HIGH;
    context.operation = err.operation;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    category = errorTracker.errorCategories.AUTHENTICATION;
    severity = errorTracker.errorSeverity.MEDIUM;
    context.authType = 'jwt';
  } else if (err.status === 401 || err.statusCode === 401) {
    category = errorTracker.errorCategories.AUTHENTICATION;
    severity = errorTracker.errorSeverity.MEDIUM;
  } else if (err.status === 403 || err.statusCode === 403) {
    category = errorTracker.errorCategories.AUTHORIZATION;
    severity = errorTracker.errorSeverity.MEDIUM;
  } else if (err.status === 429 || err.statusCode === 429) {
    category = errorTracker.errorCategories.RATE_LIMITING;
    severity = errorTracker.errorSeverity.MEDIUM;
  } else if (err.status >= 500 || err.statusCode >= 500) {
    severity = errorTracker.errorSeverity.HIGH;
  }

  // Check if it's a hospital-related endpoint
  const isHospitalEndpoint = req.originalUrl.includes('/hospitals') || 
                            req.originalUrl.includes('/admin/hospitals');
  
  if (isHospitalEndpoint) {
    if (req.originalUrl.includes('/register')) {
      category = errorTracker.errorCategories.HOSPITAL_REGISTRATION;
    } else if (req.originalUrl.includes('/login')) {
      category = errorTracker.errorCategories.HOSPITAL_LOGIN;
    } else if (req.originalUrl.includes('/api/patient-data')) {
      category = errorTracker.errorCategories.HOSPITAL_API;
    } else if (req.originalUrl.includes('/verify') || req.originalUrl.includes('/reject')) {
      category = errorTracker.errorCategories.HOSPITAL_VERIFICATION;
    }
  }

  // Add request context
  context = {
    ...context,
    endpoint: req.originalUrl,
    method: req.method,
    statusCode: err.status || err.statusCode || 500,
    hospitalId: req.hospital?.id || req.user?.id,
    userId: req.user?.id
  };

  // Track the error
  const errorId = errorTracker.trackError({
    category,
    severity,
    error: err,
    context,
    hospitalId: context.hospitalId,
    userId: context.userId,
    req
  });

  // Add error ID to response headers for debugging
  res.set('X-Error-ID', errorId);

  // Continue with normal error handling
  next(err);
};

/**
 * API-specific error tracking for hospital endpoints
 */
const apiErrorTracking = (req, res, next) => {
  // Override res.status to track API errors
  const originalStatus = res.status;
  res.status = function(statusCode) {
    // Track errors for 4xx and 5xx status codes
    if (statusCode >= 400) {
      const error = new Error(`API Error: ${statusCode}`);
      error.statusCode = statusCode;
      
      let context = {
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: statusCode,
        hospitalId: req.hospital?.id,
        userId: req.user?.id
      };

      // Add specific context for hospital API endpoints
      if (req.originalUrl.includes('/api/patient-data')) {
        context = {
          ...context,
          patientId: req.body?.patientId,
          patientEmail: req.body?.patientEmail,
          apiKey: req.body?.apiKey ? req.body.apiKey.substring(0, 10) + '...' : undefined
        };
        
        errorTracker.trackHospitalApiError(error, context, req);
      } else if (req.originalUrl.includes('/hospitals')) {
        req.trackHospitalError && req.trackHospitalError(error, context);
      } else {
        req.trackError && req.trackError(error, context);
      }
    }
    
    return originalStatus.call(this, statusCode);
  };

  next();
};

/**
 * Database error tracking wrapper
 */
const trackDatabaseError = (operation, collection) => {
  return (error, context = {}) => {
    return errorTracker.trackDatabaseError(error, {
      operation,
      collection,
      ...context
    });
  };
};

/**
 * Email error tracking wrapper
 */
const trackEmailError = (emailType, recipient) => {
  return (error, context = {}) => {
    return errorTracker.trackEmailError(error, {
      emailType,
      recipient,
      ...context
    });
  };
};

/**
 * Authentication error tracking wrapper
 */
const trackAuthError = (authType) => {
  return (error, context = {}, req) => {
    return errorTracker.trackAuthenticationError(error, {
      authType,
      ...context
    }, req);
  };
};

/**
 * Rate limit error tracking wrapper
 */
const trackRateLimitError = (limit, current, resetTime) => {
  return (error, context = {}, req) => {
    return errorTracker.trackRateLimitError(error, {
      limit,
      current,
      resetTime,
      ...context
    }, req);
  };
};

module.exports = {
  hospitalErrorTracking,
  globalErrorTracking,
  apiErrorTracking,
  trackDatabaseError,
  trackEmailError,
  trackAuthError,
  trackRateLimitError,
  errorTracker
};