/**
 * Case Creation with Conversation Integration Tests
 * Tests case creation from completed conversations
 * Requirements: 6.1, 6.2, 6.3
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Case = require('../../models/Case');
const SymptomConversation = require('../../models/SymptomConversation');
const {
  startConversation,
  submitAnswer,
  completeConversation
} = require('../../services/symptomConversationService');
const {
  getPredictionsWithConfidence
} = require('../../services/enhancedPredictionService');

describe('Case Creation with Conversation Integration Tests', () => {
  let patientId;
  let doctorId;
  let patientToken;
  let doctorToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /case-conversation-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /case-conversation-test.*@test\.com/ });
    await Case.deleteMany({});
    await SymptomConversation.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Case Conversation Test Patient',
      email: 'case-conversation-test-patient@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id.toString();

    // Create test doctor
    const doctor = new Doctor({
      name: 'Case Conversation Test Doctor',
      email: 'case-conversation-test-doctor@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1980-01-01',
      degree: 'MBBS',
      specializations: ['General Medicine'],
      experienceYears: 10,
      rating: 4.5,
      subscriptionStatus: 'active',
      isActive: true
    });
    await doctor.save();
    doctorId = doctor._id.toString();

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
    await Patient.deleteMany({ email: /case-conversation-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /case-conversation-test.*@test\.com/ });
    await Case.deleteMany({});
    await SymptomConversation.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Create Case from Completed Conversation', () => {
    let conversationId;
    let caseId;

    beforeAll(async () => {
      // Create and complete a conversation
      const result = await startConversation(patientId, 'I have fever, cough, and body ache');
      conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer 3 questions
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '7';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Severe symptoms for 3 days';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      // Generate predictions
      await getPredictionsWithConfidence(conversationId);
      
      // Mark conversation as completed
      await completeConversation(conversationId);
    });

    it('should create case with conversation reference', async () => {
      const updatedConversation = await SymptomConversation.findById(conversationId);
      
      const caseData = {
        doctorId,
        symptoms: updatedConversation.extractedSymptoms,
        predictedConditions: updatedConversation.predictions.map(p => p.disease),
        symptomConversationId: conversationId,
        predictionConfidence: updatedConversation.predictions.map(p => ({
          condition: p.disease,
          confidence: p.confidence
        }))
      };

      const newCase = new Case({
        patientId,
        doctorId,
        symptoms: caseData.symptoms,
        predictedConditions: caseData.predictedConditions,
        symptomConversationId: caseData.symptomConversationId,
        predictionConfidence: caseData.predictionConfidence,
        status: 'pending'
      });

      await newCase.save();
      caseId = newCase._id.toString();

      expect(newCase).toBeDefined();
      expect(newCase.symptomConversationId.toString()).toBe(conversationId);
      expect(newCase.predictionConfidence).toBeDefined();
      expect(newCase.predictionConfidence.length).toBeGreaterThan(0);
    });

    it('should store conversation data in case', async () => {
      const caseRecord = await Case.findById(caseId)
        .populate('symptomConversationId');

      expect(caseRecord).toBeDefined();
      expect(caseRecord.symptomConversationId).toBeDefined();
      expect(caseRecord.symptomConversationId.initialSymptom).toBe('I have fever, cough, and body ache');
      expect(caseRecord.symptomConversationId.status).toBe('completed');
      expect(caseRecord.symptomConversationId.predictions).toBeDefined();
      expect(caseRecord.symptomConversationId.predictions.length).toBeGreaterThan(0);
    });

    it('should include confidence scores in case', async () => {
      const caseRecord = await Case.findById(caseId);

      expect(caseRecord.predictionConfidence).toBeDefined();
      expect(caseRecord.predictionConfidence.length).toBeGreaterThan(0);
      
      caseRecord.predictionConfidence.forEach(pred => {
        expect(pred.condition).toBeDefined();
        expect(pred.confidence).toBeDefined();
        expect(pred.confidence).toBeGreaterThanOrEqual(0);
        expect(pred.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('2. Doctor View of Conversation History', () => {
    let conversationId;
    let caseId;

    beforeAll(async () => {
      // Create and complete another conversation
      const result = await startConversation(patientId, 'I have severe headache and nausea');
      conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer questions
      for (let i = 0; i < 4 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '8';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Severe pain with sensitivity to light';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      // Generate predictions
      await getPredictionsWithConfidence(conversationId);
      await completeConversation(conversationId);

      // Create case
      const updatedConversation = await SymptomConversation.findById(conversationId);
      const newCase = new Case({
        patientId,
        doctorId,
        symptoms: updatedConversation.extractedSymptoms,
        predictedConditions: updatedConversation.predictions.map(p => p.disease),
        symptomConversationId: conversationId,
        predictionConfidence: updatedConversation.predictions.map(p => ({
          condition: p.disease,
          confidence: p.confidence
        })),
        status: 'pending'
      });
      await newCase.save();
      caseId = newCase._id.toString();
    });

    it('should retrieve case with complete conversation history', async () => {
      const caseRecord = await Case.findById(caseId)
        .populate('symptomConversationId')
        .populate('patientId', 'name email')
        .populate('doctorId', 'name specializations');

      expect(caseRecord).toBeDefined();
      expect(caseRecord.symptomConversationId).toBeDefined();
      
      const conversation = caseRecord.symptomConversationId;
      expect(conversation.initialSymptom).toBeDefined();
      expect(conversation.questions).toBeDefined();
      expect(conversation.answers).toBeDefined();
      expect(conversation.predictions).toBeDefined();
    });

    it('should display Q&A pairs in chronological order', async () => {
      const caseRecord = await Case.findById(caseId)
        .populate('symptomConversationId');

      const conversation = caseRecord.symptomConversationId;
      
      // Build Q&A history
      const qaHistory = conversation.questions.map(question => {
        const answer = conversation.answers.find(a => a.questionId === question.questionId);
        return {
          questionText: question.questionText,
          askedAt: question.askedAt,
          answer: answer ? answer.answer : null,
          answeredAt: answer ? answer.answeredAt : null
        };
      });

      // Sort by asked time
      qaHistory.sort((a, b) => new Date(a.askedAt) - new Date(b.askedAt));

      expect(qaHistory.length).toBeGreaterThan(0);
      
      // Verify chronological order
      for (let i = 1; i < qaHistory.length; i++) {
        expect(new Date(qaHistory[i].askedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(qaHistory[i - 1].askedAt).getTime()
        );
      }
    });

    it('should show confidence scores for predictions', async () => {
      const caseRecord = await Case.findById(caseId);

      expect(caseRecord.predictionConfidence).toBeDefined();
      expect(caseRecord.predictionConfidence.length).toBeGreaterThan(0);
      
      // Verify confidence scores are visible
      caseRecord.predictionConfidence.forEach(pred => {
        expect(pred.condition).toBeDefined();
        expect(pred.confidence).toBeDefined();
        expect(typeof pred.confidence).toBe('number');
      });
    });

    it('should preserve original symptom text', async () => {
      const caseRecord = await Case.findById(caseId)
        .populate('symptomConversationId');

      const conversation = caseRecord.symptomConversationId;
      
      expect(conversation.initialSymptom).toBe('I have severe headache and nausea');
      expect(conversation.extractedSymptoms).toBeDefined();
      expect(conversation.extractedSymptoms.length).toBeGreaterThan(0);
    });
  });

  describe('3. Case Retrieval with Conversation', () => {
    it('should retrieve multiple cases with conversations', async () => {
      const cases = await Case.find({ patientId })
        .populate('symptomConversationId')
        .sort({ createdAt: -1 });

      expect(cases).toBeDefined();
      expect(cases.length).toBeGreaterThan(0);
      
      cases.forEach(caseRecord => {
        if (caseRecord.symptomConversationId) {
          expect(caseRecord.symptomConversationId.initialSymptom).toBeDefined();
          expect(caseRecord.symptomConversationId.questions).toBeDefined();
          expect(caseRecord.symptomConversationId.answers).toBeDefined();
        }
      });
    });

    it('should handle cases without conversation reference', async () => {
      // Create a case without conversation
      const caseWithoutConversation = new Case({
        patientId,
        doctorId,
        symptoms: ['headache', 'fever'],
        predictedConditions: ['Common Cold'],
        status: 'pending'
      });
      await caseWithoutConversation.save();

      const caseRecord = await Case.findById(caseWithoutConversation._id)
        .populate('symptomConversationId');

      expect(caseRecord).toBeDefined();
      expect(caseRecord.symptomConversationId).toBeUndefined();
      expect(caseRecord.symptoms).toBeDefined();
      expect(caseRecord.predictedConditions).toBeDefined();
    });
  });

  describe('4. Conversation History Format', () => {
    it('should format conversation for doctor view', async () => {
      // Create a new conversation
      const result = await startConversation(patientId, 'I have chest pain');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer questions
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '7';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Sharp pain radiating to arm';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      await getPredictionsWithConfidence(conversationId);
      await completeConversation(conversationId);

      // Create case
      const updatedConversation = await SymptomConversation.findById(conversationId);
      const newCase = new Case({
        patientId,
        doctorId,
        symptoms: updatedConversation.extractedSymptoms,
        predictedConditions: updatedConversation.predictions.map(p => p.disease),
        symptomConversationId: conversationId,
        predictionConfidence: updatedConversation.predictions.map(p => ({
          condition: p.disease,
          confidence: p.confidence
        })),
        status: 'pending'
      });
      await newCase.save();

      // Retrieve and format for doctor view
      const caseRecord = await Case.findById(newCase._id)
        .populate('symptomConversationId')
        .populate('patientId', 'name email age bloodGroup');

      expect(caseRecord).toBeDefined();
      
      // Format conversation history
      const formattedHistory = {
        patientInfo: {
          name: caseRecord.patientId.name,
          email: caseRecord.patientId.email,
          bloodGroup: caseRecord.patientId.bloodGroup
        },
        initialSymptom: caseRecord.symptomConversationId.initialSymptom,
        symptomCategory: caseRecord.symptomConversationId.symptomCategory,
        extractedSymptoms: caseRecord.symptomConversationId.extractedSymptoms,
        conversationHistory: caseRecord.symptomConversationId.questions.map(q => {
          const answer = caseRecord.symptomConversationId.answers.find(a => a.questionId === q.questionId);
          return {
            question: q.questionText,
            answer: answer ? answer.answer : 'Not answered',
            timestamp: q.askedAt
          };
        }),
        predictions: caseRecord.predictionConfidence,
        caseStatus: caseRecord.status
      };

      expect(formattedHistory.patientInfo).toBeDefined();
      expect(formattedHistory.initialSymptom).toBeDefined();
      expect(formattedHistory.conversationHistory).toBeDefined();
      expect(formattedHistory.conversationHistory.length).toBeGreaterThan(0);
      expect(formattedHistory.predictions).toBeDefined();
    });
  });
});
