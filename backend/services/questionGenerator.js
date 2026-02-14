/**
 * Question Generator Service
 * Generates contextual follow-up questions based on symptom categories
 */

// Question templates organized by medical category
const QUESTION_TEMPLATES = {
  respiratory: [
    {
      id: 'resp_001',
      text: 'How long have you had this symptom?',
      type: 'multiple_choice',
      options: ['Less than 24 hours', '1-3 days', '4-7 days', 'More than a week'],
      priority: 10,
      diagnosticValue: 'high'
    },
    {
      id: 'resp_002',
      text: 'Do you have a fever?',
      type: 'yes_no',
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'resp_003',
      text: 'On a scale of 1-10, how severe is your breathing difficulty?',
      type: 'scale',
      min: 1,
      max: 10,
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'resp_004',
      text: 'Is your cough dry or producing mucus?',
      type: 'multiple_choice',
      options: ['Dry cough', 'Mucus/phlegm', 'Not applicable'],
      priority: 7,
      diagnosticValue: 'medium'
    },
    {
      id: 'resp_005',
      text: 'Do you have chest pain or tightness?',
      type: 'yes_no',
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'resp_006',
      text: 'Are you experiencing wheezing sounds when breathing?',
      type: 'yes_no',
      priority: 6,
      diagnosticValue: 'medium'
    },
    {
      id: 'resp_007',
      text: 'Do you have a sore throat?',
      type: 'yes_no',
      priority: 5,
      diagnosticValue: 'medium'
    },
    {
      id: 'resp_008',
      text: 'Are you experiencing nasal congestion or runny nose?',
      type: 'yes_no',
      priority: 4,
      diagnosticValue: 'low'
    }
  ],

  cardiovascular: [
    {
      id: 'cardio_001',
      text: 'Where exactly is the chest pain located?',
      type: 'multiple_choice',
      options: ['Center of chest', 'Left side', 'Right side', 'Radiating to arm/jaw'],
      priority: 10,
      diagnosticValue: 'high'
    },
    {
      id: 'cardio_002',
      text: 'How long does the pain last?',
      type: 'multiple_choice',
      options: ['Few seconds', 'Few minutes', '30+ minutes', 'Constant'],
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'cardio_003',
      text: 'Do you feel shortness of breath?',
      type: 'yes_no',
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'cardio_004',
      text: 'Do you experience palpitations or irregular heartbeat?',
      type: 'yes_no',
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'cardio_005',
      text: 'Does the pain worsen with physical activity?',
      type: 'yes_no',
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'cardio_006',
      text: 'Do you feel dizzy or lightheaded?',
      type: 'yes_no',
      priority: 7,
      diagnosticValue: 'medium'
    },
    {
      id: 'cardio_007',
      text: 'Are you experiencing sweating or nausea?',
      type: 'yes_no',
      priority: 6,
      diagnosticValue: 'medium'
    },
    {
      id: 'cardio_008',
      text: 'Do you have swelling in your legs or ankles?',
      type: 'yes_no',
      priority: 5,
      diagnosticValue: 'medium'
    }
  ],

  gastrointestinal: [
    {
      id: 'gi_001',
      text: 'Where is the pain located?',
      type: 'multiple_choice',
      options: ['Upper abdomen', 'Lower abdomen', 'Around navel', 'Entire abdomen'],
      priority: 10,
      diagnosticValue: 'high'
    },
    {
      id: 'gi_002',
      text: 'When does the pain occur?',
      type: 'multiple_choice',
      options: ['After eating', 'Before eating', 'No pattern', 'At night'],
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'gi_003',
      text: 'Do you have nausea or vomiting?',
      type: 'yes_no',
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'gi_004',
      text: 'Have you noticed changes in bowel movements?',
      type: 'multiple_choice',
      options: ['Diarrhea', 'Constipation', 'Both', 'No change'],
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'gi_005',
      text: 'Is there bloating or gas?',
      type: 'yes_no',
      priority: 6,
      diagnosticValue: 'medium'
    },
    {
      id: 'gi_006',
      text: 'Have you noticed blood in your stool?',
      type: 'yes_no',
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'gi_007',
      text: 'Do you have heartburn or acid reflux?',
      type: 'yes_no',
      priority: 7,
      diagnosticValue: 'medium'
    },
    {
      id: 'gi_008',
      text: 'Have you experienced loss of appetite?',
      type: 'yes_no',
      priority: 5,
      diagnosticValue: 'medium'
    }
  ],

  neurological: [
    {
      id: 'neuro_001',
      text: 'What type of headache do you have?',
      type: 'multiple_choice',
      options: ['Throbbing/pulsating', 'Pressure/tightness', 'Sharp/stabbing', 'Dull ache'],
      priority: 10,
      diagnosticValue: 'high'
    },
    {
      id: 'neuro_002',
      text: 'Where is the headache located?',
      type: 'multiple_choice',
      options: ['One side', 'Both sides', 'Forehead', 'Back of head'],
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'neuro_003',
      text: 'Do you have sensitivity to light or sound?',
      type: 'yes_no',
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'neuro_004',
      text: 'Have you experienced vision changes?',
      type: 'yes_no',
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'neuro_005',
      text: 'Do you feel dizzy or have balance problems?',
      type: 'yes_no',
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'neuro_006',
      text: 'Are you experiencing numbness or tingling?',
      type: 'yes_no',
      priority: 7,
      diagnosticValue: 'medium'
    },
    {
      id: 'neuro_007',
      text: 'Do you have difficulty speaking or understanding speech?',
      type: 'yes_no',
      priority: 10,
      diagnosticValue: 'high'
    },
    {
      id: 'neuro_008',
      text: 'Have you experienced confusion or memory problems?',
      type: 'yes_no',
      priority: 7,
      diagnosticValue: 'medium'
    }
  ],

  musculoskeletal: [
    {
      id: 'msk_001',
      text: 'Which joints are affected?',
      type: 'multiple_choice',
      options: ['Knees', 'Hips', 'Shoulders', 'Hands/fingers', 'Multiple joints'],
      priority: 10,
      diagnosticValue: 'high'
    },
    {
      id: 'msk_002',
      text: 'Is there swelling or redness?',
      type: 'yes_no',
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'msk_003',
      text: 'When is the pain worse?',
      type: 'multiple_choice',
      options: ['Morning', 'After activity', 'At rest', 'Night time'],
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'msk_004',
      text: 'Do you have stiffness?',
      type: 'yes_no',
      priority: 7,
      diagnosticValue: 'medium'
    },
    {
      id: 'msk_005',
      text: 'Have you had any recent injury?',
      type: 'yes_no',
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'msk_006',
      text: 'Does the pain limit your daily activities?',
      type: 'yes_no',
      priority: 6,
      diagnosticValue: 'medium'
    },
    {
      id: 'msk_007',
      text: 'On a scale of 1-10, how severe is the pain?',
      type: 'scale',
      min: 1,
      max: 10,
      priority: 8,
      diagnosticValue: 'high'
    }
  ],

  dermatological: [
    {
      id: 'derm_001',
      text: 'Where is the rash or skin problem located?',
      type: 'text',
      priority: 10,
      diagnosticValue: 'high'
    },
    {
      id: 'derm_002',
      text: 'How long have you had this skin condition?',
      type: 'multiple_choice',
      options: ['Less than 24 hours', '1-3 days', '4-7 days', 'More than a week'],
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'derm_003',
      text: 'Is the affected area itchy?',
      type: 'yes_no',
      priority: 8,
      diagnosticValue: 'medium'
    },
    {
      id: 'derm_004',
      text: 'Is there any discharge or oozing?',
      type: 'yes_no',
      priority: 7,
      diagnosticValue: 'medium'
    },
    {
      id: 'derm_005',
      text: 'Have you been exposed to any new products or substances?',
      type: 'yes_no',
      priority: 6,
      diagnosticValue: 'medium'
    }
  ],

  general: [
    {
      id: 'gen_001',
      text: 'How long have you had these symptoms?',
      type: 'multiple_choice',
      options: ['Less than 24 hours', '1-3 days', '4-7 days', 'More than a week'],
      priority: 10,
      diagnosticValue: 'high'
    },
    {
      id: 'gen_002',
      text: 'Have you taken any medication for this?',
      type: 'yes_no',
      priority: 7,
      diagnosticValue: 'medium'
    },
    {
      id: 'gen_003',
      text: 'Do you have any chronic conditions?',
      type: 'yes_no',
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'gen_004',
      text: 'On a scale of 1-10, how would you rate your overall discomfort?',
      type: 'scale',
      min: 1,
      max: 10,
      priority: 9,
      diagnosticValue: 'high'
    },
    {
      id: 'gen_005',
      text: 'Are you experiencing fever or chills?',
      type: 'yes_no',
      priority: 8,
      diagnosticValue: 'high'
    },
    {
      id: 'gen_006',
      text: 'Have you noticed any changes in your appetite?',
      type: 'yes_no',
      priority: 5,
      diagnosticValue: 'low'
    }
  ]
};

