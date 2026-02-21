/**
 * AuthorizationError - Error for authorization/permission failures
 */

const AppError = require('./AppError');

class AuthorizationError extends AppError {
  /**
   * Create an authorization error
   * @param {string} message - Error message
   */
  constructor(message = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

module.exports = AuthorizationError;
