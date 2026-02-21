const { asyncHandler, sendSuccess, sendCreated, sendError, validateRequiredFields } = require('../core/controllers');
const AuthService = require('../core/services/AuthService');
const UserRepository = require('../core/repositories/UserRepository');
const PatientRepository = require('../core/repositories/PatientRepository');
const DoctorRepository = require('../core/repositories/DoctorRepository');
const HospitalRepository = require('../core/repositories/HospitalRepository');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Admin = require('../models/Admin');

// Initialize repositories
const userRepository = new UserRepository(User);
const patientRepository = new PatientRepository(Patient);
const doctorRepository = new DoctorRepository(Doctor);
const hospitalRepository = new HospitalRepository(Hospital);

// Initialize AuthService with repositories
const authService = new AuthService(userRepository, {
  Patient: patientRepository,
  Doctor: doctorRepository,
  Hospital: hospitalRepository,
  Admin: { 
    findByEmail: async (email) => await Admin.findOne({ email }),
    create: async (data) => await Admin.create(data)
  }
});

// Patient signup - Step 1: Submit details and send OTP
exports.signupPatient = asyncHandler(async (req, res) => {
  console.log('🔵 [SIGNUP] Patient signup request received');
  console.log('🔵 [SIGNUP] Request body:', JSON.stringify(req.body, null, 2));
  
  const { name, email, password, confirmPassword, dateOfBirth, bloodGroup, otp } = req.body;

  console.log('🔵 [SIGNUP] Extracted fields:', { name, email, dateOfBirth, bloodGroup, hasOtp: !!otp });

  // Validate required fields
  const missingFields = validateRequiredFields(req.body, ['name', 'email', 'password', 'dateOfBirth', 'bloodGroup']);
  if (missingFields) {
    console.log('❌ [SIGNUP] Missing required fields:', missingFields);
    return sendError(res, `Please provide all required fields: ${missingFields.join(', ')}`, 400);
  }

  // Validate password confirmation
  if (confirmPassword && password !== confirmPassword) {
    console.log('❌ [SIGNUP] Passwords do not match');
    return sendError(res, 'Passwords do not match', 400);
  }

  console.log('🔵 [SIGNUP] Checking if email exists...');
  // Check if email already exists
  const existingUser = await authService.checkEmailExists(email);
  if (existingUser) {
    console.log('❌ [SIGNUP] Email already exists');
    return sendError(res, 'Email is already registered. Please login instead.', 400);
  }
  console.log('✅ [SIGNUP] Email is available');

  // If OTP is provided, verify it and create account
  if (otp) {
    console.log('🔵 [SIGNUP] OTP provided, verifying...');
    
    try {
      // Verify OTP
      await authService.verifyOTP(email, otp, 'signup');
      console.log('✅ [SIGNUP] OTP verified successfully');
      
      // OTP verified, create account
      console.log('🔵 [SIGNUP] Creating patient account...');
      const user = await authService.signupPatient(req.body);
      console.log('✅ [SIGNUP] Patient account created:', user.userId);
      
      const token = authService.generateToken(user.userId, 'patient');
      console.log('✅ [SIGNUP] Token generated');

      return sendCreated(res, { token, user }, 'Account created successfully! You can now login.');
    } catch (error) {
      console.log('❌ [SIGNUP] OTP verification failed:', error.message);
      return sendError(res, error.message || 'Invalid or expired OTP', 400);
    }
  }

  // No OTP provided, send OTP to email
  console.log('🔵 [SIGNUP] No OTP provided, sending OTP to email...');
  
  console.log('🔵 [SIGNUP] Calling sendVerificationOTP...');
  const otpSent = await authService.sendVerificationOTP(email, 'signup');
  console.log('🔵 [SIGNUP] sendVerificationOTP returned:', otpSent);

  if (otpSent) {
    console.log('✅ [SIGNUP] OTP sent successfully');
    return sendSuccess(res, { requiresOTP: true, email }, 'Verification OTP sent to your email. Please check your inbox.');
  } else {
    console.log('❌ [SIGNUP] Failed to send OTP');
    return sendError(res, 'Failed to send OTP. Please try again.', 500);
  }
});

