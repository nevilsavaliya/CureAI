const Patient = require('../models/Patient');
const Message = require('../models/Message');

/**
 * Symptom Extraction Service
 * Automatically extracts symptoms from patient messages and stores them in patient records
 */

// Comprehensive symptom keywords database
const SYMPTOM_KEYWORDS = {
  // General symptoms
  fever: ['fever', 'high temperature', 'hot', 'burning up', 'feverish', 'pyrexia'],
  fatigue: ['tired', 'fatigue', 'exhausted', 'weakness', 'weak', 'lethargic', 'no energy', 'drained'],
  pain: ['pain', 'ache', 'aching', 'hurt', 'hurting', 'painful', 'sore', 'soreness'],
  
  // Respiratory symptoms
  cough: ['cough', 'coughing', 'hacking'],
  shortnessOfBreath: ['shortness of breath', 'breathless', 'difficulty breathing', 'hard to breathe', 'can\'t breathe', 'breathing problem'],
  soreThroat: ['sore throat', 'throat pain', 'scratchy throat', 'throat hurts'],
  congestion: ['congestion', 'stuffy nose', 'blocked nose', 'nasal congestion', 'runny nose'],
  wheezing: ['wheezing', 'whistling breath', 'chest tightness'],
  
  // Gastrointestinal symptoms
  nausea: ['nausea', 'nauseous', 'queasy', 'feel sick', 'sick to stomach'],
  vomiting: ['vomiting', 'throwing up', 'vomit', 'puking', 'being sick'],
  diarrhea: ['diarrhea', 'loose stools', 'watery stools', 'frequent bowel movements'],
  constipation: ['constipation', 'can\'t poop', 'hard stools', 'difficulty passing stool'],
  stomachAche: ['stomach ache', 'stomach pain', 'belly pain', 'abdominal pain', 'tummy ache'],
  bloating: ['bloating', 'bloated', 'gassy', 'gas', 'distended'],
  
  // Neurological symptoms
  headache: ['headache', 'head pain', 'migraine', 'head hurts', 'head ache'],
  dizziness: ['dizzy', 'dizziness', 'lightheaded', 'vertigo', 'spinning'],
  confusion: ['confused', 'confusion', 'disoriented', 'foggy', 'brain fog'],
  numbness: ['numbness', 'numb', 'tingling', 'pins and needles'],
  
  // Cardiovascular symptoms
  chestPain: ['chest pain', 'chest discomfort', 'chest pressure', 'tight chest', 'chest hurts'],
  palpitations: ['palpitations', 'heart racing', 'rapid heartbeat', 'irregular heartbeat', 'heart pounding'],
  
  // Musculoskeletal symptoms
  jointPain: ['joint pain', 'joints hurt', 'arthritis', 'stiff joints'],
  backPain: ['back pain', 'backache', 'lower back pain', 'upper back pain'],
  musclePain: ['muscle pain', 'muscle ache', 'myalgia', 'muscles hurt'],
  
  // Skin symptoms
  rash: ['rash', 'skin rash', 'red spots', 'bumps', 'hives', 'itchy skin'],
  itching: ['itching', 'itchy', 'itch', 'scratching'],
  swelling: ['swelling', 'swollen', 'puffiness', 'puffy', 'edema'],
  
  // Eye symptoms
  blurredVision: ['blurred vision', 'blurry vision', 'vision problems', 'can\'t see clearly'],
  eyePain: ['eye pain', 'eyes hurt', 'eye discomfort'],
  
  // Ear symptoms
  earache: ['earache', 'ear pain', 'ears hurt'],
  hearingLoss: ['hearing loss', 'can\'t hear', 'deaf', 'muffled hearing'],
  
  // Urinary symptoms
  frequentUrination: ['frequent urination', 'peeing a lot', 'urinating often'],
  painfulUrination: ['painful urination', 'burning when peeing', 'pain when urinating'],
  
  // Mental health symptoms
  anxiety: ['anxiety', 'anxious', 'worried', 'panic', 'nervous'],
  depression: ['depression', 'depressed', 'sad', 'hopeless', 'down'],
  insomnia: ['insomnia', 'can\'t sleep', 'trouble sleeping', 'sleepless'],
  
  // Other symptoms
  chills: ['chills', 'shivering', 'shaking', 'cold sweats'],
  sweating: ['sweating', 'night sweats', 'excessive sweating', 'perspiring'],
  lossOfAppetite: ['loss of appetite', 'no appetite', 'don\'t want to eat', 'not hungry'],
  weightLoss: ['weight loss', 'losing weight', 'lost weight'],
  weightGain: ['weight gain', 'gaining weight', 'gained weight']
};

/**
 * Extract symptoms from text content
 * @param {string} text - The text to analyze
 * @returns {Array<string>} - Array of detected symptoms
 */
