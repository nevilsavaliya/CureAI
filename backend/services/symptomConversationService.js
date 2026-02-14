/**
 * Symptom Conversation Engine Service
 * Orchestrates the multi-step symptom gathering process
 */

const SymptomConversation = require('../models/SymptomConversation');
const {
  detectSymptomCategory,
  generateQuestionsForCategory,
  validateAnswer
} = require('./questionGenerator');
const { extractSymptomsFromText } = require('./symptomExtractor');

/**
 * Start a new symptom conversation
 * @param {string} patientId - Patient ID
 * @param {string} initialSymptom - Initial symptom description
 * @returns {Promise<Object>} - Created conversation with initial questions
 */
async function startConversation(patientId, initialSymptom) {
  try {
    // Validate inputs
    if (!patientId || !initialSymptom) {
      throw new Error('Patient ID and initial symptom are required');
    }

    // Detect symptom category
    const symptomCategory = detectSymptomCategory(initialSymptom);

    // Generate initial follow-up questions (2-5 questions)
    const questionTemplates = generateQuestionsForCategory(symptomCategory, [], 5);

    // Create new conversation
    const conversation = new SymptomConversation({
      patientId,
      initialSymptom: initialSymptom.trim(),
      symptomCategory,
      status: 'active'
    });

    // Add questions to conversation
    questionTemplates.forEach(template => {
      conversation.addQuestion(
        template.id,
        template.text,
        template.type,
        template.options || []
      );
    });

    // Extract symptoms from initial symptom text
    const extractedSymptoms = extractSymptomsFromText(initialSymptom);
    conversation.extractedSymptoms = extractedSymptoms;

    // Save conversation to database
    await conversation.save();

    return {
      conversationId: conversation._id,
      symptomCategory,
      initialSymptom: conversation.initialSymptom,
      questions: conversation.questions.map(q => ({
        questionId: q.questionId,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options
      })),
      extractedSymptoms,
      status: conversation.status
    };
  } catch (error) {
    console.error('Error starting conversation:', error);
    throw error;
  }
}

/**
 * Submit an answer to a question in the conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} questionId - Question ID
 * @param {string} answer - Patient's answer
 * @returns {Promise<Object>} - Updated conversation state
 */
