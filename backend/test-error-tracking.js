/**
 * Simple test script to verify error tracking integration
 * Run with: node test-error-tracking.js
 */

const errorTracker = require('./services/errorTracker');
const logger = require('./services/logger');

console.log('🔍 Testing Error Tracking System...\n');

// Test 1: Basic error tracking
console.log('1. Testing basic error tracking...');
const basicError = new Error('Test basic error');
const errorId1 = errorTracker.trackError({
  category: errorTracker.errorCategories.SYSTEM,
  severity: errorTracker.errorSeverity.MEDIUM,
  error: basicError,
  context: { test: 'basic' }
});
console.log(`   ✓ Error tracked with ID: ${errorId1}`);

// Test 2: Hospital registration error
console.log('2. Testing hospital registration error...');
const regError = new Error('Duplicate registration number');
const mockReq = {
  method: 'POST',
  originalUrl: '/api/hospitals/register',
  headers: { 'user-agent': 'test-script' },
  ip: '127.0.0.1'
};
const errorId2 = errorTracker.trackHospitalRegistrationError(regError, {
  hospitalName: 'Test Hospital',
  email: 'test@hospital.com',
  registrationNumber: 'REG123'
}, mockReq);
console.log(`   ✓ Hospital registration error tracked with ID: ${errorId2}`);

// Test 3: Hospital API error
console.log('3. Testing hospital API error...');
const apiError = new Error('Patient not found in system');
const errorId3 = errorTracker.trackHospitalApiError(apiError, {
  hospitalId: 'hospital123',
  hospitalName: 'Test Hospital',
  endpoint: '/api/hospitals/api/patient-data',
  method: 'POST',
  patientId: 'patient456',
  patientEmail: 'patient@test.com'
}, mockReq);
console.log(`   ✓ Hospital API error tracked with ID: ${errorId3}`);

// Test 4: Critical error (should trigger alert)
console.log('4. Testing critical error alert...');
const criticalError = new Error('Database connection lost');
const errorId4 = errorTracker.trackError({
  category: errorTracker.errorCategories.DATABASE,
  severity: errorTracker.errorSeverity.CRITICAL,
  error: criticalError,
  context: { 
    operation: 'findPatient',
    collection: 'patients'
  }
});
console.log(`   ✓ Critical error tracked with ID: ${errorId4}`);

// Test 5: Error spike simulation
console.log('5. Testing error spike detection...');
const spikeError = new Error('Rate limit exceeded');
for (let i = 0; i < 12; i++) {
  errorTracker.trackRateLimitError(spikeError, {
    limit: 100,
    current: 101 + i,
    resetTime: Date.now() + 3600000
  }, mockReq);
}
console.log('   ✓ Error spike simulated (12 similar errors)');

// Test 6: Get statistics
console.log('6. Getting error statistics...');
const stats = errorTracker.getErrorStats();
console.log(`   ✓ Total errors tracked: ${stats.totalErrors}`);
console.log(`   ✓ Error categories: ${Object.keys(stats.errorsByCategory).length}`);
console.log(`   ✓ Error severities: ${Object.keys(stats.errorsBySeverity).join(', ')}`);
console.log(`   ✓ Top errors: ${stats.topErrors.length}`);

// Display detailed statistics
console.log('\n📊 Detailed Statistics:');
console.log('Categories:');
Object.entries(stats.errorsByCategory).forEach(([category, count]) => {
  console.log(`   - ${category}: ${count}`);
});

console.log('Severities:');
Object.entries(stats.errorsBySeverity).forEach(([severity, count]) => {
  console.log(`   - ${severity}: ${count}`);
});

console.log('Top Errors:');
stats.topErrors.slice(0, 3).forEach((error, index) => {
  console.log(`   ${index + 1}. ${error.message} (${error.count} times, ${error.severity})`);
});

// Test 7: Error fingerprinting
console.log('\n7. Testing error fingerprinting...');
const fp1 = errorTracker.generateFingerprint(
  new Error('Same error'),
  errorTracker.errorCategories.SYSTEM,
  { endpoint: '/test' }
);
const fp2 = errorTracker.generateFingerprint(
  new Error('Same error'),
  errorTracker.errorCategories.SYSTEM,
  { endpoint: '/test' }
);
const fp3 = errorTracker.generateFingerprint(
  new Error('Different error'),
  errorTracker.errorCategories.SYSTEM,
  { endpoint: '/test' }
);
console.log(`   ✓ Same errors have same fingerprint: ${fp1 === fp2}`);
console.log(`   ✓ Different errors have different fingerprints: ${fp1 !== fp3}`);

// Test 8: Header sanitization
console.log('8. Testing header sanitization...');
const sensitiveHeaders = {
  'authorization': 'Bearer secret-token',
  'cookie': 'session=secret',
  'x-api-key': 'secret-key',
  'content-type': 'application/json',
  'user-agent': 'test-agent'
};
const sanitized = errorTracker.sanitizeHeaders(sensitiveHeaders);
const hasSensitive = sanitized.authorization || sanitized.cookie || sanitized['x-api-key'];
console.log(`   ✓ Sensitive headers removed: ${!hasSensitive}`);
console.log(`   ✓ Safe headers preserved: ${sanitized['content-type'] === 'application/json'}`);

console.log('\n✅ Error Tracking System Test Complete!');
console.log('\nTo test the API endpoints, start the server and use:');
console.log('GET /api/admin/errors/stats');
console.log('GET /api/admin/errors/health');
console.log('GET /api/admin/errors/trends');

// Clean up for next test
errorTracker.clearStats();
console.log('\n🧹 Statistics cleared for next test run.');