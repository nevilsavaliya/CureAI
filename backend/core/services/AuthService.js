const BaseService = require('./BaseService');
const jwt = require('jsonwebtoken');
const { ValidationError, AuthenticationError, NotFoundError } = require('../errors');
const ConfigService = require('../config/ConfigService');
const CacheService = require('./CacheService');

/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */
class AuthService extends BaseService {
  /**
   * @param {UserRepository} userRepository - User repository instance
   * @param {Object} modelRegistry - Registry of model-specific repositories {Patient, Doctor, Admin, Hospital}
   */
  constructor(userRepository, modelRegistry = {}) {
    super(userRepository);
    this.modelRegistry = modelRegistry;
    this.config = ConfigService;
    this.cache = CacheService;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes for user sessions (reduced for 512MB)
  }

  /**
   * Generate JWT token
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {Object} additionalData - Additional data to include in token
   * @returns {string} JWT token
   */
  generateToken(userId, role, additionalData = {}) {
    try {
      const payload = {
        id: userId,
        role: role,
        ...additionalData
      };

      return jwt.sign(
        payload,
        this.config.getJwtSecret(),
        { expiresIn: this.config.getJwtExpiresIn() }
      );
    } catch (error) {
      throw new Error(`Failed to generate token: ${error.message}`);
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.config.getJwtSecret());
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Check if email exists in any user collection
   * @param {string} email - Email to check
   * @returns {Promise<Object|null>} User object if found, null otherwise
   */
  async checkEmailExists(email) {
    try {
      if (!email) {
        throw new ValidationError('Email is required');
      }

      // Check in all model repositories
      const repositories = [
        { repo: this.modelRegistry.Patient, role: 'patient' },
        { repo: this.modelRegistry.Doctor, role: 'doctor' },
        { repo: this.modelRegistry.Admin, role: 'admin' },
        { repo: this.modelRegistry.Hospital, role: 'hospital' }
      ];

      for (const { repo, role } of repositories) {
        if (repo) {
          const user = await repo.findByEmail(email);
          if (user) {
            return { user, role };
          }
        }
      }

      return null;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Register new patient
   * @param {Object} userData - Patient registration data
   * @returns {Promise<Object>} Created patient info
   */
  async signupPatient(userData) {
    try {
      const { name, email, password, dateOfBirth, bloodGroup } = userData;

      // Validate required fields
      this.validateRequiredFields(userData, ['name', 'email', 'password', 'dateOfBirth', 'bloodGroup']);
      this.validateEmail(email);
      this.validatePassword(password);

      // Check if email already exists
      const existingUser = await this.checkEmailExists(email);
      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Create patient using repository
      const patientRepo = this.modelRegistry.Patient;
      if (!patientRepo) {
        throw new Error('Patient repository not configured');
      }

      const patient = await patientRepo.create({
        name,
        email,
        password,
        dateOfBirth,
        bloodGroup
      });

      return {
        userId: patient._id,
        name: patient.name,
        email: patient.email,
        role: 'patient'
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Register new doctor
   * @param {Object} userData - Doctor registration data
   * @returns {Promise<Object>} Created doctor info
   */
  async signupDoctor(userData) {
    try {
      const { name, email, password, dateOfBirth, degree, speciality, specializations, experienceYears } = userData;

      // Validate required fields
      this.validateRequiredFields(userData, ['name', 'email', 'password', 'dateOfBirth', 'degree', 'experienceYears']);
      this.validateEmail(email);
      this.validatePassword(password);

      // Validate specializations
      const doctorSpecializations = specializations || (speciality ? [speciality] : []);
      if (doctorSpecializations.length === 0) {
        throw new ValidationError('At least one specialization is required');
      }

      // Check if email already exists
      const existingUser = await this.checkEmailExists(email);
      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Create doctor using repository
      const doctorRepo = this.modelRegistry.Doctor;
      if (!doctorRepo) {
        throw new Error('Doctor repository not configured');
      }

      const doctor = await doctorRepo.create({
        name,
        email,
        password,
        dateOfBirth,
        degree,
        speciality: doctorSpecializations[0],
        specializations: doctorSpecializations,
        experienceYears,
        subscriptionStatus: 'pending'
      });

      return {
        userId: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: 'doctor',
        subscriptionStatus: 'pending'
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result with token and user info
   */
  async login(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      let user = null;
      let role = null;
      let repository = null;

      // Check for hardcoded admin first
      if (email === 'admin@gmail.com' && password === 'admin@123') {
        const adminRepo = this.modelRegistry.Admin;
        if (!adminRepo) {
          throw new Error('Admin repository not configured');
        }

        user = await adminRepo.findByEmail('admin@gmail.com');
        if (!user) {
          // Create default admin if doesn't exist
          user = await adminRepo.create({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: 'admin@123'
          });
        }
        role = 'admin';
        repository = adminRepo;
      } else {
        // Try to find user in all collections
        const repositories = [
          { repo: this.modelRegistry.Patient, role: 'patient' },
          { repo: this.modelRegistry.Doctor, role: 'doctor' },
          { repo: this.modelRegistry.Admin, role: 'admin' },
          { repo: this.modelRegistry.Hospital, role: 'hospital' }
        ];

        for (const { repo, role: userRole } of repositories) {
          if (repo) {
            const foundUser = await repo.findByEmail(email);
            if (foundUser) {
              user = foundUser;
              role = userRole;
              repository = repo;
              break;
            }
          }
        }

        if (!user) {
          throw new AuthenticationError('Email is not registered. Please sign up first.');
        }

        // Check if user is active
        if (user.isActive === false) {
          throw new AuthenticationError('Account is deactivated. Please contact support.');
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          throw new AuthenticationError('Password is incorrect. Please try again.');
        }

        // Check hospital verification status
        if (role === 'hospital' && user.verificationStatus !== 'verified') {
          throw new AuthenticationError(`Hospital account is ${user.verificationStatus}. Please wait for admin verification.`);
        }
      }

      // Update last login
      if (role === 'admin') {
        user.lastLogin = new Date();
        await user.save();
      } else if (user.updateLastLogin) {
        await user.updateLastLogin();
      }

      // Generate token with role-specific data
      let tokenData = {};
      if (role === 'admin') {
        tokenData = {
          isRootAdmin: user.isRoot ? user.isRoot() : false,
          adminPermissions: user.permissions || [],
          email: user.email
        };
      }

      const token = this.generateToken(user._id, role, tokenData);

      // Build response
      const response = {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: role
        }
      };

      // Add role-specific information
      if (role === 'admin') {
        response.user.isRootAdmin = user.isRoot ? user.isRoot() : false;
        response.user.permissions = user.permissions || [];
        response.user.lastLogin = user.lastLogin;
      }

      if (role === 'doctor') {
        response.user.subscriptionStatus = user.subscriptionStatus;
      }

      if (role === 'hospital') {
        response.user.verificationStatus = user.verificationStatus;
        response.user.hospitalName = user.hospitalName;
      }

      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user by ID and role
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId, role) {
    try {
      if (!userId || !role) {
        throw new ValidationError('User ID and role are required');
      }

      // Try to get from cache
      const cacheKey = `user:${userId}:${role}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      let repository = null;

      // Get appropriate repository based on role
      switch (role) {
        case 'patient':
          repository = this.modelRegistry.Patient;
          break;
        case 'doctor':
          repository = this.modelRegistry.Doctor;
          break;
        case 'admin':
          repository = this.modelRegistry.Admin;
          break;
        case 'hospital':
          repository = this.modelRegistry.Hospital;
          break;
        default:
          throw new ValidationError('Invalid user role');
      }

      if (!repository) {
        throw new Error(`Repository for role ${role} not configured`);
      }

      // Find user with password excluded
      const user = await repository.findById(userId, { select: '-password' });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const result = { ...user.toObject(), role };

      // Cache the result
      await this.cache.set(cacheKey, result, this.cacheTTL);

      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Verify OTP for signup/password reset
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @param {string} purpose - Purpose of OTP (signup, password-reset)
   * @returns {Promise<boolean>} True if OTP is valid
   */
  async verifyOTP(email, otp, purpose) {
    try {
      // This method would integrate with OTP service
      // For now, we'll delegate to the existing emailVerificationService
      const emailVerificationService = require('../../services/emailVerificationService');
      await emailVerificationService.verifyOTP(email, otp, purpose);
      return true;
    } catch (error) {
      throw new AuthenticationError(error.message || 'Invalid or expired OTP');
    }
  }

  /**
   * Send verification OTP
   * @param {string} email - User email
   * @param {string} purpose - Purpose of OTP (signup, password-reset)
   * @returns {Promise<boolean>} True if OTP sent successfully
   */
  async sendVerificationOTP(email, purpose) {
    try {
      this.validateEmail(email);

      // Delegate to existing emailVerificationService
      const emailVerificationService = require('../../services/emailVerificationService');
      return await emailVerificationService.sendVerificationOTP(email, purpose);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get entity name for error messages
   * @returns {string} Entity name
   */
  getEntityName() {
    return 'User';
  }
}

module.exports = AuthService;
