const Hospital = require('../models/Hospital');
const emailService = require('../services/emailService');

/**
 * Get hospital statistics (for admin)
 * GET /api/admin/hospitals/statistics
 */
exports.getHospitalStatistics = async (req, res) => {
  try {
    // Get total hospitals
    const totalHospitals = await Hospital.countDocuments();
    
    // Get hospitals by status
    const pendingHospitals = await Hospital.countDocuments({ verificationStatus: 'pending' });
    const verifiedHospitals = await Hospital.countDocuments({ verificationStatus: 'verified' });
    const rejectedHospitals = await Hospital.countDocuments({ verificationStatus: 'rejected' });
    
    // Get active hospitals
    const activeHospitals = await Hospital.countDocuments({ 
      verificationStatus: 'verified',
      isActive: true 
    });
    
    // Get total API access count
    const apiAccessStats = await Hospital.aggregate([
      { $match: { verificationStatus: 'verified' } },
      { $group: { _id: null, totalApiAccess: { $sum: '$apiAccessCount' } } }
    ]);
    const totalApiAccess = apiAccessStats.length > 0 ? apiAccessStats[0].totalApiAccess : 0;
    
    // Get hospitals with recent API access (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyActiveHospitals = await Hospital.countDocuments({
      verificationStatus: 'verified',
      lastApiAccess: { $gte: sevenDaysAgo }
    });
    
    res.status(200).json({
      success: true,
      statistics: {
        totalHospitals,
        pendingHospitals,
        verifiedHospitals,
        rejectedHospitals,
        activeHospitals,
        totalApiAccess,
        recentlyActiveHospitals
      }
    });
    
  } catch (error) {
    console.error('Get hospital statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital statistics',
      error: error.message
    });
  }
};

/**
 * Get all hospitals (for admin)
 * GET /api/admin/hospitals
 */
exports.getAllHospitals = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.verificationStatus = status;
    }
    
    const hospitals = await Hospital.find(query)
      .select('-password -apiSecret')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals
    });
    
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospitals',
      error: error.message
    });
  }
};

/**
 * Get hospital by ID (for admin)
 * GET /api/admin/hospitals/:id
 */
exports.getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hospital = await Hospital.findById(id)
      .select('-password -apiSecret');
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.status(200).json({
      success: true,
      hospital
    });
    
  } catch (error) {
    console.error('Get hospital by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital',
      error: error.message
    });
  }
};

/**
 * Verify Hospital (Admin only)
 * PUT /api/admin/hospitals/:id/verify
 */
exports.verifyHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    
    const hospital = await Hospital.findById(id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    if (hospital.verificationStatus === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Hospital is already verified'
      });
    }
    
    // Generate API credentials
    const credentials = hospital.generateApiCredentials();
    hospital.verificationStatus = 'verified';
    hospital.verifiedAt = new Date();
    hospital.verifiedBy = adminId;
    
    await hospital.save();
    
    // Send email with API credentials
    try {
      await emailService.sendHospitalVerificationEmail(
        hospital.email,
        {
          hospitalName: hospital.hospitalName,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret
        }
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
    
    console.log(`✅ Hospital verified: ${hospital.hospitalName}`);
    
    res.status(200).json({
      success: true,
      message: 'Hospital verified successfully. API credentials sent via email.',
      hospital: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        verificationStatus: hospital.verificationStatus,
        apiKey: credentials.apiKey
      }
    });
    
  } catch (error) {
    console.error('Verify hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify hospital',
      error: error.message
    });
  }
};

/**
 * Reject Hospital (Admin only)
 * PUT /api/admin/hospitals/:id/reject
 */
exports.rejectHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const hospital = await Hospital.findById(id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    hospital.verificationStatus = 'rejected';
    hospital.rejectionReason = reason || 'Application did not meet requirements';
    
    await hospital.save();
    
    console.log(`❌ Hospital rejected: ${hospital.hospitalName}`);
    
    res.status(200).json({
      success: true,
      message: 'Hospital application rejected',
      hospital: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        verificationStatus: hospital.verificationStatus
      }
    });
    
  } catch (error) {
    console.error('Reject hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject hospital',
      error: error.message
    });
  }
};

/**
 * Revoke Hospital Access (Admin only)
 * PUT /api/admin/hospitals/:id/revoke
 */
exports.revokeHospitalAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const hospital = await Hospital.findById(id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    hospital.isActive = false;
    hospital.rejectionReason = reason || 'Access revoked by administrator';
    
    await hospital.save();
    
    console.log(`🚫 Hospital access revoked: ${hospital.hospitalName}`);
    
    res.status(200).json({
      success: true,
      message: 'Hospital access revoked successfully'
    });
    
  } catch (error) {
    console.error('Revoke hospital access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke hospital access',
      error: error.message
    });
  }
};

module.exports = exports;
