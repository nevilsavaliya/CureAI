/**
 * Case Workflow Integration Tests
 * Tests the complete case workflow from creation to completion
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Case = require('../../models/Case');
const Message = require('../../models/Message');
const Notification = require('../../models/Notification');

// Import app - use the same pattern as other integration tests
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware
const authMiddleware = require('../../middleware/auth');

// Routes
const caseRoutes = require('../../routes/caseRoutes');
app.use('/api', caseRoutes);

describe('Case Workflow Integration Tests', () => {
  let patientToken;
  let patientId;
  let doctorToken;
  let doctorId;
  let caseId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /case-workflow-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /case-workflow-test.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Case Workflow Test Patient',
      email: 'case-workflow-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id;

    // Create test doctor
    const doctor = new Doctor({
      name: 'Case Workflow Test Doctor',
      email: 'case-workflow-test-doctor@test.com',
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
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /case-workflow-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /case-workflow-test.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Complete Case Workflow', () => {
    it('should create a new case request', async () => {
      const caseData = {
        doctorId,
        symptoms: ['headache', 'fever', 'fatigue'],
        predictedConditions: ['Common Cold', 'Flu'],
        chatbotHistory: [
          { question: 'What are your symptoms?', answer: 'Headache and fever', timestamp: new Date() },
          { question: 'How long have you had these symptoms?', answer: '3 days', timestamp: new Date() }
        ]
      };

      const res = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(caseData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.case).toBeDefined();
      expect(res.body.case.status).toBe('pending');
      expect(res.body.case.symptoms).toEqual(caseData.symptoms);
      
      caseId = res.body.case._id;
    });

    it('should create notification for doctor when case is created', async () => {
      const notifications = await Notification.find({
        userId: doctorId,
        type: 'case_request',
        caseId
      });

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].isRead).toBe(false);
    });

    it('should allow doctor to view pending case', async () => {
      const res = await request(app)
        .get(`/api/cases/${caseId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.case.status).toBe('pending');
      expect(res.body.case.patientId).toBeDefined();
    });

    it('should allow doctor to accept the case', async () => {
      const res = await request(app)
        .put(`/api/cases/${caseId}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.case.status).toBe('ongoing');
      expect(res.body.case.acceptedAt).toBeDefined();
    });

    it('should create notification for patient when case is accepted', async () => {
      const notifications = await Notification.find({
        userId: patientId,
        type: 'case_accepted',
        caseId
      });

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should allow patient to send message in ongoing case', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          content: 'Hello doctor, my symptoms are getting worse'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello doctor, my symptoms are getting worse');
    });

    it('should allow doctor to send message in ongoing case', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          content: 'Please take rest and drink plenty of fluids'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should retrieve all messages for the case', async () => {
      const res = await request(app)
        .get(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.messages).toHaveLength(2);
    });

    it('should allow doctor to mark case as treated', async () => {
      const res = await request(app)
        .put(`/api/cases/${caseId}/mark-treated`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          treatmentNotes: 'Patient advised to rest and take fluids',
          diagnosis: 'Common Cold',
          prescription: 'Paracetamol 500mg twice daily'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.case.status).toBe('treated');
      expect(res.body.case.treatedAt).toBeDefined();
      expect(res.body.case.diagnosis).toBe('Common Cold');
    });

    it('should create notification for patient when case is treated', async () => {
      const notifications = await Notification.find({
        userId: patientId,
        type: 'case_treated',
        caseId
      });

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should prevent sending messages in treated case', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          content: 'Trying to send message after treatment'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow patient to submit feedback', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseId}/feedback`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          rating: 5,
          comment: 'Excellent treatment and care'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.case.feedback.rating).toBe(5);
    });

    it('should update doctor rating after feedback', async () => {
      const doctor = await Doctor.findById(doctorId);
      expect(doctor.totalReviews).toBeGreaterThan(0);
      expect(doctor.rating).toBeGreaterThan(0);
    });

    it('should preserve all case data after completion', async () => {
      const res = await request(app)
        .get(`/api/cases/${caseId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      const caseData = res.body.case;
      
      expect(caseData.symptoms).toBeDefined();
      expect(caseData.predictedConditions).toBeDefined();
      expect(caseData.chatbotHistory).toBeDefined();
      expect(caseData.diagnosis).toBeDefined();
      expect(caseData.treatmentNotes).toBeDefined();
      expect(caseData.feedback).toBeDefined();
    });
  });

  describe('Case Rejection Workflow', () => {
    let rejectedCaseId;

    it('should create a new case for rejection test', async () => {
      const res = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          symptoms: ['back pain'],
          predictedConditions: ['Muscle Strain']
        });

      expect(res.status).toBe(201);
      rejectedCaseId = res.body.case._id;
    });

    it('should allow doctor to reject the case', async () => {
      const res = await request(app)
        .put(`/api/cases/${rejectedCaseId}/reject`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.case.status).toBe('rejected');
      expect(res.body.case.rejectedAt).toBeDefined();
    });

    it('should create notification for patient when case is rejected', async () => {
      const notifications = await Notification.find({
        userId: patientId,
        type: 'case_rejected',
        caseId: rejectedCaseId
      });

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should prevent sending messages in rejected case', async () => {
      const res = await request(app)
        .post(`/api/cases/${rejectedCaseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          content: 'Trying to send message after rejection'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Case Filtering and Search', () => {
    it('should filter cases by status for patient', async () => {
      const res = await request(app)
        .get('/api/cases?status=treated')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cases.every(c => c.status === 'treated')).toBe(true);
    });

    it('should filter cases by status for doctor', async () => {
      const res = await request(app)
        .get('/api/cases?status=ongoing')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get all cases for patient', async () => {
      const res = await request(app)
        .get('/api/cases')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cases.length).toBeGreaterThan(0);
    });
  });
});
