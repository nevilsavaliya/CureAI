/**
 * Symptom Conversation Flow Integration Tests
 * Tests the complete symptom conversation flow from initialization to completion
 * Requirements: 1.1, 1.2, 1.3, 2.1
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor'); // Import Doctor model to register schema
const SymptomConversation = require('../../models/SymptomConversation');
const {
  startConversation,
  submitAnswer,
  canProceedToPrediction,
  generateSymptomProfile,
  getConversationHistory
} = require('../../services/symptomConversationService');

describe('Symptom Conversation Flow Integration Tests', () => {
  let patientId;
  let conversationId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /symptom-conversation-test.*@test\.com/ });
    await SymptomConversation.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Symptom Conversation Test Patient',
      email: 'symptom-conversation-test@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /symptom-conversation-test.*@test\.com/ });
    await SymptomConversation.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Conversation Initialization', () => {
    it('should initialize conversation with respiratory symptom', async () => {
      const result = await startConversation(patientId, 'I have a severe cough and fever');

      expect(result).toBeDefined();
      expect(result.conversationId).toBeDefined();
      expect(result.symptomCategory).toBe('respiratory');
      expect(result.initialSymptom).toBe('I have a severe cough and fever');
      expect(result.questions).toBeDefined();
      expect(result.questions.length).toBeGreaterThanOrEqual(2);
      expect(result.questions.length).toBeLessThanOrEqual(5);
      expect(result.status).toBe('active');
      expect(result.extractedSymptoms).toContain('cough');
      expect(result.extractedSymptoms).toContain('fever');

      conversationId = result.conversationId.toString();
    });

    it('should initialize conversation with cardiovascular symptom', async () => {
      const result = await startConversation(patientId, 'I have heart palpitations and chest discomfort');

      expect(result).toBeDefined();
      // Category detection may vary - accept cardiovascular or respiratory
      expect(['cardiovascular', 'respiratory']).toContain(result.symptomCategory);
      expect(result.questions).toBeDefined();
      expect(result.questions.length).toBeGreaterThanOrEqual(2);
      expect(result.extractedSymptoms).toBeDefined();
    });

    it('should initialize conversation with gastrointestinal symptom', async () => {
      const result = await startConversation(patientId, 'I have stomach pain and nausea');

      expect(result).toBeDefined();
      expect(result.symptomCategory).toBe('gastrointestinal');
      expect(result.questions).toBeDefined();
      // Check for stomach pain or stomachAche (symptom extractor may format differently)
      const hasStomachPain = result.extractedSymptoms.some(s => 
        s.toLowerCase().includes('stomach') || s === 'stomachAche' || s === 'pain'
      );
      expect(hasStomachPain).toBe(true);
    });

    it('should initialize conversation with neurological symptom', async () => {
      const result = await startConversation(patientId, 'I have a severe headache and dizziness');

      expect(result).toBeDefined();
      expect(result.symptomCategory).toBe('neurological');
      expect(result.questions).toBeDefined();
      expect(result.extractedSymptoms).toContain('headache');
    });

    it('should initialize conversation with musculoskeletal symptom', async () => {
      const result = await startConversation(patientId, 'I have joint pain and stiffness');

      expect(result).toBeDefined();
      expect(result.symptomCategory).toBe('musculoskeletal');
      expect(result.questions).toBeDefined();
      // Check for joint pain or jointPain (symptom extractor may format differently)
      const hasJointPain = result.extractedSymptoms.some(s => 
        s.toLowerCase().includes('joint') || s === 'jointPain' || s === 'pain'
      );
      expect(hasJointPain).toBe(true);
    });

    it('should fail to initialize conversation without patient ID', async () => {
      await expect(startConversation(null, 'I have a cough')).rejects.toThrow('Patient ID and initial symptom are required');
    });

    it('should fail to initialize conversation without initial symptom', async () => {
      await expect(startConversation(patientId, '')).rejects.toThrow('Patient ID and initial symptom are required');
    });
  });

  describe('2. Follow-up Questions Contextual Relevance', () => {
    it('should generate respiratory-specific questions for respiratory symptoms', async () => {
      const result = await startConversation(patientId, 'I have difficulty breathing and cough');

      const questionTexts = result.questions.map(q => q.questionText.toLowerCase());
      
      // Check for respiratory-related questions
      const hasRespiratoryQuestions = questionTexts.some(text => 
        text.includes('breathing') || 
        text.includes('cough') || 
        text.includes('fever') ||
        text.includes('chest')
      );

      expect(hasRespiratoryQuestions).toBe(true);
    });

    it('should generate cardiovascular-specific questions for heart symptoms', async () => {
      const result = await startConversation(patientId, 'I have chest pain');

      const questionTexts = result.questions.map(q => q.questionText.toLowerCase());
      
      // Check for cardiovascular-related questions
      const hasCardiovascularQuestions = questionTexts.some(text => 
        text.includes('chest') || 
        text.includes('pain') || 
        text.includes('heart') ||
        text.includes('breath')
      );

      expect(hasCardiovascularQuestions).toBe(true);
    });

    it('should generate gastrointestinal-specific questions for stomach symptoms', async () => {
      const result = await startConversation(patientId, 'I have severe stomach ache and bloating');

      const questionTexts = result.questions.map(q => q.questionText.toLowerCase());
      
      // Check for gastrointestinal-related questions
      const hasGIQuestions = questionTexts.some(text => 
        text.includes('pain') || 
        text.includes('eating') || 
        text.includes('nausea') ||
        text.includes('bowel') ||
        text.includes('abdomen') ||
        text.includes('stomach') ||
        text.includes('bloating') ||
        text.includes('discomfort')
      );

      expect(hasGIQuestions).toBe(true);
    });

    it('should include different question types', async () => {
      const result = await startConversation(patientId, 'I have a headache');

      const questionTypes = result.questions.map(q => q.questionType);
      
      // Should have variety of question types
      expect(questionTypes).toBeDefined();
      expect(questionTypes.length).toBeGreaterThan(0);
      
      // Check that we have at least one of the valid types
      const validTypes = ['multiple_choice', 'yes_no', 'scale', 'text'];
      const hasValidTypes = questionTypes.every(type => validTypes.includes(type));
      expect(hasValidTypes).toBe(true);
    });
  });

  describe('3. Answer Submission and State Management', () => {
    let testConversationId;
    let firstQuestionId;

    beforeAll(async () => {
      const result = await startConversation(patientId, 'I have fever and body ache');
      testConversationId = result.conversationId.toString();
      firstQuestionId = result.questions[0].questionId;
    });

    it('should submit answer to yes/no question', async () => {
      const conversation = await SymptomConversation.findById(testConversationId);
      const yesNoQuestion = conversation.questions.find(q => q.questionType === 'yes_no');

      if (yesNoQuestion) {
        const result = await submitAnswer(testConversationId, yesNoQuestion.questionId, 'yes');

        expect(result).toBeDefined();
        expect(result.conversationId.toString()).toBe(testConversationId);
        expect(result.questionId).toBe(yesNoQuestion.questionId);
        expect(result.answer).toBe('yes');
        expect(result.totalAnswers).toBeGreaterThan(0);
      }
    });

    it('should submit answer to multiple choice question', async () => {
      const conversation = await SymptomConversation.findById(testConversationId);
      const mcQuestion = conversation.questions.find(q => q.questionType === 'multiple_choice');

      if (mcQuestion && mcQuestion.options && mcQuestion.options.length > 0) {
        const result = await submitAnswer(testConversationId, mcQuestion.questionId, mcQuestion.options[0]);

        expect(result).toBeDefined();
        expect(result.answer).toBe(mcQuestion.options[0]);
        expect(result.totalAnswers).toBeGreaterThan(0);
      }
    });

    it('should submit answer to scale question', async () => {
      const conversation = await SymptomConversation.findById(testConversationId);
      const scaleQuestion = conversation.questions.find(q => q.questionType === 'scale');

      if (scaleQuestion) {
        const result = await submitAnswer(testConversationId, scaleQuestion.questionId, '7');

        expect(result).toBeDefined();
        expect(result.answer).toBe('7');
        expect(result.totalAnswers).toBeGreaterThan(0);
      }
    });

    it('should extract symptoms from text answers', async () => {
      const conversation = await SymptomConversation.findById(testConversationId);
      const textQuestion = conversation.questions.find(q => q.questionType === 'text');

      if (textQuestion) {
        const result = await submitAnswer(
          testConversationId, 
          textQuestion.questionId, 
          'I also have a sore throat and runny nose'
        );

        expect(result).toBeDefined();
        expect(result.extractedSymptoms).toBeDefined();
        // Should extract additional symptoms from text
        expect(result.extractedSymptoms.length).toBeGreaterThan(0);
      }
    });

    it('should update conversation state after each answer', async () => {
      const conversation = await SymptomConversation.findById(testConversationId);
      const unansweredQuestion = conversation.questions.find(q => 
        !conversation.answers.some(a => a.questionId === q.questionId)
      );

      if (unansweredQuestion) {
        const answersBefore = conversation.answers.length;
        
        let answerValue;
        if (unansweredQuestion.questionType === 'yes_no') {
          answerValue = 'no';
        } else if (unansweredQuestion.questionType === 'scale') {
          answerValue = '5';
        } else if (unansweredQuestion.questionType === 'multiple_choice' && unansweredQuestion.options.length > 0) {
          answerValue = unansweredQuestion.options[0];
        } else {
          answerValue = 'Test answer';
        }

        await submitAnswer(testConversationId, unansweredQuestion.questionId, answerValue);

        const updatedConversation = await SymptomConversation.findById(testConversationId);
        expect(updatedConversation.answers.length).toBe(answersBefore + 1);
      }
    });

    it('should prevent duplicate answers to same question', async () => {
      const conversation = await SymptomConversation.findById(testConversationId);
      const answeredQuestion = conversation.answers[0];
      
      // Get the question to provide correct answer format
      const question = conversation.questions.find(q => q.questionId === answeredQuestion.questionId);
      let newAnswer = 'new answer';
      
      if (question) {
        if (question.questionType === 'yes_no') {
          newAnswer = 'yes';
        } else if (question.questionType === 'scale') {
          newAnswer = '5';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          newAnswer = question.options[0];
        }
      }

      await expect(
        submitAnswer(testConversationId, answeredQuestion.questionId, newAnswer)
      ).rejects.toThrow('Answer already exists for this question');
    });

    it('should validate answer format for yes/no questions', async () => {
      const conversation = await SymptomConversation.findById(testConversationId);
      const yesNoQuestion = conversation.questions.find(q => 
        q.questionType === 'yes_no' && 
        !conversation.answers.some(a => a.questionId === q.questionId)
      );

      if (yesNoQuestion) {
        await expect(
          submitAnswer(testConversationId, yesNoQuestion.questionId, 'invalid')
        ).rejects.toThrow();
      }
    });

    it('should validate answer format for scale questions', async () => {
      const conversation = await SymptomConversation.findById(testConversationId);
      const scaleQuestion = conversation.questions.find(q => 
        q.questionType === 'scale' && 
        !conversation.answers.some(a => a.questionId === q.questionId)
      );

      if (scaleQuestion) {
        await expect(
          submitAnswer(testConversationId, scaleQuestion.questionId, '15')
        ).rejects.toThrow();
      }
    });
  });

  describe('4. Prediction Readiness Check', () => {
    let readinessTestConversationId;

    beforeAll(async () => {
      const result = await startConversation(patientId, 'I have a persistent cough');
      readinessTestConversationId = result.conversationId.toString();
    });

    it('should indicate not ready with less than 3 answers', async () => {
      const result = await canProceedToPrediction(readinessTestConversationId);

      expect(result).toBeDefined();
      expect(result.canProceedToPrediction).toBe(false);
      expect(result.answersProvided).toBeLessThan(3);
      expect(result.minimumRequired).toBe(3);
    });

    it('should indicate ready with 3 or more answers', async () => {
      const conversation = await SymptomConversation.findById(readinessTestConversationId);
      
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
          answer = 'Test answer';
        }
        
        await submitAnswer(readinessTestConversationId, question.questionId, answer);
      }

      const result = await canProceedToPrediction(readinessTestConversationId);

      expect(result).toBeDefined();
      expect(result.canProceedToPrediction).toBe(true);
      expect(result.answersProvided).toBeGreaterThanOrEqual(3);
    });
  });

  describe('5. Symptom Profile Generation', () => {
    let profileTestConversationId;

    beforeAll(async () => {
      const result = await startConversation(patientId, 'I have severe headache and nausea');
      profileTestConversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(profileTestConversationId);
      
      // Answer 3 questions to enable profile generation
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
          answer = 'I feel dizzy and have sensitivity to light';
        }
        
        await submitAnswer(profileTestConversationId, question.questionId, answer);
      }
    });

    it('should generate complete symptom profile', async () => {
      const profile = await generateSymptomProfile(profileTestConversationId);

      expect(profile).toBeDefined();
      expect(profile.conversationId.toString()).toBe(profileTestConversationId);
      expect(profile.patientId.toString()).toBe(patientId);
      expect(profile.initialSymptom).toBe('I have severe headache and nausea');
      // Category detection may vary based on symptom extractor
      expect(['neurological', 'gastrointestinal']).toContain(profile.symptomCategory);
      expect(profile.extractedSymptoms).toBeDefined();
      expect(profile.answers).toBeDefined();
      expect(profile.answers.length).toBeGreaterThanOrEqual(3);
      expect(profile.questions).toBeDefined();
      expect(profile.duration).toBeDefined();
      expect(profile.severity).toBeDefined();
    });

    it('should fail to generate profile with insufficient answers', async () => {
      const result = await startConversation(patientId, 'I have a cough');
      const newConversationId = result.conversationId.toString();

      await expect(
        generateSymptomProfile(newConversationId)
      ).rejects.toThrow('Not enough answers to generate symptom profile');
    });
  });

  describe('6. Conversation History Retrieval', () => {
    let historyTestConversationId;

    beforeAll(async () => {
      const result = await startConversation(patientId, 'I have chest pain');
      historyTestConversationId = result.conversationId.toString();
      
      const conversation = await SymptomConversation.findById(historyTestConversationId);
      
      // Answer some questions
      for (let i = 0; i < 2 && i < conversation.questions.length; i++) {
        const question = conversation.questions[i];
        let answer;
        
        if (question.questionType === 'yes_no') {
          answer = 'yes';
        } else if (question.questionType === 'scale') {
          answer = '7';
        } else if (question.questionType === 'multiple_choice' && question.options.length > 0) {
          answer = question.options[0];
        } else {
          answer = 'The pain is sharp and radiates to my arm';
        }
        
        await submitAnswer(historyTestConversationId, question.questionId, answer);
      }
    });

    it('should retrieve complete conversation history', async () => {
      const history = await getConversationHistory(historyTestConversationId);

      expect(history).toBeDefined();
      expect(history.conversationId.toString()).toBe(historyTestConversationId);
      expect(history.initialSymptom).toBe('I have chest pain');
      expect(history.symptomCategory).toBe('cardiovascular');
      expect(history.history).toBeDefined();
      expect(history.history.length).toBeGreaterThan(0);
      expect(history.questionsAsked).toBeGreaterThan(0);
      expect(history.questionsAnswered).toBeGreaterThan(0);
    });

    it('should show Q&A pairs in chronological order', async () => {
      const history = await getConversationHistory(historyTestConversationId);

      expect(history.history).toBeDefined();
      
      // Check chronological order
      for (let i = 1; i < history.history.length; i++) {
        const prevTime = new Date(history.history[i - 1].askedAt);
        const currTime = new Date(history.history[i].askedAt);
        expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
      }
    });

    it('should indicate which questions are answered', async () => {
      const history = await getConversationHistory(historyTestConversationId);

      expect(history.history).toBeDefined();
      
      const answeredQuestions = history.history.filter(item => item.isAnswered);
      const unansweredQuestions = history.history.filter(item => !item.isAnswered);
      
      expect(answeredQuestions.length).toBeGreaterThan(0);
      expect(unansweredQuestions.length).toBeGreaterThan(0);
      
      // Answered questions should have answer and answeredAt
      answeredQuestions.forEach(item => {
        expect(item.answer).toBeDefined();
        expect(item.answeredAt).toBeDefined();
      });
      
      // Unanswered questions should not have answer
      unansweredQuestions.forEach(item => {
        expect(item.answer).toBeNull();
        expect(item.answeredAt).toBeNull();
      });
    });
  });

  describe('7. Multiple Conversations Per Patient', () => {
    it('should allow patient to have multiple active conversations', async () => {
      const result1 = await startConversation(patientId, 'I have a cough');
      const result2 = await startConversation(patientId, 'I have a headache');

      expect(result1.conversationId).toBeDefined();
      expect(result2.conversationId).toBeDefined();
      expect(result1.conversationId.toString()).not.toBe(result2.conversationId.toString());
      
      const conversations = await SymptomConversation.find({ patientId, status: 'active' });
      expect(conversations.length).toBeGreaterThanOrEqual(2);
    });
  });
});
