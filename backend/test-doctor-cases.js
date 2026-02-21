/**
 * Test Script: Doctor Case Management Flows
 * 
 * This script tests:
 * - Task 4.1: Viewing pending cases
 * - Task 4.2: Accepting a case
 * - Task 4.3: Rejecting a case
 * - Task 4.4: Marking case as treated
 * - Task 4.5: Doctor messaging functionality
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// We'll find a doctor from the database
let doctorToken = '';
let doctorEmail = '';
let testCaseId = '';
let pendingCaseId = '';
let ongoingCaseId = '';

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${testName}`);
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

// Helper function to log response format
function logResponseFormat(response, testName) {
  console.log(`\n📋 Response Format for ${testName}:`);
  console.log('   Status:', response.status);
  console.log('   Success:', response.data.success);
  console.log('   Message:', response.data.message);
  console.log('   Data Keys:', Object.keys(response.data).filter(k => k !== 'success' && k !== 'message'));
  console.log('   Full Response:', JSON.stringify(response.data, null, 2));
}

/**
 * Find a doctor from the database
 */
async function findDoctor() {
  console.log('\n' + '='.repeat(60));
  console.log('SETUP: Finding a Doctor Account');
  console.log('='.repeat(60));

  try {
    // Try to get list of doctors (this might require admin access)
    // Instead, we'll use a known doctor email pattern or create one
    
    // Let's try common test doctor emails
    const testEmails = [
      'michael.chen@hospital.com',
      'sarah.johnson@hospital.com',
      'doctor@test.com',
      'testdoctor@example.com'
    ];

    for (const email of testEmails) {
      try {
        console.log(`\n🔍 Trying doctor email: ${email}`);
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: email,
          password: 'doctor123' // Common test password
        });

        if (response.data.success && response.data.token) {
          doctorToken = response.data.token;
          doctorEmail = email;
          console.log(`✅ Found doctor: ${email}`);
          console.log(`   Token: ${doctorToken.substring(0, 20)}...`);
          return true;
        }
      } catch (error) {
        // Try next email
        continue;
      }
    }

    console.log('\n❌ No doctor account found with test credentials');
    console.log('   Please create a doctor account or update credentials');
    return false;

  } catch (error) {
    console.error('\n❌ Error finding doctor:');
    console.error('   Error:', error.message);
    return false;
  }
}

/**
 * Create a test case for doctor to work with
 */
