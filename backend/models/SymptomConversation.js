const mongoose = require('mongoose');

const symptomConversationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
    index: true
  },
  initialSymptom: {
    type: String,
    required: [true, 'Initial symptom is required'],
    trim: true
  },
  symptomCategory: {
    type: String,
    enum: {
      values: ['respiratory', 'cardiovascular', 'gastrointestinal', 'neurological', 'musculoskeletal', 'dermatological', 'general'],
      message: '{VALUE} is not a valid symptom category'
    },
    required: [true, 'Symptom category is required']
  },
  questions: [{
    questionId: {
      type: String,
      required: true
    },
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    questionType: {
      type: String,
      enum: {
        values: ['multiple_choice', 'yes_no', 'scale', 'text'],
        message: '{VALUE} is not a valid question type'
      },
      required: true
    },
    options: [{
      type: String,
      trim: true
    }],
    askedAt: {
      type: Date,
      default: Date.now
    }
  }],
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(value) {
          // Find the corresponding question
          const question = this.parent().questions.find(q => q.questionId === this.questionId);
          
          if (!question) {
            return true; // Skip validation if question not found
          }
          
          // Validate based on question type
          switch (question.questionType) {
            case 'yes_no':
              return ['yes', 'no'].includes(value.toLowerCase());
            
            case 'scale':
              const numValue = parseInt(value);
              return !isNaN(numValue) && numValue >= 1 && numValue <= 10;
            
            case 'multiple_choice':
              // Check if answer is one of the options
              return question.options && question.options.length > 0 
                ? question.options.includes(value) 
                : true;
            
            case 'text':
              return value.length > 0 && value.length <= 500;
            
            default:
              return true;
          }
        },
        message: 'Answer format does not match the question type'
      }
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  extractedSymptoms: [{
    type: String,
    trim: true
  }],
  predictions: [{
    disease: {
      type: String,
      required: true,
      trim: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    specializations: [{
      type: String,
      trim: true
    }],
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recommendedDoctors: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    isGeneralMedicine: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'abandoned'],
      message: '{VALUE} is not a valid conversation status'
    },
    default: 'active',
    index: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
symptomConversationSchema.index({ patientId: 1, status: 1 });
symptomConversationSchema.index({ createdAt: -1 });
symptomConversationSchema.index({ patientId: 1, createdAt: -1 });

// Method to add a question to the conversation
symptomConversationSchema.methods.addQuestion = function(questionId, questionText, questionType, options = []) {
  this.questions.push({
    questionId,
    questionText,
    questionType,
    options,
    askedAt: new Date()
  });
  return this;
};

// Method to add an answer to the conversation
symptomConversationSchema.methods.addAnswer = function(questionId, answer) {
  // Check if question exists
  const question = this.questions.find(q => q.questionId === questionId);
  if (!question) {
    throw new Error('Question not found in conversation');
  }
  
  // Check if answer already exists for this question
  const existingAnswer = this.answers.find(a => a.questionId === questionId);
  if (existingAnswer) {
    throw new Error('Answer already exists for this question');
  }
  
  this.answers.push({
    questionId,
    answer,
    answeredAt: new Date()
  });
  
  return this;
};

// Method to check if conversation has minimum answers for prediction
symptomConversationSchema.methods.canProceedToPrediction = function() {
  return this.answers.length >= 3;
};

// Method to mark conversation as completed
symptomConversationSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return await this.save();
};

// Method to mark conversation as abandoned
symptomConversationSchema.methods.abandon = async function() {
  this.status = 'abandoned';
  return await this.save();
};

// Method to add predictions
symptomConversationSchema.methods.addPredictions = function(predictions) {
  this.predictions = predictions.map(pred => ({
    disease: pred.disease,
    confidence: pred.confidence,
    specializations: pred.specializations || [],
    calculatedAt: new Date()
  }));
  return this;
};

// Method to add recommended doctors
symptomConversationSchema.methods.addRecommendedDoctors = function(doctors) {
  this.recommendedDoctors = doctors.map(doc => ({
    doctorId: doc.doctorId || doc._id,
    relevanceScore: doc.relevanceScore || 0,
    isGeneralMedicine: doc.isGeneralMedicine || false
  }));
  return this;
};

// Method to get conversation summary
symptomConversationSchema.methods.getSummary = function() {
  return {
    conversationId: this._id,
    patientId: this.patientId,
    initialSymptom: this.initialSymptom,
    symptomCategory: this.symptomCategory,
    questionsAsked: this.questions.length,
    questionsAnswered: this.answers.length,
    extractedSymptoms: this.extractedSymptoms,
    status: this.status,
    canProceedToPrediction: this.canProceedToPrediction(),
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

// Method to get full conversation history
symptomConversationSchema.methods.getHistory = function() {
  const history = this.questions.map(question => {
    const answer = this.answers.find(a => a.questionId === question.questionId);
    return {
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options,
      askedAt: question.askedAt,
      answer: answer ? answer.answer : null,
      answeredAt: answer ? answer.answeredAt : null
    };
  });
  
  return {
    conversationId: this._id,
    initialSymptom: this.initialSymptom,
    symptomCategory: this.symptomCategory,
    history,
    extractedSymptoms: this.extractedSymptoms,
    predictions: this.predictions,
    status: this.status
  };
};

// Static method to find active conversations for a patient
symptomConversationSchema.statics.findActiveByPatient = function(patientId) {
  return this.find({ patientId, status: 'active' }).sort({ createdAt: -1 });
};

// Static method to find completed conversations for a patient
symptomConversationSchema.statics.findCompletedByPatient = function(patientId) {
  return this.find({ patientId, status: 'completed' }).sort({ createdAt: -1 });
};

// Pre-save hook to auto-abandon old active conversations (24 hours)
symptomConversationSchema.pre('save', function(next) {
  if (this.status === 'active' && !this.isNew) {
    const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      this.status = 'abandoned';
    }
  }
  next();
});

const SymptomConversation = mongoose.model('SymptomConversation', symptomConversationSchema);

module.exports = SymptomConversation;
