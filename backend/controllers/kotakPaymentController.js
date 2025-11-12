const Payment = require('../models/Payment');
const Doctor = require('../models/Doctor');
const kotakPaymentService = require('../services/kotakPaymentService');
const paymentVerificationService = require('../services/paymentVerificationService');
const kotakConfig = require('../config/kotakConfig');
const kotakErrorHandler = require('../utils/kotakErrorHandler');
const paymentLogger = require('../services/paymentLogger');
const paymentMetrics = require('../services/paymentMetrics');

// Rate limiting storage (in-memory)
// In production, use Redis or similar distributed cache
const paymentAttempts = new Map();

// Rate limiting middleware - 3 payment initiations per doctor per hour
exports.rateLimitPaymentInitiation = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const maxAttempts = 3;

    // Get or initialize attempts for this doctor
    if (!paymentAttempts.has(doctorId)) {
      paymentAttempts.set(doctorId, []);
    }

    const attempts = paymentAttempts.get(doctorId);

    // Remove attempts older than 1 hour
    const recentAttempts = attempts.filter(timestamp => now - timestamp < oneHour);
    paymentAttempts.set(doctorId, recentAttempts);

    // Check if limit exceeded
    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const timeUntilReset = Math.ceil((oneHour - (now - oldestAttempt)) / 1000 / 60); // minutes

      return res.status(429).json({
        success: false,
        message: `Payment initiation limit exceeded. You can initiate ${maxAttempts} payments per hour. Please try again in ${timeUntilReset} minutes.`,
        retryAfter: timeUntilReset
      });
    }

    // Add current attempt
    recentAttempts.push(now);
    paymentAttempts.set(doctorId, recentAttempts);

    next();
  } catch (error) {
    console.error('Error in rate limiting middleware:', error);
    // Don't block the request if rate limiting fails
    next();
  }
};

// Generate unique transaction ID with KMB prefix
const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `KMB${timestamp}${random}`;
};

