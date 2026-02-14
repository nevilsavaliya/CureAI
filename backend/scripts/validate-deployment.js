#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates deployment readiness and tests deployed endpoints
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

console.log('🔍 Healthcare Platform - Deployment Validation\n');

/**
 * Makes HTTP request to test endpoint
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Tests health endpoint
 */
async function testHealthEndpoint(baseUrl) {
  console.log('🏥 Testing health endpoint...');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/health`);
    
    if (response.statusCode === 200) {
      const body = JSON.parse(response.body);
      console.log('✅ Health endpoint working');
      console.log(`   Status: ${body.status}`);
      console.log(`   Message: ${body.message}`);
      return true;
    } else {
      console.log(`❌ Health endpoint failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Health endpoint error: ${error.message}`);
    return false;
  }
}

/**
 * Tests API documentation endpoint
 */
async function testApiDocsEndpoint(baseUrl) {
  console.log('📚 Testing API documentation...');
  
  try {
    const response = await makeRequest(`${baseUrl}/api-docs.json`);
    
    if (response.statusCode === 200) {
      const swagger = JSON.parse(response.body);
      console.log('✅ API documentation available');
      console.log(`   Title: ${swagger.info?.title || 'Unknown'}`);
      console.log(`   Version: ${swagger.info?.version || 'Unknown'}`);
      return true;
    } else {
      console.log(`❌ API documentation failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ API documentation error: ${error.message}`);
    return false;
  }
}

/**
 * Tests hospital endpoints
 */
async function testHospitalEndpoints(baseUrl) {
  console.log('🏥 Testing hospital endpoints...');
  
  const tests = [
    {
      name: 'Hospital registration endpoint',
      url: `${baseUrl}/api/hospitals/register`,
      method: 'POST',
      expectedStatus: 400, // Should fail without data
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Hospital login endpoint',
      url: `${baseUrl}/api/hospitals/login`,
      method: 'POST',
      expectedStatus: 400, // Should fail without credentials
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Admin hospitals endpoint',
      url: `${baseUrl}/api/admin/hospitals`,
      method: 'GET',
      expectedStatus: 401 // Should fail without auth
    }
  ];

  let passed = 0;
  
  for (const test of tests) {
    try {
      const response = await makeRequest(test.url, {
        method: test.method,
        body: test.body,
        headers: test.headers
      });
      
      if (response.statusCode === test.expectedStatus) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: Expected ${test.expectedStatus}, got ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  return passed === tests.length;
}

/**
 * Tests CORS configuration
 */
async function testCorsConfiguration(baseUrl, frontendUrl) {
  console.log('🌐 Testing CORS configuration...');
  
  if (!frontendUrl) {
    console.log('⚠️  Frontend URL not provided, skipping CORS test');
    return true;
  }
  
  try {
    const response = await makeRequest(`${baseUrl}/api/health`, {
      headers: {
        'Origin': frontendUrl,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    
    if (corsHeader === frontendUrl || corsHeader === '*') {
      console.log('✅ CORS configuration working');
      console.log(`   Allowed origin: ${corsHeader}`);
      return true;
    } else {
      console.log(`❌ CORS configuration issue`);
      console.log(`   Expected: ${frontendUrl}`);
      console.log(`   Got: ${corsHeader || 'none'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ CORS test error: ${error.message}`);
    return false;
  }
}

/**
 * Validates environment configuration
 */
function validateEnvironmentConfig() {
  console.log('🔧 Validating environment configuration...');
  
  try {
    const { validateEnvironment } = require('../utils/validateEnv');
    const validation = validateEnvironment();
    
    if (validation.errors.length === 0) {
      console.log('✅ Environment configuration valid');
      if (validation.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        validation.warnings.forEach(warning => {
          console.log(`   ${warning}`);
        });
      }
      return true;
    } else {
      console.log('❌ Environment configuration errors:');
      validation.errors.forEach(error => {
        console.log(`   ${error}`);
      });
      return false;
    }
  } catch (error) {
    console.log(`❌ Environment validation error: ${error.message}`);
    return false;
  }
}

/**
 * Checks database connectivity
 */
async function testDatabaseConnection() {
  console.log('🗄️  Testing database connection...');
  
  try {
    const mongoose = require('mongoose');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections found: ${collections.length}`);
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Validates deployment files
 */
function validateDeploymentFiles() {
  console.log('📄 Validating deployment files...');
  
  const files = [
    { path: 'package.json', required: true },
    { path: 'server.js', required: true },
    { path: 'Procfile', required: false, note: 'Required for Heroku' },
    { path: '../Dockerfile', required: false, note: 'Required for Docker' },
    { path: '../render.yaml', required: false, note: 'Required for Render' },
    { path: '../vercel.json', required: false, note: 'Required for Vercel' }
  ];
  
  let allRequired = true;
  
  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file.path);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      console.log(`✅ ${file.path}`);
    } else if (file.required) {
      console.log(`❌ ${file.path} (required)`);
      allRequired = false;
    } else {
      console.log(`⚠️  ${file.path} (${file.note})`);
    }
  });
  
  return allRequired;
}

/**
 * Main validation function
 */
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0];
  const frontendUrl = args[1];
  
  if (!baseUrl) {
    console.log('❌ Please provide the backend URL to test:');
    console.log('   node scripts/validate-deployment.js https://your-app.herokuapp.com');
    console.log('   node scripts/validate-deployment.js https://your-app.herokuapp.com https://your-frontend.vercel.app');
    process.exit(1);
  }
  
  console.log(`🎯 Testing deployment: ${baseUrl}\n`);
  
  const results = {
    envConfig: false,
    deploymentFiles: false,
    databaseConnection: false,
    healthEndpoint: false,
    apiDocs: false,
    hospitalEndpoints: false,
    corsConfig: false
  };
  
  // Run all tests
  results.envConfig = validateEnvironmentConfig();
  console.log('');
  
  results.deploymentFiles = validateDeploymentFiles();
  console.log('');
  
  if (process.env.MONGODB_URI) {
    results.databaseConnection = await testDatabaseConnection();
    console.log('');
  }
  
  results.healthEndpoint = await testHealthEndpoint(baseUrl);
  console.log('');
  
  results.apiDocs = await testApiDocsEndpoint(baseUrl);
  console.log('');
  
  results.hospitalEndpoints = await testHospitalEndpoints(baseUrl);
  console.log('');
  
  results.corsConfig = await testCorsConfiguration(baseUrl, frontendUrl);
  console.log('');
  
  // Summary
  console.log('📊 Validation Summary:');
  console.log('=====================\n');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅' : '❌';
    const name = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} ${name}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Deployment is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.');
    
    console.log('\n💡 Common fixes:');
    console.log('1. Check environment variables are set correctly');
    console.log('2. Ensure database is accessible');
    console.log('3. Verify CORS configuration includes frontend URL');
    console.log('4. Check that all required files are present');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the validation
main();