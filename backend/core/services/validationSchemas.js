/**
 * Validation Schemas
 * Defines validation rules for common entities
 */

const validationService = require('./ValidationService');

// ============ Case Validation Schemas ============

validationService.registerSchema('caseCreation', {
  doctorId: {
    required: true,
    type: 'objectId',
    requiredMessage: 'Doctor ID is required'
  },
  symptoms: {
    required: false,
    type: 'array',
    arrayRules: {
      maxLength: 50,
      itemType: 'string',
      itemValidator: (symptom) => {
        if (symptom.trim().length === 0) {
          return 'Symptom cannot be empty';
        }
        if (symptom.length > 500) {
          return 'Symptom cannot exceed 500 characters';
        }
        return true;
      }
    }
  },
  predictedConditions: {
    required: false,
    type: 'array',
    arrayRules: {
      maxLength: 20,
      itemType: 'string',
      itemValidator: (condition) => {
        if (condition.trim().length === 0) {
          return 'Predicted condition cannot be empty';
        }
        if (condition.length > 200) {
          return 'Predicted condition cannot exceed 200 characters';
        }
        return true;
      }
    }
  },
  chatbotHistory: {
    required: false,
    type: 'array',
    arrayRules: {
      maxLength: 100,
      itemValidator: (entry) => {
        if (!entry.question || typeof entry.question !== 'string') {
          return 'Each chatbot entry must have a valid question';
        }
        if (entry.question.length > 1000) {
          return 'Question cannot exceed 1000 characters';
        }
        if (!entry.answer || typeof entry.answer !== 'string') {
          return 'Each chatbot entry must have a valid answer';
        }
        if (entry.answer.length > 2000) {
          return 'Answer cannot exceed 2000 characters';
        }
        return true;
      }
    }
  }
});

// ============ Message Validation Schemas ============

validationService.registerSchema('messageContent', {
  content: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 5000,
    requiredMessage: 'Message content is required',
    sanitize: (value) => value.trim()
  }
});

// ============ Feedback Validation Schemas ============

validationService.registerSchema('feedback', {
  rating: {
    required: true,
    type: 'integer',
    min: 1,
    max: 5,
    requiredMessage: 'Rating is required'
  },
  comment: {
    required: false,
    type: 'string',
    maxLength: 2000,
    sanitize: (value) => value.trim()
  }
});

// ============ Treatment Validation Schemas ============

validationService.registerSchema('treatmentData', {
  treatmentNotes: {
    required: false,
    type: 'string',
    maxLength: 5000,
    sanitize: (value) => value.trim()
  },
  diagnosis: {
    required: false,
    type: 'string',
    maxLength: 2000,
    sanitize: (value) => value.trim()
  },
  prescription: {
    required: false,
    type: 'string',
    maxLength: 5000,
    sanitize: (value) => value.trim()
  }
});

// ============ Pagination Validation Schemas ============

validationService.registerSchema('pagination', {
  page: {
    required: false,
    type: 'integer',
    min: 1,
    max: 1000,
    validators: [(value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        return 'Page must be a positive integer';
      }
      return true;
    }]
  },
  limit: {
    required: false,
    type: 'integer',
    min: 1,
    max: 100,
    validators: [(value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        return 'Limit must be a positive integer';
      }
      return true;
    }]
  }
});

// ============ ID Validation Schemas ============

validationService.registerSchema('caseId', {
  id: {
    required: true,
    type: 'objectId',
    requiredMessage: 'Case ID is required'
  }
});

validationService.registerSchema('messageId', {
  id: {
    required: true,
    type: 'objectId',
    requiredMessage: 'Message ID is required'
  }
});

// ============ User Registration Schemas ============

validationService.registerSchema('userRegistration', {
  email: {
    required: true,
    type: 'email',
    requiredMessage: 'Email is required'
  },
  password: {
    required: true,
    type: 'string',
    minLength: 6,
    requiredMessage: 'Password is required',
    validators: [(value) => {
      const result = validationService.validatePassword(value);
      return result.isValid ? true : result.errors.join(', ');
    }]
  },
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    requiredMessage: 'Name is required',
    sanitize: (value) => value.trim()
  },
  phone: {
    required: false,
    type: 'phone'
  }
});

// ============ Date of Birth Validation Schema ============

validationService.registerSchema('dateOfBirth', {
  dateOfBirth: {
    required: true,
    type: 'date',
    requiredMessage: 'Date of birth is required',
    validators: [(value) => {
      const dob = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dob.setHours(0, 0, 0, 0);

      if (dob > today) {
        return 'Date of birth cannot be in the future';
      }

      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      minDate.setHours(0, 0, 0, 0);

      if (dob < minDate) {
        return 'Date of birth cannot be more than 150 years ago';
      }

      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 1);
      minAge.setHours(0, 0, 0, 0);

      if (dob > minAge) {
        return 'You must be at least 1 year old to register';
      }

      return true;
    }]
  }
});

// ============ Status Filter Schema ============

validationService.registerSchema('statusFilter', {
  status: {
    required: false,
    type: 'string',
    validators: [(value) => {
      const validStatuses = ['all', 'pending', 'ongoing', 'treated', 'rejected'];
      if (value && !validStatuses.includes(value.toLowerCase())) {
        return `Invalid status filter. Must be one of: ${validStatuses.join(', ')}`;
      }
      return true;
    }]
  }
});

module.exports = validationService;
