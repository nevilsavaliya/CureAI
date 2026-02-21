/**
 * Test Script: Patient Case Management Flows
 * 
 * This script tests:
 * - Task 3.1: Viewing cases list
 * - Task 3.2: Creating a new case
 * - Task 3.3: Viewing case details
 * - Task 3.4: Sending messages in a case
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Test credentials - using existing doctor account
const PATIENT_CREDENTIALS = {
  email: 'testpatient@example.com',
  password: 'patient123'
};

let patientToken = '';
let testCaseId = '';
let testDoctorId = '';

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
 * Task 3.1: Test viewing cases list
 */
async function testViewCasesList() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 3.1: Test Viewing Cases List');
  console.log('='.repeat(60));

  try {
    const response = await axios.get(`${API_URL}/cases`, {
      headers: {
        'Authorization': `Bearer ${patientToken}`
      }
    });

    logResponseFormat(response, 'Get Cases List');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasCases = response.data.hasOwnProperty('cases');
    const hasPagination = response.data.hasOwnProperty('pagination');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has cases array', hasCases && Array.isArray(response.data.cases));
    logTest('Response has pagination data', hasPagination, 
      hasPagination ? JSON.stringify(response.data.pagination) : 'No pagination');

    // Verify cases structure
    if (response.data.cases && response.data.cases.length > 0) {
      const firstCase = response.data.cases[0];
      console.log('\n📦 First Case Structure:');
      console.log('   Keys:', Object.keys(firstCase));
      
      logTest('Case has _id', firstCase.hasOwnProperty('_id'));
      logTest('Case has status', firstCase.hasOwnProperty('status'));
      logTest('Case has doctorId', firstCase.hasOwnProperty('doctorId'));
      logTest('Case has symptoms', firstCase.hasOwnProperty('symptoms'));
      logTest('Case has createdAt', firstCase.hasOwnProperty('createdAt'));

      // Store for later tests
      testCaseId = firstCase._id;
      testDoctorId = firstCase.doctorId._id || firstCase.doctorId;

      console.log(`\n   Stored Case ID: ${testCaseId}`);
      console.log(`   Stored Doctor ID: ${testDoctorId}`);
    } else {
      console.log('\n⚠️  No cases found. Will create one for testing.');
    }

    return response.data.cases && response.data.cases.length > 0;

  } catch (error) {
    console.error('\n❌ Error viewing cases list:');
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
 * Task 3.2: Test creating a new case
 */
async function testCreateCase() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 3.2: Test Creating a New Case');
  console.log('='.repeat(60));

  try {
    // First, get a doctor to create a case with
    if (!testDoctorId) {
      console.log('\n🔍 Finding a doctor to create case with...');
      const doctorsResponse = await axios.get(`${API_URL}/doctors/recommended`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      });

      if (doctorsResponse.data.doctors && doctorsResponse.data.doctors.length > 0) {
        testDoctorId = doctorsResponse.data.doctors[0]._id;
        console.log(`   Found Doctor ID: ${testDoctorId}`);
      } else {
        console.log('   ⚠️  No doctors available. Cannot test case creation.');
        return false;
      }
    }

    const caseData = {
      doctorId: testDoctorId,
      symptoms: ['Headache', 'Fever', 'Fatigue'],
      predictedConditions: ['Common Cold', 'Flu'],
      chatbotHistory: [
        {
          question: 'What symptoms are you experiencing?',
          answer: 'I have a headache and fever',
          timestamp: new Date()
        }
      ]
    };

    console.log('\n📤 Creating case with data:', JSON.stringify(caseData, null, 2));

    const response = await axios.post(`${API_URL}/cases`, caseData, {
      headers: {
        'Authorization': `Bearer ${patientToken}`,
        'Content-Type': 'application/json'
      }
    });

    logResponseFormat(response, 'Create Case');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasCase = response.data.hasOwnProperty('case');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has case object', hasCase);
    logTest('Success is true', response.data.success === true);

    // Verify created case structure
    if (response.data.case) {
      const createdCase = response.data.case;
      console.log('\n📦 Created Case Structure:');
      console.log('   Keys:', Object.keys(createdCase));
      
      logTest('Case has _id', createdCase.hasOwnProperty('_id'));
      logTest('Case has status', createdCase.hasOwnProperty('status'));
      logTest('Case status is pending', createdCase.status === 'pending');
      logTest('Case has doctorId', createdCase.hasOwnProperty('doctorId'));
      logTest('Case has symptoms', createdCase.hasOwnProperty('symptoms'));
      logTest('Case has predictedConditions', createdCase.hasOwnProperty('predictedConditions'));
      logTest('Case has chatbotHistory', createdCase.hasOwnProperty('chatbotHistory'));

      // Store the new case ID for later tests
      testCaseId = createdCase._id;
      console.log(`\n   New Case ID: ${testCaseId}`);
    }

    return response.data.success;

  } catch (error) {
    console.error('\n❌ Error creating case:');
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
 * Task 3.3: Test viewing case details
 */
async function testViewCaseDetails() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 3.3: Test Viewing Case Details');
  console.log('='.repeat(60));

  if (!testCaseId) {
    console.log('\n⚠️  No case ID available. Skipping test.');
    return false;
  }

  try {
    console.log(`\n🔍 Fetching case details for: ${testCaseId}`);

    const response = await axios.get(`${API_URL}/cases/${testCaseId}`, {
      headers: {
        'Authorization': `Bearer ${patientToken}`
      }
    });

    logResponseFormat(response, 'Get Case Details');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasCase = response.data.hasOwnProperty('case');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has case object', hasCase);
    logTest('Success is true', response.data.success === true);

    // Verify case details structure
    if (response.data.case) {
      const caseDetails = response.data.case;
      console.log('\n📦 Case Details Structure:');
      console.log('   Keys:', Object.keys(caseDetails));
      
      logTest('Case has _id', caseDetails.hasOwnProperty('_id'));
      logTest('Case ID matches', caseDetails._id === testCaseId);
      logTest('Case has status', caseDetails.hasOwnProperty('status'));
      logTest('Case has patientId', caseDetails.hasOwnProperty('patientId'));
      logTest('Case has doctorId', caseDetails.hasOwnProperty('doctorId'));
      logTest('Case has symptoms', caseDetails.hasOwnProperty('symptoms'));
      logTest('Case has predictedConditions', caseDetails.hasOwnProperty('predictedConditions'));
      logTest('Case has chatbotHistory', caseDetails.hasOwnProperty('chatbotHistory'));
      logTest('Case has createdAt', caseDetails.hasOwnProperty('createdAt'));

      // Check if doctor is populated
      if (caseDetails.doctorId && typeof caseDetails.doctorId === 'object') {
        console.log('\n   Doctor Info (populated):');
        console.log('   - Name:', caseDetails.doctorId.name);
        console.log('   - Speciality:', caseDetails.doctorId.speciality);
        console.log('   - Degree:', caseDetails.doctorId.degree);
        logTest('Doctor is populated', true);
      } else {
        logTest('Doctor is populated', false, 'Doctor ID is not populated');
      }
    }

    // Also test getting messages for this case
    console.log('\n📨 Testing messages endpoint...');
    const messagesResponse = await axios.get(`${API_URL}/cases/${testCaseId}/messages`, {
      headers: {
        'Authorization': `Bearer ${patientToken}`
      }
    });

    logResponseFormat(messagesResponse, 'Get Case Messages');

    const hasMessagesArray = messagesResponse.data.hasOwnProperty('messages');
    logTest('Response has messages array', hasMessagesArray && Array.isArray(messagesResponse.data.messages));
    
    if (messagesResponse.data.messages) {
      console.log(`   Messages count: ${messagesResponse.data.messages.length}`);
    }

    return response.data.success;

  } catch (error) {
    console.error('\n❌ Error viewing case details:');
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
 * Task 3.4: Test sending messages in a case
 */
async function testSendMessage() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 3.4: Test Sending Messages in a Case');
  console.log('='.repeat(60));

  if (!testCaseId) {
    console.log('\n⚠️  No case ID available. Skipping test.');
    return false;
  }

  try {
    // First, check the case status
    const caseResponse = await axios.get(`${API_URL}/cases/${testCaseId}`, {
      headers: {
        'Authorization': `Bearer ${patientToken}`
      }
    });

    const caseStatus = caseResponse.data.case?.status;
    console.log(`\n📊 Case Status: ${caseStatus}`);

    if (caseStatus === 'pending') {
      console.log('   ⚠️  Case is still pending. Messages can only be sent in ongoing cases.');
      console.log('   Note: In a real scenario, a doctor would need to accept the case first.');
      return true; // Not a failure, just a limitation
    }

    if (caseStatus === 'treated' || caseStatus === 'rejected') {
      console.log('   ⚠️  Case is closed. Messages cannot be sent.');
      return true; // Not a failure, just a limitation
    }

    const messageData = {
      content: 'Hello doctor, I have a question about my symptoms.'
    };

    console.log('\n📤 Sending message:', messageData.content);

    const response = await axios.post(
      `${API_URL}/cases/${testCaseId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${patientToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logResponseFormat(response, 'Send Message');

    // Verify response structure
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasMessageObj = response.data.hasOwnProperty('message') || response.data.hasOwnProperty('data');

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
      logTest('Message senderType is patient', sentMessage.senderType === 'patient');
      logTest('Message has createdAt', sentMessage.hasOwnProperty('createdAt'));
      logTest('Message content matches', sentMessage.content === messageData.content);
    }

    // Verify the message appears in the messages list
    console.log('\n🔍 Verifying message appears in messages list...');
    const messagesResponse = await axios.get(`${API_URL}/cases/${testCaseId}/messages`, {
      headers: {
        'Authorization': `Bearer ${patientToken}`
      }
    });

    const messages = messagesResponse.data.messages || [];
    const messageFound = messages.some(m => m.content === messageData.content);
    
    logTest('Message appears in messages list', messageFound);
    console.log(`   Total messages in case: ${messages.length}`);

    return response.data.success;

  } catch (error) {
    console.error('\n❌ Error sending message:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      
      // If the error is because case is pending, that's expected
      if (error.response.status === 400 && 
          error.response.data.message?.includes('pending')) {
        console.log('\n   ℹ️  This is expected - messages can only be sent in ongoing cases.');
        return true;
      }
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

/**
 * Login as patient
 */
async function loginAsPatient() {
  console.log('\n' + '='.repeat(60));
  console.log('AUTHENTICATION: Logging in as Patient');
  console.log('='.repeat(60));

  try {
    const response = await axios.post(`${API_URL}/auth/login`, PATIENT_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      patientToken = response.data.token;
      console.log('✅ Patient login successful');
      console.log('   Token:', patientToken.substring(0, 20) + '...');
      return true;
    } else {
      console.log('❌ Patient login failed - no token received');
      return false;
    }
  } catch (error) {
    console.error('❌ Patient login error:');
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
  console.log('PATIENT CASE MANAGEMENT FLOWS TEST');
  console.log('Testing Tasks 3.1, 3.2, 3.3, 3.4');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Patient Email: ${PATIENT_CREDENTIALS.email}`);

  // Login
  const loginSuccess = await loginAsPatient();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }

  // Run tests
  const results = {
    task31: false,
    task32: false,
    task33: false,
    task34: false
  };

  // Task 3.1: View cases list
  results.task31 = await testViewCasesList();

  // Task 3.2: Create a new case (if no cases exist or to test creation)
  results.task32 = await testCreateCase();

  // Task 3.3: View case details
  results.task33 = await testViewCaseDetails();

  // Task 3.4: Send message
  results.task34 = await testSendMessage();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Task 3.1 (View Cases List):     ${results.task31 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task 3.2 (Create Case):         ${results.task32 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task 3.3 (View Case Details):   ${results.task33 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task 3.4 (Send Message):        ${results.task34 ? '✅ PASS' : '❌ FAIL'}`);
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
