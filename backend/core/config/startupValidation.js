/**
 * Startup Configuration Validation
 * Validates all configuration at application startup using ConfigService
 */

const configService = require('./ConfigService');

/**
 * Validate configuration and fail fast if invalid
 * @returns {Object} Validation result with errors and warnings
 */
function validateConfiguration() {
  console.log('\n🔍 Validating configuration...\n');
  
  const validation = configService.validate();
  
  // Display warnings
  if (validation.warnings.length > 0) {
    console.log('⚠️  Configuration Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`   - ${warning.key}: ${warning.message}`);
    });
    console.log('');
  }
  
  // Display errors
  if (validation.errors.length > 0) {
    console.error('❌ Configuration Errors:');
    validation.errors.forEach(error => {
      console.error(`   - ${error.key}: ${error.message}`);
    });
    console.error('');
  }
  
  return validation;
}

/**
 * Validate and exit if configuration is invalid
 * Call this at application startup before initializing services
 */
function validateAndExit() {
  const validation = validateConfiguration();
  
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed. Please fix the errors above and restart the application.\n');
    process.exit(1);
  }
  
  console.log('✅ Configuration validation passed\n');
  
  // Display configuration summary (sanitized)
  if (process.env.NODE_ENV !== 'production') {
    displayConfigurationSummary();
  }
}

/**
 * Display configuration summary (for development/debugging)
 */
function displayConfigurationSummary() {
  console.log('📋 Configuration Summary:');
  console.log(`   Environment: ${configService.getNodeEnv()}`);
  console.log(`   Port: ${configService.getPort()}`);
  console.log(`   API Base URL: ${configService.getApiBaseUrl()}`);
  console.log(`   Frontend URL: ${configService.getFrontendUrl()}`);
  console.log(`   Database: ${configService.getMongoUri().replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);
  console.log(`   SSL Enabled: ${configService.isSslEnabled()}`);
  console.log(`   Rate Limiting: ${configService.isRateLimitEnabled()}`);
  
  // Email configuration
  const mailersendConfig = configService.getMailerSendConfig();
  if (mailersendConfig.apiKey) {
    console.log(`   Email Service: MailerSend (${mailersendConfig.fromEmail})`);
  } else {
    console.log(`   Email Service: Not configured (console mode)`);
  }
  
  // Payment gateways
  const razorpayConfig = configService.getRazorpayConfig();
  const kotakConfig = configService.getKotakConfig();
  
  const paymentGateways = [];
  if (razorpayConfig.keyId) paymentGateways.push('Razorpay');
  if (kotakConfig.clientId) paymentGateways.push('Kotak UPI');
  
  if (paymentGateways.length > 0) {
    console.log(`   Payment Gateways: ${paymentGateways.join(', ')}`);
  } else {
    console.log(`   Payment Gateways: None configured`);
  }
  
  console.log('');
}

/**
 * Validate specific configuration value
 * @param {string} key - Configuration key to validate
 * @returns {Object} Validation result
 */
function validateConfigValue(key, value) {
  const errors = [];
  
  // URL validation
  if (key.includes('URL') || key.includes('Url')) {
    if (value && !isValidUrl(value)) {
      errors.push(`${key} must be a valid URL`);
    }
  }
  
  // Email validation
  if (key.includes('EMAIL') || key.includes('Email')) {
    if (value && !isValidEmail(value)) {
      errors.push(`${key} must be a valid email address`);
    }
  }
  
  // Port validation
  if (key.toLowerCase().includes('port')) {
    const port = parseInt(value, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`${key} must be a valid port number (1-65535)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get configuration health status
 * @returns {Object} Health status
 */
function getConfigurationHealth() {
  const validation = configService.validate();
  
  return {
    healthy: validation.isValid,
    errors: validation.errors.length,
    warnings: validation.warnings.length,
    timestamp: new Date().toISOString(),
    environment: configService.getNodeEnv(),
    details: {
      database: !!configService.getMongoUri(),
      email: !!configService.getMailerSendConfig().apiKey,
      security: !!configService.getJwtSecret(),
      ssl: configService.isSslEnabled()
    }
  };
}

module.exports = {
  validateConfiguration,
  validateAndExit,
  validateConfigValue,
  displayConfigurationSummary,
  getConfigurationHealth,
  isValidUrl,
  isValidEmail
};