module.exports = {
  QUESTION_TEMPLATES
};

// Symptom category mapping - maps symptom keywords to medical categories
const SYMPTOM_CATEGORY_MAP = {
  respiratory: [
    'cough', 'shortnessOfBreath', 'soreThroat', 'congestion', 'wheezing',
    'breathing', 'breath', 'throat', 'chest tightness', 'nasal'
  ],
  cardiovascular: [
    'chestPain', 'palpitations', 'chest pain', 'heart', 'heartbeat',
    'chest pressure', 'chest discomfort', 'irregular heartbeat'
  ],
  gastrointestinal: [
    'nausea', 'vomiting', 'diarrhea', 'constipation', 'stomachAche',
    'bloating', 'stomach', 'abdomen', 'belly', 'bowel', 'digestive'
  ],
  neurological: [
    'headache', 'dizziness', 'confusion', 'numbness', 'migraine',
    'dizzy', 'head pain', 'vertigo', 'tingling', 'vision', 'memory'
  ],
  musculoskeletal: [
    'jointPain', 'backPain', 'musclePain', 'joint', 'muscle', 'back',
    'arthritis', 'stiff', 'sprain', 'fracture', 'bone'
  ],
  dermatological: [
    'rash', 'itching', 'swelling', 'skin', 'hives', 'bumps',
    'red spots', 'itch', 'lesion', 'wound'
  ]
};

