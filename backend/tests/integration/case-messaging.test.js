/**
 * Case Messaging Integration Tests
 * Tests the case-specific messaging functionality
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Case = require('../../models/Case');
const Message = require('../../models/Message');
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
const caseRoutes = require('../../routes/caseRoutes');
app.use('/api', caseRoutes);

describe('Case Messaging Integration Tests', () => {
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
    await Patient.deleteMany({ email: /case-msg-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /case-msg-test.*@test\.com/ });
    await User.deleteMany({ email: /case-msg-test.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({ caseId: { $exists: true } });

    // Create test patient directly in database
    const patient = new Patient({
      name: 'Case Msg Test Patient',
      email: 'case-msg-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id;

    // Create test doctor directly in database
    const doctor = new Doctor({
      name: 'Case Msg Test Doctor',
      email: 'case-msg-test-doctor@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1985-01-01',
      degree: 'MBBS',
      specializations: ['General Medicine'],
      experienceYears: 5,
      subscriptionStatus: 'active'
    });
    await doctor.save();
    doctorId = doctor._id;

    // Generate tokens manually
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

    // Create a test case directly in database
    const testCase = new Case({
      patientId,
      doctorId,
      symptoms: ['headache', 'fever'],
      predictedConditions: ['Common Cold'],
      chatbotHistory: [
        { question: 'What are your symptoms?', answer: 'Headache and fever', timestamp: new Date() }
      ],
      status: 'ongoing',
      acceptedAt: new Date()
    });
    await testCase.save();
    caseId = testCase._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /case-msg-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /case-msg-test.*@test\.com/ });
    await User.deleteMany({ email: /case-msg-test.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({ caseId: { $exists: true } });
    await mongoose.connection.close();
  });

  describe('POST /api/cases/:caseId/messages', () => {
    it('should allow patient to send message in ongoing case', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          content: 'Hello doctor, I need help with my symptoms'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello doctor, I need help with my symptoms');
      expect(res.body.data.caseId).toBe(caseId);
    });

    it('should allow doctor to send message in ongoing case', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          content: 'Hello, I can help you. Please describe your symptoms in detail.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello, I can help you. Please describe your symptoms in detail.');
    });

    it('should reject message with empty content', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          content: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    it('should reject message exceeding 5000 characters', async () => {
      const longContent = 'a'.repeat(5001);
      const res = await request(app)
        .post(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          content: longContent
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('5000 characters');
    });

    it('should reject unauthorized user from sending message', async () => {
      // Create another patient
      const otherPatientRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Other Patient',
          email: 'case-msg-test-other@test.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!',
          role: 'patient',
          dateOfBirth: '1990-01-01',
          bloodGroup: 'A+'
        });

      const otherToken = otherPatientRes.body.token;

      const res = await request(app)
        .post(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          content: 'Trying to send unauthorized message'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/cases/:caseId/messages', () => {
    it('should retrieve all messages for a case', async () => {
      const res = await request(app)
        .get(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.messages).toBeInstanceOf(Array);
      expect(res.body.messages.length).toBeGreaterThan(0);
      expect(res.body.totalMessages).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get(`/api/cases/${caseId}/messages?page=1&limit=1`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.messages.length).toBeLessThanOrEqual(1);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should reject unauthorized user from viewing messages', async () => {
      // Use the other patient token
      const otherPatientRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'case-msg-test-other@test.com',
          password: 'TestPass123!'
        });

      const otherToken = otherPatientRes.body.token;

      const res = await request(app)
        .get(`/api/cases/${caseId}/messages`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/messages/:id/read', () => {
    let messageId;

    beforeAll(async () => {
      // Get a message sent by patient (to be read by doctor)
      const messages = await Message.find({ caseId, senderModel: 'Patient' }).limit(1);
      if (messages.length > 0) {
        messageId = messages[0]._id.toString();
      }
    });

    it('should mark message as read by recipient', async () => {
      if (!messageId) {
        console.log('No message found to test read functionality');
        return;
      }

      const res = await request(app)
        .put(`/api/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify message is marked as read
      const message = await Message.findById(messageId);
      expect(message.isRead).toBe(true);
      expect(message.readAt).toBeDefined();
    });

    it('should reject non-recipient from marking message as read', async () => {
      if (!messageId) {
        return;
      }

      const res = await request(app)
        .put(`/api/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Case Data Preservation After Completion', () => {
    let treatedCaseId;
    let rejectedCaseId;

    beforeAll(async () => {
      // Create a case to be marked as treated
      const treatedCase = new Case({
        patientId,
        doctorId,
        symptoms: ['cough', 'sore throat'],
        predictedConditions: ['Upper Respiratory Infection'],
        chatbotHistory: [
          { question: 'How long have you had these symptoms?', answer: '3 days', timestamp: new Date() }
        ],
        status: 'ongoing',
        acceptedAt: new Date()
      });
      await treatedCase.save();
      treatedCaseId = treatedCase._id;

      // Add some messages to the treated case
      const message1 = new Message({
        caseId: treatedCaseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'I have been coughing for 3 days',
        messageType: 'text'
      });
      await message1.save();

      const message2 = new Message({
        caseId: treatedCaseId,
        senderId: doctorId,
        senderModel: 'Doctor',
        recipientId: patientId,
        recipientModel: 'Patient',
        content: 'I recommend rest and fluids',
        messageType: 'text'
      });
      await message2.save();

      // Mark case as treated
      await request(app)
        .put(`/api/cases/${treatedCaseId}/mark-treated`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({});

      // Create a rejected case
      const rejectedCase = new Case({
        patientId,
        doctorId,
        symptoms: ['back pain'],
        predictedConditions: ['Muscle Strain'],
        status: 'pending'
      });
      await rejectedCase.save();
      rejectedCaseId = rejectedCase._id;

      // Reject the case
      await request(app)
        .put(`/api/cases/${rejectedCaseId}/reject`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({});
    });

    it('should preserve all case data after marking as treated', async () => {
      const res = await request(app)
        .get(`/api/cases/${treatedCaseId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const caseData = res.body.case;
      expect(caseData.status).toBe('treated');
      expect(caseData.symptoms).toEqual(['cough', 'sore throat']);
      expect(caseData.predictedConditions).toEqual(['Upper Respiratory Infection']);
      expect(caseData.chatbotHistory).toHaveLength(1);
      expect(caseData.treatedAt).toBeDefined();
    });

    it('should preserve all messages after case is treated', async () => {
      const res = await request(app)
        .get(`/api/cases/${treatedCaseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0].content).toBe('I have been coughing for 3 days');
      expect(res.body.messages[1].content).toBe('I recommend rest and fluids');
    });

    it('should prevent sending messages in treated case', async () => {
      const res = await request(app)
        .post(`/api/cases/${treatedCaseId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          content: 'Trying to send message after treatment'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot send messages');
      expect(res.body.message).toContain('read-only');
    });

    it('should prevent marking treated case as treated again', async () => {
      const res = await request(app)
        .put(`/api/cases/${treatedCaseId}/mark-treated`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot mark case as treated');
    });

    it('should preserve all case data after rejection', async () => {
      const res = await request(app)
        .get(`/api/cases/${rejectedCaseId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const caseData = res.body.case;
      expect(caseData.status).toBe('rejected');
      expect(caseData.symptoms).toEqual(['back pain']);
      expect(caseData.predictedConditions).toEqual(['Muscle Strain']);
      expect(caseData.rejectedAt).toBeDefined();
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
      expect(res.body.message).toContain('Cannot send messages');
    });

    it('should allow viewing treated case history at any time', async () => {
      // Simulate time passing by waiting a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .get(`/api/cases/${treatedCaseId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.case.status).toBe('treated');
      
      // Verify all data is still intact
      expect(res.body.case.symptoms).toBeDefined();
      expect(res.body.case.predictedConditions).toBeDefined();
      expect(res.body.case.chatbotHistory).toBeDefined();
    });

    it('should allow doctor to view treated case history', async () => {
      const res = await request(app)
        .get(`/api/cases/${treatedCaseId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.case.status).toBe('treated');
      
      // Verify doctor can access all patient data
      expect(res.body.case.patientId).toBeDefined();
      expect(res.body.case.symptoms).toBeDefined();
      expect(res.body.case.chatbotHistory).toBeDefined();
    });

    it('should prevent feedback modification once submitted', async () => {
      // Submit feedback
      await request(app)
        .post(`/api/cases/${treatedCaseId}/feedback`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          rating: 5,
          comment: 'Excellent treatment'
        });

      // Try to submit feedback again
      const res = await request(app)
        .post(`/api/cases/${treatedCaseId}/feedback`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          rating: 3,
          comment: 'Changed my mind'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already been submitted');
      expect(res.body.message).toContain('cannot be modified');
    });

    it('should preserve feedback data permanently', async () => {
      const res = await request(app)
        .get(`/api/cases/${treatedCaseId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.case.feedback).toBeDefined();
      expect(res.body.case.feedback.rating).toBe(5);
      expect(res.body.case.feedback.comment).toBe('Excellent treatment');
      expect(res.body.case.feedback.submittedAt).toBeDefined();
    });
  });
});
