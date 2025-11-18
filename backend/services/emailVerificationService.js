/**
 * Email Verification Service
 * Handles OTP generation and verification for email confirmation during signup
 */

const OTP = require('../models/OTP');
const emailService = require('./emailService');

class EmailVerificationService {
  /**
   * Generate and send OTP for email verification
   * @param {String} email - User email
   * @param {String} purpose - 'signup' or 'password_reset'
   * @returns {Promise<Boolean>}
   */
  async sendVerificationOTP(email, purpose = 'signup') {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Delete any existing OTPs for this email
      await OTP.deleteMany({ email, purpose });
      
      // Save new OTP (expires in 10 minutes)
      const otpDoc = new OTP({
        email,
        otp,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      await otpDoc.save();
      
      // Send OTP via email (use signup template)
      const emailSent = await emailService.sendSignupOTP(email, otp);
      
      return emailSent;
    } catch (error) {
      console.error('Error sending verification OTP:', error);
      throw new Error('Failed to send verification OTP');
    }
  }

  /**
   * Verify OTP
   * @param {String} email - User email
   * @param {String} otp - OTP to verify
   * @param {String} purpose - 'signup' or 'password_reset'
   * @returns {Promise<Boolean>}
   */
  async verifyOTP(email, otp, purpose = 'signup') {
    try {
      // Find OTP
      const otpDoc = await OTP.findOne({
        email,
        otp,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpDoc) {
        throw new Error('Invalid or expired OTP');
      }

      // Mark OTP as used
      otpDoc.isUsed = true;
      await otpDoc.save();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if email is already verified
   * @param {String} email - User email
   * @returns {Promise<Boolean>}
   */
  async isEmailVerified(email) {
    // Check if there's a used OTP for this email
    const verifiedOTP = await OTP.findOne({
      email,
      purpose: 'signup',
      isUsed: true
    });

    return !!verifiedOTP;
  }

  /**
   * Resend OTP
   * @param {String} email - User email
   * @param {String} purpose - 'signup' or 'password_reset'
   * @returns {Promise<Boolean>}
   */
  async resendOTP(email, purpose = 'signup') {
    // Check if last OTP was sent less than 1 minute ago
    const recentOTP = await OTP.findOne({
      email,
      purpose,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });

    if (recentOTP) {
      throw new Error('Please wait 1 minute before requesting a new OTP');
    }

    return await this.sendVerificationOTP(email, purpose);
  }
}

module.exports = new EmailVerificationService();
