/**
 * Email Verification Controller
 * Handles email verification during signup
 */

const emailVerificationService = require('../services/emailVerificationService');
const authService = require('../services/authService');

// Send OTP for email verification
exports.sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email already exists
    const existingUser = await authService.checkEmailExists(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered. Please login instead.'
      });
    }

    // Send OTP
    const sent = await emailVerificationService.sendVerificationOTP(email, 'signup');

    if (sent) {
      res.status(200).json({
        success: true,
        message: 'Verification OTP sent to your email. Please check your inbox.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Verify OTP
    const isValid = await emailVerificationService.verifyOTP(email, otp, 'signup');

    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now complete your registration.'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Resend OTP
    const sent = await emailVerificationService.resendOTP(email, 'signup');

    if (sent) {
      res.status(200).json({
        success: true,
        message: 'New OTP sent to your email'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
