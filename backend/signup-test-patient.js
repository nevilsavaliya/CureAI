const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function signupPatient() {
  try {
    // Step 1: Send verification OTP
    console.log('Step 1: Sending verification OTP...');
    const otpResponse = await axios.post(`${API_URL}/auth/send-verification-otp`, {
      email: 'testpatient@example.com'
    });
    
    console.log('OTP Response:', otpResponse.data);
    
    // For testing, we'll need to get the OTP from the database or logs
    // In a real scenario, the user would receive this via email
    console.log('\n⚠️  Check the server logs or database for the OTP code');
    console.log('Then run the signup with the OTP');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

signupPatient();
