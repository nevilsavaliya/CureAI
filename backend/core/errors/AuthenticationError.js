/**
 * AuthenticationError - Error for authentication failures
 */

const AppError = require('./AppError');

class AuthenticationError extends AppError {
  /**
   * Create an authentication error
   * @param {string} message - Error message
   */
  constructor(message = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

module.exports = AuthenticationError;
