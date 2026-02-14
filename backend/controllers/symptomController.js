const Symptom = require('../models/Symptom');
const Patient = require('../models/Patient');
const predictionService = require('../services/predictionService');
const symptomConversationService = require('../services/symptomConversationService');
const enhancedPredictionService = require('../services/enhancedPredictionService');
const universalDoctorMatcher = require('../services/universalDoctorMatcher');

// Submit symptoms and get prediction
exports.submitSymptom = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { symptomText } = req.body;

    if (!symptomText) {
      return res.status(400).json({
        success: false,
        message: 'Symptom text is required'
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Save symptom
    const symptom = new Symptom({
      patientId: patient._id,
      symptomText
    });
    await symptom.save();

    // Generate prediction
    const diseases = predictionService.predictDisease(symptomText);
    const prediction = await predictionService.savePrediction(patient._id, symptom._id, diseases);

    res.status(201).json({
      success: true,
      symptom: {
        _id: symptom._id,
        symptomText: symptom.symptomText,
        submittedAt: symptom.submittedAt
      },
      prediction: {
        id: prediction._id,
        diseases: prediction.diseases,
        recommendedSpecializations: prediction.recommendedSpecializations
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get symptoms by patient
exports.getSymptoms = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const symptoms = await Symptom.find({ patientId: patient._id })
      .sort({ submittedAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      symptoms
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get predictions by patient
exports.getPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const predictions = await predictionService.getPredictionsByPatient(patient._id);

    res.status(200).json({
      success: true,
      predictions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// Symptom Conversation API Endpoints
// ============================================

/**
 * Start a new symptom conversation
 * POST /api/symptoms/conversation
 * Requirements: 1.1, 2.1
 */
exports.startConversation = async (req, res) => {
  try {
    const patientId = req.user.id; // This is the patient's _id from JWT
    const { initialSymptom } = req.body;

    // Validate input
    if (!initialSymptom || initialSymptom.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Initial symptom is required'
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Start conversation
    const conversation = await symptomConversationService.startConversation(
      patientId,
      initialSymptom
    );

    res.status(201).json({
      success: true,
      message: 'Symptom conversation started successfully',
      conversationId: conversation.conversationId,
      symptomCategory: conversation.symptomCategory,
      initialSymptom: conversation.initialSymptom,
      questions: conversation.questions,
      extractedSymptoms: conversation.extractedSymptoms,
      status: conversation.status,
      canProceedToPrediction: conversation.questions && conversation.questions.length === 0
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start symptom conversation'
    });
  }
};

/**
 * Submit an answer to a conversation question
 * POST /api/symptoms/conversation/:id/answer
 * Requirements: 1.2, 1.3
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { questionId, answer } = req.body;

    // Validate input
    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required'
      });
    }

    if (answer === null || answer === undefined || answer === '') {
      return res.status(400).json({
        success: false,
        message: 'Answer is required'
      });
    }

    // Submit answer
    const result = await symptomConversationService.submitAnswer(
      conversationId,
      questionId,
      answer
    );

    // Get unanswered questions
    const unansweredResult = await symptomConversationService.getUnansweredQuestions(conversationId);

    res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      conversationId: result.conversationId,
      questionId: result.questionId,
      answer: result.answer,
      answeredAt: result.answeredAt,
      totalAnswers: result.totalAnswers,
      canProceedToPrediction: result.canProceedToPrediction,
      extractedSymptoms: result.extractedSymptoms,
      nextQuestions: unansweredResult.unansweredQuestions,
      remainingQuestions: unansweredResult.totalUnanswered
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit answer'
    });
  }
};

/**
 * Get predictions with confidence scores and recommended doctors
 * GET /api/symptoms/conversation/:id/prediction
 * Requirements: 1.4, 3.2, 3.3, 7.1
 */
exports.getPrediction = async (req, res) => {
  try {
    const { id: conversationId } = req.params;

    // Get predictions with confidence scores
    const predictionResult = await enhancedPredictionService.getPredictionsWithConfidence(conversationId);

    // Get recommended doctors based on predictions
    const doctors = await universalDoctorMatcher.getDoctorsForConditions(
      predictionResult.predictions,
      { limit: 10 }
    );

    res.status(200).json({
      success: true,
      message: 'Predictions generated successfully',
      conversationId: predictionResult.conversationId,
      predictions: predictionResult.predictions,
      symptomProfile: predictionResult.symptomProfile,
      hasLowConfidence: predictionResult.hasLowConfidence,
      lowConfidenceDisclaimer: predictionResult.lowConfidenceDisclaimer,
      recommendGeneralMedicine: predictionResult.recommendGeneralMedicine,
      recommendedDoctors: doctors.map(doctor => ({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        degree: doctor.degree,
        specializations: doctor.specializations,
        rating: doctor.rating,
        experienceYears: doctor.experienceYears,
        contactNumber: doctor.contactNumber,
        clinicAddress: doctor.clinicAddress,
        isGeneralMedicine: doctor.isGeneralMedicine,
        relevanceScore: doctor.relevanceScore,
        totalReviews: doctor.totalReviews || 0
      }))
    });
  } catch (error) {
    console.error('Error getting prediction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate predictions'
    });
  }
};

/**
 * Get complete conversation history
 * GET /api/symptoms/conversation/:id
 * Requirements: 6.1, 6.2
 */
exports.getConversationHistory = async (req, res) => {
  try {
    const { id: conversationId } = req.params;

    // Get conversation history
    const history = await symptomConversationService.getConversationHistory(conversationId);

    res.status(200).json({
      success: true,
      message: 'Conversation history retrieved successfully',
      data: history
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve conversation history'
    });
  }
};
