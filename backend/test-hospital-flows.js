const axios = require('axios');
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');

const API_URL = 'http://localhost:3000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function logSubSection(title) {
  console.log('\n' + '-'.repeat(70));
  log(title, 'magenta');
  console.log('-'.repeat(70));
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

function logInfo(message) {
  console.log(`   ${message}`);
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, passed, message = '') {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function setupTestHospital() {
  logSubSection('Setting up test hospital');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    
    // Check for existing verified hospital
    let hospital = await Hospital.findOne({ 
      email: 'hospital@test.com',
      verificationStatus: 'verified'
    });
    
    if (!hospital) {
      logWarning('No verified test hospital found. Creating one...');
      
      hospital = new Hospital({
        name: 'Test Hospital Admin',
        email: 'hospital@test.com',
        password: 'hospital123',
        hospitalName: 'Test General Hospital',
        registrationNumber: 'TEST-HOSP-001',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contactNumber: '+1234567890',
        emergencyContact: '+1234567891',
        website: 'https://testhospital.com',
        specializations: ['General Medicine', 'Emergency Care', 'Cardiology'],
        numberOfBeds: 100,
        facilities: ['ICU', 'Emergency Room', 'Laboratory', 'Radiology'],
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        isActive: true,
        apiAccessCount: 0
      });
      
      // Generate API credentials
      hospital.generateApiCredentials();
      
      await hospital.save();
      logSuccess('Test hospital created and verified');
    } else {
      logSuccess('Found existing verified test hospital');
    }
    
    logInfo(`Email: ${hospital.email}`);
    logInfo(`Hospital Name: ${hospital.hospitalName}`);
    logInfo(`Verification Status: ${hospital.verificationStatus}`);
    
    await mongoose.disconnect();
    
    return {
      email: hospital.email,
      password: 'hospital123'
    };
    
  } catch (error) {
    logError(`Failed to setup test hospital: ${error.message}`);
    throw error;
  }
}

async function testTask6_1_HospitalDashboardAccess(credentials) {
  logSubSection('Task 6.1: Test Hospital Dashboard Access');
  
  try {
    // Test 1: Login as hospital admin
    logTest('Login as hospital admin');
    
    const loginResponse = await axios.post(`${API_URL}/hospitals/login`, {
      email: credentials.email,
      password: credentials.password
    });
    
    // Verify response format
    if (!loginResponse.data.success) {
      logError('Login failed - success is false');
      recordTest('Hospital Login', false, 'success field is false');
      return null;
    }
    
    if (!loginResponse.data.token) {
      logError('Login response missing token');
      recordTest('Hospital Login', false, 'Missing token');
      return null;
    }
    
    if (!loginResponse.data.hospital) {
      logError('Login response missing hospital object');
      recordTest('Hospital Login', false, 'Missing hospital object');
      return null;
    }
    
    logSuccess('Hospital login successful');
    logInfo(`Token received: ${loginResponse.data.token.substring(0, 20)}...`);
    logInfo(`Hospital ID: ${loginResponse.data.hospital.id}`);
    logInfo(`Hospital Name: ${loginResponse.data.hospital.hospitalName}`);
    recordTest('Hospital Login', true);
    
    const token = loginResponse.data.token;
    
    // Test 2: Verify redirect to hospital dashboard (check profile access)
    logTest('Verify redirect to hospital dashboard');
    
    const profileResponse = await axios.get(`${API_URL}/hospitals/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!profileResponse.data.success) {
      logError('Profile access failed - success is false');
      recordTest('Dashboard Access', false, 'success field is false');
      return null;
    }
    
    if (!profileResponse.data.hospital) {
      logError('Profile response missing hospital data');
      recordTest('Dashboard Access', false, 'Missing hospital data');
      return null;
    }
    
    logSuccess('Hospital dashboard accessible');
    recordTest('Dashboard Access', true);
    
    // Test 3: Check profile information displays
    logTest('Check profile information displays');
    
    const hospital = profileResponse.data.hospital;
    const requiredFields = [
      'id', 'name', 'email', 'hospitalName', 'registrationNumber',
      'address', 'contactNumber', 'verificationStatus'
    ];
    
    const missingFields = requiredFields.filter(field => !hospital[field]);
    
    if (missingFields.length > 0) {
      logError(`Profile missing required fields: ${missingFields.join(', ')}`);
      recordTest('Profile Information', false, `Missing fields: ${missingFields.join(', ')}`);
    } else {
      logSuccess('All required profile fields present');
      logInfo(`Hospital Name: ${hospital.hospitalName}`);
      logInfo(`Registration Number: ${hospital.registrationNumber}`);
      logInfo(`Contact: ${hospital.contactNumber}`);
      logInfo(`Verification Status: ${hospital.verificationStatus}`);
      logInfo(`Address: ${hospital.address.city}, ${hospital.address.state}`);
      recordTest('Profile Information', true);
    }
    
    // Test 4: Verify response format
    logTest('Verify response format');
    
    const responseFormat = {
      hasSuccess: typeof profileResponse.data.success === 'boolean',
      hasHospital: typeof profileResponse.data.hospital === 'object',
      hospitalHasId: !!hospital.id,
      hospitalHasName: !!hospital.hospitalName,
      hospitalHasEmail: !!hospital.email
    };
    
    const formatValid = Object.values(responseFormat).every(v => v === true);
    
    if (formatValid) {
      logSuccess('Response format is correct');
      recordTest('Response Format', true);
    } else {
      logError('Response format has issues');
      logInfo(JSON.stringify(responseFormat, null, 2));
      recordTest('Response Format', false, 'Format validation failed');
    }
    
    return token;
    
  } catch (error) {
    logError(`Task 6.1 failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      logInfo('Error details: ' + JSON.stringify(error.response.data, null, 2));
    }
    recordTest('Hospital Dashboard Access', false, error.message);
    return null;
  }
}

