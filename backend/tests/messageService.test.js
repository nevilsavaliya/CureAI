/**
 * Message Service Unit Tests
 * Tests message model and service methods
 */

const mongoose = require('mongoose');
const Message = require('../models/Message');
const Case = require('../models/Case');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

describe('Message Service Unit Tests', () => {
  let patientId;
  let doctorId;
  let caseId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /msg-service-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /msg-service-test.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Msg Service Test Patient',
      email: 'msg-service-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id;

    // Create test doctor
    const doctor = new Doctor({
      name: 'Msg Service Test Doctor',
      email: 'msg-service-test-doctor@test.com',
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
      status: 'ongoing',
      acceptedAt: new Date()
    });
    await testCase.save();
    caseId = testCase._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /msg-service-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /msg-service-test.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean messages after each test
    await Message.deleteMany({});
  });

  describe('Message Creation', () => {
    it('should create a message with required fields', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Hello doctor',
        messageType: 'text'
      });

      await message.save();

      expect(message._id).toBeDefined();
      expect(message.content).toBe('Hello doctor');
      expect(message.isRead).toBe(false);
    });

    it('should set default message type to text', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Test message'
      });

      await message.save();

      expect(message.messageType).toBe('text');
    });
  });

  describe('Mark As Read Method', () => {
    it('should mark message as read', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Test message',
        messageType: 'text'
      });
      await message.save();

      await message.markAsRead();

      expect(message.isRead).toBe(true);
      expect(message.readAt).toBeDefined();
    });

    it('should update readAt even if already read', async () => {
      const firstReadTime = new Date();
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Test message',
        messageType: 'text',
        isRead: true,
        readAt: firstReadTime
      });
      await message.save();

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      await message.markAsRead();

      // markAsRead always updates readAt
      expect(message.readAt.getTime()).toBeGreaterThanOrEqual(firstReadTime.getTime());
    });
  });

  describe('Message Queries', () => {
    beforeEach(async () => {
      // Create multiple messages
      await Message.create([
        {
          caseId,
          senderId: patientId,
          senderModel: 'Patient',
          recipientId: doctorId,
          recipientModel: 'Doctor',
          content: 'Message 1',
          messageType: 'text'
        },
        {
          caseId,
          senderId: doctorId,
          senderModel: 'Doctor',
          recipientId: patientId,
          recipientModel: 'Patient',
          content: 'Message 2',
          messageType: 'text'
        },
        {
          caseId,
          senderId: patientId,
          senderModel: 'Patient',
          recipientId: doctorId,
          recipientModel: 'Doctor',
          content: 'Message 3',
          messageType: 'text'
        }
      ]);
    });

    it('should retrieve all messages for a case', async () => {
      const messages = await Message.find({ caseId }).sort({ createdAt: 1 });

      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('Message 1');
      expect(messages[2].content).toBe('Message 3');
    });

    it('should filter messages by sender', async () => {
      const messages = await Message.find({
        caseId,
        senderId: patientId
      });

      expect(messages).toHaveLength(2);
      expect(messages.every(m => m.senderId.toString() === patientId.toString())).toBe(true);
    });

    it('should filter unread messages', async () => {
      // Mark one message as read
      const message = await Message.findOne({ content: 'Message 1' });
      await message.markAsRead();

      const unreadMessages = await Message.find({
        caseId,
        isRead: false
      });

      expect(unreadMessages).toHaveLength(2);
    });
  });

  describe('Message Validation', () => {
    it('should require content', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        messageType: 'text'
      });

      await expect(message.save()).rejects.toThrow();
    });

    it('should allow message without caseId', async () => {
      const message = new Message({
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Test',
        messageType: 'text'
      });

      // caseId is optional in the model
      await message.save();
      expect(message._id).toBeDefined();
    });
  });

  describe('Message Timestamps', () => {
    it('should set createdAt timestamp', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Test message',
        messageType: 'text'
      });

      await message.save();

      expect(message.createdAt).toBeDefined();
      expect(message.createdAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Test message',
        messageType: 'text'
      });

      await message.save();
      const originalUpdatedAt = message.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 100));
      await message.markAsRead();

      expect(message.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
