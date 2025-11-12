/**
 * Kotak UPI Payment Gateway Configuration
 * 
 * This module manages Kotak API configuration and validates
 * required environment variables on server startup.
 */

class KotakConfig {
  constructor() {
    this.config = {
      // API Configuration
      baseURL: process.env.KOTAK_API_BASE_URL,
      clientId: process.env.KOTAK_CLIENT_ID,
      clientSecret: process.env.KOTAK_CLIENT_SECRET,
      
      // Merchant Configuration
      merchantVPA: process.env.KOTAK_MERCHANT_VPA,
      merchantMobile: process.env.KOTAK_MERCHANT_MOBILE,
      aggregatorId: process.env.KOTAK_AGGREGATOR_ID,
      merchantId: process.env.KOTAK_MERCHANT_ID,
      secretKey: process.env.KOTAK_SECRET_KEY,
      
      // Payment Configuration
      paymentTimeoutMinutes: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES) || 10,
      paymentPollIntervalSeconds: parseInt(process.env.PAYMENT_POLL_INTERVAL_SECONDS) || 5,
      paymentMaxRetries: parseInt(process.env.PAYMENT_MAX_RETRIES) || 3
    };
    
    // Token endpoint (derived from base URL)
    this.config.tokenEndpoint = `${this.config.baseURL}/token`;
    
    // API endpoints
    this.config.endpoints = {
      token: '/token',
      checkTransactionStatus: '/v1/upi/checkTxnStatus',
      validateVPA: '/v1/upi/validateVPA'
    };
  }

  /**
   * Validate all required configuration values
   * @throws {Error} If any required configuration is missing
   */
  validate() {
    const requiredFields = [
      { key: 'baseURL', name: 'KOTAK_API_BASE_URL' },
      { key: 'clientId', name: 'KOTAK_CLIENT_ID' },
      { key: 'clientSecret', name: 'KOTAK_CLIENT_SECRET' },
      { key: 'merchantVPA', name: 'KOTAK_MERCHANT_VPA' },
      { key: 'merchantMobile', name: 'KOTAK_MERCHANT_MOBILE' },
      { key: 'aggregatorId', name: 'KOTAK_AGGREGATOR_ID' },
      { key: 'merchantId', name: 'KOTAK_MERCHANT_ID' },
      { key: 'secretKey', name: 'KOTAK_SECRET_KEY' }
    ];

    const missingFields = [];
    const invalidFields = [];

    for (const field of requiredFields) {
      const value = this.config[field.key];
      
      if (!value || value === '' || value.includes('your_') || value.includes('XXXX')) {
        missingFields.push(field.name);
      }
    }

    // Validate numeric configurations
    if (isNaN(this.config.paymentTimeoutMinutes) || this.config.paymentTimeoutMinutes <= 0) {
      invalidFields.push('PAYMENT_TIMEOUT_MINUTES must be a positive number');
    }

    if (isNaN(this.config.paymentPollIntervalSeconds) || this.config.paymentPollIntervalSeconds <= 0) {
      invalidFields.push('PAYMENT_POLL_INTERVAL_SECONDS must be a positive number');
    }

    if (isNaN(this.config.paymentMaxRetries) || this.config.paymentMaxRetries < 0) {
      invalidFields.push('PAYMENT_MAX_RETRIES must be a non-negative number');
    }

    // Validate merchant mobile format (should start with 91 and be 12 digits)
    if (this.config.merchantMobile && !this.config.merchantMobile.match(/^91\d{10}$/)) {
      invalidFields.push('KOTAK_MERCHANT_MOBILE must be in format 91XXXXXXXXXX (12 digits starting with 91)');
    }

    // Validate VPA format (should contain @)
    if (this.config.merchantVPA && !this.config.merchantVPA.includes('@')) {
      invalidFields.push('KOTAK_MERCHANT_VPA must be a valid UPI ID (e.g., merchant@kotak)');
    }

    if (missingFields.length > 0 || invalidFields.length > 0) {
      let errorMessage = 'Kotak API Configuration Error:\n';
      
      if (missingFields.length > 0) {
        errorMessage += '\nMissing or invalid environment variables:\n';
        errorMessage += missingFields.map(field => `  - ${field}`).join('\n');
      }
      
      if (invalidFields.length > 0) {
        errorMessage += '\n\nInvalid configuration values:\n';
        errorMessage += invalidFields.map(field => `  - ${field}`).join('\n');
      }
      
      errorMessage += '\n\nPlease check your .env file and ensure all Kotak API credentials are properly configured.';
      
      throw new Error(errorMessage);
    }

    return true;
  }

  /**
   * Get configuration object
   * @returns {Object} Configuration object
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get specific configuration value
   * @param {string} key - Configuration key
   * @returns {*} Configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Check if Kotak integration is enabled
   * @returns {boolean} True if all required configs are present
   */
  isEnabled() {
    try {
      this.validate();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get sanitized config for logging (without sensitive data)
   * @returns {Object} Sanitized configuration
   */
  getSanitizedConfig() {
    return {
      baseURL: this.config.baseURL,
      merchantVPA: this.config.merchantVPA,
      aggregatorId: this.config.aggregatorId,
      merchantId: this.config.merchantId,
      paymentTimeoutMinutes: this.config.paymentTimeoutMinutes,
      paymentPollIntervalSeconds: this.config.paymentPollIntervalSeconds,
      paymentMaxRetries: this.config.paymentMaxRetries,
      isEnabled: this.isEnabled()
    };
  }
}

// Export singleton instance
const kotakConfig = new KotakConfig();

module.exports = kotakConfig;
