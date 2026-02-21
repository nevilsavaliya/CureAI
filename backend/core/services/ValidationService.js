/**
 * ValidationService - Centralized validation service
 * Provides schema-based validation, common validators, and sanitization
 */

const mongoose = require('mongoose');
const ValidationError = require('../errors/ValidationError');

class ValidationService {
  constructor() {
    this.schemas = new Map();
  }

  /**
   * Register a validation schema
   * @param {string} name - Schema name
   * @param {Object} schema - Validation schema definition
   */
  registerSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  /**
   * Validate data against a registered schema
   * @param {string} schemaName - Name of the schema to validate against
   * @param {Object} data - Data to validate
   * @param {Object} options - Validation options
   * @returns {Object} - Validation result
   */
  validate(schemaName, data, options = {}) {
    const schema = this.schemas.get(schemaName);
    
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    const errors = [];
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this._validateField(field, value, rules, options, data);
      
      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
      } else if (value !== undefined) {
        sanitized[field] = this._sanitizeValue(value, rules);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Validate a single field against rules
   * @private
   */
  _validateField(field, value, rules, options, data) {
    const errors = [];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: rules.requiredMessage || `${field} is required`,
        code: 'REQUIRED'
      });
      return errors;
    }

    // Skip further validation if optional and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    if (rules.type) {
      const typeError = this._validateType(field, value, rules.type);
      if (typeError) {
        errors.push(typeError);
        return errors;
      }
    }

    // Custom validators
    if (rules.validators) {
      for (const validator of rules.validators) {
        const result = validator(value, data);
        if (result !== true) {
          errors.push({
            field,
            message: result || `${field} is invalid`,
            code: 'CUSTOM_VALIDATION'
          });
        }
      }
    }

    // Min/Max length for strings
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.minLength} characters`,
          code: 'MIN_LENGTH'
        });
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          field,
          message: `${field} cannot exceed ${rules.maxLength} characters`,
          code: 'MAX_LENGTH'
        });
      }
    }

    // Min/Max for numbers
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.min}`,
          code: 'MIN_VALUE'
        });
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field,
          message: `${field} cannot exceed ${rules.max}`,
          code: 'MAX_VALUE'
        });
      }
    }

    // Array validation
    if (Array.isArray(value) && rules.arrayRules) {
      const arrayErrors = this._validateArray(field, value, rules.arrayRules);
      errors.push(...arrayErrors);
    }

    return errors;
  }

  /**
   * Validate type
   * @private
   */
  _validateType(field, value, type) {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return { field, message: `${field} must be a string`, code: 'INVALID_TYPE' };
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { field, message: `${field} must be a number`, code: 'INVALID_TYPE' };
        }
        break;
      case 'integer':
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          return { field, message: `${field} must be an integer`, code: 'INVALID_TYPE' };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { field, message: `${field} must be a boolean`, code: 'INVALID_TYPE' };
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return { field, message: `${field} must be an array`, code: 'INVALID_TYPE' };
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return { field, message: `${field} must be an object`, code: 'INVALID_TYPE' };
        }
        break;
      case 'objectId':
        if (!this.isValidObjectId(value)) {
          return { field, message: `${field} must be a valid ObjectId`, code: 'INVALID_OBJECTID' };
        }
        break;
      case 'email':
        if (!this.isValidEmail(value)) {
          return { field, message: `${field} must be a valid email`, code: 'INVALID_EMAIL' };
        }
        break;
      case 'phone':
        if (!this.isValidPhone(value)) {
          return { field, message: `${field} must be a valid phone number`, code: 'INVALID_PHONE' };
        }
        break;
      case 'date':
        const dateResult = this.isValidDate(value);
        if (!dateResult.isValid) {
          return { field, message: dateResult.message, code: 'INVALID_DATE' };
        }
        break;
    }
    return null;
  }

  /**
   * Validate array elements
   * @private
   */
  _validateArray(field, array, rules) {
    const errors = [];

    if (rules.minLength && array.length < rules.minLength) {
      errors.push({
        field,
        message: `${field} must contain at least ${rules.minLength} items`,
        code: 'ARRAY_MIN_LENGTH'
      });
    }

    if (rules.maxLength && array.length > rules.maxLength) {
      errors.push({
        field,
        message: `${field} cannot contain more than ${rules.maxLength} items`,
        code: 'ARRAY_MAX_LENGTH'
      });
    }

    if (rules.itemType) {
      array.forEach((item, index) => {
        const typeError = this._validateType(`${field}[${index}]`, item, rules.itemType);
        if (typeError) {
          errors.push(typeError);
        }
      });
    }

    if (rules.itemValidator) {
      array.forEach((item, index) => {
        const result = rules.itemValidator(item, index);
        if (result !== true) {
          errors.push({
            field: `${field}[${index}]`,
            message: result || `Invalid item at index ${index}`,
            code: 'ARRAY_ITEM_INVALID'
          });
        }
      });
    }

    return errors;
  }

  /**
   * Sanitize value based on rules
   * @private
   */
  _sanitizeValue(value, rules) {
    if (typeof value === 'string' && rules.trim !== false) {
      value = value.trim();
    }

    if (rules.sanitize) {
      value = rules.sanitize(value);
    }

    return value;
  }

  // ============ Common Validators ============

  /**
   * Validate MongoDB ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean}
   */
  isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean}
   */
  isValidPhone(phone) {
    if (typeof phone !== 'string') return false;
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @param {Object} options - Validation options
   * @returns {Object}
   */
  validatePassword(password, options = {}) {
    const minLength = options.minLength || 6;
    const requireUppercase = options.requireUppercase || false;
    const requireLowercase = options.requireLowercase || false;
    const requireNumber = options.requireNumber || false;
    const requireSpecial = options.requireSpecial || false;

    const errors = [];

    if (!password || password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumber && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate date
   * @param {string|Date} date - Date to validate
   * @returns {Object}
   */
  isValidDate(date) {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return {
        isValid: false,
        message: 'Invalid date format'
      };
    }
    
    return {
      isValid: true,
      date: dateObj
    };
  }

  // ============ Sanitization Methods ============

  /**
   * Sanitize string to prevent XSS
   * @param {string} input - Input string
   * @returns {string}
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Sanitize HTML input
   * @param {string} html - HTML string
   * @returns {string}
   */
  sanitizeHtml(html) {
    if (typeof html !== 'string') return html;
    
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize object recursively
   * @param {*} obj - Object to sanitize
   * @returns {*}
   */
  sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  }

  // ============ Middleware Factory ============

  /**
   * Create validation middleware for a schema
   * @param {string} schemaName - Name of the schema
   * @param {Object} options - Validation options
   * @returns {Function}
   */
  middleware(schemaName, options = {}) {
    return (req, res, next) => {
      const data = options.source === 'query' ? req.query : 
                   options.source === 'params' ? req.params : 
                   req.body;

      const result = this.validate(schemaName, data, options);

      if (!result.isValid) {
        throw new ValidationError('Validation failed', result.errors);
      }

      // Replace with sanitized data
      if (options.source === 'query') {
        req.query = { ...req.query, ...result.sanitized };
      } else if (options.source === 'params') {
        req.params = { ...req.params, ...result.sanitized };
      } else {
        req.body = { ...req.body, ...result.sanitized };
      }

      next();
    };
  }

  /**
   * Format validation errors for response
   * @param {Array} errors - Array of validation errors
   * @returns {Object}
   */
  formatErrors(errors) {
    return {
      success: false,
      message: 'Validation failed',
      errors: errors.map(err => ({
        field: err.field,
        message: err.message,
        code: err.code
      }))
    };
  }
}

// Create singleton instance
const validationService = new ValidationService();

module.exports = validationService;
