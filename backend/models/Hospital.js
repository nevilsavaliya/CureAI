const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactNumber: {
    type: String,
    required: true
  },
  emergencyContact: String,
  website: String,
  specializations: [String],
  numberOfBeds: Number,
  facilities: [String],
  
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectionReason: String,
  
  // API Credentials (generated after verification)
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  apiSecret: {
    type: String
  },
  apiKeyGeneratedAt: Date,
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['registration_certificate', 'license', 'accreditation', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Activity tracking
  lastLogin: Date,
  lastApiAccess: Date,
  apiAccessCount: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
hospitalSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
hospitalSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate API credentials
hospitalSchema.methods.generateApiCredentials = function() {
  const crypto = require('crypto');
  this.apiKey = `HK_${crypto.randomBytes(16).toString('hex')}`;
  this.apiSecret = crypto.randomBytes(32).toString('hex');
  this.apiKeyGeneratedAt = new Date();
  return {
    apiKey: this.apiKey,
    apiSecret: this.apiSecret
  };
};

// Update last login
hospitalSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
