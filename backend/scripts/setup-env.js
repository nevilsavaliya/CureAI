#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps developers set up their environment configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE_PATH = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE_PATH = path.join(__dirname, '..', '.env.example');

/**
 * Prompts user for input
 * @param {string} question - Question to ask
 * @param {string} defaultValue - Default value if user presses enter
 * @returns {Promise<string>} User input
 */
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Generates a secure JWT secret
 * @returns {string} Generated secret
 */
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Checks if .env file exists
 * @returns {boolean} True if exists
 */
function envFileExists() {
  return fs.existsSync(ENV_FILE_PATH);
}

/**
 * Reads existing .env file
 * @returns {object} Environment variables
 */
function readExistingEnv() {
  if (!envFileExists()) return {};
  
  const content = fs.readFileSync(ENV_FILE_PATH, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

/**
 * Writes environment variables to .env file
 * @param {object} envVars - Environment variables
 */
function writeEnvFile(envVars) {
  const content = `# Healthcare Platform Environment Configuration
# Generated on ${new Date().toISOString()}

# Server Configuration
PORT=${envVars.PORT}
NODE_ENV=${envVars.NODE_ENV}

# Database Configuration
MONGODB_URI=${envVars.MONGODB_URI}

# JWT Configuration
JWT_SECRET=${envVars.JWT_SECRET}
JWT_EXPIRES_IN=${envVars.JWT_EXPIRES_IN}

# CORS Configuration
FRONTEND_URL=${envVars.FRONTEND_URL}

# Email Configuration (Gmail example - use App Password)
EMAIL_USER=${envVars.EMAIL_USER}
EMAIL_PASSWORD=${envVars.EMAIL_PASSWORD}

# Hospital Feature Configuration
API_RATE_LIMIT=${envVars.API_RATE_LIMIT}
HOSPITAL_API_KEY_PREFIX=${envVars.HOSPITAL_API_KEY_PREFIX}
HOSPITAL_API_SECRET_LENGTH=${envVars.HOSPITAL_API_SECRET_LENGTH}

# Payment Configuration
PAYMENT_TIMEOUT_MINUTES=${envVars.PAYMENT_TIMEOUT_MINUTES}
PAYMENT_POLL_INTERVAL_SECONDS=${envVars.PAYMENT_POLL_INTERVAL_SECONDS}
PAYMENT_MAX_RETRIES=${envVars.PAYMENT_MAX_RETRIES}
`;

  fs.writeFileSync(ENV_FILE_PATH, content);
}

/**
 * Main setup function
 */
async function setupEnvironment() {
  console.log('🚀 Healthcare Platform Environment Setup');
  console.log('=====================================\n');

  // Check if .env already exists
  const existingEnv = readExistingEnv();
  const hasExisting = Object.keys(existingEnv).length > 0;

  if (hasExisting) {
    console.log('📁 Found existing .env file');
    const overwrite = await askQuestion('Do you want to overwrite it? (y/N)', 'N');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('✅ Keeping existing configuration');
      rl.close();
      return;
    }
  }

  console.log('📝 Please provide the following configuration:\n');

  // Collect environment variables
  const envVars = {};

  // Server Configuration
  console.log('🖥️  Server Configuration:');
  envVars.PORT = await askQuestion('Port number', existingEnv.PORT || '3000');
  envVars.NODE_ENV = await askQuestion('Environment (development/production)', existingEnv.NODE_ENV || 'development');
  console.log('');

  // Database Configuration
  console.log('🗄️  Database Configuration:');
  envVars.MONGODB_URI = await askQuestion('MongoDB URI', existingEnv.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform');
  console.log('');

  // JWT Configuration
  console.log('🔐 JWT Configuration:');
  const generateNew = await askQuestion('Generate new JWT secret? (Y/n)', 'Y');
  if (generateNew.toLowerCase() !== 'n') {
    envVars.JWT_SECRET = generateJWTSecret();
    console.log(`Generated JWT secret: ${envVars.JWT_SECRET.substring(0, 16)}...`);
  } else {
    envVars.JWT_SECRET = await askQuestion('JWT Secret (32+ characters)', existingEnv.JWT_SECRET || '');
  }
  envVars.JWT_EXPIRES_IN = await askQuestion('JWT expiration time', existingEnv.JWT_EXPIRES_IN || '24h');
  console.log('');

  // CORS Configuration
  console.log('🌐 CORS Configuration:');
  envVars.FRONTEND_URL = await askQuestion('Frontend URL', existingEnv.FRONTEND_URL || 'http://localhost:4200');
  console.log('');

  // Email Configuration
  console.log('📧 Email Configuration:');
  console.log('   For Gmail, you need to:');
  console.log('   1. Enable 2-Factor Authentication');
  console.log('   2. Generate App Password: https://myaccount.google.com/apppasswords');
  envVars.EMAIL_USER = await askQuestion('Email address', existingEnv.EMAIL_USER || '');
  envVars.EMAIL_PASSWORD = await askQuestion('Email password (App Password for Gmail)', existingEnv.EMAIL_PASSWORD || '');
  console.log('');

  // Hospital Feature Configuration
  console.log('🏥 Hospital Feature Configuration:');
  envVars.API_RATE_LIMIT = await askQuestion('API rate limit (requests/hour)', existingEnv.API_RATE_LIMIT || '100');
  envVars.HOSPITAL_API_KEY_PREFIX = await askQuestion('Hospital API key prefix', existingEnv.HOSPITAL_API_KEY_PREFIX || 'HK_');
  envVars.HOSPITAL_API_SECRET_LENGTH = await askQuestion('API secret length (bytes)', existingEnv.HOSPITAL_API_SECRET_LENGTH || '64');
  console.log('');

  // Payment Configuration
  console.log('💳 Payment Configuration:');
  envVars.PAYMENT_TIMEOUT_MINUTES = await askQuestion('Payment timeout (minutes)', existingEnv.PAYMENT_TIMEOUT_MINUTES || '10');
  envVars.PAYMENT_POLL_INTERVAL_SECONDS = await askQuestion('Payment poll interval (seconds)', existingEnv.PAYMENT_POLL_INTERVAL_SECONDS || '5');
  envVars.PAYMENT_MAX_RETRIES = await askQuestion('Payment max retries', existingEnv.PAYMENT_MAX_RETRIES || '3');
  console.log('');

  // Write configuration
  console.log('💾 Writing configuration to .env file...');
  writeEnvFile(envVars);

  console.log('✅ Environment setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Review the generated .env file');
  console.log('   2. Start MongoDB if using local database');
  console.log('   3. Run: npm start');
  console.log('\n📖 For more information, see: backend/docs/ENVIRONMENT_CONFIGURATION.md');

  rl.close();
}

/**
 * Validates current environment
 */
async function validateCurrentEnv() {
  console.log('🔍 Validating current environment...\n');
  
  const { validateEnvironment } = require('../utils/validateEnv');
  const validation = validateEnvironment();
  
  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }
  
  if (validation.errors.length > 0) {
    console.log('❌ Errors:');
    validation.errors.forEach(error => console.log(`   ${error}`));
    console.log('\n🔧 Run setup to fix these issues');
  } else {
    console.log('✅ Environment configuration is valid');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate') || args.includes('-v')) {
    await validateCurrentEnv();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('Healthcare Platform Environment Setup');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/setup-env.js          Setup environment interactively');
    console.log('  node scripts/setup-env.js -v       Validate current environment');
    console.log('  node scripts/setup-env.js -h       Show this help');
    console.log('');
  } else {
    await setupEnvironment();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled');
  rl.close();
  process.exit(0);
});

main().catch(console.error);