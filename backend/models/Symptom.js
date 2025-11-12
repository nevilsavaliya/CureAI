const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  symptomText: {
    type: String,
    required: true,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

symptomSchema.index({ patientId: 1 });
symptomSchema.index({ submittedAt: -1 });

const Symptom = mongoose.model('Symptom', symptomSchema);

module.exports = Symptom;
