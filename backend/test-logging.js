/**
 * Test script to verify logging system functionality
 */

const logger = require('./services/logger');

async function testLogging() {
  console.log('🧪 Testing Hospital Logging System\n');

  // Test basic logging
  console.log('1. Testing basic log levels...');
  logger.info('Test info message');
  logger.warn('Test warning message');
  logger.error('Test error message');
  logger.debug('Test debug message');

  // Test hospital-specific logging
  console.log('2. Testing hospital-specific logging...');
  
  logger.hospital.registration({
    hospitalName: 'Test Hospital',
    email: 'test@hospital.com',
    registrationNumber: 'TEST123',
    documentsCount: 3,
    ip: '192.168.1.100',
    userAgent: 'Test User Agent'
  });

  logger.hospital.login({
    hospitalId: 'test-hospital-id',
    hospitalName: 'Test Hospital',
    email: 'test@hospital.com',
    success: true,
    reason: 'Login successful',
    ip: '192.168.1.100',
    userAgent: 'Test User Agent'
  });

  logger.hospital.apiAccess({
    hospitalId: 'test-hospital-id',
    hospitalName: 'Test Hospital',
    patientId: 'test-patient-id',
    patientEmail: 'patient@test.com',
    endpoint: '/api/hospitals/api/patient-data',
    method: 'POST',
    success: true,
    responseTime: 250,
    ip: '192.168.1.100',
    userAgent: 'Test User Agent'
  });

  logger.hospital.verification({
    hospitalId: 'test-hospital-id',
    hospitalName: 'Test Hospital',
    action: 'verified',
    adminId: 'test-admin-id',
    adminEmail: 'admin@test.com',
    ip: '192.168.1.100'
  });

  // Test security logging
  console.log('3. Testing security logging...');
  
  logger.security.invalidApiCredentials({
    apiKey: 'HK_invalid_key',
    endpoint: '/api/hospitals/api/patient-data',
    ip: '192.168.1.100',
    userAgent: 'Test User Agent'
  });

  logger.security.rateLimitExceeded({
    hospitalId: 'test-hospital-id',
    hospitalName: 'Test Hospital',
    endpoint: '/api/hospitals/api/patient-data',
    requestCount: 101,
    limit: 100,
    ip: '192.168.1.100'
  });

  logger.security.suspiciousActivity({
    activity: 'MULTIPLE_FAILED_LOGINS',
    details: { attempts: 5, timeWindow: '5 minutes' },
    hospitalId: 'test-hospital-id',
    ip: '192.168.1.100',
    userAgent: 'Test User Agent'
  });

  // Test API logging
  console.log('4. Testing API logging...');
  
  logger.api.request({
    method: 'POST',
    url: '/api/hospitals/api/patient-data',
    hospitalId: 'test-hospital-id',
    ip: '192.168.1.100',
    userAgent: 'Test User Agent'
  });

  logger.api.response({
    method: 'POST',
    url: '/api/hospitals/api/patient-data',
    statusCode: 200,
    responseTime: 250,
    hospitalId: 'test-hospital-id'
  });

  // Test performance logging
  console.log('5. Testing performance logging...');
  
  logger.performance.slowQuery({
    query: 'Hospital.findOne({ apiKey: "..." })',
    executionTime: 1500,
    collection: 'hospitals'
  });

  logger.performance.slowApi({
    endpoint: '/api/hospitals/api/patient-data',
    method: 'POST',
    responseTime: 2000,
    hospitalId: 'test-hospital-id'
  });

  console.log('\n✅ Logging test completed!');
  console.log('📁 Check the logs directory for generated log files:');
  console.log('   - logs/application-YYYY-MM-DD.log');
  console.log('   - logs/hospital-YYYY-MM-DD.log');
  console.log('   - logs/security-YYYY-MM-DD.log');
  console.log('   - logs/api-access-YYYY-MM-DD.log');
  console.log('   - logs/error-YYYY-MM-DD.log');
  
  console.log('\n🔍 You can also use the log monitor CLI:');
  console.log('   npm run log-monitor report');
  console.log('   npm run log-monitor search "Test Hospital"');
  console.log('   npm run log-monitor tail application 10');
}

// Run the test
testLogging().catch(error => {
  console.error('❌ Logging test failed:', error);
  process.exit(1);
});