/**
 * ValidationError - Error for input validation failures
 */

const AppError = require('./AppError');

class ValidationError extends AppError {
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @param {Array} details - Array of validation error details
   */
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.details = details;
  }

  toJSON() {
    const json = super.toJSON();
    if (this.details && this.details.length > 0) {
      json.details = this.details;
    }
    return json;
  }
}

module.exports = ValidationError;
