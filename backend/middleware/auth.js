const authService = require('../services/authService');
const Hospital = require('../models/Hospital');
const logger = require('../services/logger');

// Middleware to verify JWT token with enhanced session management
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        success: false,
        message: 'No token provided',
        requiresLogin: true
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token and check expiration
    let decoded;
    try {
      decoded = authService.verifyToken(token);
    } catch (tokenError) {
      // Log token verification failure
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Invalid or expired token',
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req)
      });

      return res.status(401).json({
        valid: false,
        success: false,
        message: 'Invalid or expired token',
        requiresLogin: true,
        tokenExpired: tokenError.message.includes('expired')
      });
    }

    // Check if token is close to expiration (within 1 hour)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    const shouldRefresh = timeUntilExpiry < 3600; // 1 hour

    // For hospital users, verify the hospital still exists and is active
    if (decoded.role === 'hospital') {
      const hospital = await Hospital.findById(decoded.id);
      
      if (!hospital) {
        logger.security.unauthorizedAccess({
          endpoint: req.originalUrl,
          method: req.method,
          reason: 'Hospital not found',
          hospitalId: decoded.id,
          ip: logger.getClientIP(req),
          userAgent: logger.getUserAgent(req)
        });

        return res.status(401).json({
          valid: false,
          success: false,
          message: 'Hospital account not found',
          requiresLogin: true
        });
      }

      if (!hospital.isActive) {
        logger.security.unauthorizedAccess({
          endpoint: req.originalUrl,
          method: req.method,
          reason: 'Hospital account deactivated',
          hospitalId: decoded.id,
          ip: logger.getClientIP(req),
          userAgent: logger.getUserAgent(req)
        });

        return res.status(403).json({
          valid: false,
          success: false,
          message: 'Hospital account has been deactivated',
          requiresLogin: true
        });
      }

      if (hospital.verificationStatus !== 'verified') {
        logger.security.unauthorizedAccess({
          endpoint: req.originalUrl,
          method: req.method,
          reason: `Hospital not verified: ${hospital.verificationStatus}`,
          hospitalId: decoded.id,
          ip: logger.getClientIP(req),
          userAgent: logger.getUserAgent(req)
        });

        return res.status(403).json({
          valid: false,
          success: false,
          message: `Hospital account is ${hospital.verificationStatus}`,
          verificationStatus: hospital.verificationStatus,
          requiresLogin: true
        });
      }

      // Update last login time for active sessions
      hospital.lastLogin = new Date();
      await hospital.save();
    }
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      tokenExpiry: decoded.exp,
      shouldRefresh: shouldRefresh
    };

    // Add session info to response headers
    res.set({
      'X-Token-Expires': decoded.exp,
      'X-Should-Refresh': shouldRefresh.toString(),
      'X-Session-Valid': 'true'
    });

    next();
  } catch (error) {
    logger.error('Authentication middleware error', {
      type: 'AUTH_MIDDLEWARE_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      ip: logger.getClientIP(req),
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      valid: false,
      success: false,
      message: 'Authentication error',
      requiresLogin: true
    });
  }
};

// Middleware to check user role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if hospital is verified
exports.requireVerifiedHospital = async (req, res, next) => {
  try {
    // Check if user is a hospital
    if (!req.user || req.user.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Hospital role required'
      });
    }

    // Get hospital from database
    const hospital = await Hospital.findById(req.user.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Check if hospital is active
    if (!hospital.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hospital account is deactivated. Please contact support'
      });
    }

    // Check verification status
    if (hospital.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: `Hospital is not verified. Current status: ${hospital.verificationStatus}`,
        verificationStatus: hospital.verificationStatus,
        rejectionReason: hospital.rejectionReason
      });
    }

    // Attach hospital to request
    req.hospital = hospital;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying hospital status',
      error: error.message
    });
  }
};

// Middleware to check if hospital is active (doesn't require verification)
exports.requireActiveHospital = async (req, res, next) => {
  try {
    // Check if user is a hospital
    if (!req.user || req.user.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Hospital role required'
      });
    }

    // Get hospital from database
    const hospital = await Hospital.findById(req.user.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Check if hospital is active
    if (!hospital.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hospital account is deactivated. Please contact support'
      });
    }

    // Attach hospital to request
    req.hospital = hospital;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking hospital status',
      error: error.message
    });
  }
};
