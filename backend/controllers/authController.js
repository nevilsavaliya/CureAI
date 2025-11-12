const authService = require('../services/authService');

// Patient signup controller
exports.signupPatient = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, dateOfBirth, bloodGroup } = req.body;

    // Validate required fields
    if (!name || !email || !password || !dateOfBirth || !bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, dateOfBirth, bloodGroup'
      });
    }

    // Validate password confirmation
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Register patient
    const user = await authService.signupPatient(req.body);

    // Generate token for immediate login
    const token = authService.generateToken(user.userId, 'patient');

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      token,
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Doctor signup controller
exports.signupDoctor = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, dateOfBirth, degree, speciality, specializations, experienceYears } = req.body;

    // Handle both single speciality and multiple specializations
    let doctorSpecializations = [];
    
    if (specializations) {
      // If specializations provided (array or comma-separated string)
      if (Array.isArray(specializations)) {
        doctorSpecializations = specializations;
      } else if (typeof specializations === 'string') {
        doctorSpecializations = specializations.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    } else if (speciality) {
      // Backward compatibility: single speciality
      doctorSpecializations = [speciality];
    }

    // Validate required fields
    if (!name || !email || !password || !dateOfBirth || !degree || doctorSpecializations.length === 0 || experienceYears === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, dateOfBirth, degree, specializations (or speciality), experienceYears'
      });
    }

    // Validate password confirmation
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Add specializations to request body
    const doctorData = {
      ...req.body,
      specializations: doctorSpecializations,
      speciality: doctorSpecializations[0] // Keep first one for backward compatibility
    };

    // Register doctor
    const user = await authService.signupDoctor(doctorData);

    // Generate token for immediate login
    const token = authService.generateToken(user.userId, 'doctor');

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully. Please complete subscription to access dashboard.',
      token,
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Authenticate user
    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

// Verify token controller
exports.verify = async (req, res) => {
  try {
    // If middleware passed, token is valid
    if (!req.user) {
      return res.status(401).json({
        valid: false,
        success: false,
        message: 'No user found'
      });
    }

    // User is already attached to req by auth middleware
    const user = await authService.getUserById(req.user.id, req.user.role);

    res.status(200).json({
      valid: true,
      user
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      success: false,
      message: error.message
    });
  }
};

// Logout controller (client-side token removal)
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
