/**
 * Response Helper Utilities
 * Common response patterns extracted from controllers
 */

/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccessResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} details - Additional error details
 */
function sendErrorResponse(res, message = 'An error occurred', statusCode = 400, details = null) {
  const response = {
    success: false,
    message,
    error: {
      code: getErrorCode(statusCode),
      statusCode
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Standard created response format (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
function sendCreatedResponse(res, data, message = 'Resource created successfully') {
  return sendSuccessResponse(res, data, message, 201);
}

/**
 * Standard not found response format (404)
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 */
function sendNotFoundResponse(res, message = 'Resource not found') {
  return sendErrorResponse(res, message, 404);
}

/**
 * Standard unauthorized response format (401)
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
function sendUnauthorizedResponse(res, message = 'Unauthorized access') {
  return sendErrorResponse(res, message, 401);
}

/**
 * Standard forbidden response format (403)
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
function sendForbiddenResponse(res, message = 'Access forbidden') {
  return sendErrorResponse(res, message, 403);
}

/**
 * Standard validation error response format (400)
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 * @param {string} message - Error message
 */
function sendValidationErrorResponse(res, errors, message = 'Validation failed') {
  return sendErrorResponse(res, message, 400, { validationErrors: errors });
}

/**
 * Standard paginated response format
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 */
function sendPaginatedResponse(res, items, page, limit, total, message = 'Success') {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}

/**
 * Get error code from status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error code
 */
function getErrorCode(statusCode) {
  const errorCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE'
  };
  
  return errorCodes[statusCode] || 'ERROR';
}

/**
 * Set standard response headers
 * @param {Object} res - Express response object
 * @param {Object} headers - Headers to set
 */
function setResponseHeaders(res, headers) {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * Send file download response
 * @param {Object} res - Express response object
 * @param {string} filePath - Path to file
 * @param {string} filename - Download filename
 */
function sendFileDownload(res, filePath, filename) {
  res.download(filePath, filename, (err) => {
    if (err) {
      sendErrorResponse(res, 'Failed to download file', 500);
    }
  });
}

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  sendCreatedResponse,
  sendNotFoundResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendValidationErrorResponse,
  sendPaginatedResponse,
  getErrorCode,
  setResponseHeaders,
  sendFileDownload
};
