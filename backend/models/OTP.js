const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['signup', 'password_reset'],
    default: 'password_reset'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // OTP expires after 10 minutes (MongoDB TTL index)
  }
});

// Compound index for efficient queries
otpSchema.index({ email: 1, purpose: 1, isUsed: 1 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
