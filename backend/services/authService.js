const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Hospital = require('../models/Hospital');

class AuthService {
  // Generate JWT token with enhanced admin role information
  generateToken(userId, role, additionalData = {}) {
    const payload = { 
      id: userId, 
      role: role,
      ...additionalData
    };
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Check if email exists in any collection
  async checkEmailExists(email) {
    const patient = await Patient.findOne({ email });
    const doctor = await Doctor.findOne({ email });
    const admin = await Admin.findOne({ email });
    const hospital = await Hospital.findOne({ email });
    return patient || doctor || admin || hospital;
  }

  // Register new patient
  async signupPatient(userData) {
    try {
      const { name, email, password, dateOfBirth, bloodGroup } = userData;

      // Check if email already exists
      const existingUser = await this.checkEmailExists(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new patient
      const patient = new Patient({
        name,
        email,
        password,
        dateOfBirth,
        bloodGroup
      });

      await patient.save();

      return {
        userId: patient._id,
        name: patient.name,
        email: patient.email,
        role: 'patient'
      };
    } catch (error) {
      throw error;
    }
  }

  // Register new doctor
  async signupDoctor(userData) {
    try {
      const { name, email, password, dateOfBirth, degree, speciality, specializations, experienceYears } = userData;

      // Check if email already exists
      const existingUser = await this.checkEmailExists(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new doctor with pending subscription
      const doctor = new Doctor({
        name,
        email,
        password,
        dateOfBirth,
        degree,
        speciality: speciality || (specializations && specializations[0]), // Backward compatibility
        specializations: specializations || [speciality], // New field
        experienceYears,
        subscriptionStatus: 'pending'
      });

      await doctor.save();

      return {
        userId: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: 'doctor',
        subscriptionStatus: 'pending'
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user - checks all collections
  async login(email, password) {
    try {
      let user = null;
      let role = null;
      let Model = null;

      // Check for hardcoded admin first
      if (email === 'admin@gmail.com' && password === 'admin@123') {
        // Check if admin exists, if not create it
        user = await Admin.findOne({ email: 'admin@gmail.com' });
        if (!user) {
          user = new Admin({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: 'admin@123'
          });
          await user.save();
        }
        role = 'admin';
        Model = Admin;
      } else {
        // Try to find in patients collection
        user = await Patient.findOne({ email });
        if (user) {
          role = 'patient';
          Model = Patient;
        }

        // If not found, try doctors collection
        if (!user) {
          user = await Doctor.findOne({ email });
          if (user) {
            role = 'doctor';
            Model = Doctor;
          }
        }

        // If not found, try admins collection
        if (!user) {
          user = await Admin.findOne({ email });
          if (user) {
            role = 'admin';
            Model = Admin;
          }
        }

        // If not found, try hospitals collection
        if (!user) {
          user = await Hospital.findOne({ email });
          if (user) {
            role = 'hospital';
            Model = Hospital;
          }
        }

        // Better error message: Email not registered
        if (!user) {
          throw new Error('Email is not registered. Please sign up first.');
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('Account is deactivated. Please contact support.');
        }

        // Verify password - Better error message
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          throw new Error('Password is incorrect. Please try again.');
        }

        // Check hospital verification status
        if (role === 'hospital' && user.verificationStatus !== 'verified') {
          throw new Error(`Hospital account is ${user.verificationStatus}. Please wait for admin verification.`);
        }
      }

      // Update last login with IP and user agent tracking for admins
      if (role === 'admin') {
        // For admin users, we'll update this in the controller with proper IP/user agent
        user.lastLogin = new Date();
        await user.save();
      } else {
        await user.updateLastLogin();
      }

      // Generate token with admin role information
      let tokenData = {};
      if (role === 'admin') {
        tokenData = {
          isRootAdmin: user.isRoot(),
          adminPermissions: user.permissions || [],
          email: user.email
        };
      }
      
      const token = this.generateToken(user._id, role, tokenData);

      const response = {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: role
        }
      };

      // Add admin-specific information to response
      if (role === 'admin') {
        response.user.isRootAdmin = user.isRoot();
        response.user.permissions = user.permissions || [];
        response.user.lastLogin = user.lastLogin;
      }

      // Add subscription status for doctors
      if (role === 'doctor') {
        response.user.subscriptionStatus = user.subscriptionStatus;
      }

      // Add verification status for hospitals
      if (role === 'hospital') {
        response.user.verificationStatus = user.verificationStatus;
        response.user.hospitalName = user.hospitalName;
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID and role
  async getUserById(userId, role) {
    try {
      let user = null;

      if (role === 'patient') {
        user = await Patient.findById(userId).select('-password');
      } else if (role === 'doctor') {
        user = await Doctor.findById(userId).select('-password');
      } else if (role === 'admin') {
        user = await Admin.findById(userId).select('-password');
      } else if (role === 'hospital') {
        user = await Hospital.findById(userId).select('-password -apiSecret');
      }

      if (!user) {
        throw new Error('User not found');
      }

      return { ...user.toObject(), role };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
