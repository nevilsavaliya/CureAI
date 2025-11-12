const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true
  },
  planName: {
    type: String,
    required: true
  },
  planPrice: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'razorpay', 'manual', 'other'],
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
  paidAmount: {
    type: Number,
    default: null
  },
  paymentInfo: {
    transactionId: String,
    paymentMethod: String,
    amount: Number
  }
}, {
  timestamps: true
});

subscriptionSchema.index({ doctorId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
