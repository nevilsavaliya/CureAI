/**
 * Validation Helper Utilities
 * Common validation patterns extracted from controllers and services
 */

const ValidationError = require('../errors/ValidationError');

/**
 * Validate required fields in an object
 * @param {Object} data - Data object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Array<string>|null} Array of missing fields or null if all present
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  return missingFields.length > 0 ? missingFields : null;
}

/**
 * Validate and throw error if required fields are missing
 * @param {Object} data - Data object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @throws {ValidationError} If any required fields are missing
 */
function requireFields(data, requiredFields) {
  const missing = validateRequiredFields(data, requiredFields);
  if (missing) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate and throw error if email is invalid
 * @param {string} email - Email to validate
 * @throws {ValidationError} If email is invalid
 */
function requireValidEmail(email) {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format');
  }
}

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}

/**
 * Validate and throw error if ObjectId is invalid
 * @param {string} id - ID to validate
 * @param {string} fieldName - Name of the field for error message
 * @throws {ValidationError} If ObjectId is invalid
 */
function requireValidObjectId(id, fieldName = 'ID') {
  if (!isValidObjectId(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate and throw error if password is weak
 * @param {string} password - Password to validate
 * @throws {ValidationError} If password is weak
 */
function requireStrongPassword(password) {
  const result = validatePasswordStrength(password);
  if (!result.isValid) {
    throw new ValidationError('Password does not meet requirements', {
      errors: result.errors
    });
  }
}

/**
 * Validate that two values match
 * @param {*} value1 - First value
 * @param {*} value2 - Second value
 * @param {string} fieldName - Name of the field for error message
 * @throws {ValidationError} If values don't match
 */
function requireMatch(value1, value2, fieldName = 'Values') {
  if (value1 !== value2) {
    throw new ValidationError(`${fieldName} do not match`);
  }
}

/**
 * Validate array is not empty
 * @param {Array} array - Array to validate
 * @param {string} fieldName - Name of the field for error message
 * @throws {ValidationError} If array is empty
 */
function requireNonEmptyArray(array, fieldName = 'Array') {
  if (!Array.isArray(array) || array.length === 0) {
    throw new ValidationError(`${fieldName} must contain at least one item`);
  }
}

/**
 * Validate value is within range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {string} fieldName - Name of the field for error message
 * @throws {ValidationError} If value is out of range
 */
function requireInRange(value, min, max, fieldName = 'Value') {
  if (typeof value !== 'number' || value < min || value > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
  }
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  } else if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

module.exports = {
  validateRequiredFields,
  requireFields,
  isValidEmail,
  requireValidEmail,
  isValidObjectId,
  requireValidObjectId,
  validatePasswordStrength,
  requireStrongPassword,
  requireMatch,
  requireNonEmptyArray,
  requireInRange,
  sanitizeString,
  sanitizeObject
};
