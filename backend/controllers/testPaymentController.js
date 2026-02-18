/**
 * Test Payment Controller
 * Provides mock payment endpoints for development/testing
 * These endpoints simulate payment flow without actual payment gateway integration
 */

const Doctor = require('../models/Doctor');

/**
 * Get test payment status for current doctor
 * Returns mock subscription status
 */
exports.getTestPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id; // Changed from req.user.userId
    const userRole = req.user.role;

    console.log('🔵 [TEST-PAYMENT] Get status for user:', userId, 'role:', userRole);

    // Only doctors need subscription
    if (userRole !== 'doctor') {
      return res.status(200).json({
        success: true,
        subscriptionStatus: 'not_required',
        message: 'Subscription not required for this user type'
      });
    }

    // For development: Check actual subscription status from database
    const doctor = await Doctor.findById(userId);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Return ACTUAL subscription status from database
    const subscriptionStatus = doctor.subscriptionStatus || 'pending';
    const expiryDate = doctor.subscriptionExpiryDate || null;

    console.log('✅ [TEST-PAYMENT] Subscription status:', subscriptionStatus);

    return res.status(200).json({
      success: true,
      subscriptionStatus: subscriptionStatus,
      expiryDate: expiryDate,
      amount: 30,
      currency: 'INR'
    });

  } catch (error) {
    console.error('❌ [TEST-PAYMENT] Error getting status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get subscription status',
      error: error.message
    });
  }
};

/**
 * Simulate test payment
 * Mocks payment processing for development
 */
exports.simulateTestPayment = async (req, res) => {
  try {
    const userId = req.user.id; // Changed from req.user.userId
    const userRole = req.user.role;
    const { upiId, amount } = req.body;

    console.log('🔵 [TEST-PAYMENT] Simulate payment for user:', userId);
    console.log('🔵 [TEST-PAYMENT] UPI ID:', upiId, 'Amount:', amount);

    // Only doctors can make payments
    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can make subscription payments'
      });
    }

    // Validate input
    if (!upiId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID and amount are required'
      });
    }

    // Mock payment processing
    // In production, integrate with actual payment gateway (Razorpay, Kotak, etc.)
    
    // Simulate payment success after 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockPaymentId = `TEST_PAY_${Date.now()}`;
    const mockTransactionId = `TXN_${Date.now()}`;

    console.log('✅ [TEST-PAYMENT] Payment simulated successfully');
    console.log('✅ [TEST-PAYMENT] Payment ID:', mockPaymentId);

    // Update doctor's subscription status in database
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    await Doctor.findByIdAndUpdate(userId, { 
      subscriptionStatus: 'active',
      subscriptionExpiryDate: expiryDate,
      subscriptionStartDate: new Date(),
      paymentInfo: {
        transactionId: mockTransactionId,
        amount: amount,
        paymentDate: new Date(),
        upiId: upiId
      }
    });
    
    console.log('✅ [TEST-PAYMENT] Doctor subscription status updated to active');

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully (TEST MODE)',
      paymentId: mockPaymentId,
      transactionId: mockTransactionId,
      status: 'success',
      amount: amount,
      currency: 'INR',
      subscriptionStatus: 'active',
      expiryDate: expiryDate
    });

  } catch (error) {
    console.error('❌ [TEST-PAYMENT] Error simulating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Get payment history for current doctor
 * Returns mock payment history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Changed from req.user.userId
    const userRole = req.user.role;

    console.log('🔵 [TEST-PAYMENT] Get history for user:', userId);

    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors have payment history'
      });
    }

    // Mock payment history
    const mockHistory = [
      {
        paymentId: `TEST_PAY_${Date.now() - 86400000}`,
        transactionId: `TXN_${Date.now() - 86400000}`,
        amount: 30,
        currency: 'INR',
        status: 'success',
        date: new Date(Date.now() - 86400000), // 1 day ago
        subscriptionPeriod: '30 days'
      }
    ];

    return res.status(200).json({
      success: true,
      payments: mockHistory,
      total: mockHistory.length
    });

  } catch (error) {
    console.error('❌ [TEST-PAYMENT] Error getting history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
};
