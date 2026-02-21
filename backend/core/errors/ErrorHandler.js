/**
 * ErrorHandler - Centralized error handling service
 * Handles error logging, classification, and response formatting
 */

const AppError = require('./AppError');
const logger = require('../../services/logger');

class ErrorHandler {
  /**
   * Handle error and send appropriate response
   * @param {Error} error - Error object
   * @param {Object} req - Express request object (optional)
   * @param {Object} res - Express response object (optional)
   */
  handleError(error, req = null, res = null) {
    // Log the error
    this.logError(error, req);

    // If response object is provided, send error response
    if (res && !res.headersSent) {
      const errorResponse = this.formatErrorResponse(error, req);
      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Check if error is operational (expected) or programming error
   * @param {Error} error - Error object
   * @returns {boolean} - True if operational error
   */
  isOperationalError(error) {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Check if error is trusted (known error type)
   * @param {Error} error - Error object
   * @returns {boolean} - True if trusted error
   */
  isTrustedError(error) {
    return error instanceof AppError;
  }

  /**
   * Format error for API response
   * @param {Error} error - Error object
   * @param {Object} req - Express request object (optional)
   * @returns {Object} - Formatted error response
   */
  formatErrorResponse(error, req = null) {
    // Default error response
    let statusCode = 500;
    let message = 'An unexpected error occurred';
    let code = 'INTERNAL_SERVER_ERROR';
    let details = null;

    // Handle AppError instances
    if (error instanceof AppError) {
      statusCode = error.statusCode;
      message = error.message;
      code = error.code;
      
      // Include details if available (e.g., validation errors)
      if (error.details) {
        details = error.details;
      }
      if (error.resource) {
        details = { resource: error.resource };
      }
      if (error.service) {
        details = { service: error.service };
      }
    }
    // Handle Mongoose validation errors
    else if (error.name === 'ValidationError' && error.errors) {
      statusCode = 400;
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
      details = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
    }
    // Handle Mongoose CastError (invalid ObjectId)
    else if (error.name === 'CastError') {
      statusCode = 400;
      message = `Invalid ${error.path}: ${error.value}`;
      code = 'INVALID_INPUT';
    }
    // Handle MongoDB duplicate key error
    else if (error.code === 11000) {
      statusCode = 409;
      message = 'Duplicate value error';
      code = 'DUPLICATE_ERROR';
      const field = Object.keys(error.keyPattern || {})[0];
      if (field) {
        details = { field, message: `${field} already exists` };
      }
    }
    // Handle JWT errors
    else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
      code = 'INVALID_TOKEN';
    }
    else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      code = 'TOKEN_EXPIRED';
    }

    // Build response object
    const response = {
      success: false,
      error: {
        message,
        code,
        statusCode,
        timestamp: new Date().toISOString()
      }
    };

    // Add request ID if available
    if (req && req.id) {
      response.error.requestId = req.id;
    }

    // Add details if available
    if (details) {
      response.error.details = details;
    }

    // Add stack trace in development mode
    if (process.env.NODE_ENV === 'development' && error.stack) {
      response.error.stack = error.stack;
    }

    return response;
  }

  /**
   * Log error with context
   * @param {Error} error - Error object
   * @param {Object} req - Express request object (optional)
   */
  logError(error, req = null) {
    const context = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      }
    };

    // Add request context if available
    if (req) {
      context.request = {
        id: req.id,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent')
      };

      // Add user context if authenticated
      if (req.user) {
        context.user = {
          id: req.user._id || req.user.id,
          email: req.user.email,
          role: req.user.role
        };
      }
    }

    // Log based on error severity
    if (this.isOperationalError(error)) {
      // Operational errors are expected, log as warning
      logger.warn('Operational error occurred', context);
    } else {
      // Programming errors are unexpected, log as error
      logger.error('Unexpected error occurred', context);
    }
  }

  /**
   * Handle uncaught exceptions
   * @param {Error} error - Error object
   */
  handleUncaughtException(error) {
    logger.error('Uncaught Exception', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });

    // Exit process for uncaught exceptions
    process.exit(1);
  }

  /**
   * Handle unhandled promise rejections
   * @param {Error} error - Error object
   */
  handleUnhandledRejection(error) {
    logger.error('Unhandled Promise Rejection', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });

    // Exit process for unhandled rejections
    process.exit(1);
  }
}

// Export singleton instance
module.exports = new ErrorHandler();
