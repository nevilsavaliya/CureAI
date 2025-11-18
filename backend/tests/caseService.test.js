/**
 * Case Service Unit Tests
 * Tests case model methods and business logic
 */

const mongoose = require('mongoose');
const Case = require('../models/Case');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

describe('Case Service Unit Tests', () => {
  let patientId;
  let doctorId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /case-service-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /case-service-test.*@test\.com/ });
    await Case.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Case Service Test Patient',
      email: 'case-service-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id;

    // Create test doctor
    const doctor = new Doctor({
      name: 'Case Service Test Doctor',
      email: 'case-service-test-doctor@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1985-01-01',
      degree: 'MBBS',
      specializations: ['General Medicine'],
      experienceYears: 5,
      subscriptionStatus: 'active',
      rating: 4.0,
      totalReviews: 10
    });
    await doctor.save();
    doctorId = doctor._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /case-service-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /case-service-test.*@test\.com/ });
    await Case.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean cases after each test
    await Case.deleteMany({});
  });

  describe('Case Creation', () => {
    it('should create a case with required fields', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache', 'fever'],
        predictedConditions: ['Common Cold'],
        status: 'pending'
      });

      await caseData.save();

      expect(caseData._id).toBeDefined();
      expect(caseData.status).toBe('pending');
      expect(caseData.symptoms).toEqual(['headache', 'fever']);
    });

    it('should create case with chatbot history', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['cough'],
        chatbotHistory: [
          { question: 'What are your symptoms?', answer: 'Cough', timestamp: new Date() }
        ],
        status: 'pending'
      });

      await caseData.save();

      expect(caseData.chatbotHistory).toHaveLength(1);
      expect(caseData.chatbotHistory[0].question).toBe('What are your symptoms?');
    });
  });

  describe('Case Accept Method', () => {
    it('should accept a pending case', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'pending'
      });
      await caseData.save();

      await caseData.accept();

      expect(caseData.status).toBe('ongoing');
      expect(caseData.acceptedAt).toBeDefined();
    });

    it('should update status when accepting non-pending case', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'ongoing',
        acceptedAt: new Date()
      });
      await caseData.save();

      // Model allows this - validation is in controller
      await caseData.accept();
      expect(caseData.status).toBe('ongoing');
    });
  });

  describe('Case Reject Method', () => {
    it('should reject a pending case', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'pending'
      });
      await caseData.save();

      await caseData.reject();

      expect(caseData.status).toBe('rejected');
      expect(caseData.rejectedAt).toBeDefined();
    });

    it('should update status when rejecting non-pending case', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'ongoing',
        acceptedAt: new Date()
      });
      await caseData.save();

      // Model allows this - validation is in controller
      await caseData.reject();
      expect(caseData.status).toBe('rejected');
    });
  });

  describe('Mark As Treated Method', () => {
    it('should mark ongoing case as treated', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'ongoing',
        acceptedAt: new Date()
      });
      await caseData.save();

      await caseData.markAsTreated();

      expect(caseData.status).toBe('treated');
      expect(caseData.treatedAt).toBeDefined();
    });

    it('should update status when marking non-ongoing case as treated', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'pending'
      });
      await caseData.save();

      // Model allows this - validation is in controller
      await caseData.markAsTreated();
      expect(caseData.status).toBe('treated');
    });
  });

  describe('Add Feedback Method', () => {
    it('should add feedback to treated case', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'treated',
        acceptedAt: new Date(),
        treatedAt: new Date()
      });
      await caseData.save();

      await caseData.addFeedback(5, 'Excellent treatment');

      expect(caseData.feedback.rating).toBe(5);
      expect(caseData.feedback.comment).toBe('Excellent treatment');
      expect(caseData.feedback.submittedAt).toBeDefined();
    });

    it('should allow adding feedback to any case status', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'ongoing',
        acceptedAt: new Date()
      });
      await caseData.save();

      // Model allows this - validation is in controller
      await caseData.addFeedback(5, 'Test');
      expect(caseData.feedback.rating).toBe(5);
    });

    it('should allow updating feedback', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'treated',
        acceptedAt: new Date(),
        treatedAt: new Date(),
        feedback: {
          rating: 4,
          comment: 'Good',
          submittedAt: new Date()
        }
      });
      await caseData.save();

      // Model allows this - validation is in controller
      await caseData.addFeedback(5, 'Changed');
      expect(caseData.feedback.rating).toBe(5);
    });

    it('should validate rating range via mongoose schema', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'treated',
        acceptedAt: new Date(),
        treatedAt: new Date()
      });
      await caseData.save();

      // Mongoose schema validation will catch invalid ratings
      await expect(caseData.addFeedback(6, 'Test')).rejects.toThrow();
      await expect(caseData.addFeedback(0, 'Test')).rejects.toThrow();
    });
  });

  describe('Case Status Transitions', () => {
    it('should follow correct status flow: pending -> ongoing -> treated', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'pending'
      });
      await caseData.save();

      // Accept case
      await caseData.accept();
      expect(caseData.status).toBe('ongoing');

      // Mark as treated
      await caseData.markAsTreated();
      expect(caseData.status).toBe('treated');

      // Add feedback
      await caseData.addFeedback(5, 'Great');
      expect(caseData.feedback.rating).toBe(5);
    });

    it('should follow rejection flow: pending -> rejected', async () => {
      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: ['headache'],
        status: 'pending'
      });
      await caseData.save();

      await caseData.reject();
      expect(caseData.status).toBe('rejected');
    });
  });

  describe('Case Data Preservation', () => {
    it('should preserve all data after marking as treated', async () => {
      const originalSymptoms = ['headache', 'fever'];
      const originalConditions = ['Common Cold'];
      const originalHistory = [
        { question: 'Symptoms?', answer: 'Headache', timestamp: new Date() }
      ];

      const caseData = new Case({
        patientId,
        doctorId,
        symptoms: originalSymptoms,
        predictedConditions: originalConditions,
        chatbotHistory: originalHistory,
        status: 'ongoing',
        acceptedAt: new Date()
      });
      await caseData.save();

      await caseData.markAsTreated();

      // Verify all data is preserved
      expect(caseData.symptoms).toEqual(originalSymptoms);
      expect(caseData.predictedConditions).toEqual(originalConditions);
      expect(caseData.chatbotHistory).toHaveLength(1);
      expect(caseData.status).toBe('treated');
    });
  });
});
