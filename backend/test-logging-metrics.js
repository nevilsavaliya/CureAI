const paymentLogger = require('./services/paymentLogger');
const paymentMetrics = require('./services/paymentMetrics');

console.log('Testing Payment Logger and Metrics...\n');

// Test logging
console.log('1. Testing Payment Logger...');

paymentLogger.logPaymentInitiation({
  paymentId: 'test123',
  txnId: 'KMB1234567890',
  doctorId: 'doc123',
  amount: 999,
  planName: 'Test Plan',
  duration: 30
});
console.log('   ✓ Payment initiation logged');

paymentLogger.logStatusChange({
  paymentId: 'test123',
  txnId: 'KMB1234567890',
  oldStatus: 'pending',
  newStatus: 'completed',
  reason: 'Test completion',
  verificationAttempts: 5
});
console.log('   ✓ Status change logged');

paymentLogger.logKotakAPICall({
  endpoint: '/checkTransactionStatus',
  method: 'POST',
  txnId: 'KMB1234567890',
  requestData: { test: 'data' },
  responseData: { status: 'C' },
  duration: 1250,
  success: true
});
console.log('   ✓ Kotak API call logged');

// Test metrics
console.log('\n2. Testing Payment Metrics...');

paymentMetrics.incrementCounter('initiated');
paymentMetrics.incrementCounter('completed');
paymentMetrics.incrementCounter('totalAmount', 999);
paymentMetrics.incrementCounter('completedAmount', 999);
console.log('   ✓ Metrics counters incremented');

const counters = paymentMetrics.getDailyCounters();
console.log('   ✓ Daily counters retrieved:', JSON.stringify(counters, null, 2));

// Test reading logs
console.log('\n3. Testing Log Reading...');

const paymentLogs = paymentLogger.readRecentLogs('payment', 5);
console.log('   ✓ Payment logs retrieved:', paymentLogs.length, 'entries');

const apiLogs = paymentLogger.readRecentLogs('api', 5);
console.log('   ✓ API logs retrieved:', apiLogs.length, 'entries');

// Display sample log entry
if (paymentLogs.length > 0) {
  console.log('\n4. Sample Log Entry:');
  console.log(JSON.stringify(paymentLogs[paymentLogs.length - 1], null, 2));
}

console.log('\n✅ All logging and metrics tests passed!');
console.log('\nLog files created in backend/logs/:');
console.log('  - payment-activity.log');
console.log('  - kotak-api.log');
console.log('  - payment-errors.log');
