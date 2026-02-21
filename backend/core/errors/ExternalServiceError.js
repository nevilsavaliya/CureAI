/**
 * ExternalServiceError - Error for external service failures
 */

const AppError = require('./AppError');

class ExternalServiceError extends AppError {
  /**
   * Create an external service error
   * @param {string} message - Error message
   * @param {string} service - Name of the external service
   * @param {Error} originalError - Original error from the service
   */
  constructor(message = 'External service error', service = null, originalError = null) {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    this.originalError = originalError;
  }

  toJSON() {
    const json = super.toJSON();
    if (this.service) {
      json.service = this.service;
    }
    return json;
  }
}

module.exports = ExternalServiceError;
