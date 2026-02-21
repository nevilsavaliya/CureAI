/**
 * Consolidated Security Middleware
 * Combines security-related middleware from multiple files
 * Consolidates:
 * - adminSecurityMiddleware.js (session validation, 2FA, suspicious activity)
 * - adminRoleAuth.js (session validation)
 * - validation.js (input sanitization)
 */

const Admin = require('../models/Admin');
const adminSecurityService = require('../services/adminSecurityService');
const logger = require('../services/logger');
const auditLoggerService = require('../services/auditLoggerService');
const { getRequestMetadata } = require('./utils/requestUtils');

/**
 * Validate admin session timeout
 * Checks if admin session has expired due to inactivity
 */
async function validateSessionTimeout(req, res, next) {
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
          ...getRequestMetadata(req),
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
      ...getRequestMetadata(req),
      adminId: req.admin?._id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during session validation',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
}

/**
 * Detect and handle suspicious activity
 * Analyzes request patterns to identify potential security threats
 */
async function detectSuspiciousActivity(req, res, next) {
  try {
    if (!req.admin) {
      return next();
    }

    const admin = req.admin;
    const activityData = {
      ...getRequestMetadata(req),
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
      ...getRequestMetadata(req),
      adminId: req.admin?._id
    });

    // Continue on error (fail open for security middleware)
    next();
  }
}

/**
 * Enforce 2FA for sensitive operations
 * Validates 2FA token when required
 */
async function require2FA(req, res, next) {
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
          ...getRequestMetadata(req),
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
      ...getRequestMetadata(req),
      adminId: req.admin?._id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during 2FA validation',
      code: '2FA_VALIDATION_ERROR'
    });
  }
}

/**
 * Sanitize input to prevent XSS and injection attacks
 * Removes potentially dangerous content from request body
 */
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        // Skip prototype pollution attempts
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
}

/**
 * Validate request format and structure
 * Ensures request has valid structure before processing
 */
function validateRequestFormat(req, res, next) {
  try {
    // Basic request validation
    if (req.body) {
      // Remove any potentially dangerous properties
      delete req.body.__proto__;
      delete req.body.constructor;
      delete req.body.prototype;
    }
    
    // Validate content-type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('content-type');
      if (contentType && !contentType.includes('application/json') && 
          !contentType.includes('multipart/form-data') &&
          !contentType.includes('application/x-www-form-urlencoded')) {
        return res.status(415).json({
          success: false,
          message: 'Unsupported content type',
          code: 'UNSUPPORTED_CONTENT_TYPE'
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Request validation error', {
      type: 'REQUEST_VALIDATION_ERROR',
      error: error.message,
      ...getRequestMetadata(req)
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid request format',
      code: 'INVALID_REQUEST'
    });
  }
}

/**
 * Combined security middleware chain
 * Applies multiple security checks in sequence
 */
const securityChain = [
  validateRequestFormat,
  sanitizeInput
];

/**
 * Admin security middleware chain
 * Applies admin-specific security checks
 */
const adminSecurityChain = [
  validateSessionTimeout,
  detectSuspiciousActivity
];

module.exports = {
  // Individual middleware
  validateSessionTimeout,
  detectSuspiciousActivity,
  require2FA,
  sanitizeInput,
  validateRequestFormat,
  
  // Middleware chains
  securityChain,
  adminSecurityChain
};
