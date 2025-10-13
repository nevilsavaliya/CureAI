const authService = require('../services/authService');
const Hospital = require('../models/Hospital');

// Middleware to verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      valid: false,
      success: false,
      message: 'Invalid or expired token'
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
