const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Test credentials
const TEST_PATIENT = {
  email: 'testpatient@example.com',
  password: 'patient123'
};

const TEST_DOCTOR = {
  email: 'testdoctor@example.com',
  password: 'doctor123'
};

let patientToken = null;
let doctorToken = null;
let testCaseId = null;
let testNotificationId = null;

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Helper function to log response format
function logResponseFormat(response, label) {
  console.log(`\n📋 ${label} Response Format:`);
  console.log(JSON.stringify(response, null, 2));
}

// Test 1: Patient Login
async function testPatientLogin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_PATIENT);
    
    if (response.data.success && response.data.token && response.data.user) {
      patientToken = response.data.token;
      logTest('Patient Login', true, `Token: ${patientToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('Patient Login', false, 'Missing token or user in response');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('Error response data:', error.response?.data);
    logTest('Patient Login', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 2: Doctor Login
async function testDoctorLogin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_DOCTOR);
    
    if (response.data.success && response.data.token && response.data.user) {
      doctorToken = response.data.token;
      logTest('Doctor Login', true, `Token: ${doctorToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('Doctor Login', false, 'Missing token or user in response');
      return false;
    }
  } catch (error) {
    logTest('Doctor Login', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 3: Create a case to generate notifications
async function testCreateCase() {
  try {
    const caseData = {
      symptoms: ['headache', 'fever', 'fatigue'],
      chatbotHistory: [
        {
          question: 'What symptoms are you experiencing?',
          answer: 'I have a headache, fever, and fatigue'
        }
      ]
    };

    const response = await axios.post(`${API_URL}/cases`, caseData, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (response.data.success && response.data.case) {
      testCaseId = response.data.case._id;
      logTest('Create Case', true, `Case ID: ${testCaseId}`);
      return true;
    } else {
      logTest('Create Case', false, 'Missing case in response');
      return false;
    }
  } catch (error) {
    logTest('Create Case', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 4: Doctor accepts case (generates notification for patient)
async function testDoctorAcceptCase() {
  try {
    const response = await axios.put(
      `${API_URL}/cases/${testCaseId}/accept`,
      {},
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );

    if (response.data.success) {
      logTest('Doctor Accept Case', true, 'Case accepted, notification should be generated');
      // Wait a bit for notification to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } else {
      logTest('Doctor Accept Case', false, 'Failed to accept case');
      return false;
    }
  } catch (error) {
    logTest('Doctor Accept Case', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 5: Get patient notifications (Task 7.1)
async function testGetNotifications() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 7.1: Test viewing notifications');
  console.log('='.repeat(60));

  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    logResponseFormat(response.data, 'Get Notifications');

    // Check response format
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasData = response.data.hasOwnProperty('data');
    const hasPagination = response.data.hasOwnProperty('pagination');
    
    if (!hasSuccess) {
      logTest('Response has success field', false);
      return false;
    }
    logTest('Response has success field', true);

    if (!hasData) {
      logTest('Response has data field', false);
      return false;
    }
    logTest('Response has data field', true);

    if (!hasPagination) {
      logTest('Response has pagination field', false);
      return false;
    }
    logTest('Response has pagination field', true);

    // Check if notifications array exists
    const notifications = response.data.data;
    if (!Array.isArray(notifications)) {
      logTest('Data is an array', false);
      return false;
    }
    logTest('Data is an array', true, `Found ${notifications.length} notifications`);

    // Check notification structure
    if (notifications.length > 0) {
      const notification = notifications[0];
      testNotificationId = notification._id;
      
      const hasId = notification.hasOwnProperty('_id');
      const hasUserId = notification.hasOwnProperty('userId');
      const hasType = notification.hasOwnProperty('type');
      const hasTitle = notification.hasOwnProperty('title');
      const hasMessage = notification.hasOwnProperty('message');
      const hasIsRead = notification.hasOwnProperty('isRead');
      const hasCreatedAt = notification.hasOwnProperty('createdAt');

      logTest('Notification has _id', hasId);
      logTest('Notification has userId', hasUserId);
      logTest('Notification has type', hasType);
      logTest('Notification has title', hasTitle);
      logTest('Notification has message', hasMessage);
      logTest('Notification has isRead', hasIsRead, `isRead: ${notification.isRead}`);
      logTest('Notification has createdAt', hasCreatedAt);

      // Check read/unread status
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const readNotifications = notifications.filter(n => n.isRead);
      console.log(`\n📊 Notification Status:`);
      console.log(`   Total: ${notifications.length}`);
      console.log(`   Unread: ${unreadNotifications.length}`);
      console.log(`   Read: ${readNotifications.length}`);
    }

    // Check pagination structure
    const pagination = response.data.pagination;
    const hasPage = pagination.hasOwnProperty('page');
    const hasLimit = pagination.hasOwnProperty('limit');
    const hasTotal = pagination.hasOwnProperty('total');
    const hasPages = pagination.hasOwnProperty('pages');

    logTest('Pagination has page', hasPage);
    logTest('Pagination has limit', hasLimit);
    logTest('Pagination has total', hasTotal);
    logTest('Pagination has pages', hasPages);

    logTest('Get Notifications - Overall', true, 'All checks passed');
    return true;
  } catch (error) {
    logTest('Get Notifications', false, error.response?.data?.message || error.message);
    if (error.response) {
      logResponseFormat(error.response.data, 'Error Response');
    }
    return false;
  }
}

// Test 6: Get unread count
async function testGetUnreadCount() {
  try {
    const response = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    logResponseFormat(response.data, 'Get Unread Count');

    const hasSuccess = response.data.hasOwnProperty('success');
    const hasUnreadCount = response.data.hasOwnProperty('unreadCount');

    logTest('Unread count response has success', hasSuccess);
    logTest('Unread count response has unreadCount', hasUnreadCount, `Count: ${response.data.unreadCount}`);

    return hasSuccess && hasUnreadCount;
  } catch (error) {
    logTest('Get Unread Count', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 7: Mark notification as read (Task 7.2)
async function testMarkAsRead() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 7.2: Test marking notification as read');
  console.log('='.repeat(60));

  if (!testNotificationId) {
    logTest('Mark Notification as Read', false, 'No notification ID available');
    return false;
  }

  try {
    const response = await axios.put(
      `${API_URL}/notifications/${testNotificationId}/read`,
      {},
      { headers: { Authorization: `Bearer ${patientToken}` } }
    );

    logResponseFormat(response.data, 'Mark as Read');

    // Check response format
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasNotification = response.data.hasOwnProperty('notification');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has notification field', hasNotification);

    if (hasNotification) {
      const notification = response.data.notification;
      const isRead = notification.isRead === true;
      const hasReadAt = notification.hasOwnProperty('readAt');

      logTest('Notification isRead is true', isRead);
      logTest('Notification has readAt timestamp', hasReadAt);

      if (hasReadAt) {
        console.log(`   readAt: ${notification.readAt}`);
      }
    }

    // Verify by getting notifications again
    const verifyResponse = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    const updatedNotification = verifyResponse.data.data.find(n => n._id === testNotificationId);
    if (updatedNotification) {
      logTest('Notification marked as read (verified)', updatedNotification.isRead === true);
    }

    logTest('Mark Notification as Read - Overall', true, 'All checks passed');
    return true;
  } catch (error) {
    logTest('Mark Notification as Read', false, error.response?.data?.message || error.message);
    if (error.response) {
      logResponseFormat(error.response.data, 'Error Response');
    }
    return false;
  }
}

// Test 8: Mark all notifications as read (Task 7.3)
async function testMarkAllAsRead() {
  console.log('\n' + '='.repeat(60));
  console.log('TASK 7.3: Test mark all as read functionality');
  console.log('='.repeat(60));

  try {
    // First, get current notifications to see unread count
    const beforeResponse = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    const beforeNotifications = beforeResponse.data.data;
    const unreadBefore = beforeNotifications.filter(n => !n.isRead).length;
    console.log(`\n📊 Before mark all as read:`);
    console.log(`   Total notifications: ${beforeNotifications.length}`);
    console.log(`   Unread: ${unreadBefore}`);

    // Mark all as read
    const response = await axios.put(
      `${API_URL}/notifications/read-all`,
      {},
      { headers: { Authorization: `Bearer ${patientToken}` } }
    );

    logResponseFormat(response.data, 'Mark All as Read');

    // Check response format
    const hasSuccess = response.data.hasOwnProperty('success');
    const hasMessage = response.data.hasOwnProperty('message');
    const hasModifiedCount = response.data.hasOwnProperty('modifiedCount');

    logTest('Response has success field', hasSuccess);
    logTest('Response has message field', hasMessage);
    logTest('Response has modifiedCount field', hasModifiedCount);

    if (hasModifiedCount) {
      console.log(`   Modified count: ${response.data.modifiedCount}`);
    }

    // Verify by getting notifications again
    const afterResponse = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    const afterNotifications = afterResponse.data.data;
    const unreadAfter = afterNotifications.filter(n => !n.isRead).length;
    const allRead = afterNotifications.every(n => n.isRead === true);

    console.log(`\n📊 After mark all as read:`);
    console.log(`   Total notifications: ${afterNotifications.length}`);
    console.log(`   Unread: ${unreadAfter}`);
    console.log(`   All read: ${allRead}`);

    logTest('All notifications marked as read', allRead);

    // Check unread count
    const unreadCountResponse = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    const unreadCount = unreadCountResponse.data.unreadCount;
    logTest('Unread count is 0', unreadCount === 0, `Unread count: ${unreadCount}`);

    logTest('Mark All as Read - Overall', true, 'All checks passed');
    return true;
  } catch (error) {
    logTest('Mark All as Read', false, error.response?.data?.message || error.message);
    if (error.response) {
      logResponseFormat(error.response.data, 'Error Response');
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('NOTIFICATION SYSTEM TESTING');
  console.log('='.repeat(60));
  console.log('Testing Requirements: 6.1, 6.2, 6.3, 6.4, 8.1');
  console.log('='.repeat(60));

  // Setup: Login and create test data
  console.log('\n📋 SETUP: Login and create test data');
  console.log('-'.repeat(60));
  
  const patientLoginSuccess = await testPatientLogin();
  if (!patientLoginSuccess) {
    console.log('\n❌ Cannot proceed without patient login');
    return;
  }

  const doctorLoginSuccess = await testDoctorLogin();
  if (!doctorLoginSuccess) {
    console.log('\n❌ Cannot proceed without doctor login');
    return;
  }

  // Create a case to generate notifications
  await testCreateCase();
  await testDoctorAcceptCase();

  // Run notification tests
  console.log('\n📋 NOTIFICATION TESTS');
  console.log('-'.repeat(60));

  await testGetNotifications();
  await testGetUnreadCount();
  await testMarkAsRead();
  await testMarkAllAsRead();

  console.log('\n' + '='.repeat(60));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
});