async function submitAnswer(conversationId, questionId, answer) {
  try {
    // Validate inputs
    if (!conversationId || !questionId || answer === null || answer === undefined) {
      throw new Error('Conversation ID, question ID, and answer are required');
    }

    // Find conversation
    const conversation = await SymptomConversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if conversation is still active
    if (conversation.status !== 'active') {
      throw new Error('Conversation is not active');
    }

    // Find the question
    const question = conversation.questions.find(q => q.questionId === questionId);

    if (!question) {
      throw new Error('Question not found in conversation');
    }

    // Validate answer format
    const validation = validateAnswer(
      {
        type: question.questionType,
        options: question.options,
        min: 1,
        max: 10
      },
      answer
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if answer already exists
    const existingAnswer = conversation.answers.find(a => a.questionId === questionId);
    if (existingAnswer) {
      throw new Error('Answer already exists for this question');
    }

    // Add answer to conversation
    conversation.addAnswer(questionId, answer.toString().trim());

    // Extract additional symptoms from text answers
    if (question.questionType === 'text') {
      const newSymptoms = extractSymptomsFromText(answer);

      // Add new symptoms to extracted symptoms (avoid duplicates)
      newSymptoms.forEach(symptom => {
        if (!conversation.extractedSymptoms.includes(symptom)) {
          conversation.extractedSymptoms.push(symptom);
        }
      });
    }

    // Save updated conversation
    await conversation.save();

    return {
      conversationId: conversation._id,
      questionId,
      answer: answer.toString().trim(),
      answeredAt: new Date(),
      totalAnswers: conversation.answers.length,
      canProceedToPrediction: conversation.canProceedToPrediction(),
      extractedSymptoms: conversation.extractedSymptoms
    };
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Check if conversation has enough information for prediction
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Prediction readiness status
 */
async function canProceedToPrediction(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const conversation = await SymptomConversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const canProceed = conversation.canProceedToPrediction();

    return {
      conversationId: conversation._id,
      canProceedToPrediction: canProceed,
      answersProvided: conversation.answers.length,
      minimumRequired: 3,
      status: conversation.status
    };
  } catch (error) {
    console.error('Error checking prediction readiness:', error);
    throw error;
  }
}

/**
 * Generate symptom profile from conversation data
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Complete symptom profile
 */
async function generateSymptomProfile(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const conversation = await SymptomConversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if enough answers provided
    if (!conversation.canProceedToPrediction()) {
      throw new Error('Not enough answers to generate symptom profile. Minimum 3 answers required.');
    }

    // Build symptom profile
    const profile = {
      conversationId: conversation._id,
      patientId: conversation.patientId,
      initialSymptom: conversation.initialSymptom,
      symptomCategory: conversation.symptomCategory,
      extractedSymptoms: conversation.extractedSymptoms,
      answers: conversation.answers.map(a => ({
        questionId: a.questionId,
        answer: a.answer,
        answeredAt: a.answeredAt
      })),
      questions: conversation.questions.map(q => ({
        questionId: q.questionId,
        questionText: q.questionText,
        questionType: q.questionType
      })),
      duration: getDurationFromAnswers(conversation.answers, conversation.questions),
      severity: getSeverityFromAnswers(conversation.answers, conversation.questions),
      createdAt: conversation.createdAt
    };

    return profile;
  } catch (error) {
    console.error('Error generating symptom profile:', error);
    throw error;
  }
}

/**
 * Mark conversation as completed
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Updated conversation
 */
async function completeConversation(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const conversation = await SymptomConversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Mark as completed
    await conversation.complete();

    return {
      conversationId: conversation._id,
      status: conversation.status,
      completedAt: conversation.completedAt,
      totalQuestions: conversation.questions.length,
      totalAnswers: conversation.answers.length
    };
  } catch (error) {
    console.error('Error completing conversation:', error);
    throw error;
  }
}

/**
 * Helper function to extract duration from answers
 * @param {Array} answers - Array of answers
 * @param {Array} questions - Array of questions
 * @returns {string} - Duration category
 */
function getDurationFromAnswers(answers, questions) {
  // Look for duration-related questions
  const durationQuestions = questions.filter(q =>
    q.questionText.toLowerCase().includes('how long') ||
    q.questionText.toLowerCase().includes('duration')
  );

  if (durationQuestions.length === 0) {
    return 'unknown';
  }

  // Find the answer to the duration question
  const durationAnswer = answers.find(a =>
    durationQuestions.some(q => q.questionId === a.questionId)
  );

  if (!durationAnswer) {
    return 'unknown';
  }

  const answer = durationAnswer.answer.toLowerCase();

  if (answer.includes('24 hours') || answer.includes('less than')) {
    return 'acute';
  } else if (answer.includes('1-3 days') || answer.includes('4-7 days')) {
    return 'subacute';
  } else if (answer.includes('week') || answer.includes('more than')) {
    return 'chronic';
  }

  return 'unknown';
}

/**
 * Helper function to extract severity from answers
 * @param {Array} answers - Array of answers
 * @param {Array} questions - Array of questions
 * @returns {number} - Severity score (0-10)
 */
function getSeverityFromAnswers(answers, questions) {
  // Look for scale-type questions (severity ratings)
  const scaleQuestions = questions.filter(q => q.questionType === 'scale');

  if (scaleQuestions.length === 0) {
    return 5; // Default moderate severity
  }

  // Find answers to scale questions
  const scaleAnswers = answers.filter(a =>
    scaleQuestions.some(q => q.questionId === a.questionId)
  );

  if (scaleAnswers.length === 0) {
    return 5;
  }

  // Calculate average severity
  const total = scaleAnswers.reduce((sum, a) => sum + parseInt(a.answer), 0);
  const average = total / scaleAnswers.length;

  return Math.round(average);
}

