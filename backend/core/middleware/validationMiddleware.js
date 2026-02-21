/**
 * Validation Middleware
 * Provides middleware functions using ValidationService
 */

const validationService = require('../services/validationSchemas');
const ValidationError = require('../errors/ValidationError');
const asyncHandler = require('./asyncHandler');

/**
 * Create validation middleware for request body
 * @param {string} schemaName - Name of the validation schema
 * @returns {Function}
 */
const validateBody = (schemaName) => {
  return asyncHandler(async (req, res, next) => {
    const result = validationService.validate(schemaName, req.body);

    if (!result.isValid) {
      throw new ValidationError('Validation failed', result.errors);
    }

    req.body = { ...req.body, ...result.sanitized };
    next();
  });
};

/**
 * Create validation middleware for query parameters
 * @param {string} schemaName - Name of the validation schema
 * @returns {Function}
 */
const validateQuery = (schemaName) => {
  return asyncHandler(async (req, res, next) => {
    const result = validationService.validate(schemaName, req.query);

    if (!result.isValid) {
      throw new ValidationError('Validation failed', result.errors);
    }

    req.query = { ...req.query, ...result.sanitized };
    next();
  });
};

/**
 * Create validation middleware for route parameters
 * @param {string} schemaName - Name of the validation schema
 * @returns {Function}
 */
const validateParams = (schemaName) => {
  return asyncHandler(async (req, res, next) => {
    const result = validationService.validate(schemaName, req.params);

    if (!result.isValid) {
      throw new ValidationError('Validation failed', result.errors);
    }

    req.params = { ...req.params, ...result.sanitized };
    next();
  });
};

/**
 * Validate ObjectId parameter
 * @param {string} paramName - Name of the parameter (default: 'id')
 * @returns {Function}
 */
const validateObjectId = (paramName = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      throw new ValidationError(`${paramName} is required`, [{
        field: paramName,
        message: `${paramName} is required`,
        code: 'REQUIRED'
      }]);
    }

    if (!validationService.isValidObjectId(id)) {
      throw new ValidationError(`Invalid ${paramName} format`, [{
        field: paramName,
        message: `Invalid ${paramName} format`,
        code: 'INVALID_OBJECTID'
      }]);
    }

    next();
  });
};

/**
 * Sanitize request body to prevent XSS
 * @returns {Function}
 */
const sanitizeBody = () => {
  return (req, res, next) => {
    if (req.body) {
      req.body = validationService.sanitizeObject(req.body);
    }
    next();
  };
};

/**
 * Validate case ID from params
 */
const validateCaseId = validateObjectId('id');

/**
 * Validate message ID from params
 */
const validateMessageId = validateObjectId('id');

/**
 * Validate case creation data
 */
const validateCaseCreation = validateBody('caseCreation');

/**
 * Validate message content
 */
const validateMessageContent = validateBody('messageContent');

/**
 * Validate feedback data
 */
const validateFeedback = validateBody('feedback');

/**
 * Validate treatment data
 */
const validateTreatmentData = validateBody('treatmentData');

/**
 * Validate pagination parameters
 */
const validatePagination = validateQuery('pagination');

/**
 * Validate status filter
 */
const validateStatusFilter = validateQuery('statusFilter');

/**
 * Validate date of birth
 */
const validateDateOfBirth = validateBody('dateOfBirth');

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  validateObjectId,
  sanitizeBody,
  validateCaseId,
  validateMessageId,
  validateCaseCreation,
  validateMessageContent,
  validateFeedback,
  validateTreatmentData,
  validatePagination,
  validateStatusFilter,
  validateDateOfBirth
};
