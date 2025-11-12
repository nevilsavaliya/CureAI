const profileService = require('../services/profileService');

// Create/Update patient profile
exports.savePatientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Validate required fields
    if (!profileData.age || !profileData.gender) {
      return res.status(400).json({
        success: false,
        message: 'Age and gender are required fields'
      });
    }

    const patient = await profileService.savePatientProfile(userId, profileData);

    res.status(200).json({
      success: true,
      message: 'Patient profile saved successfully',
      profile: patient
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Create/Update doctor profile
exports.saveDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Validate required fields
    if (!profileData.specialization || !profileData.qualifications || !profileData.experienceYears || !profileData.contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Specialization, qualifications, experience, and contact number are required'
      });
    }

    const doctor = await profileService.saveDoctorProfile(userId, profileData);

    res.status(200).json({
      success: true,
      message: 'Doctor profile saved successfully',
      profile: doctor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get profile by userId
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const role = req.user.role;

    const profile = await profileService.getProfile(userId, role);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
