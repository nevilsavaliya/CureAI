#!/usr/bin/env node

/**
 * Generate Environment Variables for Render Deployment
 * 
 * This script helps you prepare environment variables for Render deployment
 * with comprehensive configuration and validation.
 */

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function validateUrl(url) {
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
}

async function generateEnvForRender() {
  console.log('\n🚀 Generate Environment Variables for Render Deployment\n');
  console.log('This script will help you create all necessary environment variables');
  console.log('for deploying the healthcare platform backend to Render.\n');

  // Generate secure keys
  const jwtSecret = generateSecureKey(32);
  const encryptionKey = generateSecureKey(32);
  
  console.log('✅ Generated secure keys:');
  console.log(`   JWT_SECRET: ${jwtSecret}`);
  console.log(`   ENCRYPTION_MASTER_KEY: ${encryptionKey}\n`);

  // Get Render service name
  const serviceName = await question('Enter your Render service name\n(e.g., healthcare-backend): ');
  const renderServiceName = serviceName.trim() || 'healthcare-backend';
  
  // Generate Render URLs
  const apiBaseUrl = `https://${renderServiceName}.onrender.com`;
  const apiUrl = `${apiBaseUrl}/api`;
  const socketUrl = apiBaseUrl;
  const healthCheckUrl = `${apiBaseUrl}/api/health`;

  console.log(`\n✅ Generated Render URLs for service "${renderServiceName}":`);
  console.log(`   API_BASE_URL: ${apiBaseUrl}`);
  console.log(`   API_URL: ${apiUrl}`);
  console.log(`   SOCKET_URL: ${socketUrl}`);
  console.log(`   HEALTH_CHECK_URL: ${healthCheckUrl}\n`);

  // Get MongoDB URI
  let mongoUri;
  do {
    mongoUri = await question('Enter your MongoDB Atlas connection string\n(mongodb+srv://...): ');
    if (!mongoUri.trim()) {
      console.log('❌ MongoDB URI is required for production deployment.');
    } else if (!mongoUri.startsWith('mongodb')) {
      console.log('❌ Invalid MongoDB URI format. Should start with mongodb:// or mongodb+srv://');
      mongoUri = '';
    }
  } while (!mongoUri.trim());

  // Get Frontend URL
  let frontendUrl;
  do {
    frontendUrl = await question('\nEnter your frontend URL\n(e.g., https://your-app.vercel.app): ');
    if (!frontendUrl.trim()) {
      console.log('❌ Frontend URL is required for CORS configuration.');
    } else if (!validateUrl(frontendUrl)) {
      console.log('❌ Invalid URL format. Must be a valid HTTPS URL.');
      frontendUrl = '';
    }
  } while (!frontendUrl.trim());

  // Optional: MailerSend Email configuration
  console.log('\n📧 Email Configuration (MailerSend)');
  console.log('For email notifications, you need a MailerSend account.');
  console.log('Visit: https://www.mailersend.com/');
  const useMailerSend = await question('\nDo you want to configure MailerSend? (y/N): ');
  let mailersendApiKey = '', mailersendFromEmail = '', mailersendFromName = '';
  
  if (useMailerSend.toLowerCase() === 'y' || useMailerSend.toLowerCase() === 'yes') {
    mailersendApiKey = await question('Enter MailerSend API Key: ');
    mailersendFromEmail = await question('Enter sender email (must be verified in MailerSend): ');
    mailersendFromName = await question('Enter sender name (default: Healthcare Platform): ') || 'Healthcare Platform';
  }

  // Optional: Payment configuration
  const useRazorpay = await question('\nDo you want to configure Razorpay payments? (y/N): ');
  let razorpayKeyId = '', razorpayKeySecret = '', upiId = '';
  
  if (useRazorpay.toLowerCase() === 'y' || useRazorpay.toLowerCase() === 'yes') {
    razorpayKeyId = await question('Enter Razorpay Key ID: ');
    razorpayKeySecret = await question('Enter Razorpay Key Secret: ');
    upiId = await question('Enter UPI ID (e.g., 9909232769@superyes): ');
  }

  // Generate comprehensive output
  console.log('\n\n📋 RENDER ENVIRONMENT VARIABLES\n');
  console.log('═'.repeat(80));
  console.log('\n🔥 CRITICAL VARIABLES (Required for deployment):');
  console.log('');
  console.log(`NODE_ENV=production`);
  console.log(`PORT=10000`);
  console.log(`MONGODB_URI=${mongoUri.trim()}`);
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_EXPIRES_IN=24h`);
  console.log(`ENCRYPTION_MASTER_KEY=${encryptionKey}`);
  console.log('');
  console.log('🌐 URL CONFIGURATION:');
  console.log('');
  console.log(`API_BASE_URL=${apiBaseUrl}`);
  console.log(`API_URL=${apiUrl}`);
  console.log(`SOCKET_URL=${socketUrl}`);
  console.log(`HEALTH_CHECK_URL=${healthCheckUrl}`);
  console.log(`FRONTEND_URL=${frontendUrl.trim()}`);
  console.log(`CORS_ORIGINS=${frontendUrl.trim()}`);

  if (mailersendApiKey.trim()) {
    console.log('\n📧 EMAIL CONFIGURATION (MailerSend):');
    console.log('');
    console.log(`MAILERSEND_API_KEY=${mailersendApiKey.trim()}`);
    console.log(`MAILERSEND_FROM_EMAIL=${mailersendFromEmail.trim()}`);
    console.log(`MAILERSEND_FROM_NAME=${mailersendFromName.trim()}`);
  }

  if (razorpayKeyId.trim()) {
    console.log('\n💳 PAYMENT CONFIGURATION:');
    console.log('');
    console.log(`RAZORPAY_KEY_ID=${razorpayKeyId.trim()}`);
    console.log(`RAZORPAY_KEY_SECRET=${razorpayKeySecret.trim()}`);
    console.log(`UPI_ID=${upiId.trim()}`);
  }

  console.log('\n🏥 HOSPITAL FEATURE CONFIGURATION (Optional):');
  console.log('');
  console.log(`API_RATE_LIMIT=100`);
  console.log(`HOSPITAL_API_KEY_PREFIX=HK_`);
  console.log(`HOSPITAL_API_SECRET_LENGTH=64`);

  console.log('\n⏱️ PAYMENT TIMEOUT CONFIGURATION (Optional):');
  console.log('');
  console.log(`PAYMENT_TIMEOUT_MINUTES=10`);
  console.log(`PAYMENT_POLL_INTERVAL_SECONDS=5`);
  console.log(`PAYMENT_MAX_RETRIES=3`);

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('\n🎯 DEPLOYMENT STEPS:\n');
  console.log('1. Go to Render Dashboard → Your Web Service → Environment');
  console.log('2. Click "Add Environment Variable" for each variable above');
  console.log('3. Copy and paste each KEY=VALUE pair');
  console.log('4. Click "Deploy" to trigger deployment');
  console.log('5. Monitor build logs for any configuration errors');
  console.log('6. Test your API endpoints after deployment');
  console.log('');
  console.log('🔗 Your API will be available at:');
  console.log(`   ${apiUrl}`);
  console.log('');
  console.log('🏥 Health check endpoint:');
  console.log(`   ${healthCheckUrl}`);
  console.log('');
  console.log('⚠️  SECURITY REMINDERS:');
  console.log('   • Never commit these secrets to version control');
  console.log('   • Use strong, unique passwords for production');
  console.log('   • Regularly rotate API keys and secrets');
  console.log('   • Monitor access logs for suspicious activity');
  console.log('');
  console.log('📚 Additional Resources:');
  console.log('   • Render Docs: https://render.com/docs');
  console.log('   • Node.js on Render: https://render.com/docs/node-express-app');
  console.log('   • Environment Variables: https://render.com/docs/environment-variables');
  console.log('');

  rl.close();
}

// Handle script execution
if (require.main === module) {
  generateEnvForRender().catch(error => {
    console.error('\n❌ Error generating environment variables:', error.message);
    process.exit(1);
  });
}

module.exports = { generateEnvForRender, generateSecureKey, validateUrl };
