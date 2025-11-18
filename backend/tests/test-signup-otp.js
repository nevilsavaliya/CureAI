/**
 * Test Signup OTP Flow
 */

require('dotenv').config();
const mongoose = require('mongoose');
const emailVerificationService = require('../services/emailVerificationService');

async function testSignupOTP() {
  try {
    console.log('='.repeat(60));
    console.log('Testing Signup OTP Flow');
    console.log('='.repeat(60));
    console.log();

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform');
    console.log('✓ Connected to database');
    console.log();

    // Test email
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    
    console.log('Sending OTP to:', testEmail);
    console.log('-'.repeat(60));
    
    // Send OTP
    const sent = await emailVerificationService.sendVerificationOTP(testEmail, 'signup');
    
    if (sent) {
      console.log('✓ OTP sent successfully!');
      console.log();
      console.log('Check your email:', testEmail);
      console.log('You should receive a 6-digit OTP');
      console.log();
      console.log('To test verification, run:');
      console.log(`node -e "
        require('dotenv').config();
        const mongoose = require('mongoose');
        const emailVerificationService = require('./services/emailVerificationService');
        mongoose.connect(process.env.MONGODB_URI).then(async () => {
          const result = await emailVerificationService.verifyOTP('${testEmail}', 'YOUR_OTP_HERE', 'signup');
          console.log('Verification result:', result);
          process.exit(0);
        });
      "`);
    } else {
      console.log('✗ Failed to send OTP');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log();
    console.log('Database connection closed');
  }
}

testSignupOTP();