/**
 * Detect symptom category from initial symptom text
 * @param {string} symptomText - The initial symptom description
 * @returns {string} - Detected category (defaults to 'general' if no match)
 */
function detectSymptomCategory(symptomText) {
  if (!symptomText || typeof symptomText !== 'string') {
    return 'general';
  }

  const lowerText = symptomText.toLowerCase();

  // Check each category for keyword matches
  for (const [category, keywords] of Object.entries(SYMPTOM_CATEGORY_MAP)) {
    for (const keyword of keywords) {
      // Use word boundaries for more accurate matching
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        return category;
      }
    }
  }

  // Default to general category if no specific match found
  return 'general';
}

/**
 * Get question templates for a specific category
 * @param {string} category - Medical category
 * @returns {Array} - Array of question templates
 */
function getQuestionTemplates(category) {
  const templates = QUESTION_TEMPLATES[category];
  
  if (!templates) {
    // Fallback to general questions if category not found
    return QUESTION_TEMPLATES.general;
  }

  return templates;
}

/**
 * Filter out questions that have already been asked
 * @param {Array} questions - Array of question templates
 * @param {Array} askedQuestions - Array of already asked question objects
 * @returns {Array} - Filtered questions
 */
function filterAskedQuestions(questions, askedQuestions = []) {
  if (!askedQuestions || askedQuestions.length === 0) {
    return questions;
  }

  // Create set of asked question IDs for efficient lookup
  const askedQuestionIds = new Set(
    askedQuestions.map(q => q.questionId)
  );

  // Filter out questions that have already been asked
  return questions.filter(q => !askedQuestionIds.has(q.id));
}

