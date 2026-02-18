/**
 * Environment Variable Validation Utility
 * Validates required environment variables on application startup
 */

const crypto = require('crypto');

/**
 * Required environment variables for the application
 */
const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'API_URL'
];

/**
 * Optional environment variables with default values
 */
const OPTIONAL_VARS = {
  PORT: '3000',
  NODE_ENV: 'development',
  JWT_EXPIRES_IN: '24h',
  API_RATE_LIMIT: '100',
  HOSPITAL_API_KEY_PREFIX: 'HK_',
  HOSPITAL_API_SECRET_LENGTH: '64',
  PAYMENT_TIMEOUT_MINUTES: '10',
  PAYMENT_POLL_INTERVAL_SECONDS: '5',
  PAYMENT_MAX_RETRIES: '3',
  CORS_ORIGINS: '', // Will fallback to FRONTEND_URL if empty
  API_BASE_URL: '',
  HEALTH_CHECK_URL: ''
};

/**
 * Validation rules for environment variables
 */
const VALIDATION_RULES = {
  JWT_SECRET: {
    minLength: 32,
    description: 'JWT secret must be at least 32 characters long'
  },
  MAILERSEND_FROM_EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'MAILERSEND_FROM_EMAIL must be a valid email address',
    optional: true
  },
  API_RATE_LIMIT: {
    type: 'number',
    min: 1,
    max: 10000,
    description: 'API_RATE_LIMIT must be a number between 1 and 10000'
  },
  HOSPITAL_API_SECRET_LENGTH: {
    type: 'number',
    min: 32,
    max: 128,
    description: 'HOSPITAL_API_SECRET_LENGTH must be between 32 and 128'
  },
  PORT: {
    type: 'number',
    min: 1,
    max: 65535,
    description: 'PORT must be a valid port number (1-65535)'
  },
  API_URL: {
    pattern: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    description: 'API_URL must be a valid HTTP or HTTPS URL (e.g., https://api.example.com/api)',
    validateUrl: true
  },
  FRONTEND_URL: {
    pattern: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    description: 'FRONTEND_URL must be a valid HTTP or HTTPS URL (e.g., https://app.example.com)',
    validateUrl: true
  },
  MONGODB_URI: {
    pattern: /^mongodb(\+srv)?:\/\/[^\s]+$/,
    description: 'MONGODB_URI must be a valid MongoDB connection string (e.g., mongodb://localhost:27017/db or mongodb+srv://user:pass@cluster.mongodb.net/db)',
    validateMongoUri: true
  },
  API_BASE_URL: {
    pattern: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    description: 'API_BASE_URL must be a valid HTTP or HTTPS URL',
    optional: true,
    validateUrl: true
  },
  HEALTH_CHECK_URL: {
    pattern: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    description: 'HEALTH_CHECK_URL must be a valid HTTP or HTTPS URL',
    optional: true,
    validateUrl: true
  }
};

/**
 * Validates URL format and accessibility
 * @param {string} url - URL to validate
 * @returns {object} Validation result
 */
function validateUrlFormat(url) {
  const result = { valid: true, errors: [] };
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      result.valid = false;
      result.errors.push('URL must use HTTP or HTTPS protocol');
    }
    
    // Check hostname
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      result.valid = false;
      result.errors.push('URL must have a valid hostname');
    }
    
    // Check for localhost in production
    if (process.env.NODE_ENV === 'production' && 
        (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      result.valid = false;
      result.errors.push('Localhost URLs are not allowed in production environment');
    }
    
  } catch (error) {
    result.valid = false;
    result.errors.push(`Invalid URL format: ${error.message}`);
  }
  
  return result;
}

/**
 * Validates MongoDB URI format and components
 * @param {string} uri - MongoDB URI to validate
 * @returns {object} Validation result
 */