function extractSymptomsFromText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const lowerText = text.toLowerCase();
  const detectedSymptoms = new Set();

  // Check each symptom category
  for (const [symptomName, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
    for (const keyword of keywords) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        detectedSymptoms.add(symptomName);
        break; // Found this symptom, move to next category
      }
    }
  }

  return Array.from(detectedSymptoms);
}

/**
 * Store extracted symptoms in patient record
 * @param {string} patientId - Patient ID
 * @param {Array<string>} symptoms - Array of symptoms to store
 * @param {string} caseId - Case ID where symptoms were extracted from
 * @param {string} source - Source of extraction ('chat', 'consultation', 'manual')
 * @returns {Promise<Object>} - Updated patient record
 */
async function storeSymptomsInPatientRecord(patientId, symptoms, caseId, source = 'chat') {
  if (!patientId || !symptoms || symptoms.length === 0) {
    return null;
  }

  try {
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Initialize extractedSymptoms array if it doesn't exist
    if (!patient.extractedSymptoms) {
      patient.extractedSymptoms = [];
    }

    const extractedAt = new Date();

    // Add new symptoms (avoid duplicates for the same case)
    for (const symptom of symptoms) {
      // Check if this symptom already exists for this case
      const existingSymptom = patient.extractedSymptoms.find(
        s => s.symptom === symptom && 
             s.caseId && 
             s.caseId.toString() === caseId.toString()
      );

      if (!existingSymptom) {
        patient.extractedSymptoms.push({
          symptom,
          extractedFrom: source,
          extractedAt,
          caseId
        });
      }
    }

    await patient.save();
    return patient;
  } catch (error) {
    console.error('Error storing symptoms in patient record:', error);
    throw error;
  }
}

/**
 * Process a message and extract symptoms automatically
 * This should be called when a new message is created
 * @param {Object} message - Message object
 * @returns {Promise<Object>} - Result with extracted symptoms
 */
async function processMessageForSymptoms(message) {
  try {
    // Only process messages from patients
    if (message.senderModel !== 'Patient') {
      return {
        processed: false,
        reason: 'Message not from patient'
      };
    }

    // Only process text messages
    if (message.messageType !== 'text') {
      return {
        processed: false,
        reason: 'Message is not text type'
      };
    }

    // Extract symptoms from message content
    const symptoms = extractSymptomsFromText(message.content);

    if (symptoms.length === 0) {
      return {
        processed: true,
        symptomsFound: 0,
        symptoms: []
      };
    }

    // Store symptoms in patient record
    const patient = await storeSymptomsInPatientRecord(
      message.senderId,
      symptoms,
      message.caseId,
      'chat'
    );

    return {
      processed: true,
      symptomsFound: symptoms.length,
      symptoms,
      patientId: message.senderId
    };
  } catch (error) {
    console.error('Error processing message for symptoms:', error);
    return {
      processed: false,
      error: error.message
    };
  }
}

/**
 * Batch process messages for a case to extract symptoms
 * Useful for processing existing messages or re-processing
 * @param {string} caseId - Case ID
 * @returns {Promise<Object>} - Result with total symptoms extracted
 */
async function processCaseMessages(caseId) {
  try {
    // Get all patient messages for this case
    const messages = await Message.find({
      caseId,
      senderModel: 'Patient',
      messageType: 'text'
    }).sort({ sentAt: 1 });

    if (messages.length === 0) {
      return {
        processed: true,
        messagesProcessed: 0,
        totalSymptoms: 0
      };
    }

    let totalSymptoms = 0;
    const allSymptoms = new Set();

    // Process each message
    for (const message of messages) {
      const result = await processMessageForSymptoms(message);
      if (result.processed && result.symptomsFound > 0) {
        totalSymptoms += result.symptomsFound;
        result.symptoms.forEach(s => allSymptoms.add(s));
      }
    }

    return {
      processed: true,
      messagesProcessed: messages.length,
      totalSymptoms,
      uniqueSymptoms: Array.from(allSymptoms)
    };
  } catch (error) {
    console.error('Error processing case messages:', error);
    throw error;
  }
}

/**
 * Get all symptoms for a patient
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} - Array of extracted symptoms
 */
async function getPatientSymptoms(patientId) {
  try {
    const patient = await Patient.findById(patientId)
      .select('extractedSymptoms')
      .populate('extractedSymptoms.caseId', 'status createdAt');
    
    if (!patient) {
      throw new Error('Patient not found');
    }

    return patient.extractedSymptoms || [];
  } catch (error) {
    console.error('Error getting patient symptoms:', error);
    throw error;
  }
}

/**
 * Get symptom keywords (for documentation or testing)
 * @returns {Object} - Symptom keywords database
 */
function getSymptomKeywords() {
  return SYMPTOM_KEYWORDS;
}

module.exports = {
  extractSymptomsFromText,
  storeSymptomsInPatientRecord,
  processMessageForSymptoms,
  processCaseMessages,
  getPatientSymptoms,
  getSymptomKeywords,
  SYMPTOM_KEYWORDS
};
