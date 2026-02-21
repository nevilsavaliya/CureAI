/**
 * Circuit Breaker - Implements circuit breaker pattern for external services
 * Prevents cascading failures by failing fast when service is unavailable
 */

const logger = require('../../services/logger');

/**
 * Circuit Breaker States
 */
const CircuitState = {
  CLOSED: 'CLOSED',     // Normal operation, requests pass through
  OPEN: 'OPEN',         // Circuit is open, requests fail immediately
  HALF_OPEN: 'HALF_OPEN' // Testing if service has recovered
};

class CircuitBreaker {
  /**
   * Create a circuit breaker
   * @param {Object} options - Circuit breaker configuration
   */
  constructor(options = {}) {
    this.name = options.name || 'CircuitBreaker';
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    
    // State tracking
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastError = null;

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null
    };

    logger.info(`Circuit breaker "${this.name}" initialized`, {
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      timeout: this.timeout,
      resetTimeout: this.resetTimeout
    });
  }

  /**
   * Execute operation through circuit breaker
   * @param {Function} operation - Async function to execute
   * @returns {Promise<any>} - Operation result
   */
  async execute(operation) {
    this.stats.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should attempt to close the circuit
      if (Date.now() < this.nextAttempt) {
        this.stats.rejectedRequests++;
        const error = new Error(`Circuit breaker "${this.name}" is OPEN`);
        error.circuitBreakerOpen = true;
        error.lastError = this.lastError;
        throw error;
      }

      // Move to half-open state to test service
      this.state = CircuitState.HALF_OPEN;
      logger.info(`Circuit breaker "${this.name}" entering HALF_OPEN state`);
    }

    try {
      // Execute operation with timeout
      const result = await this.executeWithTimeout(operation);

      // Record success
      this.onSuccess();

      return result;
    } catch (error) {
      // Record failure
      this.onFailure(error);

      throw error;
    }
  }

  /**
   * Execute operation with timeout
   * @param {Function} operation - Async function to execute
   * @returns {Promise<any>} - Operation result
   */
  async executeWithTimeout(operation) {
    return Promise.race([
      operation(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${this.timeout}ms`));
        }, this.timeout);
      })
    ]);
  }

  /**
   * Handle successful operation
   */
  onSuccess() {
    this.stats.successfulRequests++;
    this.stats.lastSuccessTime = Date.now();
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this.close();
      }
    }
  }

  /**
   * Handle failed operation
   * @param {Error} error - Error that occurred
   */
  onFailure(error) {
    this.stats.failedRequests++;
    this.stats.lastFailureTime = Date.now();
    this.lastError = error.message;
    this.failureCount++;
    this.successCount = 0;

    logger.warn(`Circuit breaker "${this.name}" recorded failure (${this.failureCount}/${this.failureThreshold})`, {
      error: error.message,
      state: this.state
    });

    if (this.failureCount >= this.failureThreshold) {
      this.open();
    }
  }

  /**
   * Open the circuit
   */
  open() {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.resetTimeout;

    logger.error(`Circuit breaker "${this.name}" opened`, {
      failureCount: this.failureCount,
      lastError: this.lastError,
      nextAttempt: new Date(this.nextAttempt).toISOString()
    });
  }

  /**
   * Close the circuit
   */
  close() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;

    logger.info(`Circuit breaker "${this.name}" closed - service recovered`);
  }

  /**
   * Get circuit breaker state
   * @returns {Object} - Current state and statistics
   */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt).toISOString() : null,
      lastError: this.lastError,
      stats: { ...this.stats }
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastError = null;

    logger.info(`Circuit breaker "${this.name}" manually reset`);
  }

  /**
   * Check if circuit is open
   * @returns {boolean} - True if circuit is open
   */
  isOpen() {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Check if circuit is closed
   * @returns {boolean} - True if circuit is closed
   */
  isClosed() {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Check if circuit is half-open
   * @returns {boolean} - True if circuit is half-open
   */
  isHalfOpen() {
    return this.state === CircuitState.HALF_OPEN;
  }
}

/**
 * Circuit Breaker Manager - Manages multiple circuit breakers
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Get or create circuit breaker
   * @param {string} name - Circuit breaker name
   * @param {Object} options - Circuit breaker configuration
   * @returns {CircuitBreaker} - Circuit breaker instance
   */
  getBreaker(name, options = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ ...options, name }));
    }
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breakers
   * @returns {Map} - Map of circuit breakers
   */
  getAllBreakers() {
    return this.breakers;
  }

  /**
   * Get status of all circuit breakers
   * @returns {Array} - Array of circuit breaker states
   */
  getAllStates() {
    const states = [];
    for (const [name, breaker] of this.breakers) {
      states.push(breaker.getState());
    }
    return states;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const [name, breaker] of this.breakers) {
      breaker.reset();
    }
    logger.info('All circuit breakers reset');
  }

  /**
   * Reset specific circuit breaker
   * @param {string} name - Circuit breaker name
   */
  reset(name) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
}

// Export singleton manager
const manager = new CircuitBreakerManager();

module.exports = {
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,
  manager
};
