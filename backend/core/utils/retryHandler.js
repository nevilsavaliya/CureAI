/**
 * Retry Handler - Implements retry logic for transient failures
 * Provides exponential backoff and configurable retry strategies
 */

const logger = require('../../services/logger');

class RetryHandler {
  /**
   * Default retry configuration
   */
  static DEFAULT_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'],
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  };

  /**
   * Execute operation with retry logic
   * @param {Function} operation - Async function to execute
   * @param {Object} options - Retry configuration options
   * @param {string} operationName - Name of operation for logging
   * @returns {Promise<any>} - Operation result
   */
  static async executeWithRetry(operation, options = {}, operationName = 'Operation') {
    const config = { ...RetryHandler.DEFAULT_CONFIG, ...options };
    let lastError;
    let attempt = 0;

    while (attempt <= config.maxRetries) {
      try {
        // Log retry attempt if not first attempt
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt}/${config.maxRetries} for ${operationName}`);
        }

        // Execute the operation
        const result = await operation();

        // Log success if this was a retry
        if (attempt > 0) {
          logger.info(`${operationName} succeeded on attempt ${attempt + 1}`);
        }

        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if error is retryable
        if (!RetryHandler.isRetryableError(error, config)) {
          logger.warn(`${operationName} failed with non-retryable error: ${error.message}`);
          throw error;
        }

        // Check if we've exhausted retries
        if (attempt > config.maxRetries) {
          logger.error(`${operationName} failed after ${config.maxRetries + 1} attempts: ${error.message}`);
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = RetryHandler.calculateDelay(attempt, config);
        
        logger.warn(`${operationName} failed (attempt ${attempt}/${config.maxRetries + 1}), retrying in ${delay}ms: ${error.message}`);

        // Wait before retrying
        await RetryHandler.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @param {Object} config - Retry configuration
   * @returns {boolean} - True if error is retryable
   */
  static isRetryableError(error, config) {
    // Check for network errors
    if (error.code && config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check for HTTP status codes
    if (error.response && error.response.status) {
      return config.retryableStatusCodes.includes(error.response.status);
    }

    // Check for specific error types
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return true;
    }

    // Check for timeout errors
    if (error.message && error.message.toLowerCase().includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff
   * @param {number} attempt - Current attempt number
   * @param {Object} config - Retry configuration
   * @returns {number} - Delay in milliseconds
   */
  static calculateDelay(attempt, config) {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry wrapper for database operations
   * @param {Function} operation - Database operation to execute
   * @param {string} operationName - Name of operation for logging
   * @returns {Promise<any>} - Operation result
   */
  static async retryDatabaseOperation(operation, operationName = 'Database operation') {
    return RetryHandler.executeWithRetry(
      operation,
      {
        maxRetries: 3,
        initialDelay: 500,
        maxDelay: 5000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
        retryableStatusCodes: []
      },
      operationName
    );
  }

  /**
   * Retry wrapper for external API calls
   * @param {Function} operation - API call to execute
   * @param {string} operationName - Name of operation for logging
   * @returns {Promise<any>} - Operation result
   */
  static async retryExternalAPICall(operation, operationName = 'External API call') {
    return RetryHandler.executeWithRetry(
      operation,
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'],
        retryableStatusCodes: [408, 429, 500, 502, 503, 504]
      },
      operationName
    );
  }
}

module.exports = RetryHandler;
