const mongoose = require('mongoose');

/**
 * Validation middleware for case management system
 * Implements comprehensive validation for case creation, messaging, and user authorization
 */

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate case creation data
exports.validateCaseCreation = (req, res, next) => {
  const { doctorId, symptoms, predictedConditions, chatbotHistory } = req.body;
  const errors = [];

  // Validate doctorId
  if (!doctorId) {
    errors.push('Doctor ID is required');
  } else if (!isValidObjectId(doctorId)) {
    errors.push('Invalid Doctor ID format');
  }

  // Validate symptoms (optional but should be array if provided)
  if (symptoms !== undefined) {
    if (!Array.isArray(symptoms)) {
      errors.push('Symptoms must be an array');
    } else if (symptoms.length > 50) {
      errors.push('Cannot submit more than 50 symptoms');
    } else {
      // Validate each symptom
      symptoms.forEach((symptom, index) => {
        if (typeof symptom !== 'string') {
          errors.push(`Symptom at index ${index} must be a string`);
        } else if (symptom.trim().length === 0) {
          errors.push(`Symptom at index ${index} cannot be empty`);
        } else if (symptom.length > 500) {
          errors.push(`Symptom at index ${index} exceeds maximum length of 500 characters`);
        }
      });
    }
  }

  // Validate predictedConditions (optional but should be array if provided)
  if (predictedConditions !== undefined) {
    if (!Array.isArray(predictedConditions)) {
      errors.push('Predicted conditions must be an array');
    } else if (predictedConditions.length > 20) {
      errors.push('Cannot submit more than 20 predicted conditions');
    } else {
      predictedConditions.forEach((condition, index) => {
        if (typeof condition !== 'string') {
          errors.push(`Predicted condition at index ${index} must be a string`);
        } else if (condition.trim().length === 0) {
          errors.push(`Predicted condition at index ${index} cannot be empty`);
        } else if (condition.length > 200) {
          errors.push(`Predicted condition at index ${index} exceeds maximum length of 200 characters`);
        }
      });
    }
  }

  // Validate chatbotHistory (optional but should be array if provided)
  if (chatbotHistory !== undefined) {
    if (!Array.isArray(chatbotHistory)) {
      errors.push('Chatbot history must be an array');
    } else if (chatbotHistory.length > 100) {
      errors.push('Chatbot history cannot exceed 100 entries');
    } else {
      chatbotHistory.forEach((entry, index) => {
        if (typeof entry !== 'object' || entry === null) {
          errors.push(`Chatbot history entry at index ${index} must be an object`);
        } else {
          if (!entry.question || typeof entry.question !== 'string') {
            errors.push(`Chatbot history entry at index ${index} must have a valid question`);
          } else if (entry.question.length > 1000) {
            errors.push(`Question in chatbot history entry ${index} exceeds maximum length of 1000 characters`);
          }
          
          if (!entry.answer || typeof entry.answer !== 'string') {
            errors.push(`Chatbot history entry at index ${index} must have a valid answer`);
          } else if (entry.answer.length > 2000) {
            errors.push(`Answer in chatbot history entry ${index} exceeds maximum length of 2000 characters`);
          }
        }
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Validate message content
exports.validateMessageContent = (req, res, next) => {
  const { content } = req.body;
  const errors = [];

  // Validate content
  if (!content) {
    errors.push('Message content is required');
  } else if (typeof content !== 'string') {
    errors.push('Message content must be a string');
  } else {
    const trimmedContent = content.trim();
    
    if (trimmedContent.length === 0) {
      errors.push('Message content cannot be empty');
    } else if (trimmedContent.length > 5000) {
      errors.push('Message content cannot exceed 5000 characters');
    } else if (trimmedContent.length < 1) {
      errors.push('Message content must be at least 1 character');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Message validation failed',
      errors
    });
  }

  // Sanitize content (trim whitespace)
  req.body.content = content.trim();
  next();
};

// Validate case ID parameter
exports.validateCaseId = (req, res, next) => {
  const { id, caseId } = req.params;
  const caseIdToValidate = id || caseId;

  if (!caseIdToValidate) {
    return res.status(400).json({
      success: false,
      message: 'Case ID is required'
    });
  }

  if (!isValidObjectId(caseIdToValidate)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Case ID format'
    });
  }

  next();
};

// Validate message ID parameter
exports.validateMessageId = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Message ID is required'
    });
  }

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Message ID format'
    });
  }

  next();
};

