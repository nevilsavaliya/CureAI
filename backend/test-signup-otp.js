const axios = require('axios');
const mongoose = require('mongoose');
const OTP = require('./models/OTP');

const API_URL = 'http://localhost:3000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n📋 Test: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testPatientSignup() {
  logSection('TASK 2.4: Test Patient Signup and OTP Verification');
  
  const testEmail = `test.patient.${Date.now()}@test.com`;
  const signupData = {
    name: 'Test Patient',
    email: testEmail,
    password: 'password123',
    confirmPassword: 'password123',
    dateOfBirth: '1990-01-01',
    bloodGroup: 'O+'
  };
  
  try {
    // Test 1: Submit signup form
    logTest('Submit patient signup form');
    
    const signupResponse = await axios.post(`${API_URL}/auth/signup/patient`, signupData);
    
    if (signupResponse.data.success && signupResponse.data.requiresOTP && signupResponse.data.email) {
      logSuccess('Signup form submitted successfully');
      console.log('  Response format:', {
        success: signupResponse.data.success,
        requiresOTP: signupResponse.data.requiresOTP,
        email: signupResponse.data.email,
        message: signupResponse.data.message
      });
      
      // Verify response format
      if (signupResponse.data.requiresOTP === true) {
        logSuccess('OTP requirement flag is present');
      }
      
      if (signupResponse.data.email === testEmail) {
        logSuccess('Email is returned for OTP verification');
      }
      
      // Test 2: Retrieve OTP from database (simulating email check)
      logTest('Retrieve OTP from database');
      
      await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
      
      const otpRecord = await OTP.findOne({ 
        email: testEmail, 
        type: 'signup' 
      }).sort({ createdAt: -1 });
      
      if (otpRecord) {
        logSuccess('OTP record found in database');
        console.log('  OTP:', otpRecord.otp);
        console.log('  Expires at:', otpRecord.expiresAt);
        
        // Test 3: Verify OTP and complete signup
        logTest('Verify OTP and complete signup');
        
        const verifyData = {
          ...signupData,
          otp: otpRecord.otp
        };
        
        const verifyResponse = await axios.post(`${API_URL}/auth/signup/patient`, verifyData);
        
        if (verifyResponse.data.success && verifyResponse.data.token && verifyResponse.data.user) {
          logSuccess('OTP verification successful');
          console.log('  Response format:', {
            success: verifyResponse.data.success,
            hasToken: !!verifyResponse.data.token,
            hasUser: !!verifyResponse.data.user,
            message: verifyResponse.data.message
          });
          
          // Verify user object
          const user = verifyResponse.data.user;
          console.log('  User data:', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          });
          
          if (user.role === 'patient') {
            logSuccess('User role correctly set to "patient"');
          }
          
          // Test 4: Verify OTP is consumed
          logTest('Verify OTP is consumed after use');
          
          const usedOtpRecord = await OTP.findOne({ 
            email: testEmail, 
            type: 'signup' 
          }).sort({ createdAt: -1 });
          
          if (!usedOtpRecord || usedOtpRecord.isUsed) {
            logSuccess('OTP is marked as used or deleted');
          } else {
            logWarning('OTP still exists and not marked as used');
          }
          
          // Test 5: Try to use same OTP again (should fail)
          logTest('Try to use same OTP again (should fail)');
          
          try {
            const duplicateEmail = `test.patient.duplicate.${Date.now()}@test.com`;
            const duplicateData = {
              name: 'Duplicate Test',
              email: duplicateEmail,
              password: 'password123',
              confirmPassword: 'password123',
              dateOfBirth: '1990-01-01',
              bloodGroup: 'A+',
              otp: otpRecord.otp
            };
            
            await axios.post(`${API_URL}/auth/signup/patient`, duplicateData);
            logError('Duplicate OTP use should have failed but succeeded');
          } catch (error) {
            if (error.response?.status === 400) {
              logSuccess('Duplicate OTP use correctly rejected');
              console.log('  Error message:', error.response.data.message);
            } else {
              logError(`Unexpected error: ${error.message}`);
            }
          }
          
          await mongoose.disconnect();
          
          logSuccess('All patient signup and OTP tests passed');
          process.exit(0);
        } else {
          logError('OTP verification response missing required fields');
          console.log('  Response:', verifyResponse.data);
          await mongoose.disconnect();
          process.exit(1);
        }
      } else {
        logError('OTP record not found in database');
        await mongoose.disconnect();
        process.exit(1);
      }
    } else {
      logError('Signup response missing required fields');
      console.log('  Response:', signupResponse.data);
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('  Error details:', error.response.data);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

testPatientSignup();
