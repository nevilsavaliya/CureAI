/**
 * ConfigService - Centralized configuration management
 * Singleton pattern for global access to environment variables
 */

class ConfigService {
  constructor() {
    if (ConfigService.instance) {
      return ConfigService.instance;
    }
    
    this.config = {};
    this.loadConfiguration();
    ConfigService.instance = this;
  }

  /**
   * Load and validate all configuration from environment variables
   */
  loadConfiguration() {
    // Server configuration
    this.config.server = {
      port: this.getEnvAsNumber('PORT', 3000),
      nodeEnv: this.getEnv('NODE_ENV', 'development'),
      apiBaseUrl: this.getEnv('API_BASE_URL', 'http://localhost:3000'),
      apiUrl: this.getEnv('API_URL', 'http://localhost:3000/api'),
      socketUrl: this.getEnv('SOCKET_URL', this.getEnv('API_BASE_URL', 'http://localhost:3000')),
      healthCheckUrl: this.getEnv('HEALTH_CHECK_URL', `${this.getEnv('API_BASE_URL', 'http://localhost:3000')}/api/health`)
    };

    // Database configuration
    this.config.database = {
      mongoUri: this.getEnv('MONGODB_URI', 'mongodb://localhost:27017/healthcare-platform'),
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    };

    // Security configuration
    this.config.security = {
      jwtSecret: this.getEnv('JWT_SECRET'),
      jwtExpiresIn: this.getEnv('JWT_EXPIRES_IN', '24h'),
      encryptionKey: this.getEnv('ENCRYPTION_MASTER_KEY'),
      apiRateLimit: this.getEnvAsNumber('API_RATE_LIMIT', 100)
    };

    // Rate limiting configuration
    this.config.rateLimit = {
      enabled: this.getEnvAsBoolean('RATE_LIMIT_ENABLED', true),
      default: {
        limit: this.getEnvAsNumber('DEFAULT_RATE_LIMIT', 100),
        windowMs: this.getEnvAsNumber('DEFAULT_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000) // 1 hour
      },
      auth: {
        limit: this.getEnvAsNumber('AUTH_RATE_LIMIT', 5),
        windowMs: this.getEnvAsNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000) // 15 minutes
      },
      api: {
        limit: this.getEnvAsNumber('API_RATE_LIMIT', 100),
        windowMs: this.getEnvAsNumber('API_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000) // 1 hour
      },
      hospitalApi: {
        limit: this.getEnvAsNumber('HOSPITAL_API_RATE_LIMIT', 100),
        windowMs: this.getEnvAsNumber('HOSPITAL_API_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000) // 1 hour
      },
      adminOperations: {
        limit: this.getEnvAsNumber('ADMIN_RATE_LIMIT', 50),
        windowMs: this.getEnvAsNumber('ADMIN_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000) // 1 hour
      },
      messages: {
        limit: this.getEnvAsNumber('MESSAGE_RATE_LIMIT', 10),
        windowMs: this.getEnvAsNumber('MESSAGE_RATE_LIMIT_WINDOW_MS', 60 * 1000) // 1 minute
      },
      fileUpload: {
        limit: this.getEnvAsNumber('FILE_UPLOAD_RATE_LIMIT', 10),
        windowMs: this.getEnvAsNumber('FILE_UPLOAD_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000) // 1 hour
      }
    };

    // SSL/TLS configuration
    this.config.ssl = {
      enabled: this.getEnvAsBoolean('SSL_ENABLED', false),
      port: this.getEnvAsNumber('SSL_PORT', 3443),
      certPath: this.getEnv('SSL_CERT_PATH', './certs'),
      keyFile: this.getEnv('SSL_KEY_FILE', 'server.key'),
      certFile: this.getEnv('SSL_CERT_FILE', 'server.crt'),
      caFile: this.getEnv('SSL_CA_FILE', 'ca.crt'),
      domain: this.getEnv('SSL_DOMAIN', 'localhost'),
      organization: this.getEnv('SSL_ORGANIZATION', 'Healthcare Platform'),
      ou: this.getEnv('SSL_OU', 'IT Department'),
      country: this.getEnv('SSL_COUNTRY', 'US'),
      state: this.getEnv('SSL_STATE', 'State'),
      city: this.getEnv('SSL_CITY', 'City'),
      altNames: this.getEnvAsArray('SSL_ALT_NAMES'),
      altIps: this.getEnvAsArray('SSL_ALT_IPS'),
      certType: this.getEnv('SSL_CERT_TYPE', 'self-signed'),
      letsencryptEmail: this.getEnv('LETSENCRYPT_EMAIL', '')
    };

    // HSTS configuration
    this.config.hsts = {
      maxAge: this.getEnvAsNumber('HSTS_MAX_AGE', 31536000),
      includeSubdomains: this.getEnvAsBoolean('HSTS_INCLUDE_SUBDOMAINS', true),
      preload: this.getEnvAsBoolean('HSTS_PRELOAD', true)
    };

    // CORS configuration
    this.config.cors = {
      origins: this.getEnvAsArray('CORS_ORIGINS', ['http://localhost:4200']),
      frontendUrl: this.getEnv('FRONTEND_URL', 'http://localhost:4200')
    };

    // Email configuration (MailerSend)
    this.config.email = {
      mailersend: {
        apiKey: this.getEnv('MAILERSEND_API_KEY'),
        apiUrl: this.getEnv('MAILERSEND_API_URL', 'https://api.mailersend.com/v1/email'),
        fromEmail: this.getEnv('MAILERSEND_FROM_EMAIL'),
        fromName: this.getEnv('MAILERSEND_FROM_NAME', 'Healthcare Platform')
      },
      // Legacy Gmail (deprecated)
      gmail: {
        user: this.getEnv('EMAIL_USER', ''),
        password: this.getEnv('EMAIL_PASSWORD', '')
      },
      // Email addresses
      supportEmail: this.getEnv('SUPPORT_EMAIL', 'support@healthcare.com'),
      defaultFromEmail: this.getEnv('DEFAULT_FROM_EMAIL', 'noreply@healthcare.com')
    };

    // Hospital configuration
    this.config.hospital = {
      apiKeyPrefix: this.getEnv('HOSPITAL_API_KEY_PREFIX', 'HK_'),
      apiSecretLength: this.getEnvAsNumber('HOSPITAL_API_SECRET_LENGTH', 64)
    };

    // Payment gateway configuration
    this.config.payment = {
      razorpay: {
        keyId: this.getEnv('RAZORPAY_KEY_ID'),
        keySecret: this.getEnv('RAZORPAY_KEY_SECRET'),
        upiId: this.getEnv('UPI_ID')
      },
      kotak: {
        apiBaseUrl: this.getEnv('KOTAK_API_BASE_URL', 'https://apigwuat.kotak.com:8443'),
        clientId: this.getEnv('KOTAK_CLIENT_ID'),
        clientSecret: this.getEnv('KOTAK_CLIENT_SECRET'),
        merchantVpa: this.getEnv('KOTAK_MERCHANT_VPA'),
        merchantMobile: this.getEnv('KOTAK_MERCHANT_MOBILE'),
        aggregatorId: this.getEnv('KOTAK_AGGREGATOR_ID', 'AC001'),
        merchantId: this.getEnv('KOTAK_MERCHANT_ID', 'MC001'),
        secretKey: this.getEnv('KOTAK_SECRET_KEY')
      },
      timeout: this.getEnvAsNumber('PAYMENT_TIMEOUT_MINUTES', 10),
      pollInterval: this.getEnvAsNumber('PAYMENT_POLL_INTERVAL_SECONDS', 5),
      maxRetries: this.getEnvAsNumber('PAYMENT_MAX_RETRIES', 3)
    };

    // Proxy configuration
    this.config.proxy = {
      trustedProxies: this.getEnvAsArray('TRUSTED_PROXIES', [])
    };
  }

  /**
   * Get environment variable with optional default value
   */
  getEnv(key, defaultValue = undefined) {
    const value = process.env[key];
    if (value === undefined || value === '') {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      // Don't throw error here, let validation handle it
      return undefined;
    }
    return value;
  }

  /**
   * Get environment variable as number
   */
  getEnvAsNumber(key, defaultValue = undefined) {
    const value = this.getEnv(key);
    if (value === undefined) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
    }
    return parsed;
  }

  /**
   * Get environment variable as boolean
   */
  getEnvAsBoolean(key, defaultValue = false) {
    const value = this.getEnv(key);
    if (value === undefined) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get environment variable as array (comma-separated)
   */
  getEnvAsArray(key, defaultValue = []) {
    const value = this.getEnv(key);
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value.split(',').map(item => item.trim()).filter(item => item !== '');
  }

  // Server configuration getters
  getPort() {
    return this.config.server.port;
  }

  getNodeEnv() {
    return this.config.server.nodeEnv;
  }

  getApiBaseUrl() {
    return this.config.server.apiBaseUrl;
  }

  getApiUrl() {
    return this.config.server.apiUrl;
  }

  getSocketUrl() {
    return this.config.server.socketUrl;
  }

  getHealthCheckUrl() {
    return this.config.server.healthCheckUrl;
  }

  isProduction() {
    return this.config.server.nodeEnv === 'production';
  }

  isDevelopment() {
    return this.config.server.nodeEnv === 'development';
  }

  // Database configuration getters
  getMongoUri() {
    return this.config.database.mongoUri;
  }

  getMongoOptions() {
    return this.config.database.options;
  }

  // Security configuration getters
  getJwtSecret() {
    return this.config.security.jwtSecret;
  }

  getJwtExpiresIn() {
    return this.config.security.jwtExpiresIn;
  }

  getEncryptionKey() {
    return this.config.security.encryptionKey;
  }

  getApiRateLimit() {
    return this.config.security.apiRateLimit;
  }

  // Rate limiting configuration getters
  isRateLimitEnabled() {
    return this.config.rateLimit.enabled;
  }

  getRateLimitConfig(type = 'default') {
    return this.config.rateLimit[type] || this.config.rateLimit.default;
  }

  getAllRateLimitConfigs() {
    return this.config.rateLimit;
  }

  // SSL configuration getters
  isSslEnabled() {
    return this.config.ssl.enabled;
  }

  getSslConfig() {
    return this.config.ssl;
  }

  // HSTS configuration getters
  getHstsConfig() {
    return this.config.hsts;
  }

  // CORS configuration getters
  getCorsOrigins() {
    return this.config.cors.origins;
  }

  getFrontendUrl() {
    return this.config.cors.frontendUrl;
  }

  // Email configuration getters
  getMailerSendConfig() {
    return this.config.email.mailersend;
  }

  getGmailConfig() {
    return this.config.email.gmail;
  }

  getSupportEmail() {
    return this.config.email.supportEmail;
  }

  getDefaultFromEmail() {
    return this.config.email.defaultFromEmail;
  }

  // Hospital configuration getters
  getHospitalConfig() {
    return this.config.hospital;
  }

  // Payment configuration getters
  getRazorpayConfig() {
    return this.config.payment.razorpay;
  }

  getKotakConfig() {
    return this.config.payment.kotak;
  }

  getPaymentConfig() {
    return {
      timeout: this.config.payment.timeout,
      pollInterval: this.config.payment.pollInterval,
      maxRetries: this.config.payment.maxRetries
    };
  }

  // Proxy configuration getters
  getTrustedProxies() {
    return this.config.proxy.trustedProxies;
  }

  /**
   * Validate required environment variables
   * Returns validation result with errors if any
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Required in all environments
    const required = [
      { key: 'JWT_SECRET', value: this.config.security.jwtSecret, message: 'JWT_SECRET is required for authentication' },
      { key: 'MONGODB_URI', value: this.config.database.mongoUri, message: 'MONGODB_URI is required for database connection' }
    ];

    // Required in production
    if (this.isProduction()) {
      required.push(
        { key: 'ENCRYPTION_MASTER_KEY', value: this.config.security.encryptionKey, message: 'ENCRYPTION_MASTER_KEY is required in production' },
        { key: 'MAILERSEND_API_KEY', value: this.config.email.mailersend.apiKey, message: 'MAILERSEND_API_KEY is required for email functionality' },
        { key: 'MAILERSEND_FROM_EMAIL', value: this.config.email.mailersend.fromEmail, message: 'MAILERSEND_FROM_EMAIL is required for email functionality' }
      );
    }

    // Check required variables
    for (const { key, value, message } of required) {
      if (!value || value === '') {
        errors.push({ key, message });
      }
    }

    // Warnings for missing optional but recommended variables
    if (!this.config.payment.razorpay.keyId) {
      warnings.push({ key: 'RAZORPAY_KEY_ID', message: 'Razorpay payment gateway will not be available' });
    }

    if (!this.config.payment.kotak.clientId) {
      warnings.push({ key: 'KOTAK_CLIENT_ID', message: 'Kotak UPI payment gateway will not be available' });
    }

    // Validate JWT_SECRET strength in production
    if (this.isProduction() && this.config.security.jwtSecret) {
      if (this.config.security.jwtSecret.length < 32) {
        warnings.push({ key: 'JWT_SECRET', message: 'JWT_SECRET should be at least 32 characters long in production' });
      }
      if (this.config.security.jwtSecret === 'your-secret-key-change-this-in-production') {
        errors.push({ key: 'JWT_SECRET', message: 'JWT_SECRET must be changed from default value in production' });
      }
    }

    // Validate ENCRYPTION_MASTER_KEY format
    if (this.config.security.encryptionKey && this.config.security.encryptionKey.length !== 64) {
      errors.push({ key: 'ENCRYPTION_MASTER_KEY', message: 'ENCRYPTION_MASTER_KEY must be exactly 64 characters (hex)' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get all configuration (for debugging - use carefully)
   */
  getAllConfig() {
    // Return a copy to prevent modification
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Get sanitized configuration (without secrets)
   */
  getSanitizedConfig() {
    const sanitized = JSON.parse(JSON.stringify(this.config));
    
    // Remove sensitive data
    if (sanitized.security) {
      sanitized.security.jwtSecret = '***';
      sanitized.security.encryptionKey = '***';
    }
    if (sanitized.email?.mailersend) {
      sanitized.email.mailersend.apiKey = '***';
    }
    if (sanitized.email?.gmail) {
      sanitized.email.gmail.password = '***';
    }
    if (sanitized.payment?.razorpay) {
      sanitized.payment.razorpay.keySecret = '***';
    }
    if (sanitized.payment?.kotak) {
      sanitized.payment.kotak.clientSecret = '***';
      sanitized.payment.kotak.secretKey = '***';
    }
    
    return sanitized;
  }
}

// Export singleton instance
module.exports = new ConfigService();
