#!/usr/bin/env node

/**
 * Render Deployment Script
 * Helps prepare and deploy the backend to Render
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🚀 Healthcare Platform - Render Deployment Setup\n');

/**
 * Generates environment variables for Render
 */
function generateRenderEnvVars() {
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('📋 Environment Variables for Render:');
  console.log('=====================================\n');
  
  const envVars = [
    { name: 'NODE_ENV', value: 'production', required: true },
    { name: 'PORT', value: '3000', required: true },
    { name: 'MONGODB_URI', value: 'mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform', required: true, note: 'Replace with your MongoDB Atlas URI' },
    { name: 'JWT_SECRET', value: jwtSecret, required: true, note: 'Generated secure secret' },
    { name: 'JWT_EXPIRES_IN', value: '24h', required: true },
    { name: 'FRONTEND_URL', value: 'https://your-frontend.vercel.app', required: true, note: 'Replace with your frontend URL' },
    { name: 'EMAIL_USER', value: 'your-email@gmail.com', required: true, note: 'Your Gmail address' },
    { name: 'EMAIL_PASSWORD', value: 'your-app-password', required: true, note: 'Gmail App Password (16 chars)' },
    { name: 'API_RATE_LIMIT', value: '100', required: false },
    { name: 'HOSPITAL_API_KEY_PREFIX', value: 'HK_', required: false },
    { name: 'HOSPITAL_API_SECRET_LENGTH', value: '64', required: false },
    { name: 'PAYMENT_TIMEOUT_MINUTES', value: '10', required: false },
    { name: 'PAYMENT_POLL_INTERVAL_SECONDS', value: '5', required: false },
    { name: 'PAYMENT_MAX_RETRIES', value: '3', required: false }
  ];

  envVars.forEach((env, index) => {
    console.log(`${index + 1}. ${env.name}`);
    console.log(`   Value: ${env.value}`);
    if (env.note) {
      console.log(`   Note: ${env.note}`);
    }
    console.log(`   Required: ${env.required ? 'Yes' : 'No'}`);
    console.log('');
  });

  return envVars;
}

/**
 * Creates a deployment checklist
 */
function createDeploymentChecklist() {
  console.log('✅ Render Deployment Checklist:');
  console.log('===============================\n');
  
  const checklist = [
    'Create new Web Service on Render',
    'Connect your GitHub repository',
    'Set Root Directory to "backend"',
    'Set Build Command to "npm install"',
    'Set Start Command to "npm start"',
    'Add all environment variables above',
    'Deploy the service',
    'Wait for deployment to complete (5-10 minutes)',
    'Test the health endpoint: https://your-app.onrender.com/api/health',
    'Update frontend environment with backend URL',
    'Update FRONTEND_URL environment variable with frontend URL',
    'Redeploy to apply CORS changes'
  ];

  checklist.forEach((item, index) => {
    console.log(`${index + 1}. ${item}`);
  });
  
  console.log('\n');
}

/**
 * Validates deployment readiness
 */
function validateDeploymentReadiness() {
  console.log('🔍 Deployment Readiness Check:');
  console.log('==============================\n');
  
  const checks = [
    {
      name: 'Package.json exists',
      check: () => fs.existsSync(path.join(__dirname, '..', 'package.json')),
      fix: 'Ensure you are in the backend directory'
    },
    {
      name: 'Server.js exists',
      check: () => fs.existsSync(path.join(__dirname, '..', 'server.js')),
      fix: 'Ensure server.js is in the backend directory'
    },
    {
      name: 'Dependencies installed',
      check: () => fs.existsSync(path.join(__dirname, '..', 'node_modules')),
      fix: 'Run: npm install'
    },
    {
      name: 'Environment validation utility exists',
      check: () => fs.existsSync(path.join(__dirname, '..', 'utils', 'validateEnv.js')),
      fix: 'Ensure utils/validateEnv.js exists'
    }
  ];

  let allPassed = true;
  
  checks.forEach(check => {
    const passed = check.check();
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    if (!passed) {
      console.log(`   Fix: ${check.fix}`);
      allPassed = false;
    }
  });
  
  console.log('');
  
  if (allPassed) {
    console.log('🎉 All checks passed! Ready for deployment.\n');
  } else {
    console.log('⚠️  Please fix the issues above before deploying.\n');
  }
  
  return allPassed;
}

/**
 * Creates render.yaml configuration
 */
function createRenderConfig() {
  const renderConfig = `services:
  - type: web
    name: healthcare-platform-backend
    env: node
    region: oregon
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      # Add other environment variables manually in Render dashboard
`;

  const configPath = path.join(__dirname, '..', '..', 'render.yaml');
  fs.writeFileSync(configPath, renderConfig);
  
  console.log(`📄 Created render.yaml configuration at: ${configPath}\n`);
}

/**
 * Main deployment function
 */
function main() {
  // Validate readiness
  const isReady = validateDeploymentReadiness();
  
  if (!isReady) {
    console.log('🚫 Deployment not ready. Please fix the issues above.');
    process.exit(1);
  }
  
  // Generate environment variables
  const envVars = generateRenderEnvVars();
  
  // Create deployment checklist
  createDeploymentChecklist();
  
  // Create render config
  createRenderConfig();
  
  console.log('🎯 Quick Setup Instructions:');
  console.log('============================\n');
  console.log('1. Go to https://render.com and create account');
  console.log('2. Click "New +" → "Web Service"');
  console.log('3. Connect your GitHub repository');
  console.log('4. Configure:');
  console.log('   - Root Directory: backend');
  console.log('   - Build Command: npm install');
  console.log('   - Start Command: npm start');
  console.log('5. Add environment variables from the list above');
  console.log('6. Click "Deploy Web Service"');
  console.log('7. Wait for deployment (5-10 minutes)');
  console.log('8. Test: https://your-app.onrender.com/api/health\n');
  
  console.log('📚 For detailed instructions, see:');
  console.log('   - backend/docs/DEPLOYMENT_ENV_GUIDE.md');
  console.log('   - backend/docs/HOSPITAL_DEPLOYMENT_CHECKLIST.md\n');
  
  console.log('🎉 Render deployment setup complete!');
}

// Run the script
main();