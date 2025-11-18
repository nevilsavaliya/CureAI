const express = require('express');
const router = express.Router();
const testPaymentController = require('../controllers/testPaymentController');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/test-payment/simulate - Simulate payment completion (doctor only)
router.post(
  '/simulate',
  authenticate,
  authorize('doctor'),
  testPaymentController.simulatePayment
);

// GET /api/test-payment/status - Get subscription status (doctor only)
router.get(
  '/status',
  authenticate,
  authorize('doctor'),
  testPaymentController.getSubscriptionStatus
);

// POST /api/test-payment/reset - Reset subscription for testing (doctor only)
router.post(
  '/reset',
  authenticate,
  authorize('doctor'),
  testPaymentController.resetSubscription
);

module.exports = router;