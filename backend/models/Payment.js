const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  txnId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'timeout'],
    default: 'pending',
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'upi'
  },
  merchantVPA: {
    type: String,
    required: true
  },
  rrn: {
    type: String,
    default: null
  },
  kotakResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  verificationAttempts: {
    type: Number,
    default: 0
  },
  initiatedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  metadata: {
    planId: {
      type: String
    },
    planName: {
      type: String
    },
    duration: {
      type: Number
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
paymentSchema.index({ txnId: 1 });
paymentSchema.index({ doctorId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Compound index for doctor's payment history
paymentSchema.index({ doctorId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
