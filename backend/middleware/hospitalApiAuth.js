const Hospital = require('../models/Hospital');
const logger = require('../services/logger');
const { trackAuthError } = require('./errorTracking');
const { trackAuthenticationError } = require('./apiMonitoring');

/**
 * Middleware to authenticate hospital API requests
 * Validates API Key and Secret, checks verification and active status
 */
exports.authenticateHospitalApi = async (req, res, next) => {
  try {
    console.log('🔐 Hospital API Auth - Request received:', {
      url: req.originalUrl,
      method: req.method,
      body: req.body ? Object.keys(req.body) : 'no body'
    });
    
    // Extract API credentials from request body
    const { apiKey, apiSecret } = req.body;
    
    console.log('🔑 Extracted credentials:', {
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing',
      apiSecret: apiSecret ? `${apiSecret.substring(0, 10)}...` : 'missing'
    });

    // Check if credentials are provided
    if (!apiKey || !apiSecret) {
      const error = new Error('API credentials are required');
      const errorId = trackAuthError('api_key')(error, {
        apiKey: apiKey || 'missing',
        endpoint: req.originalUrl
      }, req);

      // Track authentication error in monitoring
      trackAuthenticationError(error, {
        apiKey: apiKey || 'missing',
        endpoint: req.originalUrl,
        reason: 'Missing credentials'
      }, req);

      logger.security.invalidApiCredentials({
        apiKey: 'missing',
        endpoint: req.originalUrl,
        errorId: errorId,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req)
      });

      return res.status(401).json({
        success: false,
        message: 'API credentials are required. Please provide apiKey and apiSecret.',
        errorId: errorId
      });
    }

    // Validate API Key format
    if (!apiKey.startsWith('HK_') || apiKey.length !== 35) {
      // Track authentication error in monitoring
      trackAuthenticationError(new Error('Invalid API Key format'), {
        apiKey: apiKey,
        endpoint: req.originalUrl,
        reason: 'Invalid API Key format'
      }, req);

      logger.security.invalidApiCredentials({
        apiKey: apiKey,
        endpoint: req.originalUrl,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req)
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid API Key format.'
      });
    }

    // Find hospital by API Key
    console.log('🔍 Looking for hospital with API Key:', apiKey);
    const hospital = await Hospital.findOne({ apiKey });
    
    console.log('🏥 Hospital found:', hospital ? {
      id: hospital._id,
      name: hospital.hospitalName,
      email: hospital.email,
      verificationStatus: hospital.verificationStatus,
      isActive: hospital.isActive,
      hasApiSecret: !!hospital.apiSecret
    } : 'NOT FOUND');

    if (!hospital) {
      // Track authentication error in monitoring
      trackAuthenticationError(new Error('Hospital not found'), {
        apiKey: apiKey,
        endpoint: req.originalUrl,
        reason: 'Hospital not found'
      }, req);

      logger.security.invalidApiCredentials({
        apiKey: apiKey,
        endpoint: req.originalUrl,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req)
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid API credentials.'
      });
    }

    // Validate API Secret
    console.log('🔒 Validating API Secret:', {
      provided: apiSecret ? `${apiSecret.substring(0, 10)}...` : 'missing',
      stored: hospital.apiSecret ? `${hospital.apiSecret.substring(0, 10)}...` : 'missing',
      match: hospital.apiSecret === apiSecret
    });
    
    if (hospital.apiSecret !== apiSecret) {
      // Track authentication error in monitoring
      trackAuthenticationError(new Error('Invalid API Secret'), {
        apiKey: apiKey,
        hospitalId: hospital._id,
        endpoint: req.originalUrl,
        reason: 'Invalid API Secret'
      }, req);

      logger.security.invalidApiCredentials({
        apiKey: apiKey,
        hospitalId: hospital._id,
        endpoint: req.originalUrl,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req)
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid API credentials.'
      });
    }

    // Check hospital verification status
    if (hospital.verificationStatus !== 'verified') {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: `Hospital not verified: ${hospital.verificationStatus}`,
        hospitalId: hospital._id,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req)
      });

      return res.status(403).json({
        success: false,
        message: `Hospital is not verified. Current status: ${hospital.verificationStatus}`,
        verificationStatus: hospital.verificationStatus
      });
    }

    // Check if hospital is active
    if (!hospital.isActive) {
      logger.security.unauthorizedAccess({
        endpoint: req.originalUrl,
        method: req.method,
        reason: 'Hospital access revoked',
        hospitalId: hospital._id,
        ip: logger.getClientIP(req),
        userAgent: logger.getUserAgent(req)
      });

      return res.status(403).json({
        success: false,
        message: 'Hospital access has been revoked. Please contact support.'
      });
    }

    // Update last API access time and increment access count
    hospital.lastApiAccess = new Date();
    hospital.apiAccessCount += 1;
    await hospital.save();

    // Attach hospital to request object for use in controllers
    req.hospital = {
      _id: hospital._id,
      id: hospital._id,
      hospitalName: hospital.hospitalName,
      name: hospital.hospitalName,
      email: hospital.email,
      registrationNumber: hospital.registrationNumber,
      apiAccessCount: hospital.apiAccessCount
    };

    next();
  } catch (error) {
    const errorId = trackAuthError('api_key')(error, {
      endpoint: req.originalUrl,
      operation: 'hospital_api_auth'
    }, req);

    logger.error('Hospital API authentication error', {
      type: 'HOSPITAL_API_AUTH_ERROR',
      errorId: errorId,
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      ip: logger.getClientIP(req),
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
      errorId: errorId
    });
  }
};
