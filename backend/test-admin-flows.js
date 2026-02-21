const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to log test results
function logTest(testName, passed, details = {}) {
  const result = {
    test: testName,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ FAIL: ${testName}`);
  }
  
  if (details.response) {
    console.log('   Response:', JSON.stringify(details.response, null, 2));
  }
  if (details.error) {
    console.log('   Error:', details.error);
  }
  console.log('');
}

// Helper function to log warnings
function logWarning(message, details = {}) {
  testResults.warnings.push({
    message,
    timestamp: new Date().toISOString(),
    ...details
  });
  console.log(`⚠️  WARNING: ${message}`);
  if (details.details) {
    console.log('   Details:', details.details);
  }
  console.log('');
}

// Test 5.1: Test viewing users by type
async function testViewingUsersByType(token) {
  console.log('\n========== TEST 5.1: Viewing Users by Type ==========\n');
  
  const userTypes = ['patient', 'doctor', 'hospital', 'admin'];
  
  for (const userType of userTypes) {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userType, page: 1, limit: 10 }
      });
      
      const hasUsers = response.data.users && response.data.users.length > 0;
      const hasPagination = response.data.pagination !== undefined;
      
      logTest(
        `View ${userType}s list`,
        response.data.success === true,
        {
          response: {
            success: response.data.success,
            userCount: response.data.users?.length || 0,
            hasPagination,
            pagination: response.data.pagination,
            sampleUser: response.data.users?.[0] ? {
              id: response.data.users[0]._id,
              name: response.data.users[0].name,
              email: response.data.users[0].email,
              role: response.data.users[0].role
            } : null
          }
        }
      );
      
      if (!hasUsers) {
        logWarning(`No ${userType}s found in database`, {
          details: `Consider creating test ${userType}s for comprehensive testing`
        });
      }
      
      // Test pagination if users exist
      if (hasUsers && hasPagination) {
        const paginationTest = response.data.pagination.page === 1 &&
                               response.data.pagination.limit === 10 &&
                               typeof response.data.pagination.total === 'number' &&
                               typeof response.data.pagination.pages === 'number';
        
        logTest(
          `Pagination controls for ${userType}s`,
          paginationTest,
          {
            response: {
              pagination: response.data.pagination
            }
          }
        );
      }
      
    } catch (error) {
      logTest(
        `View ${userType}s list`,
        false,
        {
          error: error.response?.data?.message || error.message,
          status: error.response?.status,
          code: error.response?.data?.code,
          fullResponse: error.response?.data
        }
      );
    }
  }
  
  // Test viewing all users (no userType filter)
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, limit: 20 }
    });
    
    logTest(
      'View all users (no type filter)',
      response.data.success === true,
      {
        response: {
          success: response.data.success,
          totalUsers: response.data.users?.length || 0,
          pagination: response.data.pagination
        }
      }
    );
  } catch (error) {
    logTest(
      'View all users (no type filter)',
      false,
      {
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      }
    );
  }
  
  // Test search functionality
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { search: 'test', page: 1, limit: 10 }
    });
    
    logTest(
      'Search users by keyword',
      response.data.success === true,
      {
        response: {
          success: response.data.success,
          resultsCount: response.data.users?.length || 0
        }
      }
    );
  } catch (error) {
    logTest(
      'Search users by keyword',
      false,
      {
        error: error.response?.data?.message || error.message
      }
    );
  }
}

// Test 5.2: Test removing a user
async function testRemovingUser(token) {
  console.log('\n========== TEST 5.2: Removing a User ==========\n');
  
  try {
    // First, get a list of patients to find one to remove
    const usersResponse = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { userType: 'patient', page: 1, limit: 5 }
    });
    
    if (!usersResponse.data.users || usersResponse.data.users.length === 0) {
      logWarning('No patients available to test removal', {
        details: 'Create a test patient first to test removal functionality'
      });
      return;
    }
    
    const testUser = usersResponse.data.users[0];
    console.log(`Found test user to remove: ${testUser.name} (${testUser.email})`);
    
    // Test removal
    try {
      const removeResponse = await axios.delete(
        `${API_URL}/admin/users/${testUser._id}/remove`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { userType: 'patient' },
          data: { reason: 'Test removal for admin flow verification' }
        }
      );
      
      logTest(
        'Remove user with reason',
        removeResponse.data.success === true,
        {
          response: {
            success: removeResponse.data.success,
            message: removeResponse.data.message,
            removedUser: removeResponse.data.removedUser ? {
              name: removeResponse.data.removedUser.name,
              email: removeResponse.data.removedUser.email
            } : null
          }
        }
      );
      
      // Verify user is in removed users list
      try {
        const removedUsersResponse = await axios.get(
          `${API_URL}/admin/users/removed`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { userType: 'patient', searchEmail: testUser.email }
          }
        );
        
        const userInRemovedList = removedUsersResponse.data.removedUsers?.some(
          u => u.originalData?.email === testUser.email
        );
        
        logTest(
          'Verify user moved to removed users list',
          userInRemovedList === true,
          {
            response: {
              foundInRemovedList: userInRemovedList,
              removedUsersCount: removedUsersResponse.data.removedUsers?.length || 0
            }
          }
        );
        
      } catch (error) {
        logTest(
          'Verify user moved to removed users list',
          false,
          {
            error: error.response?.data?.message || error.message
          }
        );
      }
      
    } catch (error) {
      logTest(
        'Remove user with reason',
        false,
        {
          error: error.response?.data?.message || error.message,
          status: error.response?.status,
          details: error.response?.data
        }
      );
    }
    
  } catch (error) {
    logWarning('Could not fetch users for removal test', {
      details: error.response?.data?.message || error.message
    });
  }
}

// Test 5.3: Test viewing audit logs
async function testViewingAuditLogs(token) {
  console.log('\n========== TEST 5.3: Viewing Audit Logs ==========\n');
  
  try {
    const response = await axios.get(`${API_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, limit: 20, sortBy: 'timestamp', sortOrder: 'desc' }
    });
    
    const hasLogs = response.data.logs && response.data.logs.length > 0;
    const hasPagination = response.data.pagination !== undefined;
    const hasTimestamps = hasLogs && response.data.logs.every(log => log.timestamp);
    
    logTest(
      'View audit logs with timestamps',
      response.data.success === true && hasTimestamps,
      {
        response: {
          success: response.data.success,
          logsCount: response.data.logs?.length || 0,
          hasPagination,
          pagination: response.data.pagination,
          sampleLog: response.data.logs?.[0] ? {
            action: response.data.logs[0].action,
            adminEmail: response.data.logs[0].adminEmail,
            timestamp: response.data.logs[0].timestamp,
            status: response.data.logs[0].status
          } : null
        }
      }
    );
    
    if (!hasLogs) {
      logWarning('No audit logs found', {
        details: 'Audit logs should be created automatically for admin actions'
      });
    }
    
    // Test pagination for audit logs
    if (hasPagination) {
      const paginationTest = response.data.pagination.page === 1 &&
                             response.data.pagination.limit === 20 &&
                             typeof response.data.pagination.total === 'number';
      
      logTest(
        'Audit logs pagination controls',
        paginationTest,
        {
          response: {
            pagination: response.data.pagination
          }
        }
      );
    }
    
    // Test filtering by action
    try {
      const filterResponse = await axios.get(`${API_URL}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { action: 'USER_REMOVED', page: 1, limit: 10 }
      });
      
      logTest(
        'Filter audit logs by action',
        filterResponse.data.success === true,
        {
          response: {
            success: filterResponse.data.success,
            filteredLogsCount: filterResponse.data.logs?.length || 0
          }
        }
      );
    } catch (error) {
      logTest(
        'Filter audit logs by action',
        false,
        {
          error: error.response?.data?.message || error.message
        }
      );
    }
    
    // Test response format
    if (hasLogs) {
      const log = response.data.logs[0];
      const hasRequiredFields = log.action && log.adminEmail && log.timestamp && log.status;
      
      logTest(
        'Verify audit log response format',
        hasRequiredFields,
        {
          response: {
            hasAction: !!log.action,
            hasAdminEmail: !!log.adminEmail,
            hasTimestamp: !!log.timestamp,
            hasStatus: !!log.status,
            hasDetails: !!log.details
          }
        }
      );
    }
    
  } catch (error) {
    logTest(
      'View audit logs with timestamps',
      false,
      {
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      }
    );
  }
}

// Test 5.4: Test viewing hospitals list
async function testViewingHospitalsList(token) {
  console.log('\n========== TEST 5.4: Viewing Hospitals List ==========\n');
  
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { userType: 'hospital', page: 1, limit: 10 }
    });
    
    const hasHospitals = response.data.users && response.data.users.length > 0;
    
    logTest(
      'View hospitals list',
      response.data.success === true,
      {
        response: {
          success: response.data.success,
          hospitalsCount: response.data.users?.length || 0,
          pagination: response.data.pagination,
          sampleHospital: response.data.users?.[0] ? {
            id: response.data.users[0]._id,
            name: response.data.users[0].name,
            email: response.data.users[0].email,
            isActive: response.data.users[0].isActive,
            verificationStatus: response.data.users[0].verificationStatus
          } : null
        }
      }
    );
    
    if (!hasHospitals) {
      logWarning('No hospitals found in database', {
        details: 'Consider creating test hospitals for comprehensive testing'
      });
    }
    
    // Test hospital status information
    if (hasHospitals) {
      const hospital = response.data.users[0];
      const hasStatusInfo = hospital.isActive !== undefined || 
                           hospital.verificationStatus !== undefined ||
                           hospital.status !== undefined;
      
      logTest(
        'Verify hospital status information',
        hasStatusInfo,
        {
          response: {
            hasIsActive: hospital.isActive !== undefined,
            hasVerificationStatus: hospital.verificationStatus !== undefined,
            hasStatus: hospital.status !== undefined,
            statusFields: {
              isActive: hospital.isActive,
              verificationStatus: hospital.verificationStatus,
              status: hospital.status
            }
          }
        }
      );
    }
    
    // Test response format
    logTest(
      'Verify hospitals response format',
      response.data.success !== undefined && 
      response.data.users !== undefined,
      {
        response: {
          hasSuccess: response.data.success !== undefined,
          hasUsers: response.data.users !== undefined,
          hasPagination: response.data.pagination !== undefined
        }
      }
    );
    
  } catch (error) {
    logTest(
      'View hospitals list',
      false,
      {
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      }
    );
  }
}

// Main test execution
async function runAdminFlowTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     ADMIN FLOWS TESTING - Task 5                       ║');
  console.log('║     Frontend-Backend Compatibility Verification        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  let token = null;
  
  try {
    // Step 1: Admin Login
    console.log('========== ADMIN LOGIN ==========\n');
    
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin'
      });
      
      if (loginResponse.data.success && loginResponse.data.token) {
        token = loginResponse.data.token;
        console.log('✅ Admin login successful');
        console.log(`   Token: ${token.substring(0, 20)}...`);
        console.log(`   Admin: ${loginResponse.data.user?.name || 'Unknown'}`);
        console.log('');
      } else {
        console.log('❌ Admin login failed - no token received');
        console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
        console.log('\n⚠️  Cannot proceed with tests without authentication\n');
        return;
      }
    } catch (error) {
      console.log('❌ Admin login failed');
      console.log('   Error:', error.response?.data?.message || error.message);
      console.log('\n⚠️  Make sure:');
      console.log('   1. Backend server is running on http://localhost:5000');
      console.log('   2. Test admin exists (run: node backend/create-test-admin.js)');
      console.log('   3. MongoDB is running and connected\n');
      return;
    }
    
    // Run all test suites
    await testViewingUsersByType(token);
    await testRemovingUser(token);
    await testViewingAuditLogs(token);
    await testViewingHospitalsList(token);
    
    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
    console.log('');
    
    if (testResults.failed.length > 0) {
      console.log('Failed Tests:');
      testResults.failed.forEach(test => {
        console.log(`  - ${test.test}`);
        if (test.error) {
          console.log(`    Error: ${test.error}`);
        }
      });
      console.log('');
    }
    
    if (testResults.warnings.length > 0) {
      console.log('Warnings:');
      testResults.warnings.forEach(warning => {
        console.log(`  - ${warning.message}`);
      });
      console.log('');
    }
    
    // Save detailed results to file
    const fs = require('fs');
    const resultsFile = '.kiro/specs/frontend-backend-compatibility/TASK_5_TEST_RESULTS.md';
    
    let markdown = '# Task 5: Admin Flows Test Results\n\n';
    markdown += `**Test Date:** ${new Date().toISOString()}\n\n`;
    markdown += `**Summary:**\n`;
    markdown += `- ✅ Passed: ${testResults.passed.length}\n`;
    markdown += `- ❌ Failed: ${testResults.failed.length}\n`;
    markdown += `- ⚠️ Warnings: ${testResults.warnings.length}\n\n`;
    
    markdown += '## Test Results by Sub-task\n\n';
    
    markdown += '### 5.1 Test Viewing Users by Type\n\n';
    const task51Tests = testResults.passed.concat(testResults.failed)
      .filter(t => t.test.includes('View') && (t.test.includes('list') || t.test.includes('all users') || t.test.includes('Search')));
    task51Tests.forEach(test => {
      const status = testResults.passed.includes(test) ? '✅' : '❌';
      markdown += `${status} ${test.test}\n`;
      if (test.response) {
        markdown += `\`\`\`json\n${JSON.stringify(test.response, null, 2)}\n\`\`\`\n`;
      }
      if (test.error) {
        markdown += `**Error:** ${test.error}\n`;
      }
      markdown += '\n';
    });
    
    markdown += '### 5.2 Test Removing a User\n\n';
    const task52Tests = testResults.passed.concat(testResults.failed)
      .filter(t => t.test.includes('Remove') || t.test.includes('removed'));
    task52Tests.forEach(test => {
      const status = testResults.passed.includes(test) ? '✅' : '❌';
      markdown += `${status} ${test.test}\n`;
      if (test.response) {
        markdown += `\`\`\`json\n${JSON.stringify(test.response, null, 2)}\n\`\`\`\n`;
      }
      if (test.error) {
        markdown += `**Error:** ${test.error}\n`;
      }
      markdown += '\n';
    });
    
    markdown += '### 5.3 Test Viewing Audit Logs\n\n';
    const task53Tests = testResults.passed.concat(testResults.failed)
      .filter(t => t.test.includes('audit') || t.test.includes('Audit'));
    task53Tests.forEach(test => {
      const status = testResults.passed.includes(test) ? '✅' : '❌';
      markdown += `${status} ${test.test}\n`;
      if (test.response) {
        markdown += `\`\`\`json\n${JSON.stringify(test.response, null, 2)}\n\`\`\`\n`;
      }
      if (test.error) {
        markdown += `**Error:** ${test.error}\n`;
      }
      markdown += '\n';
    });
    
    markdown += '### 5.4 Test Viewing Hospitals List\n\n';
    const task54Tests = testResults.passed.concat(testResults.failed)
      .filter(t => t.test.includes('hospital'));
    task54Tests.forEach(test => {
      const status = testResults.passed.includes(test) ? '✅' : '❌';
      markdown += `${status} ${test.test}\n`;
      if (test.response) {
        markdown += `\`\`\`json\n${JSON.stringify(test.response, null, 2)}\n\`\`\`\n`;
      }
      if (test.error) {
        markdown += `**Error:** ${test.error}\n`;
      }
      markdown += '\n';
    });
    
    if (testResults.warnings.length > 0) {
      markdown += '## Warnings\n\n';
      testResults.warnings.forEach(warning => {
        markdown += `⚠️ ${warning.message}\n`;
        if (warning.details) {
          markdown += `   ${warning.details}\n`;
        }
        markdown += '\n';
      });
    }
    
    markdown += '## Recommendations\n\n';
    
    if (testResults.failed.length === 0) {
      markdown += '✅ All admin flow tests passed successfully!\n\n';
      markdown += 'The frontend-backend compatibility for admin flows is working correctly.\n';
    } else {
      markdown += '⚠️ Some tests failed. Review the errors above and:\n\n';
      markdown += '1. Check if the backend endpoints are correctly implemented\n';
      markdown += '2. Verify the response format matches the expected structure\n';
      markdown += '3. Ensure proper authentication and authorization\n';
      markdown += '4. Check for any missing data or database issues\n';
    }
    
    fs.writeFileSync(resultsFile, markdown);
    console.log(`\n📄 Detailed results saved to: ${resultsFile}\n`);
    
  } catch (error) {
    console.error('\n❌ Unexpected error during test execution:', error);
  }
}

// Run the tests
runAdminFlowTests().then(() => {
  console.log('Test execution completed.\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
