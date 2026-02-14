const Admin = require('../models/Admin');
const logger = require('../services/logger');

/**
 * Admin Role-Based Authentication Middleware
 * Provides role-based access control for admin operations
 */

/**
 * Middleware to verify if user is a root admin (admin@gmail.com)
 * Root admin has exclusive privileges for admin management
 */
exports.isRootAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user role is admin
    if (req.user.role !== 'admin') {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Non-admin user attempted admin operation',
        userId: req.user.id,
        userRole: req.user.role,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required',
        code: 'ADMIN_ROLE_REQUIRED'
      });
    }

    // Get admin from database to verify root admin status
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Admin user not found in database',
        userId: req.user.id,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Inactive admin attempted operation',
        userId: req.user.id,
        adminEmail: admin.email,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated',
        code: 'ADMIN_DEACTIVATED'
      });
    }

    // Check if admin account is locked
    if (admin.isAccountLocked()) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Locked admin account attempted operation',
        userId: req.user.id,
        adminEmail: admin.email,
        lockedUntil: admin.accountLockedUntil,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(423).json({
        success: false,
        message: 'Admin account is temporarily locked due to failed login attempts',
        code: 'ADMIN_ACCOUNT_LOCKED',
        lockedUntil: admin.accountLockedUntil
      });
    }

    // Check if user is root admin
    if (!admin.isRoot()) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Regular admin attempted root admin operation',
        userId: req.user.id,
        adminEmail: admin.email,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. Root admin privileges required',
        code: 'ROOT_ADMIN_REQUIRED'
      });
    }

    // Update admin's last login and security tracking
    await admin.updateLastLogin(getClientIP(req), getUserAgent(req));

    // Attach admin object to request
    req.admin = admin;
    
    next();
  } catch (error) {
    logger.error('Root admin middleware error', {
      type: 'ROOT_ADMIN_MIDDLEWARE_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      userId: req.user?.id,
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during admin verification',
      code: 'ADMIN_VERIFICATION_ERROR'
    });
  }
};

/**
 * Middleware to verify if user is any admin (root or regular)
 * Allows access to general admin operations
 */
exports.isAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user role is admin
    if (req.user.role !== 'admin') {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Non-admin user attempted admin operation',
        userId: req.user.id,
        userRole: req.user.role,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required',
        code: 'ADMIN_ROLE_REQUIRED'
      });
    }

    // Get admin from database
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Admin user not found in database',
        userId: req.user.id,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Inactive admin attempted operation',
        userId: req.user.id,
        adminEmail: admin.email,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated',
        code: 'ADMIN_DEACTIVATED'
      });
    }

    // Check if admin account is locked
    if (admin.isAccountLocked()) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Locked admin account attempted operation',
        userId: req.user.id,
        adminEmail: admin.email,
        lockedUntil: admin.accountLockedUntil,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(423).json({
        success: false,
        message: 'Admin account is temporarily locked due to failed login attempts',
        code: 'ADMIN_ACCOUNT_LOCKED',
        lockedUntil: admin.accountLockedUntil
      });
    }

    // Update admin's last login and security tracking
    await admin.updateLastLogin(getClientIP(req), getUserAgent(req));

    // Attach admin object to request
    req.admin = admin;
    
    next();
  } catch (error) {
    logger.error('Admin middleware error', {
      type: 'ADMIN_MIDDLEWARE_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      userId: req.user?.id,
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during admin verification',
      code: 'ADMIN_VERIFICATION_ERROR'
    });
  }
};

/**
 * Middleware to check user management permissions based on admin role
 * Root admin can manage all users including admins
 * Regular admin can manage patients, doctors, and hospitals only
 */
exports.checkUserManagementPermission = (targetUserType) => {
  return async (req, res, next) => {
    try {
      // Ensure admin middleware has run first
      if (!req.admin) {
        return res.status(500).json({
          success: false,
          message: 'Admin verification required before permission check',
          code: 'ADMIN_VERIFICATION_REQUIRED'
        });
      }

      const admin = req.admin;
      
      // Root admin has permission for all user types
      if (admin.isRoot()) {
        return next();
      }

      // Regular admin cannot manage other admins
      if (targetUserType === 'admin') {
        logger.security.unauthorizedAccess({
          endpoint: req.originalUrl,
          method: req.method,
          reason: 'Regular admin attempted admin management',
          userId: admin._id,
          adminEmail: admin.email,
          targetUserType: targetUserType,
          ip: getClientIP(req),
          userAgent: getUserAgent(req)
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied. Only root admin can manage other admins',
          code: 'ROOT_ADMIN_REQUIRED_FOR_ADMIN_MANAGEMENT'
        });
      }

      // Check if regular admin has permission for the target user type
      const hasPermission = admin.hasPermission(targetUserType + 's', 'delete'); // Convert to plural form
      
      if (!hasPermission) {
        logger.security.unauthorizedAccess({
          endpoint: req.originalUrl,
          method: req.method,
          reason: 'Admin lacks permission for user type',
          userId: admin._id,
          adminEmail: admin.email,
          targetUserType: targetUserType,
          adminPermissions: admin.permissions,
          ip: getClientIP(req),
          userAgent: getUserAgent(req)
        });

        return res.status(403).json({
          success: false,
          message: `Access denied. No permission to manage ${targetUserType}s`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      logger.error('User management permission check error', {
        type: 'USER_MANAGEMENT_PERMISSION_ERROR',
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
        userId: req.admin?._id,
        targetUserType: targetUserType,
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission check',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
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
 * Middleware to validate admin session for sensitive operations
 * Ensures the admin session is still valid and not expired
 */
exports.validateAdminSession = async (req, res, next) => {
  try {
    // Check if admin is attached to request
    if (!req.admin) {
      return res.status(500).json({
        success: false,
        message: 'Admin verification required before session validation',
        code: 'ADMIN_VERIFICATION_REQUIRED'
      });
    }

    // Check token expiry from JWT
    const now = Math.floor(Date.now() / 1000);
    const tokenExpiry = req.user.tokenExpiry;
    
    if (tokenExpiry && now >= tokenExpiry) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Expired token used for admin operation',
        userId: req.admin._id,
        adminEmail: req.admin.email,
        tokenExpiry: tokenExpiry,
        currentTime: now,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again',
        code: 'SESSION_EXPIRED',
        requiresLogin: true
      });
    }

    // Check if session should be refreshed (within 1 hour of expiry)
    const timeUntilExpiry = tokenExpiry - now;
    if (timeUntilExpiry < 3600) { // 1 hour
      res.set('X-Should-Refresh', 'true');
    }

    next();
  } catch (error) {
    logger.error('Admin session validation error', {
      type: 'ADMIN_SESSION_VALIDATION_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      userId: req.admin?._id,
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during session validation',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
};