function validateMongoUri(uri) {
  const result = { valid: true, errors: [] };
  
  try {
    // Basic format check
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      result.valid = false;
      result.errors.push('MongoDB URI must start with mongodb:// or mongodb+srv://');
      return result;
    }
    
    // Check for required components
    const uriParts = uri.split('://')[1];
    if (!uriParts) {
      result.valid = false;
      result.errors.push('MongoDB URI is malformed');
      return result;
    }
    
    // Check for database name (after the last /)
    const pathParts = uriParts.split('/');
    if (pathParts.length < 2 || !pathParts[pathParts.length - 1]) {
      result.valid = false;
      result.errors.push('MongoDB URI must include a database name');
    }
    
    // Check for localhost in production
    if (process.env.NODE_ENV === 'production' && uri.includes('localhost')) {
      result.valid = false;
      result.errors.push('Localhost MongoDB URIs are not allowed in production environment');
    }
    
    // Check for default credentials
    if (uri.includes('username:password@') || uri.includes('<username>:<password>@')) {
      result.valid = false;
      result.errors.push('MongoDB URI contains placeholder credentials - update with actual values');
    }
    
  } catch (error) {
    result.valid = false;
    result.errors.push(`Invalid MongoDB URI: ${error.message}`);
  }
  
  return result;
}

/**
 * Validates CORS origins configuration
 * @param {string} corsOrigins - Comma-separated CORS origins
 * @returns {object} Validation result
 */
function validateCorsOrigins(corsOrigins) {
  const result = { valid: true, errors: [], warnings: [], origins: [] };
  
  if (!corsOrigins || corsOrigins.trim() === '') {
    // If no CORS_ORIGINS specified, use FRONTEND_URL as fallback
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      result.origins = [frontendUrl];
      result.warnings.push('CORS_ORIGINS not specified, using FRONTEND_URL as fallback');
      
      // Validate the fallback URL
      const urlValidation = validateUrlFormat(frontendUrl);
      if (!urlValidation.valid) {
        result.valid = false;
        result.errors.push(`FRONTEND_URL (used as CORS fallback): ${urlValidation.errors.join(', ')}`);
      }
      
      return result;
    } else {
      result.valid = false;
      result.errors.push('Either CORS_ORIGINS or FRONTEND_URL must be specified');
      return result;
    }
  }

  // Parse comma-separated origins
  const origins = corsOrigins.split(',')
    .map(origin => origin.trim())
    .filter(origin => origin);

  if (origins.length === 0) {
    result.valid = false;
    result.errors.push('CORS_ORIGINS cannot be empty');
    return result;
  }

  // Validate each origin
  const validOrigins = [];
  for (const origin of origins) {
    // Check for wildcard (only allow in development)
    if (origin === '*') {
      if (process.env.NODE_ENV === 'production') {
        result.valid = false;
        result.errors.push('Wildcard (*) CORS origin is not allowed in production');
      } else {
        validOrigins.push(origin);
        result.warnings.push('Using wildcard (*) CORS origin - only recommended for development');
      }
      continue;
    }

    // Validate URL format
    const urlValidation = validateUrlFormat(origin);
    if (!urlValidation.valid) {
      result.valid = false;
      result.errors.push(`Invalid CORS origin "${origin}": ${urlValidation.errors.join(', ')}`);
    } else {
      validOrigins.push(origin);
    }
  }

  // Check for development fallbacks
  if (process.env.NODE_ENV === 'development') {
    const hasLocalhost = validOrigins.some(origin => 
      origin.includes('localhost') || origin.includes('127.0.0.1')
    );
    
    if (!hasLocalhost && !validOrigins.includes('*')) {
      result.warnings.push('No localhost origins found in CORS_ORIGINS for development environment');
    }
  }

  // Check for production requirements
  if (process.env.NODE_ENV === 'production') {
    const hasProductionOrigins = validOrigins.some(origin => 
      !origin.includes('localhost') && !origin.includes('127.0.0.1') && origin !== '*'
    );
    
    if (!hasProductionOrigins) {
      result.valid = false;
      result.errors.push('Production environment requires at least one non-localhost CORS origin');
    }
  }

  result.origins = validOrigins;
  return result;
}

