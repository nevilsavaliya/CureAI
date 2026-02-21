/**
 * Validation Utilities
 * Provides common validation functions for controllers
 */

const { validationResult } = require('express-validator');

/**
 * Validate request using express-validator
 * Returns validation errors if any
 * @param {Object} req - Express request object
 * @returns {Array|null} - Array of validation errors or null if valid
 */
const validateRequest = (req) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
  }
  
  return null;
};

/**
 * Middleware to check validation results and send error response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkValidation = (req, res, next) => {
  const errors = validateRequest(req);
  
  if (errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Array|null} - Array of missing fields or null if all present
 */
const validateRequiredFields = (body, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missingFields.push(field);
    }
  }
  
  return missingFields.length > 0 ? missingFields : null;
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate MongoDB ObjectId format
 * @param {String} id - ID to validate
 * @returns {Boolean} - True if valid ObjectId format
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} - Validation result with isValid and message
 */
const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long'
    };
  }
  
  return {
    isValid: true,
    message: 'Password is valid'
  };
};

/**
 * Validate phone number format
 * @param {String} phone - Phone number to validate
 * @returns {Boolean} - True if valid phone format
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate date format and range
 * @param {String} date - Date string to validate
 * @returns {Object} - Validation result with isValid and message
 */
const validateDate = (date) => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      message: 'Invalid date format'
    };
  }
  
  return {
    isValid: true,
    message: 'Date is valid',
    date: dateObj
  };
};

/**
 * Validate numeric range
 * @param {Number} value - Value to validate
 * @param {Number} min - Minimum value
 * @param {Number} max - Maximum value
 * @returns {Boolean} - True if value is within range
 */
const isInRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Sanitize string input
 * @param {String} input - Input string to sanitize
 * @returns {String} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Validate array field
 * @param {*} value - Value to check
 * @param {Number} minLength - Minimum array length
 * @param {Number} maxLength - Maximum array length
 * @returns {Object} - Validation result
 */
const validateArray = (value, minLength = 0, maxLength = Infinity) => {
  if (!Array.isArray(value)) {
    return {
      isValid: false,
      message: 'Value must be an array'
    };
  }
  
  if (value.length < minLength) {
    return {
      isValid: false,
      message: `Array must contain at least ${minLength} items`
    };
  }
  
  if (value.length > maxLength) {
    return {
      isValid: false,
      message: `Array must contain at most ${maxLength} items`
    };
  }
  
  return {
    isValid: true,
    message: 'Array is valid'
  };
};

module.exports = {
  validateRequest,
  checkValidation,
  validateRequiredFields,
  isValidEmail,
  isValidObjectId,
  validatePassword,
  isValidPhone,
  validateDate,
  isInRange,
  sanitizeString,
  validateArray
};
