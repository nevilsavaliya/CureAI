/**
 * Symptom Extractor Service Unit Tests
 * Tests symptom extraction from text and storage in patient records
 */

const mongoose = require('mongoose');
const {
  extractSymptomsFromText,
  storeSymptomsInPatientRecord,
  processMessageForSymptoms,
  processCaseMessages,
  getPatientSymptoms,
  getSymptomKeywords,
  SYMPTOM_KEYWORDS
} = require('../services/symptomExtractor');
const Patient = require('../models/Patient');
const Message = require('../models/Message');
const Case = require('../models/Case');
const Doctor = require('../models/Doctor');

describe('Symptom Extractor Service Tests', () => {
  let patientId;
  let doctorId;
  let caseId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /symptom-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /symptom-test.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Symptom Test Patient',
      email: 'symptom-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id;

    // Create test doctor
    const doctor = new Doctor({
      name: 'Symptom Test Doctor',
      email: 'symptom-test-doctor@test.com',
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
    await Patient.deleteMany({ email: /symptom-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /symptom-test.*@test\.com/ });
    await Case.deleteMany({});
    await Message.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean messages and reset patient symptoms after each test
    await Message.deleteMany({});
    await Patient.findByIdAndUpdate(patientId, { extractedSymptoms: [] });
  });

  describe('extractSymptomsFromText', () => {
    it('should extract single symptom from text', () => {
      const text = 'I have a fever';
      const symptoms = extractSymptomsFromText(text);

      expect(symptoms).toContain('fever');
      expect(symptoms.length).toBe(1);
    });

    it('should extract multiple symptoms from text', () => {
      const text = 'I have a fever and cough, also feeling dizzy';
      const symptoms = extractSymptomsFromText(text);

      expect(symptoms).toContain('fever');
      expect(symptoms).toContain('cough');
      expect(symptoms).toContain('dizziness');
      expect(symptoms.length).toBe(3);
    });

    it('should be case insensitive', () => {
      const text = 'I have FEVER and HEADACHE';
      const symptoms = extractSymptomsFromText(text);

      expect(symptoms).toContain('fever');
      expect(symptoms).toContain('headache');
    });

    it('should handle empty text', () => {
      const symptoms = extractSymptomsFromText('');
      expect(symptoms).toEqual([]);
    });

    it('should handle null or undefined text', () => {
      expect(extractSymptomsFromText(null)).toEqual([]);
      expect(extractSymptomsFromText(undefined)).toEqual([]);
    });

    it('should extract symptoms from complex sentences', () => {
      const text = 'I woke up this morning with a terrible headache and sore throat. Also experiencing nausea.';
      const symptoms = extractSymptomsFromText(text);

      expect(symptoms).toContain('headache');
      expect(symptoms).toContain('soreThroat');
      expect(symptoms).toContain('nausea');
    });

    it('should not extract partial word matches', () => {
      const text = 'I am feeling great today';
      const symptoms = extractSymptomsFromText(text);

      // Should not match 'eat' from 'great' as 'eating'
      expect(symptoms).toEqual([]);
    });

    it('should extract respiratory symptoms', () => {
      const text = 'I have shortness of breath and wheezing';
      const symptoms = extractSymptomsFromText(text);

      expect(symptoms).toContain('shortnessOfBreath');
      expect(symptoms).toContain('wheezing');
    });

    it('should extract gastrointestinal symptoms', () => {
      const text = 'Experiencing stomach ache, vomiting and diarrhea';
      const symptoms = extractSymptomsFromText(text);

      expect(symptoms).toContain('stomachAche');
      expect(symptoms).toContain('vomiting');
      expect(symptoms).toContain('diarrhea');
    });

    it('should extract cardiovascular symptoms', () => {
      const text = 'I have chest pain and heart racing';
      const symptoms = extractSymptomsFromText(text);

      expect(symptoms).toContain('chestPain');
      expect(symptoms).toContain('palpitations');
    });

    it('should not duplicate symptoms from multiple keyword matches', () => {
      const text = 'I have fever, high temperature, and feeling feverish';
      const symptoms = extractSymptomsFromText(text);

      // All three phrases should match 'fever' but only return it once
      expect(symptoms).toContain('fever');
      expect(symptoms.filter(s => s === 'fever').length).toBe(1);
    });
  });

  describe('storeSymptomsInPatientRecord', () => {
    it('should store symptoms in patient record', async () => {
      const symptoms = ['fever', 'cough'];
      
      const result = await storeSymptomsInPatientRecord(patientId, symptoms, caseId, 'chat');

      expect(result).toBeDefined();
      expect(result.extractedSymptoms).toHaveLength(2);
      expect(result.extractedSymptoms[0].symptom).toBe('fever');
      expect(result.extractedSymptoms[0].extractedFrom).toBe('chat');
      expect(result.extractedSymptoms[0].caseId.toString()).toBe(caseId.toString());
    });

    it('should not duplicate symptoms for the same case', async () => {
      const symptoms = ['fever'];
      
      // Store first time
      await storeSymptomsInPatientRecord(patientId, symptoms, caseId, 'chat');
      
      // Try to store again
      const result = await storeSymptomsInPatientRecord(patientId, symptoms, caseId, 'chat');

      expect(result.extractedSymptoms).toHaveLength(1);
    });

    it('should allow same symptom from different cases', async () => {
      // Create another case
      const testCase2 = new Case({
        patientId,
        doctorId,
        symptoms: ['cough'],
        status: 'ongoing',
        acceptedAt: new Date()
      });
      await testCase2.save();
      const caseId2 = testCase2._id;

      const symptoms = ['fever'];
      
      // Store for first case
      await storeSymptomsInPatientRecord(patientId, symptoms, caseId, 'chat');
      
      // Store for second case
      const result = await storeSymptomsInPatientRecord(patientId, symptoms, caseId2, 'chat');

      expect(result.extractedSymptoms).toHaveLength(2);
      
      // Clean up
      await Case.findByIdAndDelete(caseId2);
    });

    it('should handle empty symptoms array', async () => {
      const result = await storeSymptomsInPatientRecord(patientId, [], caseId, 'chat');
      expect(result).toBeNull();
    });

    it('should handle invalid patient ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      await expect(
        storeSymptomsInPatientRecord(invalidId, ['fever'], caseId, 'chat')
      ).rejects.toThrow('Patient not found');
    });

    it('should initialize extractedSymptoms array if not exists', async () => {
      // Create a new patient without extractedSymptoms
      const newPatient = new Patient({
        name: 'New Patient',
        email: 'symptom-test-new@test.com',
        password: 'TestPass123!',
        dateOfBirth: '1995-01-01',
        bloodGroup: 'A+'
      });
      await newPatient.save();

      const result = await storeSymptomsInPatientRecord(
        newPatient._id,
        ['fever'],
        caseId,
        'chat'
      );

      expect(result.extractedSymptoms).toBeDefined();
      expect(result.extractedSymptoms).toHaveLength(1);

      // Clean up
      await Patient.findByIdAndDelete(newPatient._id);
    });
  });

  describe('processMessageForSymptoms', () => {
    it('should process patient message and extract symptoms', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'I have a fever and headache',
        messageType: 'text'
      });
      await message.save();

      const result = await processMessageForSymptoms(message);

      expect(result.processed).toBe(true);
      expect(result.symptomsFound).toBe(2);
      expect(result.symptoms).toContain('fever');
      expect(result.symptoms).toContain('headache');
      expect(result.patientId.toString()).toBe(patientId.toString());
    });

    it('should not process doctor messages', async () => {
      const message = new Message({
        caseId,
        senderId: doctorId,
        senderModel: 'Doctor',
        recipientId: patientId,
        recipientModel: 'Patient',
        content: 'Do you have fever?',
        messageType: 'text'
      });
      await message.save();

      const result = await processMessageForSymptoms(message);

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('Message not from patient');
    });

    it('should not process non-text messages', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'image.jpg',
        messageType: 'image'
      });
      await message.save();

      const result = await processMessageForSymptoms(message);

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('Message is not text type');
    });

    it('should handle messages with no symptoms', async () => {
      const message = new Message({
        caseId,
        senderId: patientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Hello doctor, how are you?',
        messageType: 'text'
      });
      await message.save();

      const result = await processMessageForSymptoms(message);

      expect(result.processed).toBe(true);
      expect(result.symptomsFound).toBe(0);
      expect(result.symptoms).toEqual([]);
    });
  });

  describe('processCaseMessages', () => {
    it('should process all patient messages in a case', async () => {
      // Create multiple messages
      await Message.create([
        {
          caseId,
          senderId: patientId,
          senderModel: 'Patient',
          recipientId: doctorId,
          recipientModel: 'Doctor',
          content: 'I have fever',
          messageType: 'text'
        },
        {
          caseId,
          senderId: patientId,
          senderModel: 'Patient',
          recipientId: doctorId,
          recipientModel: 'Doctor',
          content: 'Also experiencing cough',
          messageType: 'text'
        },
        {
          caseId,
          senderId: doctorId,
          senderModel: 'Doctor',
          recipientId: patientId,
          recipientModel: 'Patient',
          content: 'Take rest',
          messageType: 'text'
        }
      ]);

      const result = await processCaseMessages(caseId);

      expect(result.processed).toBe(true);
      expect(result.messagesProcessed).toBe(2); // Only patient messages
      expect(result.uniqueSymptoms).toContain('fever');
      expect(result.uniqueSymptoms).toContain('cough');
    });

    it('should handle case with no messages', async () => {
      const result = await processCaseMessages(caseId);

      expect(result.processed).toBe(true);
      expect(result.messagesProcessed).toBe(0);
      expect(result.totalSymptoms).toBe(0);
    });

    it('should count duplicate symptoms correctly', async () => {
      // Create messages with same symptom
      await Message.create([
        {
          caseId,
          senderId: patientId,
          senderModel: 'Patient',
          recipientId: doctorId,
          recipientModel: 'Doctor',
          content: 'I have fever',
          messageType: 'text'
        },
        {
          caseId,
          senderId: patientId,
          senderModel: 'Patient',
          recipientId: doctorId,
          recipientModel: 'Doctor',
          content: 'Still have fever',
          messageType: 'text'
        }
      ]);

      const result = await processCaseMessages(caseId);

      expect(result.processed).toBe(true);
      expect(result.messagesProcessed).toBe(2);
      expect(result.uniqueSymptoms).toHaveLength(1);
      expect(result.uniqueSymptoms).toContain('fever');
    });
  });

  describe('getPatientSymptoms', () => {
    it('should retrieve patient symptoms', async () => {
      // Store some symptoms first
      await storeSymptomsInPatientRecord(patientId, ['fever', 'cough'], caseId, 'chat');

      const symptoms = await getPatientSymptoms(patientId);

      expect(symptoms).toHaveLength(2);
      expect(symptoms[0].symptom).toBeDefined();
      expect(symptoms[0].extractedFrom).toBe('chat');
      expect(symptoms[0].extractedAt).toBeDefined();
    });

    it('should return empty array for patient with no symptoms', async () => {
      const symptoms = await getPatientSymptoms(patientId);

      expect(symptoms).toEqual([]);
    });

    it('should throw error for invalid patient ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      await expect(getPatientSymptoms(invalidId)).rejects.toThrow('Patient not found');
    });
  });

  describe('getSymptomKeywords', () => {
    it('should return symptom keywords object', () => {
      const keywords = getSymptomKeywords();

      expect(keywords).toBeDefined();
      expect(keywords).toHaveProperty('fever');
      expect(keywords).toHaveProperty('cough');
      expect(keywords).toHaveProperty('headache');
      expect(Array.isArray(keywords.fever)).toBe(true);
    });

    it('should match SYMPTOM_KEYWORDS constant', () => {
      const keywords = getSymptomKeywords();

      expect(keywords).toEqual(SYMPTOM_KEYWORDS);
    });
  });
});
