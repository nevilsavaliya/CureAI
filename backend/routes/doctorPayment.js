const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Payment = require('../models/Payment');
const { authenticate, authorize } = require('../middleware/auth');

// Get payment status
router.get('/payment-status', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const now = new Date();
    const lastPaymentDate = doctor.lastPaymentDate;
    const nextPaymentDue = doctor.subscriptionExpiryDate;

    let daysUntilDue = 0;
    if (nextPaymentDue) {
      daysUntilDue = Math.ceil((nextPaymentDue - now) / (1000 * 60 * 60 * 24));
    }

    const paymentStatus = {
      isActive: doctor.subscriptionStatus === 'active',
      lastPaymentDate: lastPaymentDate,
      nextPaymentDue: nextPaymentDue,
      daysUntilDue: daysUntilDue,
      isShadowBanned: doctor.isShadowBanned || false,
      subscriptionStatus: doctor.subscriptionStatus
    };

    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({ success: true, data: paymentStatus });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get payment history
router.get('/payment-history', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const payments = await Payment.find({ doctorId: req.user.id })
      .sort({ paymentDate: -1 })
      .limit(50);

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Make payment
router.post('/make-payment', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { amount } = req.body;
    console.log('[Payment] Processing payment for doctor:', req.user.id);

    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      console.error('[Payment] Doctor not found:', req.user.id);
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    console.log('[Payment] Current doctor subscription status:', doctor.subscriptionStatus);

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get current month and year
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    // Create payment record
    const payment = new Payment({
      doctorId: req.user.id,
      amount: amount || 30,
      transactionId: transactionId,
      status: 'completed',
      month: month,
      paymentDate: now
    });

    await payment.save();
    console.log('[Payment] Payment record created:', payment._id);

    // Update doctor subscription
    const subscriptionStart = now;
    const subscriptionExpiry = new Date(now);
    subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);

    doctor.subscriptionStatus = 'active';
    doctor.subscriptionStartDate = subscriptionStart;
    doctor.subscriptionExpiryDate = subscriptionExpiry;
    doctor.lastPaymentDate = now;
    doctor.isShadowBanned = false;

    await doctor.save();
    console.log('[Payment] Doctor subscription updated to active');
    console.log('[Payment] New subscription expiry:', subscriptionExpiry);

    res.json({
      success: true,
      message: 'Payment successful',
      data: {
        transactionId: transactionId,
        expiryDate: subscriptionExpiry,
        subscriptionStatus: 'active'
      }
    });
  } catch (error) {
    console.error('[Payment] Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed', error: error.message });
  }
});

// Get doctor profile
router.get('/profile', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select('-password');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const profile = {
      name: doctor.name,
      email: doctor.email,
      phone: doctor.contactNumber || '',
      degree: doctor.degree,
      specialization: doctor.specializations || [],
      experienceYears: doctor.experienceYears,
      registrationNumber: doctor.licenseNumber || '',
      clinicAddress: doctor.clinicAddress || '',
      about: doctor.about || '',
      consultationFee: doctor.consultationFee || 0
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update doctor profile
router.put('/profile', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { name, phone, degree, specialization, experienceYears, registrationNumber, clinicAddress, about, consultationFee } = req.body;

    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Update fields
    if (name) doctor.name = name;
    if (phone) doctor.contactNumber = phone;
    if (degree) doctor.degree = degree;
    if (specialization) doctor.specializations = specialization;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
    if (registrationNumber) doctor.licenseNumber = registrationNumber;
    if (clinicAddress) doctor.clinicAddress = clinicAddress;
    if (about !== undefined) doctor.about = about;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;

    await doctor.save();

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

module.exports = router;