// Validate feedback submission
exports.validateFeedback = (req, res, next) => {
  const { rating, comment } = req.body;
  const errors = [];

  // Validate rating
  if (rating === undefined || rating === null) {
    errors.push('Rating is required');
  } else if (typeof rating !== 'number') {
    errors.push('Rating must be a number');
  } else if (!Number.isInteger(rating)) {
    errors.push('Rating must be an integer');
  } else if (rating < 1 || rating > 5) {
    errors.push('Rating must be between 1 and 5 stars');
  }

  // Validate comment (optional)
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') {
      errors.push('Comment must be a string');
    } else if (comment.length > 2000) {
      errors.push('Comment cannot exceed 2000 characters');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Feedback validation failed',
      errors
    });
  }

  // Sanitize comment if provided
  if (comment) {
    req.body.comment = comment.trim();
  }

  next();
};

// Validate treatment data
exports.validateTreatmentData = (req, res, next) => {
  const { treatmentNotes, diagnosis, prescription } = req.body;
  const errors = [];

  // All fields are optional, but validate if provided
  if (treatmentNotes !== undefined && treatmentNotes !== null) {
    if (typeof treatmentNotes !== 'string') {
      errors.push('Treatment notes must be a string');
    } else if (treatmentNotes.length > 5000) {
      errors.push('Treatment notes cannot exceed 5000 characters');
    }
  }

  if (diagnosis !== undefined && diagnosis !== null) {
    if (typeof diagnosis !== 'string') {
      errors.push('Diagnosis must be a string');
    } else if (diagnosis.length > 2000) {
      errors.push('Diagnosis cannot exceed 2000 characters');
    }
  }

  if (prescription !== undefined && prescription !== null) {
    if (typeof prescription !== 'string') {
      errors.push('Prescription must be a string');
    } else if (prescription.length > 5000) {
      errors.push('Prescription cannot exceed 5000 characters');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Treatment data validation failed',
      errors
    });
  }

  // Sanitize fields if provided
  if (treatmentNotes) req.body.treatmentNotes = treatmentNotes.trim();
  if (diagnosis) req.body.diagnosis = diagnosis.trim();
  if (prescription) req.body.prescription = prescription.trim();

  next();
};

// Validate pagination parameters
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  const errors = [];

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    } else if (pageNum > 1000) {
      errors.push('Page number cannot exceed 1000');
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('Limit cannot exceed 100 items per page');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Pagination validation failed',
      errors
    });
  }

  next();
};

// Validate case status filter
exports.validateStatusFilter = (req, res, next) => {
  const { status } = req.query;
  const validStatuses = ['all', 'pending', 'ongoing', 'treated', 'rejected'];

  if (status && !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  next();
};

// Rate limiting helper for message sending
const messageSendTimes = new Map();
const MESSAGE_RATE_LIMIT = 10; // messages per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

exports.rateLimitMessages = (req, res, next) => {
  const userId = req.user.id;
  const now = Date.now();
  
  if (!messageSendTimes.has(userId)) {
    messageSendTimes.set(userId, []);
  }
  
  const userTimes = messageSendTimes.get(userId);
  
  // Remove timestamps older than the rate limit window
  const recentTimes = userTimes.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentTimes.length >= MESSAGE_RATE_LIMIT) {
    return res.status(429).json({
      success: false,
      message: `Rate limit exceeded. You can send up to ${MESSAGE_RATE_LIMIT} messages per minute`,
      retryAfter: Math.ceil((recentTimes[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }
  
  // Add current timestamp
  recentTimes.push(now);
  messageSendTimes.set(userId, recentTimes);
  
  // Clean up old entries periodically
  if (messageSendTimes.size > 1000) {
    const cutoff = now - RATE_LIMIT_WINDOW;
    for (const [key, times] of messageSendTimes.entries()) {
      const filtered = times.filter(time => time > cutoff);
      if (filtered.length === 0) {
        messageSendTimes.delete(key);
      } else {
        messageSendTimes.set(key, filtered);
      }
    }
  }
  
  next();
};

// Sanitize input to prevent XSS and injection attacks
exports.sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
};

// Validate user authorization for case actions
exports.validateCaseAuthorization = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${allowedRoles.join(' or ')} can perform this action`
      });
    }

    next();
  };
};

// Validate date of birth
exports.validateDateOfBirth = (req, res, next) => {
  const { dateOfBirth } = req.body;
  const errors = [];

  if (!dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    
    // Set time to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    dob.setHours(0, 0, 0, 0);

    // Check if date is valid
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date format');
    } else {
      // Check if date is in the future
      if (dob > today) {
        errors.push('Date of birth cannot be in the future');
      }

      // Check if date is too far in the past (more than 150 years)
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      minDate.setHours(0, 0, 0, 0);

      if (dob < minDate) {
        errors.push('Date of birth cannot be more than 150 years ago');
      }

      // Check if person is at least 1 year old (optional, adjust as needed)
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 1);
      minAge.setHours(0, 0, 0, 0);

      if (dob > minAge) {
        errors.push('You must be at least 1 year old to register');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Date of birth validation failed',
      errors
    });
  }

  next();
};
