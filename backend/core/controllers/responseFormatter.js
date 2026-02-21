/**
 * Response Formatter Utilities
 * Provides standardized response formats for API endpoints
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    // If data is an object with specific keys, spread it
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.assign(response, data);
    } else {
      response.data = data;
    }
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 400)
 * @param {Object} details - Additional error details
 */
const sendError = (res, message = 'An error occurred', statusCode = 400, details = null) => {
  const response = {
    success: false,
    message
  };

  if (details) {
    response.error = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {String} message - Success message
 */
const sendPaginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    count: data.length,
    pagination,
    data
  });
};

/**
 * Send created response
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {String} message - Success message
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response
 * @param {Object} res - Express response object
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendUnauthorized = (res, message = 'Authentication required') => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendForbidden = (res, message = 'Access denied') => {
  return sendError(res, message, 403);
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, 404);
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
  sendCreated,
  sendNoContent,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound
};
