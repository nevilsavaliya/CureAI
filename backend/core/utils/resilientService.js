/**
 * Resilient Service Wrapper - Combines retry logic, circuit breaker, and graceful degradation
 * Provides a unified interface for calling external services with resilience patterns
 */

const RetryHandler = require('./retryHandler');
const { manager: circuitBreakerManager } = require('./circuitBreaker');
const logger = require('../../services/logger');

class ResilientService {
  /**
   * Create a resilient service wrapper
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.name = options.name || 'ResilientService';
    this.circuitBreaker = circuitBreakerManager.getBreaker(this.name, {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 30000,
      resetTimeout: options.resetTimeout || 60000
    });
    this.retryConfig = options.retryConfig || {};
    this.fallbackHandler = options.fallbackHandler || null;
    this.degradedMode = false;
  }

  /**
   * Execute operation with full resilience patterns
   * @param {Function} operation - Async function to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} - Operation result or fallback
   */
  async execute(operation, options = {}) {
    const operationName = options.operationName || this.name;
    const fallback = options.fallback || this.fallbackHandler;

    try {
      // Execute through circuit breaker with retry logic
      const result = await this.circuitBreaker.execute(async () => {
        return await RetryHandler.executeWithRetry(
          operation,
          this.retryConfig,
          operationName
        );
      });

      // If we were in degraded mode, log recovery
      if (this.degradedMode) {
        logger.info(`Service "${this.name}" recovered from degraded mode`);
        this.degradedMode = false;
      }

      return result;
    } catch (error) {
      // Log the failure
      logger.error(`Service "${this.name}" operation failed`, {
        operation: operationName,
        error: error.message,
        circuitBreakerOpen: error.circuitBreakerOpen || false
      });

      // Enter degraded mode
      if (!this.degradedMode) {
        logger.warn(`Service "${this.name}" entering degraded mode`);
        this.degradedMode = true;
      }

      // Try fallback if available
      if (fallback) {
        try {
          logger.info(`Using fallback for "${operationName}"`);
          const fallbackResult = await fallback(error);
          return fallbackResult;
        } catch (fallbackError) {
          logger.error(`Fallback failed for "${operationName}"`, {
            error: fallbackError.message
          });
          throw error; // Throw original error
        }
      }

      // No fallback available, throw error
      throw error;
    }
  }

  /**
   * Check if service is in degraded mode
   * @returns {boolean} - True if in degraded mode
   */
  isDegraded() {
    return this.degradedMode || this.circuitBreaker.isOpen();
  }

  /**
   * Get service health status
   * @returns {Object} - Health status
   */
  getHealthStatus() {
    const circuitState = this.circuitBreaker.getState();
    return {
      name: this.name,
      healthy: !this.isDegraded(),
      degraded: this.degradedMode,
      circuitBreaker: circuitState
    };
  }

  /**
   * Reset service to normal operation
   */
  reset() {
    this.degradedMode = false;
    this.circuitBreaker.reset();
    logger.info(`Service "${this.name}" reset to normal operation`);
  }
}

/**
 * Create a resilient email service wrapper
 * @param {Object} emailService - Email service instance
 * @returns {Object} - Wrapped email service
 */
function createResilientEmailService(emailService) {
  const resilientService = new ResilientService({
    name: 'EmailService',
    failureThreshold: 3,
    timeout: 30000,
    resetTimeout: 60000,
    retryConfig: {
      maxRetries: 2,
      initialDelay: 1000,
      maxDelay: 5000
    },
    fallbackHandler: async (error) => {
      logger.warn('Email service unavailable, logging email to console', {
        error: error.message
      });
      // Return success but log that email wasn't sent
      return { success: true, fallback: true, message: 'Email logged (service unavailable)' };
    }
  });

  return {
    async sendOTP(email, otp) {
      return resilientService.execute(
        () => emailService.sendOTP(email, otp),
        {
          operationName: 'sendOTP',
          fallback: async () => {
            logger.info(`[FALLBACK] OTP for ${email}: ${otp}`);
            return true;
          }
        }
      );
    },

    async sendSignupOTP(email, otp) {
      return resilientService.execute(
        () => emailService.sendSignupOTP(email, otp),
        {
          operationName: 'sendSignupOTP',
          fallback: async () => {
            logger.info(`[FALLBACK] Signup OTP for ${email}: ${otp}`);
            return true;
          }
        }
      );
    },

    async sendConsultationEmail(email, consultationDetails, recipientRole) {
      return resilientService.execute(
        () => emailService.sendConsultationEmail(email, consultationDetails, recipientRole),
        {
          operationName: 'sendConsultationEmail',
          fallback: async () => {
            logger.info(`[FALLBACK] Consultation email for ${email}`, consultationDetails);
            return true;
          }
        }
      );
    },

    async sendEmail(to, subject, html) {
      return resilientService.execute(
        () => emailService.sendEmail(to, subject, html),
        {
          operationName: 'sendEmail',
          fallback: async () => {
            logger.info(`[FALLBACK] Email to ${to}: ${subject}`);
            return true;
          }
        }
      );
    },

    async sendHospitalVerificationEmail(email, hospitalData) {
      return resilientService.execute(
        () => emailService.sendHospitalVerificationEmail(email, hospitalData),
        {
          operationName: 'sendHospitalVerificationEmail',
          fallback: async () => {
            logger.info(`[FALLBACK] Hospital verification email for ${email}`, hospitalData);
            return true;
          }
        }
      );
    },

    getHealthStatus: () => resilientService.getHealthStatus(),
    reset: () => resilientService.reset()
  };
}

/**
 * Create a resilient payment service wrapper
 * @param {Object} paymentService - Payment service instance
 * @returns {Object} - Wrapped payment service
 */
function createResilientPaymentService(paymentService) {
  const resilientService = new ResilientService({
    name: 'PaymentService',
    failureThreshold: 5,
    timeout: 30000,
    resetTimeout: 120000, // 2 minutes for payment service
    retryConfig: {
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 10000
    }
  });

  return {
    async getAccessToken() {
      return resilientService.execute(
        () => paymentService.getAccessToken(),
        {
          operationName: 'getAccessToken',
          fallback: async (error) => {
            throw new Error('Payment service unavailable - please try again later');
          }
        }
      );
    },

    async checkTransactionStatus(params) {
      return resilientService.execute(
        () => paymentService.checkTransactionStatus(params),
        {
          operationName: 'checkTransactionStatus',
          fallback: async (error) => {
            logger.warn('Payment status check failed, returning pending status', {
              txnId: params.txnId,
              error: error.message
            });
            return {
              success: false,
              status: 'PENDING',
              message: 'Unable to verify payment status, please check again later',
              userMessage: 'Payment verification in progress'
            };
          }
        }
      );
    },

    async validateVPA(params) {
      return resilientService.execute(
        () => paymentService.validateVPA(params),
        {
          operationName: 'validateVPA',
          fallback: async (error) => {
            logger.warn('VPA validation failed, skipping validation', {
              vpa: params.vpa,
              error: error.message
            });
            return {
              success: true,
              valid: true,
              message: 'VPA validation skipped (service unavailable)'
            };
          }
        }
      );
    },

    getHealthStatus: () => resilientService.getHealthStatus(),
    reset: () => resilientService.reset(),
    
    // Pass through other methods
    getErrorMessage: (errorCode) => paymentService.getErrorMessage(errorCode),
    clearTokenCache: () => paymentService.clearTokenCache(),
    getTokenCacheStatus: () => paymentService.getTokenCacheStatus()
  };
}

module.exports = {
  ResilientService,
  createResilientEmailService,
  createResilientPaymentService
};