// Generate UPI QR code data string
const generateUPIQRData = (vpa, amount, txnId, merchantName = 'Healthcare Platform') => {
  // UPI QR code format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tn=TXN_ID&cu=INR
  return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(merchantName)}&am=${amount}&tn=${txnId}&cu=INR`;
};

// POST /api/payments/initiate - Initiate UPI payment
exports.initiatePayment = async (req, res) => {
  try {
    // Validate Kotak configuration
    if (!kotakConfig.isEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'UPI payment service is not configured. Please contact support.'
      });
    }

    const doctorId = req.user.id;
    const { amount, planId, planName, duration } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

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

    // Generate unique transaction ID
    const txnId = generateTransactionId();

    // Get merchant VPA from config
    const merchantVPA = kotakConfig.get('merchantVPA');

    // Calculate expiry time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Create payment record
    const payment = new Payment({
      txnId,
      doctorId: doctor._id,
      amount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'upi',
      merchantVPA,
      verificationAttempts: 0,
      initiatedAt: new Date(),
      expiresAt,
      metadata: {
        planId: planId || 'monthly',
        planName: planName || 'Monthly Subscription',
        duration: duration || 30
      }
    });

    await payment.save();

    // Log payment initiation
    paymentLogger.logPaymentInitiation({
      paymentId: payment._id.toString(),
      txnId,
      doctorId: doctor._id,
      amount,
      planName: planName || 'Monthly Subscription',
      duration: duration || 30
    });

    // Update metrics
    paymentMetrics.incrementCounter('initiated');
    paymentMetrics.incrementCounter('totalAmount', amount);

    // Start payment verification polling
    paymentVerificationService.startVerification(payment._id.toString());

    // Generate UPI QR code data
    const qrCodeData = generateUPIQRData(merchantVPA, amount, txnId);

    // Return payment details
    res.status(200).json({
      success: true,
      payment: {
        paymentId: payment._id,
        txnId,
        merchantVPA,
        amount,
        currency: 'INR',
        qrCodeData,
        expiresAt,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    
    // Log error with context
    kotakErrorHandler.logError('Initiate Payment', error, {
      doctorId: req.user?.id,
      amount: req.body?.amount
    });

    // Log payment error
    paymentLogger.logPaymentError({
      paymentId: null,
      txnId: null,
      doctorId: req.user?.id,
      operation: 'initiatePayment',
      error,
      context: {
        amount: req.body?.amount,
        planId: req.body?.planId
      }
    });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
      errorCode: 'INIT_ERROR',
      recommendedAction: 'Please try again or contact support if the issue persists.'
    });
  }
};

// GET /api/payments/:paymentId/status - Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const doctorId = req.user.id;

    // Find payment record
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify payment belongs to the authenticated doctor
    if (payment.doctorId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prepare response
    const response = {
      success: true,
      payment: {
        paymentId: payment._id,
        txnId: payment.txnId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        initiatedAt: payment.initiatedAt,
        completedAt: payment.completedAt,
        expiresAt: payment.expiresAt
      }
    };

    // If payment is completed, include subscription ID
    if (payment.status === 'completed' && payment.metadata && payment.metadata.subscriptionId) {
      response.payment.subscriptionId = payment.metadata.subscriptionId;
    }

    // Include error details if payment failed or timed out
    if ((payment.status === 'failed' || payment.status === 'timeout') && payment.kotakResponse) {
      response.payment.message = payment.kotakResponse.userMessage || payment.kotakResponse.message;
      response.payment.errorCode = payment.kotakResponse.responseCode || payment.kotakResponse.errorCode;
      
      // Add recommended action
      if (payment.kotakResponse.responseCode) {
        response.payment.recommendedAction = kotakErrorHandler.getRecommendedAction(payment.kotakResponse.responseCode);
      }
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    
    // Log error with context
    kotakErrorHandler.logError('Get Payment Status', error, {
      paymentId: req.params?.paymentId,
      doctorId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment status',
      errorCode: 'STATUS_ERROR',
      recommendedAction: 'Please try again or contact support if the issue persists.'
    });
  }
};

// POST /api/payments/:paymentId/verify - Manually verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const doctorId = req.user.id;

    // Find payment record
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify payment belongs to the authenticated doctor
    if (payment.doctorId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if payment is already completed or failed
    if (payment.status === 'completed') {
      return res.status(200).json({
        success: true,
        verified: true,
        status: 'completed',
        message: 'Payment already verified'
      });
    }

    if (payment.status === 'failed') {
      return res.status(200).json({
        success: true,
        verified: false,
        status: 'failed',
        message: 'Payment has failed'
      });
    }

    // Validate Kotak configuration
    if (!kotakConfig.isEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'UPI payment service is not configured'
      });
    }

    // Get configuration
    const aggregatorVPA = kotakConfig.get('merchantVPA');
    const customerId = kotakConfig.get('merchantMobile');

    // Call Kotak API to check transaction status
    const kotakResponse = await kotakPaymentService.checkTransactionStatus(
      payment.txnId,
      aggregatorVPA,
      customerId,
      payment.amount
    );

    // Update payment with response
    payment.kotakResponse = kotakResponse;
    payment.verificationAttempts += 1;

    // Check status
    if (kotakResponse.status === 'C') {
      // Payment completed
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.rrn = kotakResponse.rrn || kotakResponse.RRN;
      await payment.save();

      // Trigger subscription activation (will be handled by verification service)
      paymentVerificationService.handlePaymentSuccess(payment, kotakResponse);

      return res.status(200).json({
        success: true,
        verified: true,
        status: 'completed',
        message: 'Payment verified successfully'
      });
    } else if (kotakResponse.status === 'F' || kotakResponse.status === 'R') {
      // Payment failed or rejected
      payment.status = 'failed';
      await payment.save();

      return res.status(200).json({
        success: true,
        verified: false,
        status: 'failed',
        message: kotakResponse.message || 'Payment failed'
      });
    } else {
      // Payment still pending
      await payment.save();

      return res.status(200).json({
        success: true,
        verified: false,
        status: 'pending',
        message: 'Payment is still pending'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // Log error with context
    kotakErrorHandler.logError('Verify Payment', error, {
      paymentId: req.params?.paymentId,
      doctorId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
      errorCode: 'VERIFY_ERROR',
      recommendedAction: 'Please try again or contact support if the issue persists.'
    });
  }
};
