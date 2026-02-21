/**
 * Enhanced Audit Logging Middleware
 * Logs all security-relevant events including authentication, authorization, and data modifications
 */

const auditLoggerService = require('../../services/auditLoggerService');
const logger = require('../../services/logger');

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Get request metadata for audit logging
 * @param {Object} req - Express request object
 * @returns {Object} Request metadata
 */
function getRequestMetadata(req) {
  return {
    ipAddress: getClientIP(req),
    userAgent: req.get('user-agent') || 'unknown',
    sessionId: req.session?.id || req.sessionID || null,
    endpoint: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  };
}

/**
 * Audit logging middleware for authentication attempts
 * Logs all login attempts (successful and failed)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function auditAuthAttempt(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to capture response
  res.json = function(data) {
    // Log authentication attempt
    const isSuccess = data.success === true;
    const action = isSuccess ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
    
    const auditData = {
      adminId: data.admin?._id || data.user?.id || 'unknown',
      adminEmail: req.body.email || req.body.username || 'unknown',
      action,
      details: {
        ...getRequestMetadata(req),
        reason: isSuccess ? 'Successful authentication' : (data.message || 'Authentication failed'),
        additionalData: {
          loginType: req.body.loginType || 'standard',
          twoFactorUsed: !!req.body.twoFactorToken || !!req.headers['x-2fa-token']
        }
      },
      status: isSuccess ? 'success' : 'failed',
      errorMessage: isSuccess ? null : (data.message || 'Authentication failed')
    };
    
    // Log asynchronously without blocking response
    auditLoggerService.logAdminAction(auditData).catch(err => {
      logger.error('Failed to log authentication attempt', {
        type: 'AUDIT_LOG_ERROR',
        error: err.message
      });
    });
    
    // Call original json method
    return originalJson(data);
  };
  
  next();
}

/**
 * Audit logging middleware for authorization failures
 * Logs all access denied events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function auditAuthorizationFailure(req, res, next) {
  // Store original status method
  const originalStatus = res.status.bind(res);
  
  // Override status method to capture 403 responses
  res.status = function(statusCode) {
    if (statusCode === 403) {
      const auditData = {
        adminId: req.admin?._id || req.user?.id || 'unknown',
        adminEmail: req.admin?.email || req.user?.email || 'unknown',
        action: 'AUTHORIZATION_FAILED',
        details: {
          ...getRequestMetadata(req),
          reason: 'Access denied - insufficient permissions',
          additionalData: {
            requiredRole: req.requiredRole || 'unknown',
            userRole: req.admin?.role || req.user?.role || 'unknown',
            resource: req.originalUrl
          }
        },
        status: 'failed',
        errorMessage: 'Authorization failed'
      };
      
      // Log asynchronously without blocking response
      auditLoggerService.logAdminAction(auditData).catch(err => {
        logger.error('Failed to log authorization failure', {
          type: 'AUDIT_LOG_ERROR',
          error: err.message
        });
      });
    }
    
    // Call original status method
    return originalStatus(statusCode);
  };
  
  next();
}

/**
 * Audit logging middleware for data modifications
 * Logs all create, update, and delete operations
 * @param {Array<string>} actions - Actions to log (e.g., ['POST', 'PUT', 'DELETE'])
 * @returns {Function} Express middleware function
 */
