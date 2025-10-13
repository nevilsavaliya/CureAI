const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dob = new Date(value);
        dob.setHours(0, 0, 0, 0);
        
        // Check if date is not in the future
        if (dob > today) {
          return false;
        }
        
        // Check if date is not more than 150 years ago
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 150);
        minDate.setHours(0, 0, 0, 0);
        
        if (dob < minDate) {
          return false;
        }
        
        return true;
      },
      message: 'Date of birth must be a valid date (not in the future and not more than 150 years ago)'
    }
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  contactNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  medicalHistory: {
    type: String,
    trim: true
  },
  allergies: [{
    type: String,
    trim: true
  }],
  
  // Enhanced Medical Records for Hospital API Access
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  chronicConditions: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    prescribedBy: String
  }],
  
  pastSurgeries: [{
    surgery: String,
    date: Date,
    hospital: String,
    notes: String
  }],
  
  vaccinations: [{
    vaccine: String,
    date: Date,
    nextDue: Date
  }],
  
  // Extracted symptoms from chat history
  extractedSymptoms: [{
    symptom: String,
    extractedFrom: String, // 'chat', 'consultation', 'manual'
    extractedAt: Date,
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case'
    }
  }],
  
  // Vital signs history
  vitalSigns: [{
    recordedAt: Date,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    bmi: Number,
    oxygenSaturation: Number
  }],
  
  // Lab results
  labResults: [{
    testName: String,
    result: String,
    unit: String,
    normalRange: String,
    date: Date,
    orderedBy: String,
    notes: String
  }],
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster email lookups
patientSchema.index({ email: 1 });

// Hash password before saving
patientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
patientSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to update last login
patientSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
