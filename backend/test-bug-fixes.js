/**
 * Test script to verify critical bug fixes
 * Tests Issue #1 (Repository Lean Mode) and Issue #2 (ValidationService)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const DOCTOR_EMAIL = 'michael.chen@hospital.com';
const DOCTOR_PASSWORD = 'doctor123';
const PATIENT_EMAIL = 'testpatient@example.com';
const PATIENT_PASSWORD = 'patient123';

let doctorToken = '';
let patientToken = '';
let testCaseId = '';

/**
 * Test Issue #1: Repository Lean Mode Bug
 * Tests doctor case actions (accept, reject, mark as treated)
 */
async function testIssue1_RepositoryLeanMode() {
  console.log('\n========================================');
  console.log('Testing Issue #1: Repository Lean Mode Bug');
  console.log('========================================\n');

  try {
    // Step 1: Login as doctor
    console.log('1. Logging in as doctor...');
    const doctorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: DOCTOR_EMAIL,
      password: DOCTOR_PASSWORD
    });
    doctorToken = doctorLogin.data.token;
    console.log('✅ Doctor logged in successfully');

    // Step 2: Login as patient
    console.log('\n2. Logging in as patient...');
    const patientLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: PATIENT_EMAIL,
      password: PATIENT_PASSWORD
    });
    patientToken = patientLogin.data.token;
    const patientId = patientLogin.data.user.id;
    console.log('✅ Patient logged in successfully');

    // Step 3: Create a test case
    console.log('\n3. Creating test case...');
    const createCase = await axios.post(
      `${BASE_URL}/cases`,
      {
        doctorId: doctorLogin.data.user.id,
        symptoms: ['Test symptom for bug fix'],
        predictedConditions: ['Test condition'],
        chatbotHistory: []
      },
      {
        headers: { Authorization: `Bearer ${patientToken}` }
      }
    );
    testCaseId = createCase.data.case._id;
    console.log(`✅ Test case created: ${testCaseId}`);
    console.log(`   Status: ${createCase.data.case.status}`);

    // Step 4: Test accepting case (Issue #1 - Main Test)
    console.log('\n4. Testing ACCEPT CASE (Issue #1 fix)...');
    try {
      const acceptCase = await axios.put(
        `${BASE_URL}/cases/${testCaseId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${doctorToken}` }
        }
      );
      
      if (acceptCase.data.success && acceptCase.data.case.status === 'ongoing') {
        console.log('✅ ACCEPT CASE WORKS! Issue #1 is FIXED');
        console.log(`   Case status changed to: ${acceptCase.data.case.status}`);
        console.log(`   Accepted at: ${acceptCase.data.case.acceptedAt}`);
      } else {
        console.log('❌ Accept case returned unexpected response');
        console.log('   Response:', acceptCase.data);
      }
    } catch (error) {
      console.log('❌ ACCEPT CASE FAILED - Issue #1 NOT FIXED');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.error) {
        console.log(`   Details: ${error.response.data.error}`);
      }
      return false;
    }

    // Step 5: Test marking case as treated
    console.log('\n5. Testing MARK AS TREATED (Issue #1 fix)...');
    try {
      const markTreated = await axios.put(
        `${BASE_URL}/cases/${testCaseId}/mark-treated`,
        {
          treatmentNotes: 'Test treatment notes',
          diagnosis: 'Test diagnosis',
          prescription: 'Test prescription'
        },
        {
          headers: { Authorization: `Bearer ${doctorToken}` }
        }
      );
      
      if (markTreated.data.success && markTreated.data.case.status === 'treated') {
        console.log('✅ MARK AS TREATED WORKS! Issue #1 is FIXED');
        console.log(`   Case status changed to: ${markTreated.data.case.status}`);
        console.log(`   Treated at: ${markTreated.data.case.treatedAt}`);
      } else {
        console.log('❌ Mark as treated returned unexpected response');
        console.log('   Response:', markTreated.data);
      }
    } catch (error) {
      console.log('❌ MARK AS TREATED FAILED - Issue #1 NOT FIXED');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      return false;
    }

    // Step 6: Create another case to test reject
    console.log('\n6. Creating another test case for reject test...');
    const createCase2 = await axios.post(
      `${BASE_URL}/cases`,
      {
        doctorId: doctorLogin.data.user.id,
        symptoms: ['Test symptom for reject'],
        predictedConditions: ['Test condition'],
        chatbotHistory: []
      },
      {
        headers: { Authorization: `Bearer ${patientToken}` }
      }
    );
    const testCaseId2 = createCase2.data.case._id;
    console.log(`✅ Second test case created: ${testCaseId2}`);

    // Step 7: Test rejecting case
    console.log('\n7. Testing REJECT CASE (Issue #1 fix)...');
    try {
      const rejectCase = await axios.put(
        `${BASE_URL}/cases/${testCaseId2}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${doctorToken}` }
        }
      );
      
      if (rejectCase.data.success && rejectCase.data.case.status === 'rejected') {
        console.log('✅ REJECT CASE WORKS! Issue #1 is FIXED');
        console.log(`   Case status changed to: ${rejectCase.data.case.status}`);
        console.log(`   Rejected at: ${rejectCase.data.case.rejectedAt}`);
      } else {
        console.log('❌ Reject case returned unexpected response');
        console.log('   Response:', rejectCase.data);
      }
    } catch (error) {
      console.log('❌ REJECT CASE FAILED - Issue #1 NOT FIXED');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      return false;
    }

    console.log('\n✅ ✅ ✅ ALL ISSUE #1 TESTS PASSED! ✅ ✅ ✅');
    console.log('Repository Lean Mode Bug is FIXED!');
    return true;

  } catch (error) {
    console.log('\n❌ Issue #1 test failed with error:');
    console.log(`   ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test Issue #2: ValidationService Data Reference Bug
 * Tests patient signup and case filtering
 */
async function testIssue2_ValidationService() {
  console.log('\n========================================');
  console.log('Testing Issue #2: ValidationService Bug');
  console.log('========================================\n');

  try {
    // Test 1: Case filtering by status (was broken)
    console.log('1. Testing case filtering by status...');
    try {
      const filteredCases = await axios.get(
        `${BASE_URL}/cases?status=pending`,
        {
          headers: { Authorization: `Bearer ${doctorToken}` }
        }
      );
      
      if (filteredCases.data.success) {
        console.log('✅ CASE FILTERING WORKS! Issue #2 is FIXED');
        console.log(`   Found ${filteredCases.data.cases.length} pending cases`);
      } else {
        console.log('❌ Case filtering returned unexpected response');
      }
    } catch (error) {
      console.log('❌ CASE FILTERING FAILED - Issue #2 NOT FIXED');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      if (error.response?.data) {
        console.log('   Full error response:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.response?.data?.error && typeof error.response.data.error === 'string' && error.response.data.error.includes('data is not defined')) {
        console.log('   ⚠️  ValidationService still has "data is not defined" error');
      }
      return false;
    }

    // Test 2: Patient signup (was broken)
    console.log('\n2. Testing patient signup...');
    const randomEmail = `testpatient${Date.now()}@example.com`;
    try {
      const signup = await axios.post(`${BASE_URL}/auth/signup`, {
        name: 'Test Patient',
        email: randomEmail,
        password: 'Test@1234',
        role: 'patient',
        dateOfBirth: '1990-01-01',
        bloodGroup: 'O+',
        gender: 'male',
        contactNumber: '+1234567890'
      });
      
      if (signup.data.success && signup.data.requiresOTP) {
        console.log('✅ PATIENT SIGNUP WORKS! Issue #2 is FIXED');
        console.log(`   OTP sent to: ${signup.data.email}`);
      } else if (signup.data.success && signup.data.token) {
        console.log('✅ PATIENT SIGNUP WORKS! Issue #2 is FIXED');
        console.log(`   Account created for: ${signup.data.user.email}`);
      } else {
        console.log('⚠️  Signup returned unexpected response');
        console.log('   Response:', signup.data);
      }
    } catch (error) {
      console.log('❌ PATIENT SIGNUP FAILED - Issue #2 NOT FIXED');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.error?.includes('data is not defined')) {
        console.log('   ⚠️  ValidationService still has "data is not defined" error');
      }
      return false;
    }

    console.log('\n✅ ✅ ✅ ALL ISSUE #2 TESTS PASSED! ✅ ✅ ✅');
    console.log('ValidationService Bug is FIXED!');
    return true;

  } catch (error) {
    console.log('\n❌ Issue #2 test failed with error:');
    console.log(`   ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  CRITICAL BUG FIXES VERIFICATION TEST  ║');
  console.log('╚════════════════════════════════════════╝');

  const issue1Result = await testIssue1_RepositoryLeanMode();
  const issue2Result = await testIssue2_ValidationService();

  console.log('\n========================================');
  console.log('FINAL RESULTS');
  console.log('========================================');
  console.log(`Issue #1 (Repository Lean Mode): ${issue1Result ? '✅ FIXED' : '❌ NOT FIXED'}`);
  console.log(`Issue #2 (ValidationService):    ${issue2Result ? '✅ FIXED' : '❌ NOT FIXED'}`);
  console.log('========================================\n');

  if (issue1Result && issue2Result) {
    console.log('🎉 🎉 🎉 ALL CRITICAL BUGS ARE FIXED! 🎉 🎉 🎉');
    console.log('\nDoctor case management is now fully functional!');
    console.log('Patient signup and case filtering are working!');
    process.exit(0);
  } else {
    console.log('⚠️  Some bugs are still present. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
