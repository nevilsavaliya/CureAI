const Hospital = require('../models/Hospital');

/**
 * Middleware to authenticate hospital API requests
 * Validates API Key and Secret, checks verification and active status
 */
exports.authenticateHospitalApi = async (req, res, next) => {
  try {
    // Extract API credentials from request body
    const { apiKey, apiSecret } = req.body;

    // Check if credentials are provided
    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        success: false,
        message: 'API credentials are required. Please provide apiKey and apiSecret.'
      });
    }

    // Validate API Key format
    if (!apiKey.startsWith('HK_') || apiKey.length !== 35) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API Key format.'
      });
    }

    // Find hospital by API Key
    const hospital = await Hospital.findOne({ apiKey });

    if (!hospital) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API credentials.'
      });
    }

    // Validate API Secret
    if (hospital.apiSecret !== apiSecret) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API credentials.'
      });
    }

    // Check hospital verification status
    if (hospital.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: `Hospital is not verified. Current status: ${hospital.verificationStatus}`,
        verificationStatus: hospital.verificationStatus
      });
    }

    // Check if hospital is active
    if (!hospital.isActive) {
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
      id: hospital._id,
      name: hospital.hospitalName,
      email: hospital.email,
      registrationNumber: hospital.registrationNumber,
      apiAccessCount: hospital.apiAccessCount
    };

    next();
  } catch (error) {
    console.error('Hospital API authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};
