const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true
  },
  specializations: {
    type: [String],
    required: [true, 'At least one specialization is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one specialization is required'
    }
  },
  // Keep for backward compatibility
  speciality: {
    type: String
  },
  experienceYears: {
    type: Number,
    required: [true, 'Experience years is required'],
    min: 0
  },
  contactNumber: {
    type: String,
    trim: true
  },
  clinicAddress: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  subscriptionStatus: {
    type: String,
    enum: ['pending', 'active', 'expired'],
    default: 'pending'
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionExpiryDate: {
    type: Date
  },
  paymentInfo: {
    transactionId: String,
    amount: Number,
    paymentDate: Date,
    upiId: String
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster email lookups
doctorSchema.index({ email: 1 });
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ subscriptionStatus: 1 });

// Hash password before saving
doctorSchema.pre('save', async function(next) {
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

// Method to compare password for login
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to update last login
doctorSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
