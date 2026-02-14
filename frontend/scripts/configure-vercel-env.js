#!/usr/bin/env node

/**
 * Configure Vercel Environment Variables
 * 
 * This script helps you configure environment variables for Vercel deployment
 * with comprehensive validation and setup.
 */

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function validateUrl(url) {
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
}

function setVercelEnv(key, value, environment = 'production') {
  try {
    const command = `vercel env add ${key} ${environment}`;
    execSync(command, { 
      input: value + '\n',
      stdio: ['pipe', 'inherit', 'inherit']
    });
    return true;
  } catch (error) {
    console.log(`❌ Failed to set ${key}: ${error.message}`);
    return false;
  }
}

async function configureVercelEnv() {
  console.log('\n🚀 Configure Vercel Environment Variables\n');
  console.log('This script will help you configure environment variables');
  console.log('for deploying the healthcare platform frontend to Vercel.\n');

  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('❌ Vercel CLI is not installed.');
    console.log('Install it with: npm install -g vercel');
    console.log('Then run: vercel login');
    process.exit(1);
  }

  // Get backend URL
  let backendUrl;
  do {
    backendUrl = await question('Enter your backend URL\n(e.g., https://your-backend.onrender.com): ');
    if (!backendUrl.trim()) {
      console.log('❌ Backend URL is required.');
    } else if (!validateUrl(backendUrl)) {
      console.log('❌ Invalid URL format. Must be a valid HTTPS URL.');
      backendUrl = '';
    }
  } while (!backendUrl.trim());

  // Remove trailing slash and /api if present
  backendUrl = backendUrl.trim().replace(/\/$/, '').replace(/\/api$/, '');
  
  const apiUrl = `${backendUrl}/api`;
  const socketUrl = backendUrl;

  console.log(`\n✅ Backend URLs configured:`);
  console.log(`   API URL: ${apiUrl}`);
  console.log(`   Socket URL: ${socketUrl}\n`);

  // Get frontend URL (optional)
  const frontendUrl = await question('Enter your frontend URL (optional, Vercel will auto-detect)\n(e.g., https://your-app.vercel.app): ');
  
  // Optional features
  const enableAnalytics = await question('\nEnable analytics tracking? (y/N): ');
  const enableErrorReporting = await question('Enable error reporting? (y/N): ');
  const enablePerformanceMonitoring = await question('Enable performance monitoring? (y/N): ');

  // Optional third-party integrations
  const gaId = enableAnalytics.toLowerCase() === 'y' ? 
    await question('Enter Google Analytics ID (optional): ') : '';
  
  const sentryDsn = enableErrorReporting.toLowerCase() === 'y' ? 
    await question('Enter Sentry DSN (optional): ') : '';

  // Prepare environment variables
  const envVars = {
    'NODE_ENV': 'production',
    'NG_BUILD_ENV': 'production',
    'NEXT_PUBLIC_API_URL': apiUrl,
    'NEXT_PUBLIC_SOCKET_URL': socketUrl,
    'NG_BUILD_OPTIMIZATION': 'true',
    'NG_BUILD_SOURCE_MAP': 'false',
    'NG_BUILD_CACHE': 'true',
    'NEXT_PUBLIC_ENABLE_ANALYTICS': enableAnalytics.toLowerCase() === 'y' ? 'true' : 'false',
    'NEXT_PUBLIC_ENABLE_ERROR_REPORTING': enableErrorReporting.toLowerCase() === 'y' ? 'true' : 'false',
    'NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING': enablePerformanceMonitoring.toLowerCase() === 'y' ? 'true' : 'false',
    'NEXT_PUBLIC_DEBUG_MODE': 'false',
    'CSP_ENABLED': 'true',
    'HTTPS_REDIRECT': 'true',
    'SECURITY_HEADERS_ENABLED': 'true'
  };

  // Add optional variables
  if (frontendUrl.trim() && validateUrl(frontendUrl)) {
    envVars['NEXT_PUBLIC_FRONTEND_URL'] = frontendUrl.trim();
  }

  if (gaId.trim()) {
    envVars['NEXT_PUBLIC_GA_ID'] = gaId.trim();
  }

  if (sentryDsn.trim()) {
    envVars['NEXT_PUBLIC_SENTRY_DSN'] = sentryDsn.trim();
  }

  // Display configuration
  console.log('\n\n📋 VERCEL ENVIRONMENT VARIABLES\n');
  console.log('═'.repeat(80));
  console.log('\n🔥 Environment Variables to be set:\n');

  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  console.log('\n');
  console.log('═'.repeat(80));

  // Confirm before setting
  const confirm = await question('\nDo you want to set these environment variables in Vercel? (y/N): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Configuration cancelled.');
    console.log('You can manually add these variables in your Vercel dashboard.');
    rl.close();
    return;
  }

  // Set environment variables
  console.log('\n🚀 Setting environment variables in Vercel...\n');

  let successCount = 0;
  let totalCount = Object.keys(envVars).length;

  for (const [key, value] of Object.entries(envVars)) {
    console.log(`Setting ${key}...`);
    if (setVercelEnv(key, value)) {
      successCount++;
      console.log(`✅ ${key} set successfully`);
    }
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log(`\n📊 Configuration Summary:`);
  console.log(`   ✅ Successfully set: ${successCount}/${totalCount} variables`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All environment variables configured successfully!');
  } else {
    console.log(`\n⚠️  ${totalCount - successCount} variables failed to set.`);
    console.log('Please check the errors above and set them manually in Vercel dashboard.');
  }

  console.log('\n🎯 Next Steps:');
  console.log('   1. Run "vercel --prod" to deploy with new configuration');
  console.log('   2. Test your application endpoints after deployment');
  console.log('   3. Verify API connections are working correctly');
  console.log('   4. Check browser console for any configuration errors');
  console.log('');
  console.log('🔗 Your frontend will be available at your Vercel deployment URL');
  console.log('📚 Vercel Dashboard: https://vercel.com/dashboard');
  console.log('');

  rl.close();
}

// Handle script execution
if (require.main === module) {
  configureVercelEnv().catch(error => {
    console.error('\n❌ Error configuring environment variables:', error.message);
    process.exit(1);
  });
}

module.exports = { configureVercelEnv, validateUrl, setVercelEnv };