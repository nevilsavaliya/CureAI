/**
 * Notification Service Unit Tests
 * Tests the notification service methods
 */

const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Case = require('../models/Case');

describe('Notification Service Unit Tests', () => {
  let patientId;
  let doctorId;
  let caseId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /notif-service-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /notif-service-test.*@test\.com/ });
    await Notification.deleteMany({});
    await Case.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Notif Service Test Patient',
      email: 'notif-service-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id;

    // Create test doctor
    const doctor = new Doctor({
      name: 'Notif Service Test Doctor',
      email: 'notif-service-test-doctor@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1985-01-01',
      degree: 'MBBS',
      specializations: ['General Medicine'],
      experienceYears: 5,
      subscriptionStatus: 'active'
    });
    await doctor.save();
    doctorId = doctor._id;

    // Create test case
    const testCase = new Case({
      patientId,
      doctorId,
      symptoms: ['headache'],
      status: 'pending'
    });
    await testCase.save();
    caseId = testCase._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /notif-service-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /notif-service-test.*@test\.com/ });
    await Notification.deleteMany({});
    await Case.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean notifications after each test
    await Notification.deleteMany({});
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notification = await notificationService.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_request',
        title: 'Test Notification',
        message: 'Test message',
        caseId
      });

      expect(notification).toBeDefined();
      expect(notification.userId.toString()).toBe(doctorId.toString());
      expect(notification.type).toBe('case_request');
      expect(notification.isRead).toBe(false);
    });
  });

  describe('createCaseRequestNotification', () => {
    it('should create case request notification', async () => {
      const notification = await notificationService.createCaseRequestNotification(
        doctorId,
        patientId,
        'Test Patient',
        caseId
      );

      expect(notification.type).toBe('case_request');
      expect(notification.title).toBe('New Case Request');
      expect(notification.message).toContain('Test Patient');
    });
  });

  describe('createCaseAcceptedNotification', () => {
    it('should create case accepted notification', async () => {
      const notification = await notificationService.createCaseAcceptedNotification(
        patientId,
        doctorId,
        'Test Doctor',
        caseId
      );

      expect(notification.type).toBe('case_accepted');
      expect(notification.title).toBe('Case Accepted');
      expect(notification.message).toContain('Test Doctor');
    });
  });

  describe('getNotifications', () => {
    beforeEach(async () => {
      // Create multiple notifications
      await notificationService.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_request',
        title: 'Notification 1',
        message: 'Message 1',
        caseId
      });

      await notificationService.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_accepted',
        title: 'Notification 2',
        message: 'Message 2',
        caseId
      });
    });

    it('should get all notifications for user', async () => {
      const notifications = await notificationService.getNotifications(doctorId);

      expect(notifications).toHaveLength(2);
      expect(notifications[0].userId.toString()).toBe(doctorId.toString());
    });

    it('should filter notifications by type', async () => {
      const notifications = await notificationService.getNotifications(doctorId, {
        type: 'case_request'
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('case_request');
    });

    it('should filter notifications by read status', async () => {
      const notifications = await notificationService.getNotifications(doctorId, {
        isRead: false
      });

      expect(notifications).toHaveLength(2);
      expect(notifications.every(n => n.isRead === false)).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      await notificationService.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_request',
        title: 'Test',
        message: 'Test',
        caseId
      });

      const count = await notificationService.getUnreadCount(doctorId);
      expect(count).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = await notificationService.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_request',
        title: 'Test',
        message: 'Test',
        caseId
      });

      const updated = await notificationService.markAsRead(notification._id, doctorId);

      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it('should throw error for unauthorized access', async () => {
      const notification = await notificationService.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_request',
        title: 'Test',
        message: 'Test',
        caseId
      });

      await expect(
        notificationService.markAsRead(notification._id, patientId)
      ).rejects.toThrow('Unauthorized access');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      await notificationService.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_request',
        title: 'Test 1',
        message: 'Test 1',
        caseId
      });

      await notificationService.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_accepted',
        title: 'Test 2',
        message: 'Test 2',
        caseId
      });

      const result = await notificationService.markAllAsRead(doctorId);

      expect(result.modifiedCount).toBe(2);

      const unreadCount = await notificationService.getUnreadCount(doctorId);
      expect(unreadCount).toBe(0);
    });
  });
});
