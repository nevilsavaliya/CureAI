const Symptom = require('../models/Symptom');
const Patient = require('../models/Patient');
const predictionService = require('../services/predictionService');

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