function auditDataModification(actions = ['POST', 'PUT', 'DELETE', 'PATCH']) {
  return async (req, res, next) => {
    // Only log specified HTTP methods
    if (!actions.includes(req.method)) {
      return next();
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    const startTime = Date.now();
    
    // Override json method to capture response
    res.json = function(data) {
      const operationDuration = Date.now() - startTime;
      const isSuccess = data.success !== false && res.statusCode < 400;
      
      // Determine action type based on method and endpoint
      let action = 'DATA_MODIFICATION';
      if (req.method === 'POST') action = 'DATA_CREATED';
      if (req.method === 'PUT' || req.method === 'PATCH') action = 'DATA_UPDATED';
      if (req.method === 'DELETE') action = 'DATA_DELETED';
      
      const auditData = {
        adminId: req.admin?._id || req.user?.id || 'system',
        adminEmail: req.admin?.email || req.user?.email || 'system',
        action,
        targetUserId: req.params.id || req.body.id || null,
        targetUserType: req.params.userType || req.body.userType || null,
        details: {
          ...getRequestMetadata(req),
          reason: `${req.method} operation on ${req.originalUrl}`,
          additionalData: {
            affectedRecords: data.affectedRecords || (data.data ? 1 : 0),
            resourceType: req.baseUrl.split('/').pop() || 'unknown',
            operationDuration
          },
          operationDuration
        },
        status: isSuccess ? 'success' : 'failed',
        errorMessage: isSuccess ? null : (data.message || 'Operation failed')
      };
      
      // Log asynchronously without blocking response
      auditLoggerService.logAdminAction(auditData).catch(err => {
        logger.error('Failed to log data modification', {
          type: 'AUDIT_LOG_ERROR',
          error: err.message
        });
      });
      
      // Call original json method
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Audit logging middleware for security events
 * Logs security-relevant events like password changes, 2FA changes, etc.
 * @param {string} eventType - Type of security event
 * @returns {Function} Express middleware function
 */
function auditSecurityEvent(eventType) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to capture response
    res.json = function(data) {
      const isSuccess = data.success !== false && res.statusCode < 400;
      
      const auditData = {
        adminId: req.admin?._id || req.user?.id || 'unknown',
        adminEmail: req.admin?.email || req.user?.email || 'unknown',
        action: eventType,
        details: {
          ...getRequestMetadata(req),
          reason: `Security event: ${eventType}`,
          additionalData: {
            eventType,
            eventData: data.eventData || {}
          }
        },
        status: isSuccess ? 'success' : 'failed',
        errorMessage: isSuccess ? null : (data.message || 'Security event failed')
      };
      
      // Log asynchronously without blocking response
      auditLoggerService.logAdminAction(auditData).catch(err => {
        logger.error('Failed to log security event', {
          type: 'AUDIT_LOG_ERROR',
          error: err.message
        });
      });
      
      // Call original json method
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Audit logging middleware for sensitive operations
 * Logs high-risk operations that require additional scrutiny
 * @param {string} operationType - Type of sensitive operation
 * @returns {Function} Express middleware function
 */
function auditSensitiveOperation(operationType) {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to capture response
    res.json = function(data) {
      const operationDuration = Date.now() - startTime;
      const isSuccess = data.success !== false && res.statusCode < 400;
      
      const auditData = {
        adminId: req.admin?._id || req.user?.id || 'unknown',
        adminEmail: req.admin?.email || req.user?.email || 'unknown',
        action: operationType,
        targetUserId: req.params.id || req.body.targetUserId || null,
        targetUserType: req.params.userType || req.body.targetUserType || null,
        targetUserEmail: req.body.targetUserEmail || null,
        details: {
          ...getRequestMetadata(req),
          reason: `Sensitive operation: ${operationType}`,
          additionalData: {
            operationType,
            affectedRecords: data.affectedRecords || 1,
            operationData: {
              requestBody: req.body,
              requestParams: req.params
            }
          },
          operationDuration
        },
        status: isSuccess ? 'success' : 'failed',
        errorMessage: isSuccess ? null : (data.message || 'Operation failed')
      };
      
      // Log asynchronously without blocking response
      auditLoggerService.logAdminAction(auditData).catch(err => {
        logger.error('Failed to log sensitive operation', {
          type: 'AUDIT_LOG_ERROR',
          error: err.message
        });
      });
      
      // Call original json method
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Comprehensive audit logging middleware
 * Logs all requests with configurable detail level
 * @param {Object} options - Logging options
 * @returns {Function} Express middleware function
 */
function auditAllRequests(options = {}) {
  const {
    logBody = false,
    logQuery = true,
    logHeaders = false,
    excludePaths = ['/health', '/api/health']
  } = options;
  
  return async (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.originalUrl.startsWith(path))) {
      return next();
    }
    
    const startTime = Date.now();
    
    // Store original end method
    const originalEnd = res.end.bind(res);
    
    // Override end method to capture response
    res.end = function(...args) {
      const operationDuration = Date.now() - startTime;
      
      const auditData = {
        adminId: req.admin?._id || req.user?.id || 'anonymous',
        adminEmail: req.admin?.email || req.user?.email || 'anonymous',
        action: 'API_REQUEST',
        details: {
          ...getRequestMetadata(req),
          reason: `API request: ${req.method} ${req.originalUrl}`,
          additionalData: {
            statusCode: res.statusCode,
            operationDuration,
            query: logQuery ? req.query : undefined,
            body: logBody ? req.body : undefined,
            headers: logHeaders ? req.headers : undefined
          },
          operationDuration
        },
        status: res.statusCode < 400 ? 'success' : 'failed'
      };
      
      // Log asynchronously without blocking response
      auditLoggerService.logAdminAction(auditData).catch(err => {
        logger.error('Failed to log API request', {
          type: 'AUDIT_LOG_ERROR',
          error: err.message
        });
      });
      
      // Call original end method
      return originalEnd(...args);
    };
    
    next();
  };
}

module.exports = {
  auditAuthAttempt,
  auditAuthorizationFailure,
  auditDataModification,
  auditSecurityEvent,
  auditSensitiveOperation,
  auditAllRequests,
  getRequestMetadata,
  getClientIP
};
