/**
 * AppError - Base error class for application errors
 * All custom errors should extend this class
 */

class AppError extends Error {
  /**
   * Create an application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether this is an operational error (expected)
   * @param {string} code - Error code for client identification
   */
  constructor(message, statusCode = 500, isOperational = true, code = 'APP_ERROR') {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format for API responses
   */
  toJSON() {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };
  }
}

module.exports = AppError;
