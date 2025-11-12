const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  symptomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Symptom',
    required: true
  },
  diseases: [{
    name: { type: String, required: true },
    confidence: { type: Number, required: true },
    description: String,
    specialization: [String]
  }],
  recommendedSpecializations: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

predictionSchema.index({ patientId: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;