/**
 * Validates a single environment variable
 * @param {string} name - Variable name
 * @param {string} value - Variable value
 * @param {object} rule - Validation rule
 * @returns {object} Validation result
 */
function validateVariable(name, value, rule) {
  const result = { valid: true, errors: [] };

  // Skip validation for optional variables that are empty
  if (rule.optional && (!value || value.trim() === '')) {
    return result;
  }

  if (!value) {
    result.valid = false;
    result.errors.push(`${name} is required but not set`);
    return result;
  }

  // Check minimum length
  if (rule.minLength && value.length < rule.minLength) {
    result.valid = false;
    result.errors.push(`${name}: ${rule.description}`);
  }

  // Check pattern
  if (rule.pattern && !rule.pattern.test(value)) {
    result.valid = false;
    result.errors.push(`${name}: ${rule.description}`);
  }

  // Enhanced URL validation
  if (rule.validateUrl) {
    const urlValidation = validateUrlFormat(value);
    if (!urlValidation.valid) {
      result.valid = false;
      result.errors.push(`${name}: ${urlValidation.errors.join(', ')}`);
    }
  }

  // Enhanced MongoDB URI validation
  if (rule.validateMongoUri) {
    const mongoValidation = validateMongoUri(value);
    if (!mongoValidation.valid) {
      result.valid = false;
      result.errors.push(`${name}: ${mongoValidation.errors.join(', ')}`);
    }
  }

  // Check type and range for numbers
  if (rule.type === 'number') {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      result.valid = false;
      result.errors.push(`${name}: ${rule.description}`);
    } else {
      if (rule.min && numValue < rule.min) {
        result.valid = false;
        result.errors.push(`${name}: ${rule.description}`);
      }
      if (rule.max && numValue > rule.max) {
        result.valid = false;
        result.errors.push(`${name}: ${rule.description}`);
      }
    }
  }

  return result;
}

/**
 * Validates all environment variables
 * @returns {object} Validation result with errors and warnings
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const missing = [];

  console.log('🔍 Validating environment configuration...');

  // Check required variables
  REQUIRED_VARS.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
      missing.push(varName);
      errors.push(`Missing required environment variable: ${varName}`);
    } else {
      // Validate against rules if they exist
      const rule = VALIDATION_RULES[varName];
      if (rule) {
        const validation = validateVariable(varName, value, rule);
        if (!validation.valid) {
          errors.push(...validation.errors);
        }
      }
    }
  });

  // Set defaults for optional variables and validate
  Object.entries(OPTIONAL_VARS).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      warnings.push(`Using default value for ${varName}: ${defaultValue}`);
    } else {
      // Validate against rules if they exist
      const rule = VALIDATION_RULES[varName];
      if (rule) {
        const validation = validateVariable(varName, process.env[varName], rule);
        if (!validation.valid) {
          errors.push(...validation.errors);
        }
      }
    }
  });

  // Validate CORS origins
  const corsValidation = validateCorsOrigins(process.env.CORS_ORIGINS);
  if (!corsValidation.valid) {
    errors.push(...corsValidation.errors);
  }
  if (corsValidation.warnings) {
    warnings.push(...corsValidation.warnings);
  }

  // Environment-specific warnings
  if (process.env.NODE_ENV === 'production') {
    // Production-specific checks
    if (process.env.JWT_SECRET === 'your-secret-key-change-this-in-production') {
      errors.push('JWT_SECRET must be changed from default value in production');
    }
    
    if (process.env.MAILERSEND_API_KEY === 'your_mailersend_api_key_here') {
      warnings.push('MAILERSEND_API_KEY should be set to actual API key for email functionality');
    }

    if (process.env.MONGODB_URI.includes('localhost')) {
      warnings.push('Using localhost MongoDB in production - consider using MongoDB Atlas');
    }
  }

  return { errors, warnings, missing };
}

/**
 * Generates a secure JWT secret
 * @returns {string} Generated secret
 */
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Displays environment validation results
 * @param {object} validation - Validation results
 */
