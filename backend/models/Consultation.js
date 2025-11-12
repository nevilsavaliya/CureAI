const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  roomId: String,
  videoLink: String,
  startedAt: Date,
  endedAt: Date
}, {
  timestamps: true
});

consultationSchema.index({ patientId: 1 });
consultationSchema.index({ doctorId: 1 });

const Consultation = mongoose.model('Consultation', consultationSchema);

module.exports = Consultation;
