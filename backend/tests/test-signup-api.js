/**
 * Test Signup API Flow
 * Simulates the complete signup process
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth';

async function testSignupFlow() {
  console.log('='.repeat(60));
  console.log('Testing Complete Signup API Flow');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Submit signup details (should send OTP)
    console.log('Step 1: Submitting signup details...');
    console.log('-'.repeat(60));
    
    const signupData = {
      name: 'Test Patient',
      email: 'test' + Date.now() + '@test.com',
      password: 'Test123!',
      confirmPassword: 'Test123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    };

    console.log('Signup data:', JSON.stringify(signupData, null, 2));
    console.log();

    const response1 = await axios.post(`${API_URL}/signup/patient`, signupData);
    
    console.log('Response Status:', response1.status);
    console.log('Response Data:', JSON.stringify(response1.data, null, 2));
    console.log();

    if (response1.data.requiresOTP) {
      console.log('✓ OTP required! Email sent to:', response1.data.email);
      console.log();
      console.log('Step 2: Now you would:');
      console.log('  1. Check email for OTP');
      console.log('  2. Submit the same data with OTP field');
      console.log();
      console.log('Example:');
      console.log(`
      const response2 = await axios.post('${API_URL}/signup/patient', {
        ...signupData,
        otp: '123456' // OTP from email
      });
      `);
    } else if (response1.data.token) {
      console.log('✓ Account created directly (no OTP required)');
      console.log('Token:', response1.data.token);
    }

  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
    console.log();
    console.log('Full error:', error.response?.data);
  }

  console.log();
  console.log('='.repeat(60));
}

testSignupFlow();
