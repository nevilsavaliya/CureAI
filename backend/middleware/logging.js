const logger = require('../services/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log the incoming request
  logger.api.request({
    method: req.method,
    url: req.originalUrl,
    hospitalId: req.hospital?.id || req.user?.id || 'anonymous',
    ip: logger.getClientIP(req),
    userAgent: logger.getUserAgent(req)
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log the response
    logger.api.response({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: responseTime,
      hospitalId: req.hospital?.id || req.user?.id || 'anonymous'
    });

    // Log slow responses
    if (responseTime > 1000) {
      logger.performance.slowApi({
        endpoint: req.originalUrl,
        method: req.method,
        responseTime: responseTime,
        hospitalId: req.hospital?.id || req.user?.id || 'anonymous'
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    type: 'UNHANDLED_ERROR',
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    hospitalId: req.hospital?.id || req.user?.id || 'anonymous',
    ip: logger.getClientIP(req),
    userAgent: logger.getUserAgent(req),
    timestamp: new Date().toISOString()
  });

  next(err);
};

// Hospital-specific logging middleware
const hospitalLogger = (req, res, next) => {
  // Add hospital logging context to request
  req.logHospitalAction = (action, data = {}) => {
    const baseData = {
      hospitalId: req.hospital?.id,
      hospitalName: req.hospital?.hospitalName,
      ip: logger.getClientIP(req),
      userAgent: logger.getUserAgent(req),
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
      ip: logger.getClientIP(req),
      userAgent: logger.getUserAgent(req),
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

  next();
};

module.exports = {
  requestLogger,
  errorLogger,
  hospitalLogger
};