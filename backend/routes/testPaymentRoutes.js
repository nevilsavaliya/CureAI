/**
 * Test Payment Routes
 * Mock payment endpoints for development/testing
 * 
 * WARNING: These are for development only!
 * Replace with actual payment gateway integration in production
 */

const express = require('express');
const router = express.Router();
const testPaymentController = require('../controllers/testPaymentController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/test-payment/status
 * @desc    Get subscription status for current user (mock)
 * @access  Private
 */
router.get('/status', authenticate, testPaymentController.getTestPaymentStatus);

/**
 * @route   POST /api/test-payment/simulate
 * @desc    Simulate payment processing (mock)
 * @access  Private (Doctor only)
 */
router.post('/simulate', authenticate, testPaymentController.simulateTestPayment);

/**
 * @route   GET /api/test-payment/history
 * @desc    Get payment history (mock)
 * @access  Private (Doctor only)
 */
router.get('/history', authenticate, testPaymentController.getPaymentHistory);

module.exports = router;
