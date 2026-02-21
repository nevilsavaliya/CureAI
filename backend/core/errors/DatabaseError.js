/**
 * DatabaseError - Error for database operation failures
 */

const AppError = require('./AppError');

class DatabaseError extends AppError {
  /**
   * Create a database error
   * @param {string} message - Error message
   * @param {Error} originalError - Original database error
   */
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, true, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

module.exports = DatabaseError;
