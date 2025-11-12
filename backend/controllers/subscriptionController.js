const Subscription = require('../models/Subscription');
const Doctor = require('../models/Doctor');
const paymentService = require('../services/paymentService');

// Create payment order for subscription
exports.createPaymentOrder = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Find doctor by ID
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Check if doctor already has active subscription
    if (doctor.subscriptionStatus === 'active') {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Create Razorpay order for 30 Rs
    const order = await paymentService.createSubscriptionOrder(doctorId, 30);

    res.status(200).json({
      success: true,
      order: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
};

// Verify payment and activate subscription
exports.verifyPayment = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { orderId, paymentId, signature } = req.body;

    // Verify payment signature
    const isValid = paymentService.verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await paymentService.getPaymentDetails(paymentId);

    // Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

    // Update doctor subscription status
    doctor.subscriptionStatus = 'active';
    doctor.subscriptionStartDate = startDate;
    doctor.subscriptionExpiryDate = expiryDate;
    doctor.paymentInfo = {
      transactionId: paymentId,
      amount: paymentDetails.payment.amount,
      paymentDate: new Date(),
      upiId: process.env.UPI_ID
    };
    await doctor.save();

    // Create or update subscription record
    let subscription = await Subscription.findOne({ doctorId: doctor._id });
    
    if (subscription) {
      subscription.planName = 'Monthly Subscription';
      subscription.planPrice = 30;
      subscription.startDate = startDate;
      subscription.expiryDate = expiryDate;
      subscription.isActive = true;
      subscription.paymentInfo = {
        transactionId: paymentId,
        paymentMethod: paymentDetails.payment.method,
        amount: paymentDetails.payment.amount
      };
      await subscription.save();
    } else {
      subscription = new Subscription({
        doctorId: doctor._id,
        planName: 'Monthly Subscription',
        planPrice: 30,
        startDate: startDate,
        expiryDate: expiryDate,
        isActive: true,
        paymentInfo: {
          transactionId: paymentId,
          paymentMethod: paymentDetails.payment.method,
          amount: paymentDetails.payment.amount
        }
      });
      await subscription.save();
    }

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        status: 'active',
        startDate: startDate,
        expiryDate: expiryDate
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
};

// Get subscription status
exports.getSubscription = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Find doctor by ID
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Return subscription status from doctor document
    res.status(200).json({
      success: true,
      subscriptionStatus: doctor.subscriptionStatus,
      subscriptionStartDate: doctor.subscriptionStartDate,
      subscriptionExpiryDate: doctor.subscriptionExpiryDate
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// TEST MODE: Activate subscription without payment (for development only)
exports.activateSubscriptionTest = async (req, res) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }

    const doctorId = req.user.id;

    // Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

    // Update doctor subscription status
    doctor.subscriptionStatus = 'active';
    doctor.subscriptionStartDate = startDate;
    doctor.subscriptionExpiryDate = expiryDate;
    doctor.paymentInfo = {
      transactionId: 'TEST_' + Date.now(),
      amount: 30,
      paymentDate: new Date(),
      upiId: 'test@upi'
    };
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully (TEST MODE)',
      subscription: {
        status: 'active',
        startDate: startDate,
        expiryDate: expiryDate
      }
    });
  } catch (error) {
    console.error('Error activating test subscription:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate subscription'
    });
  }
};
