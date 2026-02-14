const Admin = require('../models/Admin');
const adminSecurityService = require('../services/adminSecurityService');
const logger = require('../services/logger');
const auditLoggerService = require('../services/auditLoggerService');

/**
 * Enhanced Admin Security Middleware
 * Provides session timeout, suspicious activity detection, and 2FA validation
 */

/**
 * Middleware to validate admin session timeout
 */
exports.validateSessionTimeout = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(500).json({
        success: false,
        message: 'Admin verification required before session validation',
        code: 'ADMIN_VERIFICATION_REQUIRED'
      });
    }

    const admin = req.admin;
    
    // Check if session is expired
    if (admin.isSessionExpired(adminSecurityService.sessionTimeoutMinutes)) {
      await auditLoggerService.logAdminAction({
        adminId: admin._id,
        adminEmail: admin.email,
        action: 'SESSION_EXPIRED',
        details: {
          reason: 'Admin session expired due to inactivity',
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req),
          additionalData: {
            lastActivity: admin.lastActivity,
            timeoutMinutes: adminSecurityService.sessionTimeoutMinutes
          }
        },
        status: 'warning'
      });

      // Invalidate the session
      await admin.invalidateSession();

      return res.status(401).json({
        success: false,
        message: 'Session expired due to inactivity. Please login again.',
        code: 'SESSION_EXPIRED',
        requiresLogin: true
      });
    }

    // Update last activity
    await admin.updateActivity();
    
    next();
  } catch (error) {
    logger.error('Session timeout validation error', {
      type: 'SESSION_TIMEOUT_VALIDATION_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      adminId: req.admin?._id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during session validation',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to detect and handle suspicious activity
 */
exports.detectSuspiciousActivity = async (req, res, next) => {
  try {
    if (!req.admin) {
      return next();
    }

    const admin = req.admin;
    const activityData = {
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date()
    };

    // Detect suspicious activity
    const suspiciousActivity = await adminSecurityService.detectSuspiciousActivity(admin, activityData);

    if (suspiciousActivity.isSuspicious) {
      // Add warning header
      res.setHeader('X-Security-Warning', 'Suspicious activity detected');
      
      // For high-risk activities, require additional verification
      if (suspiciousActivity.riskScore >= 5) {
        return res.status(403).json({
          success: false,
          message: 'Additional security verification required due to suspicious activity',
          code: 'SUSPICIOUS_ACTIVITY_DETECTED',
          requiresVerification: true,
          riskScore: suspiciousActivity.riskScore
        });
      }
    }

    // Attach suspicious activity info to request for logging
    req.suspiciousActivity = suspiciousActivity;
    
    next();
  } catch (error) {
    logger.error('Suspicious activity detection error', {
      type: 'SUSPICIOUS_ACTIVITY_DETECTION_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      adminId: req.admin?._id
    });

    // Continue on error (fail open for security middleware)
    next();
  }
};

/**
 * Middleware to enforce 2FA for sensitive operations
 */
exports.require2FA = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(500).json({
        success: false,
        message: 'Admin verification required before 2FA check',
        code: 'ADMIN_VERIFICATION_REQUIRED'
      });
    }

    const admin = req.admin;
    
    // Skip 2FA check if not enabled for this admin
    if (!admin.twoFactorEnabled) {
      return next();
    }

    // Check if 2FA token is provided in headers
    const twoFactorToken = req.headers['x-2fa-token'];
    
    if (!twoFactorToken) {
      return res.status(401).json({
        success: false,
        message: '2FA token required for this operation',
        code: '2FA_TOKEN_REQUIRED',
        requires2FA: true
      });
    }

    // Validate 2FA token
    const isValidToken = await adminSecurityService.validate2FAToken(admin, twoFactorToken);
    
    if (!isValidToken) {
      await auditLoggerService.logAdminAction({
        adminId: admin._id,
        adminEmail: admin.email,
        action: '2FA_VALIDATION_FAILED',
        details: {
          reason: 'Invalid 2FA token for sensitive operation',
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req),
          endpoint: req.originalUrl,
          additionalData: {
            tokenProvided: !!twoFactorToken
          }
        },
        status: 'failed'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA token',
        code: 'INVALID_2FA_TOKEN'
      });
    }

    next();
  } catch (error) {
    logger.error('2FA validation error', {
      type: '2FA_VALIDATION_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      adminId: req.admin?._id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during 2FA validation',
      code: '2FA_VALIDATION_ERROR'
    });
  }
};

/**
 * Rate limiting middleware for admin operations
 */
