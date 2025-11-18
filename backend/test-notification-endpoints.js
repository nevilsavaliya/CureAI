/**
 * Manual test script for notification endpoints
 * Run this with: node test-notification-endpoints.js
 */

const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Case = require('./models/Case'); // Import Case model for populate
const notificationService = require('./services/notificationService');

async function testNotificationService() {
  try {
    console.log('🧪 Testing Notification Service...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to database\n');

    // Test 1: Create notification
    console.log('Test 1: Create notification');
    const testUserId = new mongoose.Types.ObjectId();
    const testCaseId = new mongoose.Types.ObjectId();
    
    const notification = await notificationService.createNotification({
      userId: testUserId,
      userType: 'doctor',
      type: 'case_request',
      title: 'Test Notification',
      message: 'This is a test notification',
      caseId: testCaseId
    });
    console.log('✅ Notification created:', notification._id);
    console.log('   Type:', notification.type);
    console.log('   Title:', notification.title);
    console.log('   IsRead:', notification.isRead);
    console.log('');

    // Test 2: Get notifications
    console.log('Test 2: Get notifications');
    const notifications = await notificationService.getNotifications(testUserId);
    console.log('✅ Retrieved', notifications.length, 'notification(s)');
    console.log('');

    // Test 3: Get unread count
    console.log('Test 3: Get unread count');
    const unreadCount = await notificationService.getUnreadCount(testUserId);
    console.log('✅ Unread count:', unreadCount);
    console.log('');

    // Test 4: Mark as read
    console.log('Test 4: Mark notification as read');
    const updatedNotification = await notificationService.markAsRead(notification._id, testUserId);
    console.log('✅ Notification marked as read');
    console.log('   IsRead:', updatedNotification.isRead);
    console.log('   ReadAt:', updatedNotification.readAt);
    console.log('');

    // Test 5: Get unread count after marking as read
    console.log('Test 5: Get unread count after marking as read');
    const newUnreadCount = await notificationService.getUnreadCount(testUserId);
    console.log('✅ New unread count:', newUnreadCount);
    console.log('');

    // Test 6: Create case request notification
    console.log('Test 6: Create case request notification');
    const caseRequestNotif = await notificationService.createCaseRequestNotification(
      testUserId,
      new mongoose.Types.ObjectId(),
      'Test Patient',
      testCaseId
    );
    console.log('✅ Case request notification created');
    console.log('   Type:', caseRequestNotif.type);
    console.log('   Message:', caseRequestNotif.message);
    console.log('');

    // Test 7: Mark all as read
    console.log('Test 7: Mark all notifications as read');
    const result = await notificationService.markAllAsRead(testUserId);
    console.log('✅ All notifications marked as read');
    console.log('   Modified count:', result.modifiedCount);
    console.log('');

    // Clean up test data
    console.log('Cleaning up test data...');
    await Notification.deleteMany({ userId: testUserId });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All tests passed!\n');

    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testNotificationService();