async function testTask6_2_APIUsageStatistics(token) {
  logSubSection('Task 6.2: Test Viewing API Usage Statistics');
  
  if (!token) {
    logError('No token available - skipping Task 6.2');
    recordTest('API Usage Statistics', false, 'No token available');
    return;
  }
  
  try {
    // Test 1: Navigate to API usage section
    logTest('Navigate to API usage section');
    
    const statsResponse = await axios.get(`${API_URL}/hospitals/api/usage-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!statsResponse.data.success) {
      logError('API stats request failed - success is false');
      recordTest('API Stats Access', false, 'success field is false');
      return;
    }
    
    logSuccess('API usage statistics endpoint accessible');
    recordTest('API Stats Access', true);
    
    // Test 2: Verify statistics display correctly
    logTest('Verify statistics display correctly');
    
    const stats = statsResponse.data.stats;
    
    if (!stats) {
      logError('Response missing stats object');
      recordTest('Stats Display', false, 'Missing stats object');
      return;
    }
    
    const expectedFields = [
      'totalRequests', 'requestsToday', 'requestsThisWeek', 'requestsThisMonth',
      'averageResponseTime', 'successRate', 'remainingRequests', 'rateLimit'
    ];
    
    const missingFields = expectedFields.filter(field => stats[field] === undefined);
    
    if (missingFields.length > 0) {
      logError(`Stats missing fields: ${missingFields.join(', ')}`);
      recordTest('Stats Display', false, `Missing fields: ${missingFields.join(', ')}`);
    } else {
      logSuccess('All expected statistics fields present');
      logInfo(`Total Requests: ${stats.totalRequests}`);
      logInfo(`Requests Today: ${stats.requestsToday}`);
      logInfo(`Requests This Week: ${stats.requestsThisWeek}`);
      logInfo(`Requests This Month: ${stats.requestsThisMonth}`);
      logInfo(`Average Response Time: ${stats.averageResponseTime}ms`);
      logInfo(`Success Rate: ${stats.successRate}%`);
      logInfo(`Remaining Requests: ${stats.remainingRequests}`);
      logInfo(`Rate Limit: ${stats.rateLimit}`);
      recordTest('Stats Display', true);
    }
    
    // Test 3: Check response format
    logTest('Check response format');
    
    const formatValid = 
      typeof statsResponse.data.success === 'boolean' &&
      typeof statsResponse.data.message === 'string' &&
      typeof stats === 'object' &&
      typeof stats.totalRequests === 'number' &&
      typeof stats.successRate === 'number';
    
    if (formatValid) {
      logSuccess('Response format is correct');
      recordTest('Stats Response Format', true);
    } else {
      logError('Response format has issues');
      recordTest('Stats Response Format', false, 'Format validation failed');
    }
    
    // Test 4: Test recent requests endpoint
    logTest('Test recent API requests endpoint');
    
    try {
      const recentResponse = await axios.get(`${API_URL}/hospitals/api/recent-requests?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (recentResponse.data.success) {
        logSuccess('Recent requests endpoint accessible');
        logInfo(`Requests returned: ${recentResponse.data.requests?.length || 0}`);
        
        if (recentResponse.data.pagination) {
          logInfo(`Pagination: Page ${recentResponse.data.pagination.currentPage} of ${recentResponse.data.pagination.totalPages}`);
        }
        
        recordTest('Recent Requests Endpoint', true);
      } else {
        logWarning('Recent requests endpoint returned success: false');
        recordTest('Recent Requests Endpoint', false, 'success field is false');
      }
    } catch (error) {
      logWarning(`Recent requests endpoint error: ${error.response?.data?.message || error.message}`);
      recordTest('Recent Requests Endpoint', false, error.message);
    }
    
  } catch (error) {
    logError(`Task 6.2 failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      logInfo('Error details: ' + JSON.stringify(error.response.data, null, 2));
    }
    recordTest('API Usage Statistics', false, error.message);
  }
}

async function testTask6_3_HospitalErrorHandling(credentials) {
  logSubSection('Task 6.3: Test Hospital Error Handling');
  
  try {
    // Test 1: Test with expired/invalid token
    logTest('Test with expired/invalid token');
    
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJyb2xlIjoiaG9zcGl0YWwiLCJpYXQiOjE1MTYyMzkwMjJ9.invalid';
    
    try {
      await axios.get(`${API_URL}/hospitals/profile`, {
        headers: { Authorization: `Bearer ${invalidToken}` }
      });
      
      logError('Invalid token was accepted (should have been rejected)');
      recordTest('Invalid Token Handling', false, 'Invalid token accepted');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logSuccess('Invalid token correctly rejected');
        logInfo(`Status: ${error.response.status}`);
        logInfo(`Message: ${error.response.data.message}`);
        recordTest('Invalid Token Handling', true);
      } else {
        logError(`Unexpected error status: ${error.response?.status}`);
        recordTest('Invalid Token Handling', false, `Unexpected status: ${error.response?.status}`);
      }
    }
    
    // Test 2: Test with invalid credentials
    logTest('Test with invalid credentials');
    
    try {
      await axios.post(`${API_URL}/hospitals/login`, {
        email: 'nonexistent@hospital.com',
        password: 'wrongpassword'
      });
      
      logError('Invalid credentials were accepted (should have been rejected)');
      recordTest('Invalid Credentials Handling', false, 'Invalid credentials accepted');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Invalid credentials correctly rejected');
        logInfo(`Status: ${error.response.status}`);
        logInfo(`Message: ${error.response.data.message}`);
        
        // Verify error message is user-friendly
        if (error.response.data.message && error.response.data.message.length > 0) {
          logSuccess('Error message is present and user-friendly');
          recordTest('Invalid Credentials Handling', true);
        } else {
          logWarning('Error message is missing or empty');
          recordTest('Invalid Credentials Handling', false, 'Missing error message');
        }
      } else {
        logError(`Unexpected error status: ${error.response?.status}`);
        recordTest('Invalid Credentials Handling', false, `Unexpected status: ${error.response?.status}`);
      }
    }
    
    // Test 3: Test with missing required fields
    logTest('Test with missing required fields');
    
    try {
      await axios.post(`${API_URL}/hospitals/login`, {
        email: 'hospital@test.com'
        // Missing password
      });
      
      logError('Request with missing fields was accepted');
      recordTest('Missing Fields Handling', false, 'Missing fields accepted');
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Missing fields correctly rejected');
        logInfo(`Status: ${error.response.status}`);
        logInfo(`Message: ${error.response.data.message}`);
        recordTest('Missing Fields Handling', true);
      } else {
        logError(`Unexpected error status: ${error.response?.status}`);
        recordTest('Missing Fields Handling', false, `Unexpected status: ${error.response?.status}`);
      }
    }
    
    // Test 4: Test unverified hospital login
    logTest('Test unverified hospital login');
    
    try {
      await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
      
      // Create an unverified hospital
      let unverifiedHospital = await Hospital.findOne({ 
        email: 'unverified@hospital.com'
      });
      
      if (!unverifiedHospital) {
        unverifiedHospital = new Hospital({
          name: 'Unverified Hospital Admin',
          email: 'unverified@hospital.com',
          password: 'hospital123',
          hospitalName: 'Unverified Hospital',
          registrationNumber: 'TEST-UNVERIFIED-001',
          address: {
            street: '456 Test Street',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
          },
          contactNumber: '+1234567890',
          verificationStatus: 'pending',
          isActive: true
        });
        
        await unverifiedHospital.save();
        logInfo('Created unverified test hospital');
      }
      
      await mongoose.disconnect();
      
      // Try to login with unverified hospital
      try {
        await axios.post(`${API_URL}/hospitals/login`, {
          email: 'unverified@hospital.com',
          password: 'hospital123'
        });
        
        logError('Unverified hospital was allowed to login');
        recordTest('Unverified Hospital Handling', false, 'Unverified hospital allowed');
      } catch (error) {
        if (error.response?.status === 403) {
          logSuccess('Unverified hospital correctly blocked from login');
          logInfo(`Status: ${error.response.status}`);
          logInfo(`Message: ${error.response.data.message}`);
          
          // Verify the message mentions verification status
          if (error.response.data.message.toLowerCase().includes('pending') || 
              error.response.data.message.toLowerCase().includes('verif')) {
            logSuccess('Error message correctly mentions verification status');
            recordTest('Unverified Hospital Handling', true);
          } else {
            logWarning('Error message does not mention verification status');
            recordTest('Unverified Hospital Handling', false, 'Message unclear about verification');
          }
        } else {
          logError(`Unexpected error status: ${error.response?.status}`);
          recordTest('Unverified Hospital Handling', false, `Unexpected status: ${error.response?.status}`);
        }
      }
    } catch (error) {
      logError(`Failed to test unverified hospital: ${error.message}`);
      recordTest('Unverified Hospital Handling', false, error.message);
    }
    
    // Test 5: Test accessing protected route without token
    logTest('Test accessing protected route without token');
    
    try {
      await axios.get(`${API_URL}/hospitals/profile`);
      
      logError('Protected route accessible without token');
      recordTest('No Token Handling', false, 'Protected route accessible without token');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Protected route correctly requires authentication');
        logInfo(`Status: ${error.response.status}`);
        logInfo(`Message: ${error.response.data.message}`);
        recordTest('No Token Handling', true);
      } else {
        logError(`Unexpected error status: ${error.response?.status}`);
        recordTest('No Token Handling', false, `Unexpected status: ${error.response?.status}`);
      }
    }
    
  } catch (error) {
    logError(`Task 6.3 failed: ${error.message}`);
    recordTest('Hospital Error Handling', false, error.message);
  }
}

function printTestSummary() {
  logSection('TEST SUMMARY');
  
  console.log('\n📊 Overall Results:');
  logSuccess(`Passed: ${testResults.passed}`);
  logError(`Failed: ${testResults.failed}`);
  logWarning(`Warnings: ${testResults.warnings}`);
  
  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`\n📈 Pass Rate: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        logError(`  - ${t.name}${t.message ? ': ' + t.message : ''}`);
      });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (testResults.failed === 0) {
    logSuccess('✨ All tests passed! Hospital flows are working correctly.');
    return 0;
  } else {
    logError(`⚠️  ${testResults.failed} test(s) failed. Please review the issues above.`);
    return 1;
  }
}

async function runAllTests() {
  logSection('TASK 6: TEST AND VERIFY HOSPITAL FLOWS');
  
  console.log('\nThis test suite will verify:');
  console.log('  • Task 6.1: Hospital dashboard access');
  console.log('  • Task 6.2: API usage statistics');
  console.log('  • Task 6.3: Hospital error handling');
  console.log('');
  
  try {
    // Setup
    const credentials = await setupTestHospital();
    
    // Run tests
    const token = await testTask6_1_HospitalDashboardAccess(credentials);
    await testTask6_2_APIUsageStatistics(token);
    await testTask6_3_HospitalErrorHandling(credentials);
    
    // Print summary
    const exitCode = printTestSummary();
    process.exit(exitCode);
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runAllTests();