exports.rateLimitAdminOperations = (() => {
  const adminOperationLimits = new Map();
  const ADMIN_RATE_LIMIT = 50; // requests per hour
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return next();
      }

      const adminId = req.admin._id.toString();
      const now = Date.now();

      // Get or initialize rate limit data
      let rateLimitData = adminOperationLimits.get(adminId);

      if (!rateLimitData || now > rateLimitData.resetTime) {
        rateLimitData = {
          count: 0,
          resetTime: now + WINDOW_MS
        };
        adminOperationLimits.set(adminId, rateLimitData);
      }

      rateLimitData.count += 1;

      // Check if rate limit exceeded
      if (rateLimitData.count > ADMIN_RATE_LIMIT) {
        const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);

        await auditLoggerService.logAdminAction({
          adminId: req.admin._id,
          adminEmail: req.admin.email,
          action: 'ADMIN_RATE_LIMIT_EXCEEDED',
          details: {
            reason: 'Admin operation rate limit exceeded',
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
            endpoint: req.originalUrl,
            additionalData: {
              requestCount: rateLimitData.count,
              limit: ADMIN_RATE_LIMIT
            }
          },
          status: 'warning'
        });

        res.setHeader('Retry-After', retryAfter);
        
        return res.status(429).json({
          success: false,
          message: 'Too many admin operations. Please try again later.',
          code: 'ADMIN_RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfter
        });
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', ADMIN_RATE_LIMIT);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, ADMIN_RATE_LIMIT - rateLimitData.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitData.resetTime / 1000));

      next();
    } catch (error) {
      logger.error('Admin rate limiting error', {
        type: 'ADMIN_RATE_LIMITING_ERROR',
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
        adminId: req.admin?._id
      });

      // Continue on error (fail open)
      next();
    }
  };
})();

/**
 * Middleware to log all admin operations for audit trail
 */
exports.logAdminOperation = async (req, res, next) => {
  try {
    if (!req.admin) {
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the operation after response is sent
      setImmediate(async () => {
        try {
          await auditLoggerService.logAdminAction({
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            action: 'ADMIN_OPERATION',
            details: {
              reason: `Admin operation: ${req.method} ${req.originalUrl}`,
              ipAddress: getClientIP(req),
              userAgent: getUserAgent(req),
              endpoint: req.originalUrl,
              method: req.method,
              additionalData: {
                statusCode: res.statusCode,
                success: data?.success,
                suspiciousActivity: req.suspiciousActivity,
                responseTime: Date.now() - req.startTime
              }
            },
            status: res.statusCode < 400 ? 'success' : 'failed'
          });
        } catch (logError) {
          logger.error('Admin operation logging error', {
            type: 'ADMIN_OPERATION_LOGGING_ERROR',
            error: logError.message,
            adminId: req.admin._id
          });
        }
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    // Store start time for response time calculation
    req.startTime = Date.now();
    
    next();
  } catch (error) {
    logger.error('Admin operation logging middleware error', {
      type: 'ADMIN_OPERATION_LOGGING_MIDDLEWARE_ERROR',
      error: error.message,
      stack: error.stack
    });

    // Continue on error
    next();
  }
};

/**
 * Helper function to get client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Helper function to get user agent
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}
/**
 * 
Rate limiting middleware for admin operations
 */
exports.adminRateLimit = (() => {
  const adminRequestLimits = new Map();
  const ADMIN_RATE_LIMIT = 100; // requests per hour
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  return (req, res, next) => {
    try {
      const adminId = req.admin?._id?.toString();
      if (!adminId) {
        return next();
      }

      const now = Date.now();
      const windowStart = now - WINDOW_MS;
      
      // Get or create request history for this admin
      if (!adminRequestLimits.has(adminId)) {
        adminRequestLimits.set(adminId, []);
      }
      
      const requests = adminRequestLimits.get(adminId);
      
      // Remove old requests outside the window
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      
      // Check if limit exceeded
      if (recentRequests.length >= ADMIN_RATE_LIMIT) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
      
      // Add current request
      recentRequests.push(now);
      adminRequestLimits.set(adminId, recentRequests);
      
      next();
    } catch (error) {
      console.error('Admin rate limit error:', error);
      next(); // Continue on error to avoid blocking
    }
  };
})();

/**
 * Request validation and sanitization middleware
 */
exports.validateAndSanitizeRequest = (req, res, next) => {
  try {
    // Basic request validation
    if (req.body) {
      // Remove any potentially dangerous properties
      delete req.body.__proto__;
      delete req.body.constructor;
      
      // Sanitize string inputs
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          // Basic XSS prevention
          req.body[key] = req.body[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Request validation error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid request format',
      code: 'INVALID_REQUEST'
    });
  }
};

/**
 * CSRF protection middleware (placeholder - implement with actual CSRF library if needed)
 */
exports.csrfProtection = (req, res, next) => {
  // For now, skip CSRF protection in development
  // In production, implement proper CSRF protection
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Basic CSRF token validation
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token required',
      code: 'CSRF_TOKEN_REQUIRED'
    });
  }
  
  next();
};

/**
 * IP restriction middleware (placeholder)
 */
exports.ipRestriction = (req, res, next) => {
  // For now, allow all IPs
  // In production, implement IP whitelist if needed
  next();
};

/**
 * Generate CSRF token endpoint
 */
exports.generateCSRFToken = (req, res) => {
  try {
    // Generate a simple token for development
    const token = require('crypto').randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      csrfToken: token
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
      code: 'CSRF_TOKEN_GENERATION_FAILED'
    });
  }
};