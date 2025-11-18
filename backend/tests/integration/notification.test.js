/**
 * Notification Integration Tests
 * Tests the notification system functionality
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Case = require('../../models/Case');
const Notification = require('../../models/Notification');
const User = require('../../models/User');

// Import app without starting the server
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const notificationRoutes = require('../../routes/notificationRoutes');
app.use('/api', notificationRoutes);

describe('Notification Integration Tests', () => {
  let patientToken;
  let patientId;
  let doctorToken;
  let doctorId;
  let caseId;
  let notificationId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /notification-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /notification-test.*@test\.com/ });
    await User.deleteMany({ email: /notification-test.*@test\.com/ });
    await Notification.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Notification Test Patient',
      email: 'notification-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id;

    // Create test doctor
    const doctor = new Doctor({
      name: 'Notification Test Doctor',
      email: 'notification-test-doctor@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1985-01-01',
      degree: 'MBBS',
      specializations: ['General Medicine'],
      experienceYears: 5,
      subscriptionStatus: 'active'
    });
    await doctor.save();
    doctorId = doctor._id;

    // Generate tokens
    const jwt = require('jsonwebtoken');
    patientToken = jwt.sign(
      { id: patientId, role: 'patient' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
    doctorToken = jwt.sign(
      { id: doctorId, role: 'doctor' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    // Create a test case
    const testCase = new Case({
      patientId,
      doctorId,
      symptoms: ['headache'],
      status: 'pending'
    });
    await testCase.save();
    caseId = testCase._id;

    // Create test notifications
    const notification = await Notification.createNotification({
      userId: doctorId,
      userType: 'doctor',
      type: 'case_request',
      title: 'New Case Request',
      message: 'Test patient has requested a consultation',
      caseId,
      relatedUserId: patientId,
      relatedUserType: 'patient'
    });
    notificationId = notification._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /notification-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /notification-test.*@test\.com/ });
    await User.deleteMany({ email: /notification-test.*@test\.com/ });
    await Notification.deleteMany({});
    await Case.deleteMany({ patientId });
    
    // Close database connection
    await mongoose.connection.close();
  });

  describe('GET /api/notifications', () => {
    it('should get all notifications for doctor', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toBeDefined();
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(response.body.notifications.length).toBeGreaterThan(0);
    });

    it('should filter notifications by type', async () => {
      const response = await request(app)
        .get('/api/notifications?type=case_request')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.notifications.every(n => n.type === 'case_request')).toBe(true);
    });

    it('should filter notifications by read status', async () => {
      const response = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.notifications.every(n => n.isRead === false)).toBe(true);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should get unread notification count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.unreadCount).toBeDefined();
      expect(typeof response.body.unreadCount).toBe('number');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.notification.isRead).toBe(true);
      expect(response.body.notification.readAt).toBeDefined();
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized access', async () => {
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Create another unread notification
      await Notification.createNotification({
        userId: doctorId,
        userType: 'doctor',
        type: 'case_accepted',
        title: 'Case Accepted',
        message: 'Another test notification',
        caseId
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.modifiedCount).toBeDefined();

      // Verify all notifications are read
      const unreadCount = await Notification.getUnreadCount(doctorId);
      expect(unreadCount).toBe(0);
    });
  });
});