/**
 * Prioritize questions based on diagnostic value and priority score
 * @param {Array} questions - Array of question templates
 * @param {Object} symptomProfile - Current symptom profile (optional)
 * @returns {Array} - Sorted questions by priority
 */
function prioritizeQuestions(questions, symptomProfile = null) {
  // Sort by priority (higher first), then by diagnostic value
  const diagnosticValueWeight = {
    'high': 3,
    'medium': 2,
    'low': 1
  };

  return questions.sort((a, b) => {
    // Primary sort by priority
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // Secondary sort by diagnostic value
    const aValue = diagnosticValueWeight[a.diagnosticValue] || 0;
    const bValue = diagnosticValueWeight[b.diagnosticValue] || 0;
    return bValue - aValue;
  });
}

/**
 * Generate follow-up questions for a specific symptom category
 * @param {string} category - Medical category
 * @param {Array} existingAnswers - Array of already answered questions
 * @param {number} maxQuestions - Maximum number of questions to return (default: 5)
 * @returns {Array} - Array of question objects to ask
 */
function generateQuestionsForCategory(category, existingAnswers = [], maxQuestions = 5) {
  // Get templates for the category
  let questions = getQuestionTemplates(category);

  // Filter out already asked questions
  questions = filterAskedQuestions(questions, existingAnswers);

  // Prioritize remaining questions
  questions = prioritizeQuestions(questions);

  // Return top N questions (between 2 and maxQuestions)
  const numQuestions = Math.min(questions.length, maxQuestions);
  const minQuestions = Math.min(2, questions.length);
  
  return questions.slice(0, Math.max(minQuestions, numQuestions));
}

/**
 * Generate initial follow-up questions based on symptom text
 * @param {string} symptomText - Initial symptom description
 * @param {number} maxQuestions - Maximum number of questions (default: 5)
 * @returns {Object} - Object containing category and questions
 */
function generateInitialQuestions(symptomText, maxQuestions = 5) {
  // Detect category from symptom
  const category = detectSymptomCategory(symptomText);

  // Generate questions for the category
  const questions = generateQuestionsForCategory(category, [], maxQuestions);

  return {
    category,
    questions
  };
}

/**
 * Get all available categories
 * @returns {Array} - Array of category names
 */
function getAvailableCategories() {
  return Object.keys(QUESTION_TEMPLATES);
}

/**
 * Validate question answer based on question type
 * @param {Object} question - Question template
 * @param {string|number} answer - User's answer
 * @returns {Object} - Validation result
 */
function validateAnswer(question, answer) {
  if (!question || answer === null || answer === undefined) {
    return {
      valid: false,
      error: 'Question or answer is missing'
    };
  }

  switch (question.type) {
    case 'yes_no':
      const validYesNo = ['yes', 'no', 'Yes', 'No', 'YES', 'NO'];
      if (!validYesNo.includes(answer)) {
        return {
          valid: false,
          error: 'Answer must be "yes" or "no"'
        };
      }
      break;

    case 'multiple_choice':
      if (!question.options || !question.options.includes(answer)) {
        return {
          valid: false,
          error: 'Answer must be one of the provided options'
        };
      }
      break;

    case 'scale':
      const numAnswer = Number(answer);
      if (isNaN(numAnswer) || numAnswer < question.min || numAnswer > question.max) {
        return {
          valid: false,
          error: `Answer must be a number between ${question.min} and ${question.max}`
        };
      }
      break;

    case 'text':
      if (typeof answer !== 'string' || answer.trim().length === 0) {
        return {
          valid: false,
          error: 'Answer must be a non-empty text'
        };
      }
      break;

    default:
      return {
        valid: false,
        error: 'Unknown question type'
      };
  }

  return {
    valid: true
  };
}

module.exports = {
  QUESTION_TEMPLATES,
  SYMPTOM_CATEGORY_MAP,
  detectSymptomCategory,
  getQuestionTemplates,
  filterAskedQuestions,
  prioritizeQuestions,
  generateQuestionsForCategory,
  generateInitialQuestions,
  getAvailableCategories,
  validateAnswer
};
