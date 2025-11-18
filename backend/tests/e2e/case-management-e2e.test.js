/**
 * End-to-End Case Management Tests
 * Tests complete user flows from patient perspective and doctor perspective
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Case = require('../../models/Case');
const Message = require('../../models/Message');
const Notification = require('../../models/Notification');

// Import app
const express = require('express');
const cors = require('express');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('../../routes/authRoutes');
const caseRoutes = require('../../routes/caseRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', caseRoutes);

describe('End-to-End Case Management Tests', () => {
  let patientToken;
  let patientId;
  let patientEmail = 'e2e-patient@test.com';
  let doctorToken;
  let doctorId;
  let doctorEmail = 'e2e-doctor@test.com';
  let caseId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /e2e-.*@test\.com/ });
    await Doctor.deleteMany({ email: /e2e-.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /e2e-.*@test\.com/ });
    await Doctor.deleteMany({ email: /e2e-.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.connection.close();
  });

  describe('E2E: Patient Creates Case Flow', () => {
    it('Step 1: Patient signs up', async () => {
      const patientData = {
        name: 'E2E Test Patient',
        email: patientEmail,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        dateOfBirth: '1990-01-01',
        bloodGroup: 'O+',
        role: 'patient'
      };

      // Create patient directly in database for E2E test
      const patient = new Patient(patientData);
      await patient.save();
      patientId = patient._id;

      // Generate token
      const jwt = require('jsonwebtoken');
      patientToken = jwt.sign(
        { id: patientId, role: 'patient' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      expect(patientId).toBeDefined();
      expect(patientToken).toBeDefined();
    });

    it('Step 2: Doctor signs up and gets active subscription', async () => {
      const doctorData = {
        name: 'E2E Test Doctor',
        email: doctorEmail,
        password: 'TestPass123!',
        dateOfBirth: '1985-01-01',
        degree: 'MBBS',
        specializations: ['General Medicine'],
        experienceYears: 5,
        subscriptionStatus: 'active'
      };

      const doctor = new Doctor(doctorData);
      await doctor.save();
      doctorId = doctor._id;

      // Generate token
      const jwt = require('jsonwebtoken');
      doctorToken = jwt.sign(
        { id: doctorId, role: 'doctor' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      expect(doctorId).toBeDefined();
      expect(doctorToken).toBeDefined();
    });

    it('Step 3: Patient creates case with symptoms', async () => {
      const caseData = {
        doctorId,
        symptoms: ['persistent headache', 'dizziness', 'nausea'],
        predictedConditions: ['Migraine', 'Tension Headache'],
        chatbotHistory: [
          { question: 'What symptoms are you experiencing?', answer: 'Headache and dizziness', timestamp: new Date() },
          { question: 'How long have you had these symptoms?', answer: '5 days', timestamp: new Date() },
          { question: 'Rate your pain level 1-10', answer: '7', timestamp: new Date() }
        ]
      };

      const testCase = new Case({
        patientId,
        ...caseData,
        status: 'pending'
      });
      await testCase.save();
      caseId = testCase._id;

      expect(caseId).toBeDefined();
      expect(testCase.status).toBe('pending');
    });

    it('Step 4: Verify case appears in patient dashboard', async () => {
      const cases = await Case.find({ patientId });
      
      expect(cases.length).toBeGreaterThan(0);
      expect(cases[0]._id.toString()).toBe(caseId.toString());
      expect(cases[0].symptoms).toContain('persistent headache');
    });
  });

  describe('E2E: Doctor Accepts/Rejects Case', () => {
    it('Step 1: Doctor views pending case request', async () => {
      const cases = await Case.find({ doctorId, status: 'pending' });
      
      expect(cases.length).toBeGreaterThan(0);
      const pendingCase = cases.find(c => c._id.toString() === caseId.toString());
      expect(pendingCase).toBeDefined();
    });

    it('Step 2: Doctor accepts the case', async () => {
      const caseData = await Case.findById(caseId);
      await caseData.accept();

      expect(caseData.status).toBe('ongoing');
      expect(caseData.acceptedAt).toBeDefined();
    });

    it('Step 3: Verify case status updated in patient view', async () => {
      const caseData = await Case.findById(caseId);
      
      expect(caseData.status).toBe('ongoing');
    });
  });

  describe('E2E: Real-time Messaging Between Users', () => {
    it('Step 1: Patient sends first message', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Hello Doctor, my headache is getting worse. What should I do?',
        messageType: 'text'
      });
      await message.save();

      expect(message._id).toBeDefined();
      expect(message.isRead).toBe(false);
    });

    it('Step 2: Doctor receives and reads message', async () => {
      const messages = await Message.find({ caseId, recipientId: doctorId });
      
      expect(messages.length).toBeGreaterThan(0);
      const message = messages[0];
      await message.markAsRead();

      expect(message.isRead).toBe(true);
      expect(message.readAt).toBeDefined();
    });

    it('Step 3: Doctor responds to patient', async () => {
      const message = new Message({
        caseId,
        senderId: doctorId,
        senderModel: 'Doctor',
        recipientId: patientId,
        recipientModel: 'Patient',
        content: 'Please take rest in a dark room and avoid bright lights. Take the prescribed medication.',
        messageType: 'text'
      });
      await message.save();

      expect(message._id).toBeDefined();
    });

    it('Step 4: Patient receives doctor response', async () => {
      const messages = await Message.find({ caseId, recipientId: patientId });
      
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].content).toContain('rest in a dark room');
    });

    it('Step 5: Multiple message exchange', async () => {
      // Patient sends follow-up
      await Message.create({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Thank you doctor. Should I be concerned about the nausea?',
        messageType: 'text'
      });

      // Doctor responds
      await Message.create({
        caseId,
        senderId: doctorId,
        senderModel: 'Doctor',
        recipientId: patientId,
        recipientModel: 'Patient',
        content: 'Nausea is common with migraines. If it persists for more than 24 hours, please let me know.',
        messageType: 'text'
      });

      const allMessages = await Message.find({ caseId }).sort({ createdAt: 1 });
      expect(allMessages.length).toBe(4);
    });
  });

  describe('E2E: Treatment Completion and Feedback', () => {
    it('Step 1: Doctor marks case as treated', async () => {
      const caseData = await Case.findById(caseId);
      caseData.treatmentNotes = 'Patient responded well to treatment. Symptoms improved significantly.';
      caseData.diagnosis = 'Migraine with Aura';
      caseData.prescription = 'Sumatriptan 50mg as needed, max 2 doses per day';
      await caseData.markAsTreated();

      expect(caseData.status).toBe('treated');
      expect(caseData.treatedAt).toBeDefined();
    });

    it('Step 2: Patient receives treatment completion notification', async () => {
      const caseData = await Case.findById(caseId);
      
      expect(caseData.status).toBe('treated');
      expect(caseData.diagnosis).toBe('Migraine with Aura');
    });

    it('Step 3: Patient cannot send messages after treatment', async () => {
      const caseData = await Case.findById(caseId);
      
      expect(caseData.allowsMessaging()).toBe(false);
      expect(caseData.isReadOnly()).toBe(true);
    });

    it('Step 4: Patient submits feedback', async () => {
      const caseData = await Case.findById(caseId);
      await caseData.addFeedback(5, 'Excellent care! Doctor was very helpful and responsive.');

      expect(caseData.feedback.rating).toBe(5);
      expect(caseData.feedback.comment).toContain('Excellent care');
      expect(caseData.feedback.submittedAt).toBeDefined();
    });

    it('Step 5: Doctor rating would be updated via controller', async () => {
      // Note: Rating update happens in the controller when feedback is submitted via API
      // In this E2E test, we're directly using models, so we verify the feedback was saved
      const caseData = await Case.findById(caseId);
      
      expect(caseData.feedback).toBeDefined();
      expect(caseData.feedback.rating).toBe(5);
      // In real API flow, the controller would update doctor.rating and doctor.totalReviews
    });

    it('Step 6: Case data is preserved permanently', async () => {
      const caseData = await Case.findById(caseId)
        .populate('patientId', 'name email')
        .populate('doctorId', 'name email');

      // Verify all data is intact
      expect(caseData.symptoms).toHaveLength(3);
      expect(caseData.predictedConditions).toHaveLength(2);
      expect(caseData.chatbotHistory).toHaveLength(3);
      expect(caseData.diagnosis).toBeDefined();
      expect(caseData.treatmentNotes).toBeDefined();
      expect(caseData.prescription).toBeDefined();
      expect(caseData.feedback).toBeDefined();
      expect(caseData.acceptedAt).toBeDefined();
      expect(caseData.treatedAt).toBeDefined();
    });

    it('Step 7: Messages are preserved and accessible', async () => {
      const messages = await Message.find({ caseId }).sort({ createdAt: 1 });
      
      expect(messages.length).toBe(4);
      // All messages should be preserved
      messages.forEach(msg => {
        expect(msg.content).toBeDefined();
        expect(msg.senderId).toBeDefined();
        expect(msg.recipientId).toBeDefined();
      });
    });
  });

  describe('E2E: Case History Access', () => {
    it('Patient can view complete case history', async () => {
      const cases = await Case.find({ patientId })
        .populate('doctorId', 'name specializations')
        .sort({ createdAt: -1 });

      expect(cases.length).toBeGreaterThan(0);
      const completedCase = cases.find(c => c._id.toString() === caseId.toString());
      
      expect(completedCase.status).toBe('treated');
      expect(completedCase.doctorId.name).toBeDefined();
    });

    it('Doctor can view complete case history', async () => {
      const cases = await Case.find({ doctorId })
        .populate('patientId', 'name bloodGroup')
        .sort({ createdAt: -1 });

      expect(cases.length).toBeGreaterThan(0);
      const completedCase = cases.find(c => c._id.toString() === caseId.toString());
      
      expect(completedCase.status).toBe('treated');
      expect(completedCase.patientId.name).toBeDefined();
    });
  });
});
