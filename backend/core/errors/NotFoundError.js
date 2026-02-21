/**
 * NotFoundError - Error for resource not found
 */

const AppError = require('./AppError');

class NotFoundError extends AppError {
  /**
   * Create a not found error
   * @param {string} message - Error message
   * @param {string} resource - Resource type that was not found
   */
  constructor(message = 'Resource not found', resource = null) {
    super(message, 404, true, 'NOT_FOUND_ERROR');
    this.resource = resource;
  }

  toJSON() {
    const json = super.toJSON();
    if (this.resource) {
      json.resource = this.resource;
    }
    return json;
  }
}

module.exports = NotFoundError;
