/**
 * Enhanced Prediction Service
 * Analyzes complete symptom profiles and generates predictions with confidence scores
 */

const SymptomConversation = require('../models/SymptomConversation');
const { getSpecializationsForDiseases } = require('./diseaseSpecializationMapping');

// Enhanced disease database with primary and secondary symptoms
const DISEASE_DATABASE = {
  // Respiratory diseases
  'Influenza': {
    primarySymptoms: ['fever', 'cough', 'flu'],
    secondarySymptoms: ['headache', 'body ache', 'fatigue', 'sore throat', 'chills'],
    category: 'respiratory',
    specializations: ['General Medicine', 'Internal Medicine'],
    description: 'Common flu with fever and body aches'
  },
  'Bronchitis': {
    primarySymptoms: ['cough', 'chest pain'],
    secondarySymptoms: ['mucus', 'phlegm', 'shortness of breath', 'fatigue', 'fever'],
    category: 'respiratory',
    specializations: ['General Medicine', 'Pulmonology'],
    description: 'Inflammation of bronchial tubes'
  },
  'Asthma': {
    primarySymptoms: ['shortness of breath', 'wheezing', 'breathing difficulty'],
    secondarySymptoms: ['cough', 'chest tightness', 'chest pain'],
    category: 'respiratory',
    specializations: ['General Medicine', 'Pulmonology'],
    description: 'Chronic respiratory condition'
  },
  'Pneumonia': {
    primarySymptoms: ['cough', 'fever', 'chest pain'],
    secondarySymptoms: ['shortness of breath', 'fatigue', 'chills', 'mucus'],
    category: 'respiratory',
    specializations: ['General Medicine', 'Pulmonology'],
    description: 'Lung infection causing inflammation'
  },
  
  // Cardiovascular diseases
  'Angina': {
    primarySymptoms: ['chest pain', 'chest tightness'],
    secondarySymptoms: ['shortness of breath', 'pain radiating', 'sweating', 'nausea'],
    category: 'cardiovascular',
    specializations: ['Cardiology', 'General Medicine'],
    description: 'Heart-related chest pain'
  },
  'Hypertension': {
    primarySymptoms: ['headache', 'dizziness'],
    secondarySymptoms: ['chest pain', 'shortness of breath', 'nosebleed', 'vision changes'],
    category: 'cardiovascular',
    specializations: ['Cardiology', 'General Medicine'],
    description: 'High blood pressure'
  },
  'Arrhythmia': {
    primarySymptoms: ['palpitations', 'irregular heartbeat'],
    secondarySymptoms: ['dizziness', 'chest pain', 'shortness of breath', 'fatigue'],
    category: 'cardiovascular',
    specializations: ['Cardiology'],
    description: 'Irregular heart rhythm'
  },
  
  // Gastrointestinal diseases
  'Gastritis': {
    primarySymptoms: ['stomach pain', 'abdominal pain'],
    secondarySymptoms: ['nausea', 'vomiting', 'bloating', 'indigestion', 'loss of appetite'],
    category: 'gastrointestinal',
    specializations: ['General Medicine', 'Gastroenterology'],
    description: 'Stomach lining inflammation'
  },
  'Acid Reflux': {
    primarySymptoms: ['heartburn', 'chest pain'],
    secondarySymptoms: ['regurgitation', 'difficulty swallowing', 'sore throat', 'cough'],
    category: 'gastrointestinal',
    specializations: ['General Medicine', 'Gastroenterology'],
    description: 'Digestive issue causing chest discomfort'
  },
  'Ulcer': {
    primarySymptoms: ['stomach pain', 'abdominal pain'],
    secondarySymptoms: ['nausea', 'vomiting', 'bloating', 'weight loss', 'dark stool'],
    category: 'gastrointestinal',
    specializations: ['General Medicine', 'Gastroenterology'],
    description: 'Stomach or intestinal ulcer'
  },
  'Irritable Bowel Syndrome': {
    primarySymptoms: ['abdominal pain', 'cramping'],
    secondarySymptoms: ['diarrhea', 'constipation', 'bloating', 'gas', 'mucus in stool'],
    category: 'gastrointestinal',
    specializations: ['General Medicine', 'Gastroenterology'],
    description: 'Chronic digestive disorder'
  },
  
  // Neurological diseases
  'Migraine': {
    primarySymptoms: ['headache', 'severe headache'],
    secondarySymptoms: ['sensitivity to light', 'sensitivity to sound', 'nausea', 'vomiting', 'vision changes'],
    category: 'neurological',
    specializations: ['Neurology', 'General Medicine'],
    description: 'Severe headache with sensitivity to light'
  },
  'Tension Headache': {
    primarySymptoms: ['headache', 'head pressure'],
    secondarySymptoms: ['neck pain', 'shoulder pain', 'fatigue', 'difficulty concentrating'],
    category: 'neurological',
    specializations: ['General Medicine', 'Neurology'],
    description: 'Stress-related headache'
  },
  'Vertigo': {
    primarySymptoms: ['dizziness', 'spinning sensation'],
    secondarySymptoms: ['nausea', 'vomiting', 'balance problems', 'headache'],
    category: 'neurological',
    specializations: ['Neurology', 'ENT', 'General Medicine'],
    description: 'Sensation of spinning or loss of balance'
  },
  
  // Musculoskeletal diseases
  'Arthritis': {
    primarySymptoms: ['joint pain', 'joint stiffness'],
    secondarySymptoms: ['swelling', 'redness', 'decreased range of motion', 'warmth'],
    category: 'musculoskeletal',
    specializations: ['Orthopedics', 'Rheumatology', 'General Medicine'],
    description: 'Joint inflammation'
  },
  'Rheumatoid Arthritis': {
    primarySymptoms: ['joint pain', 'joint swelling'],
    secondarySymptoms: ['stiffness', 'fatigue', 'fever', 'weight loss', 'multiple joints'],
    category: 'musculoskeletal',
    specializations: ['Rheumatology', 'General Medicine'],
    description: 'Autoimmune joint disease'
  },
  'Osteoarthritis': {
    primarySymptoms: ['joint pain', 'stiffness'],
    secondarySymptoms: ['decreased flexibility', 'grating sensation', 'bone spurs', 'swelling'],
    category: 'musculoskeletal',
    specializations: ['Orthopedics', 'General Medicine'],
    description: 'Degenerative joint disease'
  },
  
  // Dermatological diseases
  'Eczema': {
    primarySymptoms: ['skin rash', 'itching'],
    secondarySymptoms: ['dry skin', 'redness', 'swelling', 'cracked skin'],
    category: 'dermatological',
    specializations: ['Dermatology', 'General Medicine'],
    description: 'Inflammatory skin condition'
  },
  'Psoriasis': {
    primarySymptoms: ['skin rash', 'scaly patches'],
    secondarySymptoms: ['itching', 'burning', 'dry skin', 'cracked skin'],
    category: 'dermatological',
    specializations: ['Dermatology', 'General Medicine'],
    description: 'Chronic skin disorder'
  },
  
  // Other common conditions
  'Dengue': {
    primarySymptoms: ['fever', 'severe headache'],
    secondarySymptoms: ['joint pain', 'muscle pain', 'rash', 'nausea', 'vomiting'],
    category: 'general',
    specializations: ['General Medicine', 'Internal Medicine'],
    description: 'Mosquito-borne viral infection'
  },
  'Common Cold': {
    primarySymptoms: ['runny nose', 'sneezing', 'cough'],
    secondarySymptoms: ['sore throat', 'congestion', 'mild headache', 'mild fever'],
    category: 'respiratory',
    specializations: ['General Medicine'],
    description: 'Viral upper respiratory infection'
  }
};

