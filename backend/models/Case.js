const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'treated', 'rejected'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // Patient Medical Data
  symptoms: [{
    type: String,
    trim: true
  }],
  predictedConditions: [{
    type: String,
    trim: true
  }],
  chatbotHistory: [{
    question: {
      type: String,
      trim: true
    },
    answer: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Symptom Conversation Reference
  symptomConversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SymptomConversation',
    index: true
  },
  predictionConfidence: [{
    condition: {
      type: String,
      trim: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  
  // Case Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  treatedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  
  // Treatment Info
  treatmentNotes: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  prescription: {
    type: String,
    trim: true
  },
  
  // Feedback
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date
    }
  },
  
  // Video Consultation
  videoConsultation: {
    scheduledDate: {
      type: Date
    },
    scheduledTime: {
      type: String
    },
    videoLink: {
      type: String
    },
    roomId: {
      type: String
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    startedAt: {
      type: Date
    },
    endedAt: {
      type: Date
    }
  },
  
  // Timestamps
  lastMessageAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
caseSchema.index({ patientId: 1, status: 1 });
caseSchema.index({ doctorId: 1, status: 1 });
caseSchema.index({ createdAt: -1 });
caseSchema.index({ patientId: 1, doctorId: 1, status: 1 });
caseSchema.index({ symptomConversationId: 1 });

// Update the updatedAt timestamp before saving
caseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to accept case
caseSchema.methods.accept = async function() {
  this.status = 'ongoing';
  this.acceptedAt = new Date();
  return await this.save();
};

// Method to reject case
caseSchema.methods.reject = async function() {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  return await this.save();
};

// Method to mark as treated
caseSchema.methods.markAsTreated = async function() {
  this.status = 'treated';
  this.treatedAt = new Date();
  return await this.save();
};

// Method to add feedback
caseSchema.methods.addFeedback = async function(rating, comment) {
  this.feedback = {
    rating,
    comment,
    submittedAt: new Date()
  };
  return await this.save();
};

// Method to update last message timestamp
caseSchema.methods.updateLastMessage = async function() {
  this.lastMessageAt = new Date();
  return await this.save();
};

// Method to check if case is read-only (treated or rejected)
caseSchema.methods.isReadOnly = function() {
  return this.status === 'treated' || this.status === 'rejected';
};

// Method to check if case allows messaging
caseSchema.methods.allowsMessaging = function() {
  return this.status === 'ongoing';
};

// Pre-save hook to prevent modifications to treated cases
caseSchema.pre('save', function(next) {
  // Allow initial save and status changes to treated/rejected
  if (this.isNew || this.isModified('status')) {
    return next();
  }
  
  // Prevent modifications to treated or rejected cases (except feedback)
  if ((this.status === 'treated' || this.status === 'rejected') && !this.isModified('feedback')) {
    const error = new Error('Cannot modify a completed case. Case data is preserved for medical records.');
    return next(error);
  }
  
  next();
});

const Case = mongoose.model('Case', caseSchema);

module.exports = Case;
