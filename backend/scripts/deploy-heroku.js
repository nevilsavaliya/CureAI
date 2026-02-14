#!/usr/bin/env node

/**
 * Heroku Deployment Script
 * Helps prepare and deploy the backend to Heroku
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🚀 Healthcare Platform - Heroku Deployment Setup\n');

/**
 * Checks if Heroku CLI is installed
 */
function checkHerokuCLI() {
  try {
    execSync('heroku --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Creates Heroku app and configures environment
 */
function setupHerokuApp(appName) {
  console.log(`🏗️  Setting up Heroku app: ${appName}\n`);
  
  try {
    // Create app
    console.log('Creating Heroku app...');
    execSync(`heroku create ${appName}`, { stdio: 'inherit' });
    
    // Set buildpack
    console.log('Setting Node.js buildpack...');
    execSync(`heroku buildpacks:set heroku/nodejs -a ${appName}`, { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create Heroku app:', error.message);
    return false;
  }
}

/**
 * Sets environment variables on Heroku
 */
function setHerokuEnvVars(appName) {
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('🔧 Setting environment variables...\n');
  
  const envVars = [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'JWT_SECRET', value: jwtSecret },
    { key: 'JWT_EXPIRES_IN', value: '24h' },
    { key: 'API_RATE_LIMIT', value: '100' },
    { key: 'HOSPITAL_API_KEY_PREFIX', value: 'HK_' },
    { key: 'HOSPITAL_API_SECRET_LENGTH', value: '64' },
    { key: 'PAYMENT_TIMEOUT_MINUTES', value: '10' },
    { key: 'PAYMENT_POLL_INTERVAL_SECONDS', value: '5' },
    { key: 'PAYMENT_MAX_RETRIES', value: '3' }
  ];

  try {
    envVars.forEach(env => {
      console.log(`Setting ${env.key}...`);
      execSync(`heroku config:set ${env.key}="${env.value}" -a ${appName}`, { stdio: 'pipe' });
    });
    
    console.log('\n✅ Environment variables set successfully!\n');
    
    // Show manual variables that need to be set
    console.log('⚠️  Please set these variables manually:');
    console.log('=====================================\n');
    console.log(`heroku config:set MONGODB_URI="your_mongodb_atlas_uri" -a ${appName}`);
    console.log(`heroku config:set FRONTEND_URL="https://your-frontend.vercel.app" -a ${appName}`);
    console.log(`heroku config:set EMAIL_USER="your-email@gmail.com" -a ${appName}`);
    console.log(`heroku config:set EMAIL_PASSWORD="your-gmail-app-password" -a ${appName}`);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to set environment variables:', error.message);
    return false;
  }
}

/**
 * Creates Procfile for Heroku
 */
function createProcfile() {
  const procfileContent = 'web: node server.js\n';
  const procfilePath = path.join(__dirname, '..', 'Procfile');
  
  fs.writeFileSync(procfilePath, procfileContent);
  console.log(`📄 Created Procfile at: ${procfilePath}\n`);
}

/**
 * Deploys to Heroku
 */
function deployToHeroku(appName) {
  console.log('🚀 Deploying to Heroku...\n');
  
  try {
    // Add Heroku remote
    execSync(`heroku git:remote -a ${appName}`, { stdio: 'inherit' });
    
    // Deploy
    console.log('Pushing to Heroku...');
    execSync('git subtree push --prefix=backend heroku main', { stdio: 'inherit' });
    
    console.log('\n✅ Deployment successful!\n');
    
    // Show app URL
    const appUrl = `https://${appName}.herokuapp.com`;
    console.log(`🌐 Your app is available at: ${appUrl}`);
    console.log(`🔍 Test health endpoint: ${appUrl}/api/health\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure you have committed your changes');
    console.log('2. Ensure you are in the project root directory');
    console.log('3. Check that all environment variables are set');
    console.log('4. Verify MongoDB URI is accessible from Heroku\n');
    return false;
  }
}

/**
 * Main deployment function
 */
function main() {
  const args = process.argv.slice(2);
  const appName = args[0];
  
  if (!appName) {
    console.log('❌ Please provide an app name:');
    console.log('   node scripts/deploy-heroku.js my-healthcare-app\n');
    process.exit(1);
  }
  
  // Check Heroku CLI
  if (!checkHerokuCLI()) {
    console.log('❌ Heroku CLI not found. Please install it first:');
    console.log('   https://devcenter.heroku.com/articles/heroku-cli\n');
    process.exit(1);
  }
  
  console.log('✅ Heroku CLI found\n');
  
  // Create Procfile
  createProcfile();
  
  // Setup Heroku app
  if (!setupHerokuApp(appName)) {
    process.exit(1);
  }
  
  // Set environment variables
  if (!setHerokuEnvVars(appName)) {
    process.exit(1);
  }
  
  console.log('🎯 Next Steps:');
  console.log('==============\n');
  console.log('1. Set the manual environment variables shown above');
  console.log('2. Commit your changes: git add . && git commit -m "Add Heroku config"');
  console.log(`3. Deploy: git subtree push --prefix=backend heroku main`);
  console.log(`4. Test: https://${appName}.herokuapp.com/api/health\n`);
  
  console.log('🎉 Heroku setup complete!');
}

// Run the script
main();