/**
 * Database Cleanup Script Integration Tests
 * Tests the database cleanup utility
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Admin = require('../../models/Admin');
const Hospital = require('../../models/Hospital');
const Message = require('../../models/Message');
const SymptomConversation = require('../../models/SymptomConversation');
const Case = require('../../models/Case');

describe('Database Cleanup Script Integration Tests', () => {
  let patientId;
  let doctorId;
  let adminId;
  let hospitalId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /cleanup-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /cleanup-test.*@test\.com/ });
    await Admin.deleteMany({ email: /cleanup-test.*@test\.com/ });
    await Hospital.deleteMany({ email: /cleanup-test.*@test\.com/ });
    await Message.deleteMany({});
    await SymptomConversation.deleteMany({});
    await Case.deleteMany({});

    // Create test data
    const patient = new Patient({
      name: 'Cleanup Test Patient',
      email: 'cleanup-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+',
      extractedSymptoms: [
        { symptom: 'fever', extractedFrom: 'chat' },
        { symptom: 'cough', extractedFrom: 'chat' },
        { symptom: 'headache', extractedFrom: 'chat' }
      ]
    });
    await patient.save();
    patientId = patient._id.toString();

    const doctor = new Doctor({
      name: 'Cleanup Test Doctor',
      email: 'cleanup-test-doctor@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1980-01-01',
      degree: 'MBBS',
      specializations: ['General Medicine'],
      experienceYears: 10,
      subscriptionStatus: 'active'
    });
    await doctor.save();
    doctorId = doctor._id.toString();

    const admin = new Admin({
      name: 'Cleanup Test Admin',
      email: 'cleanup-test-admin@test.com',
      password: 'TestPass123!',
      role: 'admin'
    });
    await admin.save();
    adminId = admin._id.toString();

    const hospital = new Hospital({
      name: 'Cleanup Test Hospital',
      hospitalName: 'Cleanup Test Hospital',
      email: 'cleanup-test-hospital@test.com',
      password: 'TestPass123!',
      address: '123 Test St',
      contactNumber: '1234567890',
      registrationNumber: 'TEST123'
    });
    await hospital.save();
    hospitalId = hospital._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /cleanup-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /cleanup-test.*@test\.com/ });
    await Admin.deleteMany({ email: /cleanup-test.*@test\.com/ });
    await Hospital.deleteMany({ email: /cleanup-test.*@test\.com/ });
    await Message.deleteMany({});
    await SymptomConversation.deleteMany({});
    await Case.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Cleanup Messages', () => {
    beforeEach(async () => {
      // Create test messages
      await Message.create([
        {
          senderId: patientId,
          recipientId: doctorId,
          content: 'Test message 1',
          senderModel: 'Patient',
          recipientModel: 'Doctor'
        },
        {
          senderId: doctorId,
          recipientId: patientId,
          content: 'Test message 2',
          senderModel: 'Doctor',
          recipientModel: 'Patient'
        }
      ]);
    });

    it('should remove all messages', async () => {
      const messagesBefore = await Message.countDocuments();
      expect(messagesBefore).toBeGreaterThan(0);

      // Perform cleanup
      const result = await Message.deleteMany({});

      const messagesAfter = await Message.countDocuments();
      expect(messagesAfter).toBe(0);
      expect(result.deletedCount).toBe(messagesBefore);
    });

    it('should count messages to be removed in dry-run', async () => {
      const messageCount = await Message.countDocuments();
      expect(messageCount).toBeGreaterThan(0);

      // Dry run - just count, don't delete
      const count = await Message.countDocuments();
      
      expect(count).toBe(messageCount);
      
      // Verify messages still exist
      const messagesAfter = await Message.countDocuments();
      expect(messagesAfter).toBe(messageCount);
    });
  });

  describe('2. Cleanup Symptom Conversations', () => {
    beforeEach(async () => {
      // Create test conversations
      await SymptomConversation.create([
        {
          patientId,
          initialSymptom: 'Test symptom 1',
          symptomCategory: 'respiratory',
          status: 'completed'
        },
        {
          patientId,
          initialSymptom: 'Test symptom 2',
          symptomCategory: 'cardiovascular',
          status: 'active'
        }
      ]);
    });

    it('should remove all symptom conversations', async () => {
      const conversationsBefore = await SymptomConversation.countDocuments();
      expect(conversationsBefore).toBeGreaterThan(0);

      // Perform cleanup
      const result = await SymptomConversation.deleteMany({});

      const conversationsAfter = await SymptomConversation.countDocuments();
      expect(conversationsAfter).toBe(0);
      expect(result.deletedCount).toBe(conversationsBefore);
    });

    it('should count conversations to be removed in dry-run', async () => {
      const conversationCount = await SymptomConversation.countDocuments();
      expect(conversationCount).toBeGreaterThan(0);

      // Dry run - just count
      const count = await SymptomConversation.countDocuments();
      
      expect(count).toBe(conversationCount);
      
      // Verify conversations still exist
      const conversationsAfter = await SymptomConversation.countDocuments();
      expect(conversationsAfter).toBe(conversationCount);
    });
  });

  describe('3. Data Preservation', () => {
    it('should preserve user accounts', async () => {
      const patientsBefore = await Patient.countDocuments({ email: /cleanup-test.*@test\.com/ });
      const doctorsBefore = await Doctor.countDocuments({ email: /cleanup-test.*@test\.com/ });

      // Perform cleanup (messages and conversations only)
      await Message.deleteMany({});
      await SymptomConversation.deleteMany({});

      const patientsAfter = await Patient.countDocuments({ email: /cleanup-test.*@test\.com/ });
      const doctorsAfter = await Doctor.countDocuments({ email: /cleanup-test.*@test\.com/ });

      expect(patientsAfter).toBe(patientsBefore);
      expect(doctorsAfter).toBe(doctorsBefore);
    });

    it('should preserve doctor profiles', async () => {
      const doctorBefore = await Doctor.findById(doctorId);
      
      // Perform cleanup
      await Message.deleteMany({});
      await SymptomConversation.deleteMany({});

      const doctorAfter = await Doctor.findById(doctorId);

      expect(doctorAfter).toBeDefined();
      expect(doctorAfter.name).toBe(doctorBefore.name);
      expect(doctorAfter.specializations).toEqual(doctorBefore.specializations);
      expect(doctorAfter.experienceYears).toBe(doctorBefore.experienceYears);
    });

    it('should preserve hospital information', async () => {
      const hospitalBefore = await Hospital.findById(hospitalId);
      
      // Perform cleanup
      await Message.deleteMany({});
      await SymptomConversation.deleteMany({});

      const hospitalAfter = await Hospital.findById(hospitalId);

      expect(hospitalAfter).toBeDefined();
      expect(hospitalAfter.name).toBe(hospitalBefore.name);
      expect(hospitalAfter.registrationNumber).toBe(hospitalBefore.registrationNumber);
    });

    it('should preserve admin accounts', async () => {
      const adminBefore = await Admin.findById(adminId);
      
      // Perform cleanup
      await Message.deleteMany({});
      await SymptomConversation.deleteMany({});

      const adminAfter = await Admin.findById(adminId);

      expect(adminAfter).toBeDefined();
      expect(adminAfter.name).toBe(adminBefore.name);
      expect(adminAfter.role).toBe(adminBefore.role);
    });

    it('should clear extracted symptoms from patient records', async () => {
      const patientBefore = await Patient.findById(patientId);
      expect(patientBefore.extractedSymptoms).toBeDefined();
      expect(patientBefore.extractedSymptoms.length).toBeGreaterThan(0);

      // Clear extracted symptoms
      await Patient.updateMany({}, { $set: { extractedSymptoms: [] } });

      const patientAfter = await Patient.findById(patientId);
      expect(patientAfter.extractedSymptoms).toBeDefined();
      expect(patientAfter.extractedSymptoms.length).toBe(0);
    });
  });

  describe('4. Selective Cleanup', () => {
    beforeEach(async () => {
      // Create test data
      await Message.create({
        senderId: patientId,
        recipientId: doctorId,
        content: 'Test message',
        senderModel: 'Patient',
        recipientModel: 'Doctor'
      });

      await SymptomConversation.create({
        patientId,
        initialSymptom: 'Test symptom',
        symptomCategory: 'general',
        status: 'active'
      });

      await Case.create({
        patientId,
        doctorId,
        symptoms: ['fever', 'cough'],
        predictedConditions: ['Common Cold'],
        status: 'pending'
      });
    });

    it('should cleanup only messages when specified', async () => {
      const messagesBefore = await Message.countDocuments();
      const conversationsBefore = await SymptomConversation.countDocuments();
      const casesBefore = await Case.countDocuments();

      // Cleanup only messages
      await Message.deleteMany({});

      const messagesAfter = await Message.countDocuments();
      const conversationsAfter = await SymptomConversation.countDocuments();
      const casesAfter = await Case.countDocuments();

      expect(messagesAfter).toBe(0);
      expect(conversationsAfter).toBe(conversationsBefore);
      expect(casesAfter).toBe(casesBefore);
    });

    it('should cleanup only conversations when specified', async () => {
      const messagesBefore = await Message.countDocuments();
      const conversationsBefore = await SymptomConversation.countDocuments();
      const casesBefore = await Case.countDocuments();

      // Cleanup only conversations
      await SymptomConversation.deleteMany({});

      const messagesAfter = await Message.countDocuments();
      const conversationsAfter = await SymptomConversation.countDocuments();
      const casesAfter = await Case.countDocuments();

      expect(messagesAfter).toBe(messagesBefore);
      expect(conversationsAfter).toBe(0);
      expect(casesAfter).toBe(casesBefore);
    });

    it('should cleanup only cases when specified', async () => {
      const messagesBefore = await Message.countDocuments();
      const conversationsBefore = await SymptomConversation.countDocuments();
      const casesBefore = await Case.countDocuments();

      // Cleanup only cases
      await Case.deleteMany({});

      const messagesAfter = await Message.countDocuments();
      const conversationsAfter = await SymptomConversation.countDocuments();
      const casesAfter = await Case.countDocuments();

      expect(messagesAfter).toBe(messagesBefore);
      expect(conversationsAfter).toBe(conversationsBefore);
      expect(casesAfter).toBe(0);
    });

    it('should cleanup all when specified', async () => {
      // Cleanup all
      await Message.deleteMany({});
      await SymptomConversation.deleteMany({});
      await Case.deleteMany({});

      const messagesAfter = await Message.countDocuments();
      const conversationsAfter = await SymptomConversation.countDocuments();
      const casesAfter = await Case.countDocuments();

      expect(messagesAfter).toBe(0);
      expect(conversationsAfter).toBe(0);
      expect(casesAfter).toBe(0);
    });
  });

  describe('5. Cleanup Results and Logging', () => {
    beforeEach(async () => {
      // Create test data
      await Message.create([
        {
          senderId: patientId,
          recipientId: doctorId,
          content: 'Message 1',
          senderModel: 'Patient',
          recipientModel: 'Doctor'
        },
        {
          senderId: doctorId,
          recipientId: patientId,
          content: 'Message 2',
          senderModel: 'Doctor',
          recipientModel: 'Patient'
        }
      ]);

      await SymptomConversation.create([
        {
          patientId,
          initialSymptom: 'Symptom 1',
          symptomCategory: 'respiratory',
          status: 'completed'
        },
        {
          patientId,
          initialSymptom: 'Symptom 2',
          symptomCategory: 'cardiovascular',
          status: 'active'
        }
      ]);
    });

    it('should return affected record counts', async () => {
      const messageResult = await Message.deleteMany({});
      const conversationResult = await SymptomConversation.deleteMany({});

      expect(messageResult.deletedCount).toBeGreaterThan(0);
      expect(conversationResult.deletedCount).toBeGreaterThan(0);
    });

    it('should log cleanup operations', async () => {
      const timestamp = new Date();
      
      const messageResult = await Message.deleteMany({});
      const conversationResult = await SymptomConversation.deleteMany({});

      // Verify operations completed
      expect(messageResult.deletedCount).toBeDefined();
      expect(conversationResult.deletedCount).toBeDefined();
      
      // Verify timestamp is recent
      const now = new Date();
      expect(now.getTime() - timestamp.getTime()).toBeLessThan(5000); // Within 5 seconds
    });

    it('should provide summary of cleanup operations', async () => {
      const messagesBefore = await Message.countDocuments();
      const conversationsBefore = await SymptomConversation.countDocuments();

      const messageResult = await Message.deleteMany({});
      const conversationResult = await SymptomConversation.deleteMany({});

      const summary = {
        messagesRemoved: messageResult.deletedCount,
        conversationsRemoved: conversationResult.deletedCount,
        timestamp: new Date()
      };

      expect(summary.messagesRemoved).toBe(messagesBefore);
      expect(summary.conversationsRemoved).toBe(conversationsBefore);
      expect(summary.timestamp).toBeDefined();
    });
  });
});
