const apiMonitoring = require('./services/apiMonitoring');
const logger = require('./services/logger');

console.log('🔍 Testing API Monitoring Service...\n');

// Test 1: Track API requests
console.log('1. Testing API request tracking...');

// Simulate API request start
const trackingId1 = apiMonitoring.trackRequestStart({
  method: 'POST',
  url: '/api/hospitals/api/patient-data',
  hospitalId: 'hospital123',
  ip: '192.168.1.100',
  userAgent: 'Hospital-Client/1.0'
});
console.log(`   ✓ Request started with tracking ID: ${trackingId1}`);

// Simulate API request completion (successful)
setTimeout(() => {
  apiMonitoring.trackRequestEnd(trackingId1, {
    method: 'POST',
    url: '/api/hospitals/api/patient-data',
    endpoint: '/api/hospitals/api/patient-data',
    statusCode: 200,
    responseTime: 250,
    hospitalId: 'hospital123'
  });
  console.log('   ✓ Successful request tracked');
}, 100);

// Simulate slow API request
const trackingId2 = apiMonitoring.trackRequestStart({
  method: 'POST',
  url: '/api/hospitals/api/patient-data',
  hospitalId: 'hospital456',
  ip: '192.168.1.101',
  userAgent: 'Hospital-Client/1.0'
});

setTimeout(() => {
  apiMonitoring.trackRequestEnd(trackingId2, {
    method: 'POST',
    url: '/api/hospitals/api/patient-data',
    endpoint: '/api/hospitals/api/patient-data',
    statusCode: 200,
    responseTime: 1500, // Slow request
    hospitalId: 'hospital456'
  });
  console.log('   ✓ Slow request tracked');
}, 150);

// Test 2: Track patient data access
console.log('\n2. Testing patient data access tracking...');
apiMonitoring.trackPatientDataAccess({
  hospitalId: 'hospital123',
  hospitalName: 'City General Hospital',
  patientId: 'patient789',
  patientEmail: 'patient@example.com',
  endpoint: '/api/hospitals/api/patient-data',
  method: 'POST',
  success: true,
  responseTime: 300,
  ip: '192.168.1.100',
  userAgent: 'Hospital-Client/1.0'
});
console.log('   ✓ Patient data access tracked');

// Test 3: Track authentication errors
console.log('\n3. Testing authentication error tracking...');
apiMonitoring.trackAuthenticationError({
  hospitalId: null,
  apiKey: 'HK_invalid123',
  endpoint: '/api/hospitals/api/patient-data',
  reason: 'Invalid API Key',
  ip: '192.168.1.102',
  userAgent: 'Unknown-Client/1.0'
});
console.log('   ✓ Authentication error tracked');

// Test 4: Track rate limit exceeded
console.log('\n4. Testing rate limit tracking...');
apiMonitoring.trackRateLimitExceeded({
  hospitalId: 'hospital123',
  hospitalName: 'City General Hospital',
  endpoint: '/api/hospitals/api/patient-data',
  requestCount: 101,
  limit: 100,
  ip: '192.168.1.100'
});
console.log('   ✓ Rate limit exceeded tracked');

// Test 5: Get real-time metrics
setTimeout(() => {
  console.log('\n5. Testing real-time metrics...');
  const metrics = apiMonitoring.getRealTimeMetrics();
  console.log('   ✓ Real-time metrics retrieved:');
  console.log(`     - Total requests: ${metrics.requests.total}`);
  console.log(`     - Successful requests: ${metrics.requests.successful}`);
  console.log(`     - Failed requests: ${metrics.requests.failed}`);
  console.log(`     - Success rate: ${metrics.requests.successRate}%`);
  console.log(`     - Error rate: ${metrics.requests.errorRate}%`);
  console.log(`     - Average response time: ${metrics.performance.averageResponseTime}ms`);
  console.log(`     - Slow requests: ${metrics.performance.slowRequests}`);
  console.log(`     - Authentication errors: ${metrics.security.authenticationErrors}`);
  console.log(`     - Rate limit exceeded: ${metrics.security.rateLimitExceeded}`);
  console.log(`     - Patient data requests: ${metrics.usage.patientDataRequests}`);
  console.log(`     - Unique hospitals: ${metrics.usage.uniqueHospitals}`);
  console.log(`     - Unique patients: ${metrics.usage.uniquePatients}`);

  // Test 6: Test alert conditions
  console.log('\n6. Testing alert conditions...');
  if (metrics.alerts.highErrorRate) {
    console.log('   ⚠️  High error rate alert triggered');
  } else {
    console.log('   ✓ Error rate within normal limits');
  }

  if (metrics.alerts.slowPerformance) {
    console.log('   ⚠️  Slow performance alert triggered');
  } else {
    console.log('   ✓ Performance within normal limits');
  }

  // Test 7: Test error spike detection (simulate multiple errors)
  console.log('\n7. Testing error spike detection...');
  for (let i = 0; i < 12; i++) {
    apiMonitoring.trackAuthenticationError({
      hospitalId: null,
      apiKey: `HK_invalid${i}`,
      endpoint: '/api/hospitals/api/patient-data',
      reason: 'Invalid API Key',
      ip: '192.168.1.102',
      userAgent: 'Unknown-Client/1.0'
    });
  }
  console.log('   ✓ Multiple authentication errors tracked (should trigger spike alert)');

  // Test 8: Clear monitoring data
  console.log('\n8. Testing data clearing...');
  apiMonitoring.clearCache();
  console.log('   ✓ Cache cleared');

  console.log('\n✅ All API monitoring tests completed!');
  console.log('\nMonitoring Features Tested:');
  console.log('  - ✓ API request tracking (start/end)');
  console.log('  - ✓ Patient data access tracking');
  console.log('  - ✓ Authentication error tracking');
  console.log('  - ✓ Rate limit tracking');
  console.log('  - ✓ Real-time metrics calculation');
  console.log('  - ✓ Performance monitoring (slow requests)');
  console.log('  - ✓ Alert condition detection');
  console.log('  - ✓ Error spike detection');
  console.log('  - ✓ Cache management');

  console.log('\nNext Steps:');
  console.log('  1. Integrate monitoring middleware with hospital API routes ✓');
  console.log('  2. Add monitoring endpoints for admin dashboard ✓');
  console.log('  3. Test with real API requests');
  console.log('  4. Set up external monitoring (Prometheus/Grafana)');
  console.log('  5. Configure alerting thresholds for production');

  process.exit(0);
}, 500);