const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 30
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  month: {
    type: String,
    required: true // Format: "January 2026"
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    default: 'UPI'
  }
}, {
  timestamps: true
});

// Index for faster lookups
paymentSchema.index({ doctorId: 1, paymentDate: -1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
