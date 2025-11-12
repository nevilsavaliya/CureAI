const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate, authorize } = require('../middleware/auth');

// Create payment order for subscription (doctor only)
router.post('/payment/subscription/create-order', authenticate, authorize('doctor'), subscriptionController.createPaymentOrder);

// Verify payment and activate subscription (doctor only)
router.post('/payment/subscription/verify', authenticate, authorize('doctor'), subscriptionController.verifyPayment);

// Get subscription status
router.get('/subscriptions/:doctorId', authenticate, subscriptionController.getSubscription);

// TEST MODE: Activate subscription without payment (development only)
router.post('/payment/subscription/activate-test', authenticate, authorize('doctor'), subscriptionController.activateSubscriptionTest);

module.exports = router;
