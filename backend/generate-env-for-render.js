#!/usr/bin/env node

/**
 * Generate Environment Variables for Render
 * 
 * This script helps you prepare environment variables for Render deployment
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

async function generateEnvForRender() {
  console.log('\n🚀 Generate Environment Variables for Render\n');
  console.log('This will help you create the environment variables needed for deployment.\n');

  // Generate JWT Secret
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  console.log('✅ Generated JWT_SECRET:', jwtSecret);
  console.log('');

  // Ask for MongoDB URI
  const mongoUri = await question('Enter your MongoDB Atlas connection string\n(or press Enter to use placeholder): ');
  const finalMongoUri = mongoUri.trim() || 'mongodb+srv://USER:PASS@CLUSTER.mongodb.net/healthcare-platform';

  // Ask for Frontend URL
  const frontendUrl = await question('\nEnter your frontend URL\n(or press Enter to use placeholder): ');
  const finalFrontendUrl = frontendUrl.trim() || 'https://your-frontend.vercel.app';

  // Generate output
  console.log('\n\n📋 Copy these environment variables to Render:\n');
  console.log('═'.repeat(60));
  console.log('');
  console.log(`NODE_ENV=production`);
  console.log(`PORT=3000`);
  console.log(`MONGODB_URI=${finalMongoUri}`);
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_EXPIRES_IN=24h`);
  console.log(`FRONTEND_URL=${finalFrontendUrl}`);
  console.log('');
  console.log('═'.repeat(60));
  console.log('');
  console.log('✅ These are the MINIMUM required variables.');
  console.log('');
  console.log('📝 Optional variables (add later if needed):');
  console.log('   - EMAIL_USER and EMAIL_PASSWORD (for email notifications)');
  console.log('   - RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (for payments)');
  console.log('   - KOTAK_* variables (for Kotak UPI payments)');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   1. Go to Render → Your Web Service → Environment');
  console.log('   2. Click "Add Environment Variable"');
  console.log('   3. Add each variable above');
  console.log('   4. Click "Deploy"');
  console.log('');

  rl.close();
}

generateEnvForRender().catch(console.error);
