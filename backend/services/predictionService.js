const Prediction = require('../models/Prediction');
const { getSpecializationsForDiseases } = require('./diseaseSpecializationMapping');

// Static disease prediction data
const staticPredictions = {
  'fever': {
    diseases: [
      { name: 'Influenza', confidence: 85, description: 'Common flu with fever and body aches', specialization: ['General Medicine'] },
      { name: 'Dengue', confidence: 60, description: 'Mosquito-borne viral infection', specialization: ['General Medicine', 'Internal Medicine'] }
    ]
  },
  'headache': {
    diseases: [
      { name: 'Migraine', confidence: 75, description: 'Severe headache with sensitivity to light', specialization: ['Neurology'] },
      { name: 'Tension Headache', confidence: 70, description: 'Stress-related headache', specialization: ['General Medicine'] }
    ]
  },
  'chest pain': {
    diseases: [
      { name: 'Angina', confidence: 75, description: 'Heart-related chest pain', specialization: ['Cardiology'] },
      { name: 'Acid Reflux', confidence: 65, description: 'Digestive issue causing chest discomfort', specialization: ['General Medicine'] }
    ]
  },
  'cough': {
    diseases: [
      { name: 'Bronchitis', confidence: 80, description: 'Inflammation of bronchial tubes', specialization: ['General Medicine'] },
      { name: 'Asthma', confidence: 65, description: 'Chronic respiratory condition', specialization: ['General Medicine'] }
    ]
  },
  'joint pain': {
    diseases: [
      { name: 'Arthritis', confidence: 80, description: 'Joint inflammation', specialization: ['Orthopedics'] },
      { name: 'Rheumatoid Arthritis', confidence: 60, description: 'Autoimmune joint disease', specialization: ['Orthopedics'] }
    ]
  },
  'skin rash': {
    diseases: [
      { name: 'Eczema', confidence: 75, description: 'Inflammatory skin condition', specialization: ['Dermatology'] },
      { name: 'Psoriasis', confidence: 65, description: 'Chronic skin disorder', specialization: ['Dermatology'] }
    ]
  },
  'stomach pain': {
    diseases: [
      { name: 'Gastritis', confidence: 75, description: 'Stomach lining inflammation', specialization: ['General Medicine'] },
      { name: 'Ulcer', confidence: 60, description: 'Stomach or intestinal ulcer', specialization: ['General Medicine'] }
    ]
  }
};

class PredictionService {
  // Predict disease based on symptoms
  predictDisease(symptomText) {
    const lowerSymptom = symptomText.toLowerCase();
    let allDiseases = [];

    // Check for keyword matches
    for (const [keyword, data] of Object.entries(staticPredictions)) {
      if (lowerSymptom.includes(keyword)) {
        allDiseases.push(...data.diseases);
      }
    }

    // If no matches, return default general medicine diseases
    if (allDiseases.length === 0) {
      allDiseases = [
        { name: 'General Illness', confidence: 50, description: 'Please consult a general physician', specialization: ['General Medicine'] }
      ];
    }

    // Sort by confidence and return top 5
    allDiseases.sort((a, b) => b.confidence - a.confidence);
    return allDiseases.slice(0, 5);
  }

  // Save prediction to database
  async savePrediction(patientId, symptomId, diseases) {
    try {
      // Get recommended specializations based on predicted diseases
      const recommendedSpecializations = getSpecializationsForDiseases(diseases);
      
      const prediction = new Prediction({
        patientId,
        symptomId,
        diseases,
        recommendedSpecializations
      });
      await prediction.save();
      return prediction;
    } catch (error) {
      throw error;
    }
  }

  // Get predictions by patient ID
  async getPredictionsByPatient(patientId) {
    try {
      const predictions = await Prediction.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(10);
      return predictions;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PredictionService();
