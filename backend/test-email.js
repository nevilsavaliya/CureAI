require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Testing email configuration...\n');
  
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Password:', process.env.EMAIL_PASSWORD ? '***configured***' : 'NOT SET');
  console.log('\n');
  
  // Test sending OTP
  const testEmail = process.env.EMAIL_USER; // Send to self for testing
  const testOTP = '123456';
  
  console.log(`📧 Sending test OTP to ${testEmail}...`);
  
  try {
    const result = await emailService.sendOTP(testEmail, testOTP);
    
    if (result) {
      console.log('\n✅ SUCCESS! Email sent successfully.');
      console.log('Check your inbox for the OTP email.');
    } else {
      console.log('\n❌ FAILED! Email was not sent.');
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

testEmail();