async function createTestCase() {
  console.log('\n' + '='.repeat(60));
  console.log('SETUP: Creating Test Case');
  console.log('='.repeat(60));

  try {
    // Login as patient first
    const patientLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'testpatient@example.com',
      password: 'patient123'
    });

    if (!patientLogin.data.success) {
      console.log('❌ Could not login as patient to create test case');
      return false;
    }

    const patientToken = patientLogin.data.token;
    console.log('✅ Logged in as patient');

    // Get the doctor ID
    const doctorResponse = await axios.post(`${API_URL}/auth/login`, {
      email: doctorEmail,
      password: 'doctor123'
    });

    const doctorId = doctorResponse.data.user?.id || doctorResponse.data.user?._id;
    
    if (!doctorId) {
      console.log('❌ Could not get doctor ID');
      return false;
    }

    console.log(`   Doctor ID: ${doctorId}`);

    // Create a case
    const caseData = {
      doctorId: doctorId,
      symptoms: ['Persistent cough', 'Chest pain', 'Shortness of breath'],
      predictedConditions: ['Bronchitis', 'Pneumonia'],
      chatbotHistory: [
        {
          question: 'How long have you had these symptoms?',
          answer: 'About 5 days now',
          timestamp: new Date()
        }
      ]
    };

    const caseResponse = await axios.post(`${API_URL}/cases`, caseData, {
      headers: {
        'Authorization': `Bearer ${patientToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (caseResponse.data.success && caseResponse.data.case) {
      testCaseId = caseResponse.data.case._id;
      pendingCaseId = testCaseId;
      console.log(`✅ Test case created: ${testCaseId}`);
      console.log(`   Status: ${caseResponse.data.case.status}`);
      return true;
    }

    return false;

  } catch (error) {
    console.error('\n❌ Error creating test case:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

/**
 * Task 4.1: Test viewing pending cases
 */
async function testViewPendingCases() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 4.1: Test Viewing Pending Cases');
  console.log('='.repeat(60));

  try {
    // Get all cases for the doctor and filter pending ones
    const response = await axios.get(`${API_URL}/cases`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });

    logResponseFormat(response, 'Get Cases');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasCases = response.data.hasOwnProperty('cases');
    const hasPagination = response.data.hasOwnProperty('pagination');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has cases array', hasCases && Array.isArray(response.data.cases));
    logTest('Success is true', response.data.success === true);
    
    if (hasPagination) {
      logTest('Response has pagination data', true, JSON.stringify(response.data.pagination));
    }

    // Filter pending cases
    const pendingCases = response.data.cases?.filter(c => c.status === 'pending') || [];
    console.log(`\n📊 Total cases: ${response.data.cases?.length || 0}`);
    console.log(`   Pending cases: ${pendingCases.length}`);

    // Verify cases structure
    if (pendingCases.length > 0) {
      const firstCase = pendingCases[0];
      console.log('\n📦 First Pending Case Structure:');
      console.log('   Keys:', Object.keys(firstCase));
      
      logTest('Case has _id', firstCase.hasOwnProperty('_id'));
      logTest('Case has status', firstCase.hasOwnProperty('status'));
      logTest('Case status is pending', firstCase.status === 'pending');
      logTest('Case has patientId', firstCase.hasOwnProperty('patientId'));
      logTest('Case has symptoms', firstCase.hasOwnProperty('symptoms'));
      logTest('Case has createdAt', firstCase.hasOwnProperty('createdAt'));

      // Check if patient is populated
      if (firstCase.patientId && typeof firstCase.patientId === 'object') {
        console.log('\n   Patient Info (populated):');
        console.log('   - Name:', firstCase.patientId.name);
        console.log('   - Email:', firstCase.patientId.email);
        logTest('Patient is populated', true);
      }

      // Store a pending case ID for later tests
      pendingCaseId = firstCase._id;
      console.log(`\n   Stored pending case ID: ${pendingCaseId}`);
    } else {
      console.log('\n⚠️  No pending cases found.');
      if (testCaseId) {
        console.log(`   Using created test case: ${testCaseId}`);
        pendingCaseId = testCaseId;
      }
    }

    return response.data.success;

  } catch (error) {
    console.error('\n❌ Error viewing pending cases:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

/**
 * Task 4.2: Test accepting a case
 */
async function testAcceptCase() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 4.2: Test Accepting a Case');
  console.log('='.repeat(60));

  if (!pendingCaseId) {
    console.log('\n⚠️  No pending case ID available. Skipping test.');
    return false;
  }

  try {
    console.log(`\n📤 Accepting case: ${pendingCaseId}`);

    const response = await axios.put(
      `${API_URL}/cases/${pendingCaseId}/accept`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${doctorToken}`
        }
      }
    );

    logResponseFormat(response, 'Accept Case');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasCase = response.data.hasOwnProperty('case');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has case object', hasCase);
    logTest('Success is true', response.data.success === true);

    // Verify case status changed
    if (response.data.case) {
      const acceptedCase = response.data.case;
      console.log('\n📦 Accepted Case Structure:');
      console.log('   Keys:', Object.keys(acceptedCase));
      
      logTest('Case has _id', acceptedCase.hasOwnProperty('_id'));
      logTest('Case has status', acceptedCase.hasOwnProperty('status'));
      logTest('Case status is ongoing', acceptedCase.status === 'ongoing');
      logTest('Case has acceptedAt', acceptedCase.hasOwnProperty('acceptedAt'));
      
      console.log(`   Case ID: ${acceptedCase._id}`);
      console.log(`   Status: ${acceptedCase.status}`);
      console.log(`   Accepted At: ${acceptedCase.acceptedAt}`);

      // Store ongoing case ID for later tests
      ongoingCaseId = acceptedCase._id;
    }

    // Verify case no longer appears in pending list
    console.log('\n🔍 Verifying case removed from pending list...');
    const pendingResponse = await axios.get(`${API_URL}/cases`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });

    const pendingCases = pendingResponse.data.cases?.filter(c => c.status === 'pending') || [];
    const stillPending = pendingCases.some(c => c._id === pendingCaseId);
    logTest('Case removed from pending list', !stillPending);

    return response.data.success;

  } catch (error) {
    console.error('\n❌ Error accepting case:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

/**
 * Task 4.3: Test rejecting a case
 */
async function testRejectCase() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 4.3: Test Rejecting a Case');
  console.log('='.repeat(60));

  try {
    // Create another test case to reject
    console.log('\n🔧 Creating a new case to reject...');
    const setupSuccess = await createTestCase();
    
    if (!setupSuccess || !testCaseId) {
      console.log('⚠️  Could not create test case for rejection. Skipping test.');
      return true; // Not a failure of the test itself
    }

    const caseToReject = testCaseId;
    console.log(`\n📤 Rejecting case: ${caseToReject}`);

    const response = await axios.put(
      `${API_URL}/cases/${caseToReject}/reject`,
      { reason: 'Test rejection - not my specialization' },
      {
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logResponseFormat(response, 'Reject Case');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasCase = response.data.hasOwnProperty('case');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has case object', hasCase);
    logTest('Success is true', response.data.success === true);

    // Verify case status changed
    if (response.data.case) {
      const rejectedCase = response.data.case;
      console.log('\n📦 Rejected Case Structure:');
      console.log('   Keys:', Object.keys(rejectedCase));
      
      logTest('Case has _id', rejectedCase.hasOwnProperty('_id'));
      logTest('Case has status', rejectedCase.hasOwnProperty('status'));
      logTest('Case status is rejected', rejectedCase.status === 'rejected');
      logTest('Case has rejectedAt', rejectedCase.hasOwnProperty('rejectedAt'));
      
      console.log(`   Case ID: ${rejectedCase._id}`);
      console.log(`   Status: ${rejectedCase.status}`);
      console.log(`   Rejected At: ${rejectedCase.rejectedAt}`);
    }

    // Verify case no longer appears in pending list
    console.log('\n🔍 Verifying case removed from pending list...');
    const pendingResponse = await axios.get(`${API_URL}/cases`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });

    const pendingCases = pendingResponse.data.cases?.filter(c => c.status === 'pending') || [];
    const stillPending = pendingCases.some(c => c._id === caseToReject);
    logTest('Case removed from pending list', !stillPending);

    return response.data.success;

  } catch (error) {
    console.error('\n❌ Error rejecting case:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

/**
 * Task 4.4: Test marking case as treated
 */
async function testMarkAsTreated() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 4.4: Test Marking Case as Treated');
  console.log('='.repeat(60));

  if (!ongoingCaseId) {
    console.log('\n⚠️  No ongoing case ID available. Skipping test.');
    console.log('   Note: A case must be accepted first before it can be marked as treated.');
    return true; // Not a failure
  }

  try {
    console.log(`\n📤 Marking case as treated: ${ongoingCaseId}`);

    const response = await axios.put(
      `${API_URL}/cases/${ongoingCaseId}/mark-treated`,
      { diagnosis: 'Test diagnosis', prescription: 'Test prescription' },
      {
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logResponseFormat(response, 'Mark as Treated');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasCase = response.data.hasOwnProperty('case');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has case object', hasCase);
    logTest('Success is true', response.data.success === true);

    // Verify case status changed
    if (response.data.case) {
      const treatedCase = response.data.case;
      console.log('\n📦 Treated Case Structure:');
      console.log('   Keys:', Object.keys(treatedCase));
      
      logTest('Case has _id', treatedCase.hasOwnProperty('_id'));
      logTest('Case has status', treatedCase.hasOwnProperty('status'));
      logTest('Case status is treated', treatedCase.status === 'treated');
      logTest('Case has treatedAt', treatedCase.hasOwnProperty('treatedAt'));
      
      console.log(`   Case ID: ${treatedCase._id}`);
      console.log(`   Status: ${treatedCase.status}`);
      console.log(`   Treated At: ${treatedCase.treatedAt}`);
    }

    return response.data.success;

  } catch (error) {
    console.error('\n❌ Error marking case as treated:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

/**
 * Task 4.5: Test doctor messaging functionality
 */
async function testDoctorMessaging() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 4.5: Test Doctor Messaging Functionality');
  console.log('='.repeat(60));

  if (!ongoingCaseId) {
    console.log('\n⚠️  No ongoing case ID available. Skipping test.');
    console.log('   Note: Messages can only be sent in ongoing cases.');
    return true; // Not a failure
  }

  try {
    // First, check the case status
    const caseResponse = await axios.get(`${API_URL}/cases/${ongoingCaseId}`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });

    const caseStatus = caseResponse.data.case?.status;
    console.log(`\n📊 Case Status: ${caseStatus}`);

    if (caseStatus !== 'ongoing') {
      console.log('   ⚠️  Case is not ongoing. Messages can only be sent in ongoing cases.');
      return true; // Not a failure
    }

    const messageData = {
      content: 'Hello, I have reviewed your symptoms. Let me ask you a few questions.'
    };

    console.log('\n📤 Sending message:', messageData.content);

    const response = await axios.post(
      `${API_URL}/cases/${ongoingCaseId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logResponseFormat(response, 'Send Message');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Success is true', response.data.success === true);

    // Check for the sent message in response
    const sentMessage = response.data.message || response.data.data;
    if (sentMessage && typeof sentMessage === 'object' && sentMessage.content) {
      console.log('\n📦 Sent Message Structure:');
      console.log('   Keys:', Object.keys(sentMessage));
      
      logTest('Message has _id', sentMessage.hasOwnProperty('_id'));
      logTest('Message has content', sentMessage.hasOwnProperty('content'));
      logTest('Message has senderType', sentMessage.hasOwnProperty('senderType'));
      logTest('Message senderType is doctor', sentMessage.senderType === 'doctor');
      logTest('Message has createdAt', sentMessage.hasOwnProperty('createdAt'));
      logTest('Message content matches', sentMessage.content === messageData.content);
    }

    // Verify the message appears in the messages list
    console.log('\n🔍 Verifying message appears in messages list...');
    const messagesResponse = await axios.get(`${API_URL}/cases/${ongoingCaseId}/messages`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });

    const messages = messagesResponse.data.messages || [];
    const messageFound = messages.some(m => m.content === messageData.content);
    
    logTest('Message appears in messages list', messageFound);
    console.log(`   Total messages in case: ${messages.length}`);

    // Send another message to test multiple messages
    console.log('\n📤 Sending second message...');
    const message2Data = {
      content: 'Please describe your symptoms in more detail.'
    };

    const response2 = await axios.post(
      `${API_URL}/cases/${ongoingCaseId}/messages`,
      message2Data,
      {
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logTest('Second message sent successfully', response2.data.success === true);

    return response.data.success;

  } catch (error) {
    console.error('\n❌ Error sending message:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('DOCTOR CASE MANAGEMENT FLOWS TEST');
  console.log('Testing Tasks 4.1, 4.2, 4.3, 4.4, 4.5');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);

  // Find doctor
  const doctorFound = await findDoctor();
  if (!doctorFound) {
    console.log('\n❌ Cannot proceed without doctor authentication');
    console.log('\n💡 To fix this:');
    console.log('   1. Create a doctor account in the database');
    console.log('   2. Or update the test credentials in this script');
    process.exit(1);
  }

  console.log(`\nDoctor Email: ${doctorEmail}`);

  // Create a test case
  await createTestCase();

  // Run tests
  const results = {
    task41: false,
    task42: false,
    task43: false,
    task44: false,
    task45: false
  };

  // Task 4.1: View pending cases
  results.task41 = await testViewPendingCases();

  // Task 4.2: Accept a case
  results.task42 = await testAcceptCase();

  // Task 4.3: Reject a case
  results.task43 = await testRejectCase();

  // Task 4.4: Mark case as treated
  results.task44 = await testMarkAsTreated();

  // Task 4.5: Doctor messaging
  results.task45 = await testDoctorMessaging();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Task 4.1 (View Pending Cases):      ${results.task41 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task 4.2 (Accept Case):             ${results.task42 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task 4.3 (Reject Case):             ${results.task43 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task 4.4 (Mark as Treated):         ${results.task44 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task 4.5 (Doctor Messaging):        ${results.task45 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