/**
 * Calculate confidence score for a disease based on symptom profile
 * Weights: Primary symptoms (40%), Secondary symptoms (30%), Follow-up answers (20%), Duration (10%)
 * @param {Object} disease - Disease object from database
 * @param {Object} symptomProfile - Complete symptom profile from conversation
 * @returns {number} - Confidence score (0-100)
 */
function calculateConfidenceScore(disease, symptomProfile) {
  let score = 0;
  
  const weights = {
    primarySymptom: 40,
    secondarySymptoms: 30,
    followUpAnswers: 20,
    duration: 10
  };
  
  // 1. Primary symptom match (40%)
  const initialSymptomLower = symptomProfile.initialSymptom.toLowerCase();
  const extractedSymptomsLower = symptomProfile.extractedSymptoms.map(s => s.toLowerCase());
  const allSymptoms = [initialSymptomLower, ...extractedSymptomsLower];
  
  let primaryMatch = false;
  for (const primarySymptom of disease.primarySymptoms) {
    if (allSymptoms.some(s => s.includes(primarySymptom) || primarySymptom.includes(s))) {
      primaryMatch = true;
      break;
    }
  }
  
  if (primaryMatch) {
    score += weights.primarySymptom;
  }
  
  // 2. Secondary symptom matches (30%)
  if (disease.secondarySymptoms && disease.secondarySymptoms.length > 0) {
    let matchedSecondary = 0;
    
    for (const secondarySymptom of disease.secondarySymptoms) {
      if (allSymptoms.some(s => s.includes(secondarySymptom) || secondarySymptom.includes(s))) {
        matchedSecondary++;
      }
    }
    
    const secondaryMatchRatio = matchedSecondary / disease.secondarySymptoms.length;
    score += secondaryMatchRatio * weights.secondarySymptoms;
  }
  
  // 3. Follow-up answer relevance (20%)
  const answerRelevance = analyzeAnswerRelevance(disease, symptomProfile);
  score += answerRelevance * weights.followUpAnswers;
  
  // 4. Duration factor (10%)
  const durationFactor = calculateDurationFactor(disease, symptomProfile.duration);
  score += durationFactor * weights.duration;
  
  // Ensure score is between 0 and 100
  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Analyze relevance of follow-up answers to the disease
 * @param {Object} disease - Disease object
 * @param {Object} symptomProfile - Symptom profile with answers
 * @returns {number} - Relevance score (0-1)
 */
function analyzeAnswerRelevance(disease, symptomProfile) {
  if (!symptomProfile.answers || symptomProfile.answers.length === 0) {
    return 0.5; // Neutral score if no answers
  }
  
  let relevanceScore = 0;
  let scoredAnswers = 0;
  
  symptomProfile.answers.forEach(answer => {
    const question = symptomProfile.questions.find(q => q.questionId === answer.questionId);
    
    if (!question) {
      return;
    }
    
    const answerLower = answer.answer.toLowerCase();
    const questionLower = question.questionText.toLowerCase();
    
    // Check for severity indicators
    if (question.questionType === 'scale') {
      const severity = parseInt(answer.answer);
      if (!isNaN(severity)) {
        // Higher severity increases relevance for serious conditions
        if (disease.category === 'cardiovascular' || disease.category === 'neurological') {
          relevanceScore += severity >= 7 ? 1 : severity / 10;
        } else {
          relevanceScore += severity / 10;
        }
        scoredAnswers++;
      }
    }
    
    // Check for yes/no answers that indicate disease symptoms
    if (question.questionType === 'yes_no') {
      if (answerLower === 'yes') {
        // Check if question relates to disease symptoms
        const questionIndicatesSymptom = disease.secondarySymptoms.some(symptom => 
          questionLower.includes(symptom)
        );
        
        if (questionIndicatesSymptom) {
          relevanceScore += 1;
        } else {
          relevanceScore += 0.5;
        }
      } else {
        relevanceScore += 0.3; // Slight penalty for 'no' answers
      }
      scoredAnswers++;
    }
    
    // Check for multiple choice answers
    if (question.questionType === 'multiple_choice') {
      // Check if answer contains disease-related keywords
      const answerRelevant = disease.secondarySymptoms.some(symptom => 
        answerLower.includes(symptom) || symptom.includes(answerLower)
      );
      
      if (answerRelevant) {
        relevanceScore += 1;
      } else {
        relevanceScore += 0.5;
      }
      scoredAnswers++;
    }
  });
  
  // Return average relevance (0-1)
  return scoredAnswers > 0 ? Math.min(relevanceScore / scoredAnswers, 1) : 0.5;
}

/**
 * Calculate duration factor for disease confidence
 * @param {Object} disease - Disease object
 * @param {string} duration - Duration category (acute, subacute, chronic, unknown)
 * @returns {number} - Duration factor (0-1)
 */
function calculateDurationFactor(disease, duration) {
  if (!duration || duration === 'unknown') {
    return 0.5; // Neutral score
  }
  
  // Different diseases have typical duration patterns
  const acuteDiseases = ['Influenza', 'Common Cold', 'Gastritis', 'Acid Reflux'];
  const chronicDiseases = ['Asthma', 'Arthritis', 'Rheumatoid Arthritis', 'Osteoarthritis', 'Hypertension', 'Irritable Bowel Syndrome'];
  
  if (duration === 'acute' && acuteDiseases.includes(disease.name)) {
    return 1;
  }
  
  if (duration === 'chronic' && chronicDiseases.includes(disease.name)) {
    return 1;
  }
  
  if (duration === 'subacute') {
    return 0.7; // Moderate match for subacute
  }
  
  return 0.5; // Neutral for mismatches
}

/**
 * Analyze complete symptom profile and generate predictions with confidence scores
 * @param {Object} symptomProfile - Complete symptom profile from conversation
 * @returns {Array} - Array of predictions sorted by confidence score
 */
function analyzeSymptomsWithConfidence(symptomProfile) {
  const predictions = [];
  
  // Analyze each disease in the database
  for (const [diseaseName, diseaseData] of Object.entries(DISEASE_DATABASE)) {
    const disease = {
      name: diseaseName,
      ...diseaseData
    };
    
    // Calculate confidence score
    const confidence = calculateConfidenceScore(disease, symptomProfile);
    
    // Only include predictions with confidence > 0
    if (confidence > 0) {
      predictions.push({
        disease: diseaseName,
        confidence,
        specializations: diseaseData.specializations,
        description: diseaseData.description,
        category: diseaseData.category
      });
    }
  }
  
  // Sort by confidence score (descending)
  predictions.sort((a, b) => b.confidence - a.confidence);
  
  // Return top 5 predictions
  return predictions.slice(0, 5);
}

/**
 * Get disease predictions with confidence scores from symptom profile
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Predictions with confidence scores
 */
async function getPredictionsWithConfidence(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Get conversation
    const conversation = await SymptomConversation.findById(conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Check if enough answers provided
    if (!conversation.canProceedToPrediction()) {
      throw new Error('Not enough answers to generate predictions. Minimum 3 answers required.');
    }
    
    // Build symptom profile
    const symptomProfile = {
      conversationId: conversation._id,
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
      duration: getDurationFromProfile(conversation),
      severity: getSeverityFromProfile(conversation)
    };
    
    // Analyze symptoms and get predictions
    const predictions = analyzeSymptomsWithConfidence(symptomProfile);
    
    // Check for low confidence
    const hasLowConfidence = predictions.length > 0 && predictions.every(p => p.confidence < 50);
    
    // Add low confidence handling
    let lowConfidenceDisclaimer = null;
    let recommendGeneralMedicine = false;
    
    if (hasLowConfidence) {
      lowConfidenceDisclaimer = 'The confidence scores for all predictions are below 50%. We recommend consulting with a General Medicine doctor for a comprehensive evaluation.';
      recommendGeneralMedicine = true;
      
      // Ensure General Medicine is in specializations if not already present
      predictions.forEach(prediction => {
        if (!prediction.specializations.includes('General Medicine')) {
          prediction.specializations.unshift('General Medicine');
        }
      });
    }
    
    // Store predictions in conversation
    conversation.addPredictions(predictions);
    await conversation.save();
    
    return {
      conversationId: conversation._id,
      predictions,
      symptomProfile: {
        initialSymptom: symptomProfile.initialSymptom,
        extractedSymptoms: symptomProfile.extractedSymptoms,
        duration: symptomProfile.duration,
        severity: symptomProfile.severity
      },
      hasLowConfidence,
      lowConfidenceDisclaimer,
      recommendGeneralMedicine
    };
  } catch (error) {
    console.error('Error getting predictions with confidence:', error);
    throw error;
  }
}

/**
 * Helper function to extract duration from conversation
 * @param {Object} conversation - Conversation object
 * @returns {string} - Duration category
 */
function getDurationFromProfile(conversation) {
  const { answers, questions } = conversation;
  
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
 * Helper function to extract severity from conversation
 * @param {Object} conversation - Conversation object
 * @returns {number} - Severity score (0-10)
 */
function getSeverityFromProfile(conversation) {
  const { answers, questions } = conversation;
  
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
 * Recalculate predictions when new answers are added to conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Updated predictions with new confidence scores
 */
async function recalculatePredictions(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Get conversation
    const conversation = await SymptomConversation.findById(conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Check if conversation is still active
    if (conversation.status !== 'active') {
      throw new Error('Cannot recalculate predictions for non-active conversation');
    }
    
    // Check if enough answers provided
    if (!conversation.canProceedToPrediction()) {
      return {
        conversationId: conversation._id,
        predictions: [],
        message: 'Not enough answers to generate predictions. Minimum 3 answers required.',
        answersProvided: conversation.answers.length,
        minimumRequired: 3
      };
    }
    
    // Build symptom profile
    const symptomProfile = {
      conversationId: conversation._id,
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
      duration: getDurationFromProfile(conversation),
      severity: getSeverityFromProfile(conversation)
    };
    
    // Analyze symptoms and get updated predictions
    const predictions = analyzeSymptomsWithConfidence(symptomProfile);
    
    // Check for low confidence
    const hasLowConfidence = predictions.length > 0 && predictions.every(p => p.confidence < 50);
    
    // Add low confidence handling
    let lowConfidenceDisclaimer = null;
    let recommendGeneralMedicine = false;
    
    if (hasLowConfidence) {
      lowConfidenceDisclaimer = 'The confidence scores for all predictions are below 50%. We recommend consulting with a General Medicine doctor for a comprehensive evaluation.';
      recommendGeneralMedicine = true;
      
      // Ensure General Medicine is in specializations if not already present
      predictions.forEach(prediction => {
        if (!prediction.specializations.includes('General Medicine')) {
          prediction.specializations.unshift('General Medicine');
        }
      });
    }
    
    // Update predictions in conversation
    conversation.addPredictions(predictions);
    await conversation.save();
    
    return {
      conversationId: conversation._id,
      predictions,
      recalculatedAt: new Date(),
      answersUsed: conversation.answers.length,
      hasLowConfidence,
      lowConfidenceDisclaimer,
      recommendGeneralMedicine,
      message: 'Predictions recalculated successfully'
    };
  } catch (error) {
    console.error('Error recalculating predictions:', error);
    throw error;
  }
}

module.exports = {
  calculateConfidenceScore,
  analyzeAnswerRelevance,
  calculateDurationFactor,
  analyzeSymptomsWithConfidence,
  getPredictionsWithConfidence,
  recalculatePredictions,
  DISEASE_DATABASE
};
