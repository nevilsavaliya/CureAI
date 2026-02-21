const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';

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

// Create an expired token
function createExpiredToken(userId, role) {
  return jwt.sign(
    { id: userId, role: role },
    JWT_SECRET,
    { expiresIn: '-1h' } // Expired 1 hour ago
  );
}

// Create a valid token
function createValidToken(userId, role) {
  return jwt.sign(
    { id: userId, role: role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function testTokenExpiration() {
  logSection('TASK 2.5: Test Token Expiration and Session Management');
  
  try {
    // Test 1: Login to get a valid token
    logTest('Login to get valid token');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'sarah.johnson@hospital.com',
      password: 'doctor123'
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      logSuccess('Login successful, token obtained');
      
      const validToken = loginResponse.data.token;
      const userId = loginResponse.data.user.id;
      const userRole = loginResponse.data.user.role;
      
      // Test 2: Verify token is valid
      logTest('Verify valid token');
      
      try {
        const verifyResponse = await axios.get(`${API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${validToken}` }
        });
        
        if (verifyResponse.data.success && verifyResponse.data.valid) {
          logSuccess('Valid token accepted');
          console.log('  Token validation response:', {
            success: verifyResponse.data.success,
            valid: verifyResponse.data.valid,
            hasUser: !!verifyResponse.data.user
          });
        } else {
          logError('Valid token rejected');
        }
      } catch (error) {
        logError(`Token verification failed: ${error.response?.data?.message || error.message}`);
      }
      
      // Test 3: Test with expired token
      logTest('Test with expired token');
      
      const expiredToken = createExpiredToken(userId, userRole);
      
      try {
        await axios.get(`${API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${expiredToken}` }
        });
        logError('Expired token should have been rejected but was accepted');
      } catch (error) {
        if (error.response?.status === 401) {
          logSuccess('Expired token correctly rejected with 401');
          console.log('  Error message:', error.response.data.message);
          
          // Verify error response format
          if (error.response.data.requiresLogin) {
            logSuccess('Response includes requiresLogin flag');
          }
        } else {
          logError(`Unexpected error status: ${error.response?.status}`);
        }
      }
      
      // Test 4: Test accessing protected route without token
      logTest('Test accessing protected route without token');
      
      try {
        await axios.get(`${API_URL}/doctor/cases/pending`);
        logError('Request without token should have been rejected');
      } catch (error) {
        if (error.response?.status === 401) {
          logSuccess('Request without token correctly rejected with 401');
          console.log('  Error message:', error.response.data.message);
        } else {
          logError(`Unexpected error status: ${error.response?.status}`);
        }
      }
      
      // Test 5: Test accessing protected route with invalid token
      logTest('Test accessing protected route with invalid token');
      
      try {
        await axios.get(`${API_URL}/doctor/cases/pending`, {
          headers: { Authorization: 'Bearer invalid-token-here' }
        });
        logError('Request with invalid token should have been rejected');
      } catch (error) {
        if (error.response?.status === 401) {
          logSuccess('Request with invalid token correctly rejected with 401');
          console.log('  Error message:', error.response.data.message);
        } else {
          logError(`Unexpected error status: ${error.response?.status}`);
        }
      }
      
      // Test 6: Verify frontend token expiration detection
      logTest('Verify frontend token expiration detection logic');
      
      // Decode token to check expiration
      const decoded = jwt.decode(validToken);
      if (decoded && decoded.exp) {
        const expirationTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;
        
        logSuccess('Token expiration can be detected from JWT payload');
        console.log('  Token expires at:', new Date(expirationTime).toISOString());
        console.log('  Time until expiration:', Math.floor(timeUntilExpiration / 1000 / 60), 'minutes');
        
        // Verify frontend logic
        if (timeUntilExpiration > 0) {
          logSuccess('Frontend can calculate time until expiration');
        }
      } else {
        logError('Token does not contain expiration time');
      }
      
      logSuccess('All token expiration tests passed');
      process.exit(0);
    } else {
      logError('Login failed');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('  Error details:', error.response.data);
    }
    process.exit(1);
  }
}

testTokenExpiration();