/**
 * Get complete conversation history with Q&A pairs
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Complete conversation history
 */
async function getConversationHistory(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const conversation = await SymptomConversation.findById(conversationId)
      .populate('patientId', 'name email')
      .populate('recommendedDoctors.doctorId', 'name specializations');

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Build Q&A pairs in chronological order
    const qaHistory = conversation.questions.map(question => {
      const answer = conversation.answers.find(a => a.questionId === question.questionId);

      return {
        questionId: question.questionId,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options,
        askedAt: question.askedAt,
        answer: answer ? answer.answer : null,
        answeredAt: answer ? answer.answeredAt : null,
        isAnswered: !!answer
      };
    });

    // Sort by asked time to maintain chronological order
    qaHistory.sort((a, b) => new Date(a.askedAt) - new Date(b.askedAt));

    return {
      conversationId: conversation._id,
      patientId: conversation.patientId,
      initialSymptom: conversation.initialSymptom,
      symptomCategory: conversation.symptomCategory,
      extractedSymptoms: conversation.extractedSymptoms,
      history: qaHistory,
      predictions: conversation.predictions.map(p => ({
        disease: p.disease,
        confidence: p.confidence,
        specializations: p.specializations,
        calculatedAt: p.calculatedAt
      })),
      recommendedDoctors: conversation.recommendedDoctors,
      status: conversation.status,
      questionsAsked: conversation.questions.length,
      questionsAnswered: conversation.answers.length,
      canProceedToPrediction: conversation.canProceedToPrediction(),
      createdAt: conversation.createdAt,
      completedAt: conversation.completedAt,
      updatedAt: conversation.updatedAt
    };
  } catch (error) {
    console.error('Error getting conversation history:', error);
    throw error;
  }
}

/**
 * Get conversation summary (lightweight version)
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Conversation summary
 */
async function getConversationSummary(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const conversation = await SymptomConversation.findById(conversationId)
      .select('patientId initialSymptom symptomCategory status extractedSymptoms createdAt completedAt');

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation.getSummary();
  } catch (error) {
    console.error('Error getting conversation summary:', error);
    throw error;
  }
}

/**
 * Get all conversations for a patient
 * @param {string} patientId - Patient ID
 * @param {string} status - Filter by status (optional: 'active', 'completed', 'abandoned')
 * @returns {Promise<Array>} - Array of conversations
 */
async function getPatientConversations(patientId, status = null) {
  try {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }

    const query = { patientId };

    if (status) {
      query.status = status;
    }

    const conversations = await SymptomConversation.find(query)
      .select('initialSymptom symptomCategory status createdAt completedAt')
      .sort({ createdAt: -1 });

    return conversations.map(conv => ({
      conversationId: conv._id,
      initialSymptom: conv.initialSymptom,
      symptomCategory: conv.symptomCategory,
      status: conv.status,
      createdAt: conv.createdAt,
      completedAt: conv.completedAt
    }));
  } catch (error) {
    console.error('Error getting patient conversations:', error);
    throw error;
  }
}

/**
 * Get unanswered questions in a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} - Array of unanswered questions
 */
async function getUnansweredQuestions(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const conversation = await SymptomConversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Find questions without answers
    const answeredQuestionIds = new Set(conversation.answers.map(a => a.questionId));

    const unansweredQuestions = conversation.questions
      .filter(q => !answeredQuestionIds.has(q.questionId))
      .map(q => ({
        questionId: q.questionId,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        askedAt: q.askedAt
      }));

    return {
      conversationId: conversation._id,
      unansweredQuestions,
      totalUnanswered: unansweredQuestions.length,
      totalQuestions: conversation.questions.length,
      totalAnswered: conversation.answers.length
    };
  } catch (error) {
    console.error('Error getting unanswered questions:', error);
    throw error;
  }
}

module.exports = {
  startConversation,
  submitAnswer,
  canProceedToPrediction,
  generateSymptomProfile,
  completeConversation,
  getConversationHistory,
  getConversationSummary,
  getPatientConversations,
  getUnansweredQuestions
};
