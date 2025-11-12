const express = require('express');
const router = express.Router();
const kotakPaymentController = require('../controllers/kotakPaymentController');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/payments/initiate - Initiate UPI payment (doctor only, with rate limiting)
router.post(
  '/payments/initiate',
  authenticate,
  authorize('doctor'),
  kotakPaymentController.rateLimitPaymentInitiation,
  kotakPaymentController.initiatePayment
);

// GET /api/payments/:paymentId/status - Get payment status (authenticated users)
router.get(
  '/payments/:paymentId/status',
  authenticate,
  kotakPaymentController.getPaymentStatus
);

// POST /api/payments/:paymentId/verify - Manually verify payment (authenticated users)
router.post(
  '/payments/:paymentId/verify',
  authenticate,
  kotakPaymentController.verifyPayment
);

module.exports = router;
