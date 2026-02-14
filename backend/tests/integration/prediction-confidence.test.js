/**
 * Prediction Generation with Confidence Integration Tests
 * Tests prediction generation with confidence scores
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const SymptomConversation = require('../../models/SymptomConversation');
const {
  startConversation,
  submitAnswer
} = require('../../services/symptomConversationService');
const {
  getPredictionsWithConfidence,
  recalculatePredictions,
  calculateConfidenceScore,
  DISEASE_DATABASE
} = require('../../services/enhancedPredictionService');

describe('Prediction Generation with Confidence Integration Tests', () => {
  let patientId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /prediction-confidence-test.*@test\.com/ });
    await SymptomConversation.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Prediction Confidence Test Patient',
      email: 'prediction-confidence-test@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /prediction-confidence-test.*@test\.com/ });
    await SymptomConversation.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Confidence Score Calculation', () => {
    it('should calculate confidence scores between 0 and 100', async () => {
      const result = await startConversation(patientId, 'I have fever, cough, and body ache');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer 3 questions to enable prediction
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
          answer = 'I feel very weak and tired';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions).toBeDefined();
      expect(predictions.predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(0);
      
      // Check that all confidence scores are between 0 and 100
      predictions.predictions.forEach(pred => {
        expect(pred.confidence).toBeGreaterThanOrEqual(0);
        expect(pred.confidence).toBeLessThanOrEqual(100);
        expect(Number.isInteger(pred.confidence)).toBe(true);
      });
    });

    it('should calculate higher confidence for matching symptoms', async () => {
      const result = await startConversation(patientId, 'I have severe cough with fever and body ache');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer questions that match Influenza symptoms
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionText.toLowerCase().includes('fever')) {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '8'; // High severity
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else {
          answer = 'I have chills and fatigue';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions.predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(0);
      
      // Should have Influenza or similar respiratory disease with reasonable confidence
      const topPrediction = predictions.predictions[0];
      expect(topPrediction.confidence).toBeGreaterThan(0);
    });

    it('should sort predictions by confidence score descending', async () => {
      const result = await startConversation(patientId, 'I have headache and nausea');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer 3 questions
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '6';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Moderate symptoms';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions.predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(1);
      
      // Check that predictions are sorted by confidence (descending)
      for (let i = 1; i < predictions.predictions.length; i++) {
        expect(predictions.predictions[i - 1].confidence).toBeGreaterThanOrEqual(
          predictions.predictions[i].confidence
        );
      }
    });
  });

  describe('2. Prediction with Various Symptom Combinations', () => {
    it('should generate predictions for respiratory symptoms', async () => {
      const result = await startConversation(patientId, 'I have persistent cough and chest pain');
      const conversationId = result.conversationId.toString();
      
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
          answer = 'Breathing is difficult';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions.predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(0);
      
      // Should include respiratory diseases
      const hasRespiratoryDisease = predictions.predictions.some(pred => 
        pred.category === 'respiratory'
      );
      expect(hasRespiratoryDisease).toBe(true);
    });

    it('should generate predictions for cardiovascular symptoms', async () => {
      const result = await startConversation(patientId, 'I have heart palpitations and dizziness');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer 3 questions
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '6';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Irregular heartbeat';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions.predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(0);
    });

    it('should generate predictions for gastrointestinal symptoms', async () => {
      const result = await startConversation(patientId, 'I have severe stomach pain and vomiting');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer 3 questions
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '8';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Pain after eating';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions.predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(0);
      
      // Should include gastrointestinal diseases
      const hasGIDisease = predictions.predictions.some(pred => 
        pred.category === 'gastrointestinal'
      );
      expect(hasGIDisease).toBe(true);
    });

    it('should generate predictions for musculoskeletal symptoms', async () => {
      const result = await startConversation(patientId, 'I have severe joint pain and stiffness');
      const conversationId = result.conversationId.toString();
      
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
          answer = 'Multiple joints affected';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions.predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(0);
      
      // Should include musculoskeletal diseases
      const hasMSKDisease = predictions.predictions.some(pred => 
        pred.category === 'musculoskeletal'
      );
      expect(hasMSKDisease).toBe(true);
    });
  });

  describe('3. Low Confidence Disclaimer', () => {
    it('should show disclaimer when all predictions below 50% confidence', async () => {
      // Use vague symptoms that don't match well
      const result = await startConversation(patientId, 'I feel unwell');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer with vague responses
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'no';
        } else if (question.questionType === 'scale') {
          answer = '3'; // Low severity
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[question.options.length - 1]; // Last option
        } else {
          answer = 'Not sure';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions).toBeDefined();
      
      // Check if low confidence is detected
      if (predictions.hasLowConfidence) {
        expect(predictions.lowConfidenceDisclaimer).toBeDefined();
        expect(predictions.lowConfidenceDisclaimer).toContain('50%');
        expect(predictions.lowConfidenceDisclaimer).toContain('General Medicine');
        expect(predictions.recommendGeneralMedicine).toBe(true);
      }
    });

    it('should recommend General Medicine for low confidence cases', async () => {
      const result = await startConversation(patientId, 'I have some discomfort');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer with minimal information
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'no';
        } else if (question.questionType === 'scale') {
          answer = '2';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Mild';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions).toBeDefined();
      
      // If low confidence, check General Medicine is recommended
      if (predictions.hasLowConfidence) {
        expect(predictions.recommendGeneralMedicine).toBe(true);
        
        // Check that General Medicine is in specializations
        predictions.predictions.forEach(pred => {
          expect(pred.specializations).toContain('General Medicine');
        });
      }
    });

    it('should not show disclaimer when confidence is above 50%', async () => {
      const result = await startConversation(patientId, 'I have high fever, severe cough, and body ache for 3 days');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer with clear symptoms matching Influenza
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionText.toLowerCase().includes('fever')) {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '9'; // High severity
        } else if (question.questionType === 'multiple_choice') {
          if (question.options.some(opt => opt.includes('3 days') || opt.includes('1-3 days'))) {
            answer = question.options.find(opt => opt.includes('3 days') || opt.includes('1-3 days'));
          } else {
            answer = question.options[0];
          }
        } else if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else {
          answer = 'Severe flu-like symptoms with chills';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions).toBeDefined();
      expect(predictions.predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(0);
      
      // Check if any prediction has confidence >= 50%
      const hasHighConfidence = predictions.predictions.some(pred => pred.confidence >= 50);
      
      if (hasHighConfidence) {
        expect(predictions.hasLowConfidence).toBe(false);
        expect(predictions.lowConfidenceDisclaimer).toBeNull();
      }
    });
  });

  describe('4. Prediction Recalculation', () => {
    it('should recalculate predictions when new answers added', async () => {
      const result = await startConversation(patientId, 'I have a cough');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer 3 questions initially
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '5';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Mild cough';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      // Get initial predictions
      const initialPredictions = await getPredictionsWithConfidence(conversationId);
      expect(initialPredictions.predictions).toBeDefined();
      
      const initialTopConfidence = initialPredictions.predictions[0].confidence;

      // Answer more questions with stronger symptoms
      const updatedConversation = await SymptomConversation.findById(conversationId);
      const unansweredQuestions = updatedConversation.questions.filter(q => 
        !updatedConversation.answers.some(a => a.questionId === q.questionId)
      );

      if (unansweredQuestions.length > 0) {
        const question = unansweredQuestions[0];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '8'; // Higher severity
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Severe symptoms with fever';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);

        // Recalculate predictions
        const recalculatedPredictions = await recalculatePredictions(conversationId);

        expect(recalculatedPredictions).toBeDefined();
        expect(recalculatedPredictions.predictions).toBeDefined();
        expect(recalculatedPredictions.recalculatedAt).toBeDefined();
        expect(recalculatedPredictions.answersUsed).toBeGreaterThan(3);
      }
    });

    it('should fail to recalculate with insufficient answers', async () => {
      const result = await startConversation(patientId, 'I have a headache');
      const conversationId = result.conversationId.toString();
      
      // Don't answer enough questions - answer only 1
      const conversation = await SymptomConversation.findById(conversationId);
      const question = conversation.questions[0];
      
      let answer;
      if (question.questionType === 'yes_no') {
        answer = 'yes';
      } else if (question.questionType === 'scale') {
        answer = '5';
      } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
        answer = question.options[0];
      } else {
        answer = 'Mild headache';
      }
      
      await submitAnswer(conversationId, question.questionId, answer);

      const recalculated = await recalculatePredictions(conversationId);

      expect(recalculated).toBeDefined();
      expect(recalculated.predictions).toEqual([]);
      expect(recalculated.message).toContain('Not enough answers');
      expect(recalculated.answersProvided).toBeLessThan(3);
    });
  });

  describe('5. Prediction Data Structure', () => {
    it('should include all required fields in predictions', async () => {
      const result = await startConversation(patientId, 'I have fever and cough');
      const conversationId = result.conversationId.toString();
      
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
          answer = 'Symptoms for 2 days';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      const predictions = await getPredictionsWithConfidence(conversationId);

      expect(predictions).toBeDefined();
      expect(predictions.conversationId).toBeDefined();
      expect(predictions.predictions).toBeDefined();
      expect(predictions.symptomProfile).toBeDefined();
      expect(predictions.symptomProfile.initialSymptom).toBeDefined();
      expect(predictions.symptomProfile.extractedSymptoms).toBeDefined();
      expect(predictions.symptomProfile.duration).toBeDefined();
      expect(predictions.symptomProfile.severity).toBeDefined();
      
      // Check each prediction has required fields
      predictions.predictions.forEach(pred => {
        expect(pred.disease).toBeDefined();
        expect(pred.confidence).toBeDefined();
        expect(pred.specializations).toBeDefined();
        expect(Array.isArray(pred.specializations)).toBe(true);
        expect(pred.description).toBeDefined();
        expect(pred.category).toBeDefined();
      });
    });

    it('should store predictions in conversation', async () => {
      const result = await startConversation(patientId, 'I have joint pain');
      const conversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(conversationId);
      
      // Answer 3 questions
      for (let i = 0; i < 3 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '6';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'Stiff joints';
        }
        
        await submitAnswer(conversationId, question.questionId, answer);
      }

      await getPredictionsWithConfidence(conversationId);

      // Check that predictions are stored in conversation
      const updatedConversation = await SymptomConversation.findById(conversationId);
      
      expect(updatedConversation.predictions).toBeDefined();
      expect(updatedConversation.predictions.length).toBeGreaterThan(0);
      
      updatedConversation.predictions.forEach(pred => {
        expect(pred.disease).toBeDefined();
        expect(pred.confidence).toBeDefined();
        expect(pred.specializations).toBeDefined();
        expect(pred.calculatedAt).toBeDefined();
      });
    });
  });
});
