#!/usr/bin/env node

/**
 * Test Authentication Service Improvements
 * 
 * This script tests the authentication service improvements:
 * 1. Response parsing in AuthService
 * 2. Error handling in authentication
 * 3. 401 error handling and redirect
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// ANSI color codes
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

async function testValidLogin() {
  logTest('Valid Patient Login - Response Format');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'patient@test.com',
      password: 'password123'
    });

    // Check response format
    if (response.data.success === true) {
      logSuccess('Response has success field: true');
    } else {
      logError('Response missing success field or not true');
    }

    if (response.data.token) {
      logSuccess('Response has token field');
    } else {
      logError('Response missing token field');
    }

    if (response.data.user) {
      logSuccess('Response has user field');
      console.log('   User:', JSON.stringify(response.data.user, null, 2));
    } else {
      logError('Response missing user field');
    }

    if (response.data.message) {
      logSuccess(`Response has message: "${response.data.message}"`);
    }

    return { success: true, token: response.data.token };
  } catch (error) {
    logError(`Login failed: ${error.message}`);
    if (error.response) {
      console.log('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false };
  }
}

async function testInvalidLogin() {
  logTest('Invalid Login - Error Handling');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'nonexistent@test.com',
      password: 'wrongpassword'
    });

    logError('Should have thrown an error for invalid credentials');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess('Received 401 Unauthorized status');
      
      if (error.response.data.success === false) {
        logSuccess('Error response has success: false');
      }

      if (error.response.data.message) {
        logSuccess(`Error message: "${error.response.data.message}"`);
      } else {
        logWarning('Error response missing message field');
      }

      return true;
    } else {
      logError(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function testExpiredToken() {
  logTest('Expired Token - 401 Handling');
  
  // Use an obviously expired/invalid token
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
  
  try {
    const response = await axios.get(`${API_URL}/cases`, {
      headers: {
        'Authorization': `Bearer ${invalidToken}`
      }
    });

    logError('Should have thrown an error for invalid token');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess('Received 401 Unauthorized for invalid token');
      
      if (error.response.data.message) {
        logSuccess(`Error message: "${error.response.data.message}"`);
      }

      return true;
    } else {
      logError(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function testMissingToken() {
  logTest('Missing Token - 401 Handling');
  
  try {
    const response = await axios.get(`${API_URL}/cases`);

    logError('Should have thrown an error for missing token');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess('Received 401 Unauthorized for missing token');
      
      if (error.response.data.message) {
        logSuccess(`Error message: "${error.response.data.message}"`);
      }

      return true;
    } else {
      logError(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function testValidationError() {
  logTest('Validation Error - 400 Handling');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'invalid-email',
      password: '123' // Too short
    });

    logError('Should have thrown an error for invalid data');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('Received 400 Bad Request for validation error');
      
      if (error.response.data.message) {
        logSuccess(`Error message: "${error.response.data.message}"`);
      }

      if (error.response.data.errors) {
        logSuccess('Error response includes validation errors array');
        console.log('   Errors:', JSON.stringify(error.response.data.errors, null, 2));
      }

      return true;
    } else {
      logWarning(`Received status ${error.response?.status} instead of 400`);
      if (error.response) {
        console.log('   Response:', JSON.stringify(error.response.data, null, 2));
      }
      return false;
    }
  }
}

async function testNetworkError() {
  logTest('Network Error - Connection Handling');
  
  try {
    // Try to connect to a non-existent server
    const response = await axios.post('http://localhost:9999/api/auth/login', {
      email: 'test@test.com',
      password: 'password123'
    }, {
      timeout: 2000
    });

    logError('Should have thrown a network error');
    return false;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logSuccess('Network error detected correctly');
      logSuccess(`Error code: ${error.code}`);
      return true;
    } else {
      logWarning(`Unexpected error code: ${error.code}`);
      return false;
    }
  }
}

async function runTests() {
  logSection('Authentication Service Improvements Test Suite');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test 1: Valid Login
  results.total++;
  const test1 = await testValidLogin();
  if (test1.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2: Invalid Login
  results.total++;
  const test2 = await testInvalidLogin();
  if (test2) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3: Expired Token
  results.total++;
  const test3 = await testExpiredToken();
  if (test3) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Missing Token
  results.total++;
  const test4 = await testMissingToken();
  if (test4) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Validation Error
  results.total++;
  const test5 = await testValidationError();
  if (test5) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 6: Network Error
  results.total++;
  const test6 = await testNetworkError();
  if (test6) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  logSection('Test Summary');
  console.log(`Total Tests: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`\nPass Rate: ${passRate}%`);

  if (results.failed === 0) {
    logSuccess('\n🎉 All tests passed!');
  } else {
    logWarning('\n⚠️  Some tests failed. Please review the results above.');
  }
}

// Run tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