function displayValidationResults(validation) {
  const { errors, warnings } = validation;

  if (warnings.length > 0) {
    console.log('\n⚠️  Environment Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Environment Configuration Errors:');
    errors.forEach(error => console.log(`   ${error}`));
    
    const corsRecommendations = getCorsRecommendations();
    
    console.log('\n💡 Configuration Guide:');
    console.log('   1. Copy example file: cp backend/.env.example backend/.env');
    console.log('   2. Generate JWT secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.log('   3. Set up Gmail App Password: https://myaccount.google.com/apppasswords');
    console.log('   4. Configure URLs for your deployment environment:');
    console.log('      - API_URL: Your backend API endpoint (e.g., https://api.example.com/api)');
    console.log('      - FRONTEND_URL: Your frontend application URL (e.g., https://app.example.com)');
    console.log('      - MONGODB_URI: Your MongoDB connection string');
    console.log(`   5. Configure CORS origins for ${corsRecommendations.environment}:`);
    console.log(`      CORS_ORIGINS="${corsRecommendations.example}"`);
    console.log('   6. For cloud deployments:');
    console.log('      - Render: Use your .onrender.com URLs');
    console.log('      - Vercel: Use your .vercel.app URLs');
    console.log('      - Custom domains: Use your actual domain URLs');
    
    console.log('\n📖 Detailed setup instructions:');
    console.log('   - Environment setup: backend/docs/ENVIRONMENT_CONFIGURATION.md');
    console.log('   - Deployment guide: DEPLOYMENT_GUIDE.md');
    
    return false;
  }

  console.log('✅ Environment configuration is valid');
  return true;
}

/**
 * Main validation function
 * Validates environment and exits if critical errors found
 */
function validateAndExit() {
  const validation = validateEnvironment();
  const isValid = displayValidationResults(validation);

  if (!isValid) {
    console.log('\n🚫 Application cannot start with invalid environment configuration');
    process.exit(1);
  }

  // Log configuration summary (without sensitive data)
  console.log('\n📋 Environment Summary:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   Database: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`   API URL: ${process.env.API_URL}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`   CORS Origins: ${getCorsOrigins().join(', ')}`);
  console.log(`   Email User: ${process.env.EMAIL_USER}`);
  console.log(`   API Rate Limit: ${process.env.API_RATE_LIMIT}/hour`);
  console.log(`   Hospital API Key Prefix: ${process.env.HOSPITAL_API_KEY_PREFIX}`);
  if (process.env.API_BASE_URL) {
    console.log(`   API Base URL: ${process.env.API_BASE_URL}`);
  }
  if (process.env.HEALTH_CHECK_URL) {
    console.log(`   Health Check URL: ${process.env.HEALTH_CHECK_URL}`);
  }
  console.log('');
}

/**
 * Gets configured CORS origins with fallback logic
 * @returns {string[]} Array of CORS origins
 */
function getCorsOrigins() {
  const corsValidation = validateCorsOrigins(process.env.CORS_ORIGINS);
  return corsValidation.origins;
}

/**
 * Provides CORS configuration recommendations based on environment
 * @returns {object} CORS configuration recommendations
 */
function getCorsRecommendations() {
  const recommendations = {
    development: [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:3000'
    ],
    production: [
      'https://your-frontend.vercel.app',
      'https://your-domain.com',
      'https://www.your-domain.com'
    ]
  };

  const currentEnv = process.env.NODE_ENV || 'development';
  return {
    environment: currentEnv,
    recommended: recommendations[currentEnv] || recommendations.development,
    example: recommendations[currentEnv]?.join(',') || recommendations.development.join(',')
  };
}

module.exports = {
  validateEnvironment,
  validateAndExit,
  generateJWTSecret,
  validateCorsOrigins,
  getCorsOrigins,
  getCorsRecommendations,
  validateUrlFormat,
  validateMongoUri,
  validateVariable,
  REQUIRED_VARS,
  OPTIONAL_VARS,
  VALIDATION_RULES
};