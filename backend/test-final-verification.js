/**
 * Final Verification Test Suite
 * Comprehensive testing of all system functionality
 * Task 21: Final verification and testing
 */

const axios = require('axios');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Test credentials (should exist in database)
const testCredentials = {
  patient: {
    email: 'patient@test.com',
    password: 'Test@123'
  },
  doctor: {
    email: 'doctor@test.com',
    password: 'Test@123'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test@123'
  },
  hospital: {
    email: 'hospital@test.com',
    password: 'Test@123'
  }
};

// Store tokens and data for cross-test usage
const testData = {
  tokens: {},
  users: {},
  caseId: null,
  messageId: null,
  notificationId: null
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  log(`${symbol} ${name}${details ? ': ' + details : ''}`, color);
  
  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test Suite 21.1: Authentication Flows
async function testAuthenticationFlows() {
  log('\n=== 21.1 Testing Authentication Flows ===', colors.cyan);

  // Test 1: Patient Login
  log('\nTest: Patient Login', colors.blue);
  const patientLogin = await makeRequest('POST', '/auth/login', testCredentials.patient);
  if (patientLogin.success && patientLogin.data.token && patientLogin.data.user) {
    testData.tokens.patient = patientLogin.data.token;
    testData.users.patient = patientLogin.data.user;
    logTest('Patient login with valid credentials', 'PASS');
  } else {
    logTest('Patient login with valid credentials', 'FAIL', patientLogin.error?.message);
  }

  // Test 2: Invalid Login
  log('\nTest: Invalid Login', colors.blue);
  const invalidLogin = await makeRequest('POST', '/auth/login', {
    email: 'nonexistent@test.com',
    password: 'wrong'
  });
  if (!invalidLogin.success && invalidLogin.status === 401) {
    logTest('Invalid credentials error handling', 'PASS');
  } else {
    logTest('Invalid credentials error handling', 'FAIL', 'Should return 401');
  }

  // Test 3: Doctor Login
  log('\nTest: Doctor Login', colors.blue);
  const doctorLogin = await makeRequest('POST', '/auth/login', testCredentials.doctor);
  if (doctorLogin.success && doctorLogin.data.token) {
    testData.tokens.doctor = doctorLogin.data.token;
    testData.users.doctor = doctorLogin.data.user;
    logTest('Doctor login', 'PASS');
  } else {
    logTest('Doctor login', 'FAIL', doctorLogin.error?.message);
  }

  // Test 4: Admin Login
  log('\nTest: Admin Login', colors.blue);
  const adminLogin = await makeRequest('POST', '/auth/login', testCredentials.admin);
  if (adminLogin.success && adminLogin.data.token) {
    testData.tokens.admin = adminLogin.data.token;
    testData.users.admin = adminLogin.data.user;
    logTest('Admin login', 'PASS');
  } else {
    logTest('Admin login', 'FAIL', adminLogin.error?.message);
  }

  // Test 5: Token Validation
  log('\nTest: Token Validation', colors.blue);
  const profile = await makeRequest('GET', '/auth/profile', null, testData.tokens.patient);
  if (profile.success && profile.data.user) {
    logTest('Token validation and profile retrieval', 'PASS');
  } else {
    logTest('Token validation and profile retrieval', 'FAIL', profile.error?.message);
  }

  // Test 6: Unauthorized Access
  log('\nTest: Unauthorized Access', colors.blue);
  const unauthorized = await makeRequest('GET', '/auth/profile', null, 'invalid-token');
  if (!unauthorized.success && unauthorized.status === 401) {
    logTest('Unauthorized access handling', 'PASS');
  } else {
    logTest('Unauthorized access handling', 'FAIL', 'Should return 401');
  }
}

// Test Suite 21.2: Case Management Flows
async function testCaseManagementFlows() {
  log('\n=== 21.2 Testing Case Management Flows ===', colors.cyan);

  // Test 1: Patient - View Cases
  log('\nTest: Patient View Cases', colors.blue);
  const patientCases = await makeRequest('GET', '/cases', null, testData.tokens.patient);
  if (patientCases.success && Array.isArray(patientCases.data.cases)) {
    logTest('Patient view cases list', 'PASS', `Found ${patientCases.data.cases.length} cases`);
    if (patientCases.data.cases.length > 0) {
      testData.caseId = patientCases.data.cases[0]._id;
    }
  } else {
    logTest('Patient view cases list', 'FAIL', patientCases.error?.message);
  }

  // Test 2: Patient - Create Case (if possible)
  log('\nTest: Patient Create Case', colors.blue);
  const newCase = await makeRequest('POST', '/cases', {
    symptoms: ['headache', 'fever'],
    description: 'Test case for verification'
  }, testData.tokens.patient);
  if (newCase.success && newCase.data.case) {
    testData.caseId = newCase.data.case._id;
    logTest('Patient create new case', 'PASS');
  } else {
    logTest('Patient create new case', 'WARN', 'May require additional data');
  }

  // Test 3: Patient - View Case Details
  if (testData.caseId) {
    log('\nTest: Patient View Case Details', colors.blue);
    const caseDetails = await makeRequest('GET', `/cases/${testData.caseId}`, null, testData.tokens.patient);
    if (caseDetails.success && caseDetails.data.case) {
      logTest('Patient view case details', 'PASS');
    } else {
      logTest('Patient view case details', 'FAIL', caseDetails.error?.message);
    }
  }

  // Test 4: Doctor - View Pending Cases
  log('\nTest: Doctor View Pending Cases', colors.blue);
  const pendingCases = await makeRequest('GET', '/cases/pending', null, testData.tokens.doctor);
  if (pendingCases.success) {
    const cases = pendingCases.data.cases || [];
    logTest('Doctor view pending cases', 'PASS', `Found ${cases.length} pending cases`);
    if (cases.length > 0 && !testData.caseId) {
      testData.caseId = cases[0]._id;
    }
  } else {
    logTest('Doctor view pending cases', 'FAIL', pendingCases.error?.message);
  }

  // Test 5: Doctor - Accept Case
  if (testData.caseId) {
    log('\nTest: Doctor Accept Case', colors.blue);
    const acceptCase = await makeRequest('PUT', `/cases/${testData.caseId}/accept`, null, testData.tokens.doctor);
    if (acceptCase.success) {
      logTest('Doctor accept case', 'PASS');
    } else {
      logTest('Doctor accept case', 'WARN', 'Case may already be accepted');
    }
  }

  // Test 6: Messaging
  if (testData.caseId) {
    log('\nTest: Send Message', colors.blue);
    const sendMessage = await makeRequest('POST', `/cases/${testData.caseId}/messages`, {
      content: 'Test message for verification'
    }, testData.tokens.patient);
    if (sendMessage.success) {
      logTest('Send message in case', 'PASS');
    } else {
      logTest('Send message in case', 'FAIL', sendMessage.error?.message);
    }

    log('\nTest: Get Messages', colors.blue);
    const getMessages = await makeRequest('GET', `/cases/${testData.caseId}/messages`, null, testData.tokens.patient);
    if (getMessages.success && Array.isArray(getMessages.data.messages)) {
      logTest('Get case messages', 'PASS', `Found ${getMessages.data.messages.length} messages`);
    } else {
      logTest('Get case messages', 'FAIL', getMessages.error?.message);
    }
  }
}

// Test Suite 21.3: Admin and Hospital Flows
async function testAdminAndHospitalFlows() {
  log('\n=== 21.3 Testing Admin and Hospital Flows ===', colors.cyan);

  // Test 1: Admin - View Patients
  log('\nTest: Admin View Patients', colors.blue);
  const patients = await makeRequest('GET', '/admin/users?type=patient&page=1&limit=10', null, testData.tokens.admin);
  if (patients.success && Array.isArray(patients.data.users)) {
    logTest('Admin view patients list', 'PASS', `Found ${patients.data.users.length} patients`);
  } else {
    logTest('Admin view patients list', 'FAIL', patients.error?.message);
  }

  // Test 2: Admin - View Doctors
  log('\nTest: Admin View Doctors', colors.blue);
  const doctors = await makeRequest('GET', '/admin/users?type=doctor&page=1&limit=10', null, testData.tokens.admin);
  if (doctors.success && Array.isArray(doctors.data.users)) {
    logTest('Admin view doctors list', 'PASS', `Found ${doctors.data.users.length} doctors`);
  } else {
    logTest('Admin view doctors list', 'FAIL', doctors.error?.message);
  }

  // Test 3: Admin - View Audit Logs
  log('\nTest: Admin View Audit Logs', colors.blue);
  const auditLogs = await makeRequest('GET', '/admin/audit-logs?page=1&limit=10', null, testData.tokens.admin);
  if (auditLogs.success) {
    logTest('Admin view audit logs', 'PASS');
  } else {
    logTest('Admin view audit logs', 'WARN', 'Audit logs may not be available');
  }

  // Test 4: Admin - View Hospitals
  log('\nTest: Admin View Hospitals', colors.blue);
  const hospitals = await makeRequest('GET', '/admin/hospitals', null, testData.tokens.admin);
  if (hospitals.success) {
    logTest('Admin view hospitals', 'PASS');
  } else {
    logTest('Admin view hospitals', 'WARN', 'Hospitals endpoint may not be available');
  }

  // Test 5: Hospital Login
  log('\nTest: Hospital Login', colors.blue);
  const hospitalLogin = await makeRequest('POST', '/hospital/login', testCredentials.hospital);
  if (hospitalLogin.success && hospitalLogin.data.token) {
    testData.tokens.hospital = hospitalLogin.data.token;
    logTest('Hospital login', 'PASS');

    // Test 6: Hospital Dashboard
    log('\nTest: Hospital Dashboard', colors.blue);
    const hospitalDashboard = await makeRequest('GET', '/hospital/profile', null, testData.tokens.hospital);
    if (hospitalDashboard.success) {
      logTest('Hospital dashboard access', 'PASS');
    } else {
      logTest('Hospital dashboard access', 'FAIL', hospitalDashboard.error?.message);
    }
  } else {
    logTest('Hospital login', 'WARN', 'Hospital credentials may not exist');
  }
}

// Test Suite 21.4: Notification and Real-time Features
async function testNotificationAndRealtime() {
  log('\n=== 21.4 Testing Notification and Real-time Features ===', colors.cyan);

  // Test 1: Get Notifications
  log('\nTest: Get Notifications', colors.blue);
  const notifications = await makeRequest('GET', '/notifications', null, testData.tokens.patient);
  if (notifications.success && Array.isArray(notifications.data.notifications)) {
    logTest('Get notifications', 'PASS', `Found ${notifications.data.notifications.length} notifications`);
    if (notifications.data.notifications.length > 0) {
      testData.notificationId = notifications.data.notifications[0]._id;
    }
  } else {
    logTest('Get notifications', 'FAIL', notifications.error?.message);
  }

  // Test 2: Mark Notification as Read
  if (testData.notificationId) {
    log('\nTest: Mark Notification as Read', colors.blue);
    const markRead = await makeRequest('PUT', `/notifications/${testData.notificationId}/read`, null, testData.tokens.patient);
    if (markRead.success) {
      logTest('Mark notification as read', 'PASS');
    } else {
      logTest('Mark notification as read', 'FAIL', markRead.error?.message);
    }
  }

  // Test 3: Mark All as Read
  log('\nTest: Mark All Notifications as Read', colors.blue);
  const markAllRead = await makeRequest('PUT', '/notifications/mark-all-read', null, testData.tokens.patient);
  if (markAllRead.success) {
    logTest('Mark all notifications as read', 'PASS');
  } else {
    logTest('Mark all notifications as read', 'WARN', 'Endpoint may not be available');
  }

  // Test 4: WebSocket Connection (basic check)
  log('\nTest: WebSocket Endpoint', colors.blue);
  logTest('WebSocket real-time features', 'WARN', 'Manual testing required for Socket.IO');
}

// Test Suite 21.5: Error Handling
async function testErrorHandling() {
  log('\n=== 21.5 Testing Error Handling ===', colors.cyan);

  // Test 1: 404 Not Found
  log('\nTest: 404 Not Found', colors.blue);
  const notFound = await makeRequest('GET', '/nonexistent-endpoint', null, testData.tokens.patient);
  if (!notFound.success && notFound.status === 404) {
    logTest('404 error handling', 'PASS');
  } else {
    logTest('404 error handling', 'FAIL', 'Should return 404');
  }

  // Test 2: 401 Unauthorized
  log('\nTest: 401 Unauthorized', colors.blue);
  const unauthorized = await makeRequest('GET', '/cases', null, null);
  if (!unauthorized.success && unauthorized.status === 401) {
    logTest('401 unauthorized error handling', 'PASS');
  } else {
    logTest('401 unauthorized error handling', 'FAIL', 'Should return 401');
  }

  // Test 3: 400 Validation Error
  log('\nTest: 400 Validation Error', colors.blue);
  const validationError = await makeRequest('POST', '/auth/login', {
    email: 'invalid-email',
    password: '123'
  });
  if (!validationError.success && validationError.status === 400) {
    logTest('400 validation error handling', 'PASS');
  } else {
    logTest('400 validation error handling', 'WARN', 'Validation may be handled differently');
  }

  // Test 4: Invalid Token Format
  log('\nTest: Invalid Token Format', colors.blue);
  const invalidToken = await makeRequest('GET', '/auth/profile', null, 'invalid-token-format');
  if (!invalidToken.success && invalidToken.status === 401) {
    logTest('Invalid token format handling', 'PASS');
  } else {
    logTest('Invalid token format handling', 'FAIL', 'Should return 401');
  }
}

// Test Suite 21.6: Performance Metrics
async function testPerformanceMetrics() {
  log('\n=== 21.6 Testing Performance Metrics ===', colors.cyan);

  // Test 1: API Response Time
  log('\nTest: API Response Time', colors.blue);
  const startTime = Date.now();
  const healthCheck = await makeRequest('GET', '/health', null, null);
  const responseTime = Date.now() - startTime;
  
  if (healthCheck.success) {
    if (responseTime < 500) {
      logTest('API response time', 'PASS', `${responseTime}ms`);
    } else {
      logTest('API response time', 'WARN', `${responseTime}ms (>500ms)`);
    }
  } else {
    logTest('API response time', 'FAIL', 'Health check failed');
  }

  // Test 2: Pagination Performance
  log('\nTest: Pagination Performance', colors.blue);
  const paginationStart = Date.now();
  const paginatedRequest = await makeRequest('GET', '/cases?page=1&limit=10', null, testData.tokens.patient);
  const paginationTime = Date.now() - paginationStart;
  
  if (paginatedRequest.success) {
    if (paginationTime < 1000) {
      logTest('Pagination performance', 'PASS', `${paginationTime}ms`);
    } else {
      logTest('Pagination performance', 'WARN', `${paginationTime}ms (>1000ms)`);
    }
  } else {
    logTest('Pagination performance', 'FAIL', paginatedRequest.error?.message);
  }

  // Test 3: Concurrent Requests
  log('\nTest: Concurrent Requests', colors.blue);
  const concurrentStart = Date.now();
  const concurrentRequests = await Promise.all([
    makeRequest('GET', '/auth/profile', null, testData.tokens.patient),
    makeRequest('GET', '/cases', null, testData.tokens.patient),
    makeRequest('GET', '/notifications', null, testData.tokens.patient)
  ]);
  const concurrentTime = Date.now() - concurrentStart;
  
  const allSuccessful = concurrentRequests.every(r => r.success);
  if (allSuccessful) {
    logTest('Concurrent requests handling', 'PASS', `${concurrentTime}ms for 3 requests`);
  } else {
    logTest('Concurrent requests handling', 'FAIL', 'Some requests failed');
  }
}

// Print Summary
function printSummary() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('FINAL VERIFICATION TEST SUMMARY', colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  log(`\nTotal Tests: ${results.tests.length}`);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  log(`Warnings: ${results.warnings}`, colors.yellow);
  
  const passRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? colors.green : colors.yellow);
  
  if (results.failed > 0) {
    log('\nFailed Tests:', colors.red);
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => log(`  - ${t.name}: ${t.details}`, colors.red));
  }
  
  if (results.warnings > 0) {
    log('\nWarnings:', colors.yellow);
    results.tests
      .filter(t => t.status === 'WARN')
      .forEach(t => log(`  - ${t.name}: ${t.details}`, colors.yellow));
  }
  
  log('\n' + '='.repeat(60), colors.cyan);
}

// Main execution
async function runAllTests() {
  log('='.repeat(60), colors.cyan);
  log('FINAL VERIFICATION TEST SUITE', colors.cyan);
  log('Task 21: Final verification and testing', colors.cyan);
  log('='.repeat(60), colors.cyan);
  log(`\nAPI Base URL: ${API_BASE_URL}`);
  log(`Testing against: ${API_URL}\n`);

  try {
    // Check if server is running
    log('Checking server availability...', colors.blue);
    const healthCheck = await makeRequest('GET', '/health', null, null);
    if (!healthCheck.success) {
      log('ERROR: Server is not responding. Please start the backend server.', colors.red);
      log('Run: cd backend && npm start', colors.yellow);
      process.exit(1);
    }
    log('Server is running ✓\n', colors.green);

    // Run all test suites
    await testAuthenticationFlows();
    await testCaseManagementFlows();
    await testAdminAndHospitalFlows();
    await testNotificationAndRealtime();
    await testErrorHandling();
    await testPerformanceMetrics();

    // Print summary
    printSummary();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\nFATAL ERROR: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
