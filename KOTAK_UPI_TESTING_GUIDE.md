# Kotak UPI Payment Integration Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Kotak UPI payment integration. It covers unit testing, integration testing, manual testing, and common issues with solutions.

## Table of Contents

1. [Testing Environment Setup](#testing-environment-setup)
2. [UAT Test Credentials](#uat-test-credentials)
3. [Manual Testing Procedures](#manual-testing-procedures)
4. [Automated Testing](#automated-testing)
5. [Test Scenarios](#test-scenarios)
6. [Manual Testing Checklist](#manual-testing-checklist)
7. [Common Issues and Solutions](#common-issues-and-solutions)
8. [Test Data](#test-data)

## Testing Environment Setup

### Prerequisites

Before starting testing, ensure:

1. **Backend server is running:**
   ```bash
   cd backend
   npm start
   ```

2. **Frontend server is running:**
   ```bash
   cd frontend
   ng serve
   ```

3. **MongoDB is running:**
   ```bash
   systemctl status mongod
   ```

4. **Environment variables are configured:**
   - Verify `.env` file has all Kotak UAT credentials
   - Check `KOTAK_API_BASE_URL` points to UAT environment

### UAT Environment Configuration

Ensure your `.env` file has UAT configuration:

```bash
KOTAK_API_BASE_URL=https://apigwuat.kotak.com:8443
KOTAK_CLIENT_ID=uat_client_id
KOTAK_CLIENT_SECRET=uat_client_secret
KOTAK_MERCHANT_VPA=testmerchant@kotak
KOTAK_MERCHANT_MOBILE=919876543210
KOTAK_AGGREGATOR_ID=UAT_AG001
KOTAK_MERCHANT_ID=UAT_MER001
KOTAK_SECRET_KEY=uat_secret_key_32_chars_hex
```

## UAT Test Credentials

### Test UPI IDs for UAT Environment

Kotak provides test UPI IDs for UAT testing. Use these for making test payments:

#### Successful Payment Test UPIs

```
success@paytm
success@ybl
success@oksbi
success@okaxis
success@okicici
```

#### Failed Payment Test UPIs

```
failure@paytm
failure@ybl
```

#### Timeout Test UPIs

```
timeout@paytm
timeout@ybl
```

### Test Payment Amounts

Use these amounts for specific test scenarios:

| Amount | Expected Behavior |
|--------|-------------------|
| ₹1.00 | Immediate success |
| ₹2.00 | Success after 30 seconds |
| ₹3.00 | Failure - insufficient funds |
| ₹4.00 | Failure - transaction declined |
| ₹5.00 | Timeout scenario |
| ₹999.00 | Normal subscription amount |

### Test Doctor Account

Create a test doctor account for testing:

```json
{
  "email": "testdoctor@example.com",
  "password": "Test@123",
  "name": "Dr. Test User",
  "role": "doctor",
  "specialization": "General Medicine",
  "phone": "9876543210"
}
```

## Manual Testing Procedures

### Test 1: Complete Payment Flow (Happy Path)

**Objective:** Verify end-to-end payment flow works correctly

**Steps:**

1. **Login as Doctor:**
   - Navigate to `http://localhost:4200/login`
   - Login with test doctor credentials
   - Verify redirect to doctor dashboard

2. **Navigate to Subscription Page:**
   - Click on "Subscribe" or navigate to `/subscription`
   - Verify subscription plans are displayed
   - Verify "Pay with UPI" button is visible

3. **Initiate Payment:**
   - Click "Pay with UPI" button
   - Verify loading indicator appears
   - Wait for payment details to load

4. **Verify Payment Details Display:**
   - Check merchant VPA is displayed (e.g., `testmerchant@kotak`)
   - Check amount is displayed correctly (₹999)
   - Check transaction ID starts with "KMB"
   - Check QR code is generated and displayed
   - Check "Waiting for payment..." message is shown

5. **Make Test Payment:**
   - Open any UPI app on mobile device
   - Scan the QR code OR manually enter:
     - VPA: `testmerchant@kotak`
     - Amount: ₹999
     - Note: Transaction ID
   - Use test UPI ID: `success@paytm`
   - Complete payment in UPI app

6. **Verify Payment Verification:**
   - Watch frontend for status updates (polls every 3 seconds)
   - Backend should poll Kotak API every 5 seconds
   - Check browser console for polling logs
   - Verify status changes from "pending" to "completed"

7. **Verify Success State:**
   - Check success message is displayed
   - Check "Redirecting to dashboard..." message appears
   - Verify automatic redirect happens within 2 seconds
   - Verify doctor dashboard loads successfully

8. **Verify Subscription Activation:**
   - Check subscription status in dashboard
   - Verify subscription is "active"
   - Verify subscription expiry date is set correctly (30 days from now)
   - Verify payment details are linked to subscription

9. **Verify Database Records:**
   ```bash
   # Check payment record
   mongo healthcare_db --eval "db.payments.findOne({txnId: 'KMB_TRANSACTION_ID'})"
   
   # Check subscription record
   mongo healthcare_db --eval "db.subscriptions.findOne({doctorId: ObjectId('DOCTOR_ID')})"
   ```

**Expected Results:**
- ✓ Payment initiated successfully
- ✓ QR code displayed
- ✓ Payment verified automatically
- ✓ Subscription activated
- ✓ Auto-redirect to dashboard
- ✓ Database records created correctly

---

### Test 2: Payment Failure Scenario

**Objective:** Verify system handles failed payments correctly

**Steps:**

1. Login as doctor and navigate to subscription page
2. Click "Pay with UPI"
3. Use test UPI ID: `failure@paytm`
4. Complete payment in UPI app
5. Wait for verification

**Expected Results:**
- ✓ Payment status changes to "failed"
- ✓ Error message displayed: "Payment failed. Please try again."
- ✓ "Retry Payment" button is shown
- ✓ No subscription is created
- ✓ Payment record marked as "failed" in database

---

### Test 3: Payment Timeout Scenario

**Objective:** Verify system handles timeout correctly

**Steps:**

1. Login as doctor and navigate to subscription page
2. Click "Pay with UPI"
3. **Do NOT make any payment** (or use `timeout@paytm`)
4. Wait for 10 minutes

**Expected Results:**
- ✓ Polling continues for 10 minutes
- ✓ After 10 minutes, status changes to "timeout"
- ✓ Error message displayed: "Payment verification timed out"
- ✓ "Check Status" button is shown
- ✓ "Retry Payment" button is shown
- ✓ Payment record marked as "timeout" in database

---

### Test 4: Manual Status Check

**Objective:** Verify manual status check works after timeout

**Steps:**

1. Complete Test 3 (timeout scenario)
2. Make actual payment using UPI app
3. Click "Check Status" button
4. Wait for verification

**Expected Results:**
- ✓ Manual verification triggered
- ✓ Status updated to "completed" if payment found
- ✓ Subscription activated
- ✓ Auto-redirect to dashboard

---

### Test 5: Multiple Payment Attempts

**Objective:** Verify rate limiting works correctly

**Steps:**

1. Login as doctor
2. Initiate payment (1st attempt)
3. Cancel and initiate again (2nd attempt)
4. Cancel and initiate again (3rd attempt)
5. Try to initiate 4th payment within same hour

**Expected Results:**
- ✓ First 3 attempts succeed
- ✓ 4th attempt blocked with error: "Too many payment attempts. Please try again later."
- ✓ Rate limit resets after 1 hour

---

### Test 6: Concurrent Payment Attempts

**Objective:** Verify system prevents duplicate payments

**Steps:**

1. Login as doctor
2. Initiate payment
3. Open new browser tab
4. Try to initiate another payment while first is pending

**Expected Results:**
- ✓ Second payment attempt should be prevented
- ✓ Error message: "You already have a pending payment"
- ✓ Only one payment record exists in database

---

### Test 7: Network Interruption

**Objective:** Verify system handles network issues gracefully

**Steps:**

1. Initiate payment
2. Disconnect internet connection
3. Wait 30 seconds
4. Reconnect internet
5. Observe behavior

**Expected Results:**
- ✓ Polling resumes after reconnection
- ✓ No duplicate payment records created
- ✓ Status eventually updates correctly
- ✓ Error messages displayed during disconnection

---

### Test 8: Browser Refresh During Payment

**Objective:** Verify payment state persists across page refresh

**Steps:**

1. Initiate payment
2. Wait for QR code to display
3. Refresh browser page
4. Check payment status

**Expected Results:**
- ✓ Payment status can be retrieved from backend
- ✓ User can check status manually
- ✓ Polling can be restarted if needed

---

### Test 9: API Error Handling

**Objective:** Verify system handles Kotak API errors correctly

**Steps:**

1. Temporarily modify `KOTAK_CLIENT_ID` to invalid value
2. Restart backend server
3. Try to initiate payment

**Expected Results:**
- ✓ Error message displayed: "Payment service unavailable"
- ✓ Error logged in backend
- ✓ User can retry after fixing configuration

---

### Test 10: Checksum Validation

**Objective:** Verify checksum generation is correct

**Steps:**

1. Enable debug logging in `cryptoService.js`
2. Initiate payment
3. Check backend logs for checksum details
4. Verify checksum format and length

**Expected Results:**
- ✓ Checksum is Base64 encoded string
- ✓ Checksum length is appropriate for AES encryption
- ✓ No errors in checksum generation
- ✓ Kotak API accepts the checksum

---

## Automated Testing

### Unit Tests

#### Test Crypto Service

```bash
cd backend
npm test -- cryptoService.test.js
```

**Test Cases:**
- SHA-256 hashing with known inputs
- AES encryption with zero IV
- Checksum generation for Check Transaction Status API
- Hex string to byte array conversion

#### Test Kotak Payment Service

```bash
npm test -- kotakPaymentService.test.js
```

**Test Cases:**
- OAuth token generation
- Token caching and refresh
- Transaction status checking
- Error handling and retries
- API response parsing

#### Test Payment Verification Service

```bash
npm test -- paymentVerificationService.test.js
```

**Test Cases:**
- Polling logic
- Status update handling
- Timeout handling
- Subscription activation
- Cleanup on completion

### Integration Tests

```bash
npm test -- integration/payment-flow.test.js
```

**Test Cases:**
- Complete payment flow
- Payment failure handling
- Timeout scenarios
- Subscription activation
- Database record creation

### Running All Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- kotakPaymentService.test.js

# Run tests in watch mode
npm test -- --watch
```

## Test Scenarios

### Scenario Matrix

| Scenario | Payment Status | UPI ID | Amount | Expected Outcome |
|----------|---------------|--------|--------|------------------|
| 1 | Success | success@paytm | ₹999 | Subscription activated |
| 2 | Success (Delayed) | success@ybl | ₹2 | Success after 30s |
| 3 | Failure | failure@paytm | ₹3 | Error message shown |
| 4 | Timeout | timeout@paytm | ₹5 | Timeout after 10 min |
| 5 | Invalid VPA | invalid@test | ₹999 | VPA validation error |
| 6 | Insufficient Funds | success@paytm | ₹3 | Payment declined |
| 7 | Network Error | success@paytm | ₹999 | Retry mechanism works |
| 8 | Duplicate Payment | success@paytm | ₹999 | Prevented |

## Manual Testing Checklist

### Pre-Testing Checklist

- [ ] Backend server is running
- [ ] Frontend server is running
- [ ] MongoDB is running and accessible
- [ ] UAT environment variables are configured
- [ ] Test doctor account is created
- [ ] Browser console is open for debugging
- [ ] Network tab is open to monitor API calls

### Payment Initiation Checklist

- [ ] "Pay with UPI" button is visible
- [ ] Button click initiates payment
- [ ] Loading indicator appears
- [ ] Payment details are displayed
- [ ] Transaction ID starts with "KMB"
- [ ] Merchant VPA is correct
- [ ] Amount is displayed correctly
- [ ] QR code is generated and visible
- [ ] QR code is scannable

### Payment Verification Checklist

- [ ] Frontend polls every 3 seconds
- [ ] Backend polls Kotak API every 5 seconds
- [ ] Status updates are reflected in UI
- [ ] Loading message is displayed
- [ ] No console errors during polling
- [ ] Network requests are successful

### Success Flow Checklist

- [ ] Success message is displayed
- [ ] Subscription is activated
- [ ] Subscription details are correct
- [ ] Auto-redirect countdown is shown
- [ ] Redirect to dashboard works
- [ ] Dashboard shows active subscription
- [ ] Payment record is created in database
- [ ] Subscription record is created in database

### Error Handling Checklist

- [ ] Failed payment shows error message
- [ ] Timeout shows appropriate message
- [ ] Retry button is functional
- [ ] Check status button works
- [ ] Network errors are handled gracefully
- [ ] API errors show user-friendly messages
- [ ] Rate limiting works correctly

### Database Verification Checklist

- [ ] Payment record has correct status
- [ ] Transaction ID is stored correctly
- [ ] Doctor ID is linked correctly
- [ ] Amount is stored correctly
- [ ] Timestamps are accurate
- [ ] Subscription record is created
- [ ] Payment ID is linked to subscription
- [ ] Subscription dates are correct

## Common Issues and Solutions

### Issue 1: QR Code Not Displaying

**Symptoms:**
- QR code area is blank
- Console error: "Cannot generate QR code"

**Solutions:**
1. Check if `qrcode` library is installed:
   ```bash
   cd frontend
   npm install qrcode
   ```
2. Verify QR code data format is correct
3. Check browser console for errors
4. Verify `qrCodeData` is returned from backend

**Test:**
```bash
# Check if qrcode is installed
npm list qrcode
```

---

### Issue 2: Payment Status Not Updating

**Symptoms:**
- Status remains "pending" indefinitely
- No polling activity in network tab

**Solutions:**
1. Check if polling service is running:
   ```bash
   # Check backend logs
   tail -f logs/app.log | grep "Polling"
   ```
2. Verify payment ID is correct
3. Check network connectivity to Kotak API
4. Verify OAuth token is valid
5. Check if payment record exists in database

**Test:**
```bash
# Check payment record
mongo healthcare_db --eval "db.payments.find({status: 'pending'})"

# Test Kotak API connectivity
curl -I https://apigwuat.kotak.com:8443
```

---

### Issue 3: "Invalid Checksum" Error

**Symptoms:**
- Kotak API returns checksum validation error
- Payment verification fails

**Solutions:**
1. Verify secret key is correct (32-character hex)
2. Check input parameter order in checksum generation
3. Verify AES encryption uses CBC mode with zero IV
4. Test checksum with known values

**Test:**
```javascript
// Test checksum generation
const cryptoService = require('./services/cryptoService');
const checksum = cryptoService.generateCheckTransactionChecksum(
  'C', 'TEST123', '', '', '20240115120000', '100.00',
  'merchant@kotak', '919876543210', 'your_secret_key'
);
console.log('Checksum:', checksum);
```

---

### Issue 4: Rate Limiting Not Working

**Symptoms:**
- Can initiate unlimited payments
- No rate limit error shown

**Solutions:**
1. Check if rate limiting middleware is applied
2. Verify Redis/memory store is working
3. Check rate limit configuration
4. Review route middleware order

**Test:**
```bash
# Test rate limiting
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/payments/initiate \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount": 999}'
  echo "Attempt $i"
done
```

---

### Issue 5: Subscription Not Activating

**Symptoms:**
- Payment completes successfully
- Subscription remains inactive

**Solutions:**
1. Check subscription activation logic in `paymentVerificationService.js`
2. Verify subscription model is correct
3. Check database permissions
4. Review error logs for subscription creation

**Test:**
```bash
# Check subscription records
mongo healthcare_db --eval "db.subscriptions.find({doctorId: ObjectId('DOCTOR_ID')})"

# Check payment-subscription link
mongo healthcare_db --eval "db.subscriptions.find({paymentId: ObjectId('PAYMENT_ID')})"
```

---

### Issue 6: Frontend Not Polling

**Symptoms:**
- No status updates in UI
- Network tab shows no polling requests

**Solutions:**
1. Check if `startStatusPolling()` is called
2. Verify polling interval is set correctly
3. Check for JavaScript errors in console
4. Verify payment ID is stored in component state

**Test:**
```javascript
// Add debug logging in subscription.component.ts
startStatusPolling() {
  console.log('Starting polling for payment:', this.paymentDetails.paymentId);
  this.pollingInterval = setInterval(() => {
    console.log('Polling attempt...');
    this.checkPaymentStatus();
  }, 3000);
}
```

---

### Issue 7: Auto-Redirect Not Working

**Symptoms:**
- Success message shown
- No redirect to dashboard

**Solutions:**
1. Check if `router.navigate()` is called
2. Verify route path is correct
3. Check for navigation guards blocking redirect
4. Review browser console for errors

**Test:**
```typescript
// Add debug logging
if (status === 'completed') {
  console.log('Payment completed, redirecting...');
  setTimeout(() => {
    console.log('Navigating to dashboard...');
    this.router.navigate(['/doctor-dashboard']);
  }, 2000);
}
```

---

### Issue 8: Database Connection Errors

**Symptoms:**
- Payment records not saved
- Error: "Cannot connect to database"

**Solutions:**
1. Verify MongoDB is running
2. Check connection string in `.env`
3. Verify database permissions
4. Check network connectivity

**Test:**
```bash
# Test MongoDB connection
mongo --eval "db.adminCommand('ping')"

# Check if database exists
mongo --eval "show dbs"

# Test connection from Node.js
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
"
```

---

## Test Data

### Sample Payment Records

```json
{
  "_id": "65a1234567890abcdef12345",
  "txnId": "KMB20240115120000ABC123",
  "doctorId": "65a0987654321fedcba09876",
  "amount": 999,
  "currency": "INR",
  "status": "completed",
  "paymentMethod": "upi",
  "merchantVPA": "testmerchant@kotak",
  "rrn": "401234567890",
  "kotakResponse": {
    "status": "C",
    "message": "Transaction successful"
  },
  "verificationAttempts": 5,
  "initiatedAt": "2024-01-15T12:00:00.000Z",
  "completedAt": "2024-01-15T12:00:25.000Z",
  "expiresAt": "2024-01-15T12:10:00.000Z",
  "metadata": {
    "planId": "monthly",
    "planName": "Monthly Subscription",
    "duration": 30
  }
}
```

### Sample Subscription Records

```json
{
  "_id": "65a1234567890abcdef12346",
  "doctorId": "65a0987654321fedcba09876",
  "planId": "monthly",
  "status": "active",
  "startDate": "2024-01-15T12:00:25.000Z",
  "expiryDate": "2024-02-14T12:00:25.000Z",
  "paymentId": "65a1234567890abcdef12345",
  "paymentMethod": "upi",
  "transactionId": "KMB20240115120000ABC123",
  "paidAmount": 999,
  "autoRenew": false
}
```

## Performance Testing

### Load Testing

Test system performance under load:

```bash
# Install artillery
npm install -g artillery

# Create load test config
cat > payment-load-test.yml << EOF
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "Payment Initiation"
    flow:
      - post:
          url: "/api/payments/initiate"
          headers:
            Authorization: "Bearer {{token}}"
          json:
            amount: 999
            planId: "monthly"
EOF

# Run load test
artillery run payment-load-test.yml
```

### Stress Testing

Test system behavior under stress:

```bash
# Test concurrent payments
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  -p payment-data.json -T application/json \
  http://localhost:5000/api/payments/initiate
```

## Reporting Issues

When reporting issues, include:

1. **Environment Details:**
   - Node.js version
   - MongoDB version
   - Browser and version
   - Operating system

2. **Steps to Reproduce:**
   - Detailed step-by-step instructions
   - Test data used
   - Expected vs actual behavior

3. **Logs and Screenshots:**
   - Backend server logs
   - Browser console logs
   - Network tab screenshots
   - Error messages

4. **Database State:**
   - Relevant payment records
   - Subscription records
   - User records

## Best Practices

1. **Always test in UAT before production**
2. **Use test UPI IDs for UAT testing**
3. **Never use real payment credentials in UAT**
4. **Clear test data between test runs**
5. **Monitor logs during testing**
6. **Document any issues found**
7. **Verify database state after each test**
8. **Test edge cases and error scenarios**
9. **Perform regression testing after fixes**
10. **Keep test documentation updated**

## Next Steps

After completing testing:

1. Document all test results
2. Fix any issues found
3. Perform regression testing
4. Get stakeholder approval
5. Prepare for production deployment
6. Schedule production testing
7. Monitor production metrics

---

**Note:** This testing guide should be updated as new features are added or issues are discovered. Always refer to the latest version before testing.