// Doctor signup - Step 1: Submit details and send OTP
exports.signupDoctor = asyncHandler(async (req, res) => {
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
  const requiredFields = ['name', 'email', 'password', 'dateOfBirth', 'degree', 'experienceYears'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields || doctorSpecializations.length === 0) {
    const fields = missingFields ? [...missingFields, 'specializations'] : ['specializations'];
    return sendError(res, `Please provide all required fields: ${fields.join(', ')}`, 400);
  }

  // Validate password confirmation
  if (confirmPassword && password !== confirmPassword) {
    return sendError(res, 'Passwords do not match', 400);
  }

  // Check if email already exists
  const existingUser = await authService.checkEmailExists(email);
  if (existingUser) {
    return sendError(res, 'Email is already registered. Please login instead.', 400);
  }

  // If OTP is provided, verify it and create account
  if (otp) {
    try {
      // Verify OTP
      await authService.verifyOTP(email, otp, 'signup');
      
      // OTP verified, create account
      const doctorData = {
        ...req.body,
        specializations: doctorSpecializations,
        speciality: doctorSpecializations[0]
      };
      
      const user = await authService.signupDoctor(doctorData);
      const token = authService.generateToken(user.userId, 'doctor');

      return sendCreated(res, { token, user }, 'Doctor account created successfully! Please complete subscription to access dashboard.');
    } catch (error) {
      return sendError(res, error.message || 'Invalid or expired OTP', 400);
    }
  }

  // No OTP provided, send OTP to email
  const otpSent = await authService.sendVerificationOTP(email, 'signup');

  if (otpSent) {
    return sendSuccess(res, { requiresOTP: true, email }, 'Verification OTP sent to your email. Please check your inbox.');
  } else {
    return sendError(res, 'Failed to send OTP. Please try again.', 500);
  }
});

// Login controller with enhanced admin authentication
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  const missingFields = validateRequiredFields(req.body, ['email', 'password']);
  if (missingFields) {
    return sendError(res, `Please provide ${missingFields.join(' and ')}`, 400);
  }

  // Get client IP and user agent for security tracking
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   req.socket?.remoteAddress ||
                   req.ip ||
                   'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Authenticate user
  const result = await authService.login(email, password);

  // For admin users, update last login with IP and user agent tracking
  if (result.user.role === 'admin') {
    const admin = await Admin.findById(result.user.id);
    
    if (admin) {
      await admin.updateLastLogin(clientIP, userAgent);
      
      // Update response with latest admin information
      result.user.lastLogin = admin.lastLogin;
      result.user.lastLoginIP = admin.lastLoginIP;
    }
  }

  // Set session headers for admin users
  if (result.user.role === 'admin') {
    res.set({
      'X-Admin-Session': 'active',
      'X-Root-Admin': result.user.isRootAdmin ? 'true' : 'false'
    });
  }

  return sendSuccess(res, { token: result.token, user: result.user }, 'Login successful');
});

// Verify token controller with admin session validation
exports.verify = asyncHandler(async (req, res) => {
  // If middleware passed, token is valid
  if (!req.user) {
    return sendError(res, 'No user found', 401, { valid: false, requiresLogin: true });
  }

  // User is already attached to req by auth middleware
  const user = await authService.getUserById(req.user.id, req.user.role);

  // For admin users, perform additional session validation
  if (req.user.role === 'admin') {
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return sendError(res, 'Admin user not found', 401, { valid: false, requiresLogin: true });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return sendError(res, 'Admin account is deactivated', 403, { valid: false, requiresLogin: true });
    }

    // Check if admin account is locked
    if (admin.isAccountLocked()) {
      return sendError(res, 'Admin account is temporarily locked', 423, { 
        valid: false, 
        requiresLogin: true,
        lockedUntil: admin.accountLockedUntil 
      });
    }

    // Add admin-specific information to user object
    user.isRootAdmin = admin.isRoot();
    user.permissions = admin.permissions || [];
    user.lastLogin = admin.lastLogin;
    user.lastLoginIP = admin.lastLoginIP;

    // Set admin session headers
    res.set({
      'X-Admin-Session': 'active',
      'X-Root-Admin': admin.isRoot() ? 'true' : 'false',
      'X-Admin-Permissions': JSON.stringify(admin.permissions || [])
    });
  }

  return sendSuccess(res, { valid: true, user }, 'Token is valid');
});

// Logout controller (client-side token removal)
exports.logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, null, 'Logged out successfully');
});
