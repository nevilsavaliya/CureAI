/**
 * Error Handling Utilities
 * Common error handling patterns extracted from middleware and services
 */

const logger = require('../../services/logger');

/**
 * Standard middleware error handler
 * Logs error and allows request to continue (fail open)
 * @param {string} errorType - Type of error for logging
 * @param {Function} next - Express next function
 * @returns {Function} Error handler function
 */
function createMiddlewareErrorHandler(errorType) {
  return (error, req, next) => {
    logger.error(`${errorType} error`, {
      type: errorType,
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    });
    
    // Continue on error (fail open for middleware)
    next();
  };
}

/**
 * Standard middleware error handler with response
 * Logs error and sends error response
 * @param {string} errorType - Type of error for logging
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message for client
 * @returns {Function} Error handler function
 */
function createMiddlewareErrorHandlerWithResponse(errorType, statusCode = 500, message = 'Internal server error') {
  return (error, req, res) => {
    logger.error(`${errorType} error`, {
      type: errorType,
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    });
    
    return res.status(statusCode).json({
      success: false,
      message,
      code: errorType
    });
  };
}

/**
 * Wrap middleware with try-catch and error handling
 * @param {Function} middleware - Middleware function to wrap
 * @param {string} errorType - Type of error for logging
 * @returns {Function} Wrapped middleware
 */
function wrapMiddleware(middleware, errorType) {
  return async (req, res, next) => {
    try {
      await middleware(req, res, next);
    } catch (error) {
      const handler = createMiddlewareErrorHandler(errorType);
      handler(error, req, next);
    }
  };
}

/**
 * Wrap service method with try-catch and error handling
 * @param {Function} serviceMethod - Service method to wrap
 * @param {string} errorMessage - Error message prefix
 * @returns {Function} Wrapped service method
 */
function wrapServiceMethod(serviceMethod, errorMessage) {
  return async function(...args) {
    try {
      return await serviceMethod.apply(this, args);
    } catch (error) {
      if (this.handleError) {
        this.handleError(error);
      } else {
        throw new Error(`${errorMessage}: ${error.message}`);
      }
    }
  };
}

/**
 * Standard catch block for database operations
 * @param {Error} error - Error object
 * @param {string} operation - Operation description
 * @throws {DatabaseError}
 */
function handleDatabaseError(error, operation) {
  const DatabaseError = require('../errors/DatabaseError');
  const ValidationError = require('../errors/ValidationError');
  
  if (error instanceof ValidationError) {
    throw error;
  }
  
  throw new DatabaseError(`Failed to ${operation}: ${error.message}`);
}

/**
 * Standard catch block for external service operations
 * @param {Error} error - Error object
 * @param {string} service - Service name
 * @param {string} operation - Operation description
 * @throws {ExternalServiceError}
 */
function handleExternalServiceError(error, service, operation) {
  const ExternalServiceError = require('../errors/ExternalServiceError');
  
  throw new ExternalServiceError(
    `${service} ${operation} failed: ${error.message}`,
    500,
    { service, operation, originalError: error.message }
  );
}

module.exports = {
  createMiddlewareErrorHandler,
  createMiddlewareErrorHandlerWithResponse,
  wrapMiddleware,
  wrapServiceMethod,
  handleDatabaseError,
  handleExternalServiceError
};
