const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passwordResetController = require('../controllers/passwordResetController');

// Validation middleware
const validateEmail = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const validateOTP = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const validateResetPassword = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/request-otp', validateEmail, passwordResetController.requestOTP);
router.post('/verify-otp', validateOTP, passwordResetController.verifyOTP);
router.post('/reset-password', validateResetPassword, passwordResetController.resetPassword);

module.exports = router;
