# Quick Test Guide - UPI Payment Flow

## Test the Complete Flow (Without Real API Keys)

### 1. Start the Server
```bash
cd backend
npm start
```

### 2. Register a Doctor
```bash
curl -X POST http://localhost:3000/api/auth/signup/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test",
    "email": "test@doctor.com",
    "password": "Test123!",
    "confirmPassword": "Test123!",
    "dateOfBirth": "1980-01-01",
    "degree": "MBBS, MD",
    "specializations": ["Cardiology"],
    "experienceYears": 10
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor registered successfully. Please complete subscription to access dashboard.",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "role": "doctor",
    "subscriptionStatus": "pending"
  }
}
```

### 3. Try to Access Dashboard (Should Fail)
The frontend subscription guard will check the status and redirect to `/subscription` page.

### 4. Check Doctor Status
```bash
# Use the token from step 2
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "valid": true,
  "user": {
    "id": "...",
    "role": "doctor",
    "subscriptionStatus": "pending"  // ← Still pending
  }
}
```

### 5. Initiate Payment
```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 999,
    "planId": "monthly",
    "planName": "Monthly Subscription",
    "duration": 30
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "paymentId": "...",
    "txnId": "KMB1699...",
    "merchantVPA": "test@kotak",
    "amount": 999,
    "qrCodeData": "upi://pay?pa=test@kotak&pn=Healthcare%20Platform&am=999&tn=KMB...",
    "expiresAt": "2024-...",
    "status": "pending"
  }
}
```

### 6. Simulate Payment Success (For Testing)

Since we don't have real Kotak API keys, we need to manually update the payment status:

```javascript
// In MongoDB or using a script
db.payments.updateOne(
  { txnId: "KMB..." },
  { 
    $set: { 
      status: "completed",
      completedAt: new Date(),
      rrn: "TEST123456789",
      kotakResponse: {
        status: "C",
        message: "Transaction successful"
      }
    }
  }
)
```

Then manually trigger subscription activation:

```javascript
// Run this in Node.js or create a test endpoint
const paymentVerificationService = require('./services/paymentVerificationService');
const Payment = require('./models/Payment');

async function activateTestSubscription(paymentId) {
  const payment = await Payment.findById(paymentId);
  await paymentVerificationService.activateSubscription(payment);
}

activateTestSubscription('YOUR_PAYMENT_ID');
```

### 7. Verify Subscription Activated
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "valid": true,
  "user": {
    "id": "...",
    "role": "doctor",
    "subscriptionStatus": "active",  // ← NOW ACTIVE!
    "subscriptionExpiryDate": "2024-..."
  }
}
```

### 8. Access Dashboard (Should Work Now)
The frontend subscription guard will now allow access to the dashboard.

## With Real Kotak API Keys

If you have real Kotak credentials:

1. Set them in `.env` file
2. Follow steps 1-5 above
3. Actually scan the QR code and pay via UPI app
4. Wait 5-10 seconds for automatic verification
5. Check status again - should be active automatically
6. Access dashboard - should work!

## Automated Test

Run the integration tests:
```bash
cd backend
npm test -- tests/integration/upi-payment-flow.test.js --runInBand
```

This will test the complete flow with mocked Kotak API responses.
