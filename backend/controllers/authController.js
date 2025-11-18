const authService = require('../services/authService');

// Patient signup - Step 1: Submit details and send OTP
exports.signupPatient = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, dateOfBirth, bloodGroup, otp } = req.body;

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

    // Check if email already exists
    const existingUser = await authService.checkEmailExists(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered. Please login instead.'
      });
    }

    // If OTP is provided, verify it and create account
    if (otp) {
      const emailVerificationService = require('../services/emailVerificationService');
      
      try {
        // Verify OTP
        await emailVerificationService.verifyOTP(email, otp, 'signup');
        
        // OTP verified, create account
        const user = await authService.signupPatient(req.body);
        const token = authService.generateToken(user.userId, 'patient');

        return res.status(201).json({
          success: true,
          message: 'Account created successfully! You can now login.',
          token,
          user
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'Invalid or expired OTP'
        });
      }
    }

    // No OTP provided, send OTP to email
    const emailVerificationService = require('../services/emailVerificationService');
    const otpSent = await emailVerificationService.sendVerificationOTP(email, 'signup');

    if (otpSent) {
      // Store signup data temporarily (you might want to use session or cache)
      // For now, just return success and ask for OTP
      return res.status(200).json({
        success: true,
        message: 'Verification OTP sent to your email. Please check your inbox.',
        requiresOTP: true,
        email: email
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Doctor signup - Step 1: Submit details and send OTP
exports.signupDoctor = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, dateOfBirth, degree, speciality, specializations, experienceYears, otp } = req.body;

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

    // Check if email already exists
    const existingUser = await authService.checkEmailExists(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered. Please login instead.'
      });
    }

    // If OTP is provided, verify it and create account
    if (otp) {
      const emailVerificationService = require('../services/emailVerificationService');
      
      try {
        // Verify OTP
        await emailVerificationService.verifyOTP(email, otp, 'signup');
        
        // OTP verified, create account
        const doctorData = {
          ...req.body,
          specializations: doctorSpecializations,
          speciality: doctorSpecializations[0]
        };
        
        const user = await authService.signupDoctor(doctorData);
        const token = authService.generateToken(user.userId, 'doctor');

        return res.status(201).json({
          success: true,
          message: 'Doctor account created successfully! Please complete subscription to access dashboard.',
          token,
          user
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'Invalid or expired OTP'
        });
      }
    }

    // No OTP provided, send OTP to email
    const emailVerificationService = require('../services/emailVerificationService');
    const otpSent = await emailVerificationService.sendVerificationOTP(email, 'signup');

    if (otpSent) {
      return res.status(200).json({
        success: true,
        message: 'Verification OTP sent to your email. Please check your inbox.',
        requiresOTP: true,
        email: email
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
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
