const Doctor = require('../models/Doctor');
const Subscription = require('../models/Subscription');

/**
 * Test Payment Controller
 * Allows doctors to simulate payment for testing purposes
 */

// POST /api/test-payment/simulate - Simulate payment completion
exports.simulatePayment = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { amount = 30, planName = 'Monthly Subscription' } = req.body;

    // Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if already has active subscription
    if (doctor.subscriptionStatus === 'active') {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days

    // Update doctor subscription status
    await Doctor.findByIdAndUpdate(doctorId, {
      subscriptionStatus: 'active',
      subscriptionStartDate: startDate,
      subscriptionExpiryDate: expiryDate,
      'paymentInfo.transactionId': `TEST_${Date.now()}`,
      'paymentInfo.amount': amount,
      'paymentInfo.paymentDate': startDate
    });

    // Create or update subscription record
    let subscription = await Subscription.findOne({ doctorId });

    if (subscription) {
      // Update existing subscription
      subscription.planName = planName;
      subscription.planPrice = amount;
      subscription.startDate = startDate;
      subscription.expiryDate = expiryDate;
      subscription.isActive = true;
      subscription.paymentMethod = 'other';
      subscription.transactionId = `TEST_${Date.now()}`;
      subscription.paidAmount = amount;
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new Subscription({
        doctorId,
        planName,
        planPrice: amount,
        startDate,
        expiryDate,
        isActive: true,
        paymentMethod: 'other',
        transactionId: `TEST_${Date.now()}`,
        paidAmount: amount
      });
      await subscription.save();
    }

    console.log(`✅ Test payment completed for doctor ${doctorId}`);

    res.status(200).json({
      success: true,
      message: 'Payment simulation completed successfully! You now have access to the dashboard.',
      subscription: {
        id: subscription._id,
        planName: subscription.planName,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        isActive: subscription.isActive,
        amount: subscription.paidAmount
      }
    });

  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to simulate payment',
      error: error.message
    });
  }
};

// GET /api/test-payment/status - Check current subscription status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const subscription = await Subscription.findOne({ doctorId });

    res.status(200).json({
      success: true,
      subscriptionStatus: doctor.subscriptionStatus,
      subscriptionStartDate: doctor.subscriptionStartDate,
      subscriptionExpiryDate: doctor.subscriptionExpiryDate,
      subscription: subscription ? {
        id: subscription._id,
        planName: subscription.planName,
        planPrice: subscription.planPrice,
        isActive: subscription.isActive,
        paymentMethod: subscription.paymentMethod,
        transactionId: subscription.transactionId
      } : null
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status',
      error: error.message
    });
  }
};

// POST /api/test-payment/reset - Reset subscription (for testing)
exports.resetSubscription = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Reset doctor subscription status
    await Doctor.findByIdAndUpdate(doctorId, {
      subscriptionStatus: 'pending',
      subscriptionStartDate: null,
      subscriptionExpiryDate: null,
      paymentInfo: {}
    });

    // Delete subscription record
    await Subscription.deleteOne({ doctorId });

    console.log(`🔄 Subscription reset for doctor ${doctorId}`);

    res.status(200).json({
      success: true,
      message: 'Subscription reset successfully. You can now test the payment flow again.'
    });

  } catch (error) {
    console.error('Error resetting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset subscription',
      error: error.message
    });
  }
};