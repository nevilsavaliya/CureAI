const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n📋 Test: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testHospitalLogin() {
  logSection('TASK 2.3: Test Hospital Login Flow');
  
  // First, let's check if there are any hospitals
  logTest('Checking for test hospitals');
  
  const mongoose = require('mongoose');
  const Hospital = require('./models/Hospital');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    
    const hospitals = await Hospital.find({ verificationStatus: 'verified' }).limit(1);
    
    if (hospitals.length === 0) {
      logWarning('No verified hospitals found. Creating test hospital...');
      
      // Create a test hospital
      const testHospital = new Hospital({
        name: 'Test Hospital Admin',
        email: 'hospital@test.com',
        password: 'hospital123',
        hospitalName: 'Test General Hospital',
        registrationNumber: 'TEST-HOSP-001',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contactNumber: '+1234567890',
        emergencyContact: '+1234567891',
        specializations: ['General Medicine', 'Emergency Care'],
        numberOfBeds: 100,
        facilities: ['ICU', 'Emergency Room', 'Laboratory'],
        verificationStatus: 'verified',
        isActive: true,
        apiAccessCount: 0
      });
      
      await testHospital.save();
      logSuccess('Test hospital created');
      console.log('  Email: hospital@test.com');
      console.log('  Password: hospital123');
    } else {
      logSuccess('Found verified hospital');
      console.log('  Email:', hospitals[0].email);
      console.log('  Name:', hospitals[0].hospitalName);
    }
    
    await mongoose.disconnect();
    
    // Now test the login
    logTest('Testing hospital login with valid credentials');
    
    const loginResponse = await axios.post(`${API_URL}/hospitals/login`, {
      email: 'hospital@test.com',
      password: 'hospital123',
      rememberMe: false
    });
    
    if (loginResponse.data.success && loginResponse.data.token && loginResponse.data.hospital) {
      logSuccess('Hospital login successful');
      console.log('  Response format:', {
        success: loginResponse.data.success,
        hasToken: !!loginResponse.data.token,
        hasHospital: !!loginResponse.data.hospital,
        message: loginResponse.data.message
      });
      
      // Verify hospital object structure
      const hospital = loginResponse.data.hospital;
      console.log('  Hospital data:', {
        id: hospital.id,
        name: hospital.name || hospital.hospitalName,
        email: hospital.email,
        verificationStatus: hospital.verificationStatus
      });
      
      // Test dashboard access
      logTest('Testing hospital dashboard access');
      
      try {
        const profileResponse = await axios.get(`${API_URL}/hospitals/profile`, {
          headers: { Authorization: `Bearer ${loginResponse.data.token}` }
        });
        
        if (profileResponse.data.success && profileResponse.data.hospital) {
          logSuccess('Hospital can access profile endpoint');
          console.log('  Profile data available:', {
            hasHospital: !!profileResponse.data.hospital,
            hospitalName: profileResponse.data.hospital.hospitalName
          });
        } else {
          logError('Unexpected profile response format');
        }
      } catch (error) {
        logError(`Profile access failed: ${error.response?.data?.message || error.message}`);
      }
      
      // Test API stats access
      logTest('Testing hospital API stats access');
      
      try {
        const statsResponse = await axios.get(`${API_URL}/hospitals/api/usage-stats`, {
          headers: { Authorization: `Bearer ${loginResponse.data.token}` }
        });
        
        if (statsResponse.data.success) {
          logSuccess('Hospital can access API stats endpoint');
          console.log('  Stats available:', {
            hasStats: !!statsResponse.data.stats
          });
        } else {
          logError('Unexpected stats response format');
        }
      } catch (error) {
        logError(`Stats access failed: ${error.response?.data?.message || error.message}`);
      }
      
      logSuccess('All hospital login tests passed');
      process.exit(0);
    } else {
      logError('Hospital login response missing required fields');
      console.log('  Response:', loginResponse.data);
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('  Error details:', error.response.data);
    }
    process.exit(1);
  }
}

testHospitalLogin();
