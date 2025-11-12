# Design Document

## Overview

This design document outlines the architecture and implementation approach for integrating Kotak Mahindra Bank's UPI payment gateway into the healthcare platform. The system enables automated payment verification through polling the Kotak API and provides a seamless user experience with QR code payments and automatic dashboard redirection.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Angular        │◄────────┤  Node.js/Express │◄────────┤  Kotak UPI API  │
│  Frontend       │         │  Backend         │         │                 │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │
        │                            │
        │                            ▼
        │                   ┌──────────────────┐
        │                   │                  │
        └──────────────────►│  MongoDB         │
                            │  Database        │
                            │                  │
                            └──────────────────┘
```

### Component Architecture

```
Backend Services:
├── kotakPaymentService.js      # Kotak API integration
├── paymentVerificationService.js # Background polling service
├── subscriptionService.js       # Subscription management
└── cryptoService.js            # Checksum generation

Backend Controllers:
├── kotakPaymentController.js   # Payment endpoints

Backend Models:
├── Payment.js                  # Payment transaction model
└── Subscription.js             # Existing subscription model

Frontend Components:
├── subscription.component.ts   # Updated with UPI flow
└── subscription.component.html # Updated UI with QR code

Frontend Services:
└── subscription.service.ts     # Updated with polling logic
```

## Components and Interfaces

### 1. Kotak Payment Service

**Purpose:** Handle all interactions with Kotak Mahindra Bank UPI API

**Key Methods:**

```javascript
class KotakPaymentService {
  // Get OAuth 2.0 access token
  async getAccessToken()
  
  // Check transaction status
  async checkTransactionStatus(txnId, aggregatorVPA, customerId, amount)
  
  // Validate VPA (optional, for future use)
  async validateVPA(vpa, customerId, aggregatorId, merchantId)
  
  // Generate checksum for API requests
  generateChecksum(data, secretKey)
}
```

**Configuration:**
```javascript
{
  baseURL: process.env.KOTAK_API_BASE_URL,
  clientId: process.env.KOTAK_CLIENT_ID,
  clientSecret: process.env.KOTAK_CLIENT_SECRET,
  merchantVPA: process.env.KOTAK_MERCHANT_VPA,
  merchantMobile: process.env.KOTAK_MERCHANT_MOBILE,
  aggregatorId: process.env.KOTAK_AGGREGATOR_ID,
  merchantId: process.env.KOTAK_MERCHANT_ID,
  secretKey: process.env.KOTAK_SECRET_KEY
}
```

### 2. Payment Verification Service

**Purpose:** Background service that polls Kotak API to verify payment status

**Key Methods:**

```javascript
class PaymentVerificationService {
  // Start verification polling for a payment
  async startVerification(paymentId)
  
  // Stop verification polling
  stopVerification(paymentId)
  
  // Poll Kotak API for status
  async pollPaymentStatus(payment)
  
  // Handle successful payment
  async handlePaymentSuccess(payment, kotakResponse)
  
  // Handle failed payment
  async handlePaymentFailure(payment, reason)
  
  // Handle timeout
  async handlePaymentTimeout(payment)
}
```

**Polling Strategy:**
- Poll every 5 seconds
- Maximum duration: 10 minutes (120 polls)
- Exponential backoff on API errors
- Stop polling when status is final (Complete/Failed/Rejected)

### 3. Crypto Service

**Purpose:** Generate checksums and handle encryption as per Kotak specification

**Key Methods:**

```javascript
class CryptoService {
  // Generate SHA-256 hash
  sha256(data)
  
  // AES encryption with CBC mode
  aesEncrypt(key, data)
  
  // Generate checksum for Check Transaction Status API
  generateCheckTransactionChecksum(type, txnId, refId, orderId, dateTime, amount, aggregatorVPA, customerId, secretKey)
  
  // Convert hex string to byte array
  hexStringToByteArray(hexString)
}
```

**Checksum Logic:**
```
Input String = type + txnId + refId + orderId + dateTime + amount + aggregatorVPA + customerId
Hash = SHA256(Input String)
Encrypted = AES_CBC_Encrypt(SecretKey, Hash)
Checksum = Base64(Encrypted)
```

### 4. Payment Controller

**Purpose:** Handle HTTP requests for payment operations

**Endpoints:**

```javascript
POST /api/payments/initiate
// Initiate UPI payment
Request: { doctorId, planId, amount }
Response: { 
  paymentId, 
  txnId, 
  merchantVPA, 
  amount, 
  qrCodeData,
  expiresAt 
}

GET /api/payments/:paymentId/status
// Check payment status
Response: { 
  status: 'pending' | 'completed' | 'failed' | 'timeout',
  subscriptionId?: string,
  message?: string
}

POST /api/payments/:paymentId/verify
// Manually trigger verification
Response: { 
  status, 
  verified: boolean 
}
```

## Data Models

### Payment Model

```javascript
{
  _id: ObjectId,
  txnId: String,              // Unique transaction ID (KMB prefix)
  doctorId: ObjectId,         // Reference to Doctor
  amount: Number,             // Payment amount
  currency: String,           // Default: 'INR'
  status: String,             // 'pending', 'completed', 'failed', 'timeout'
  paymentMethod: String,      // 'upi'
  merchantVPA: String,        // Merchant UPI ID
  rrn: String,                // Reference number from Kotak
  kotakResponse: Object,      // Full response from Kotak API
  verificationAttempts: Number, // Number of polling attempts
  initiatedAt: Date,
  completedAt: Date,
  expiresAt: Date,            // Payment expiry (10 minutes from initiation)
  metadata: {
    planId: String,
    planName: String,
    duration: Number
  }
}
```

### Updated Subscription Model

```javascript
{
  // Existing fields...
  paymentId: ObjectId,        // Reference to Payment
  paymentMethod: String,      // 'upi', 'razorpay', etc.
  transactionId: String,      // External transaction ID
  paidAmount: Number,         // Actual amount paid
  // ...
}
```

## Error Handling

### Error Codes Mapping

```javascript
const KOTAK_ERROR_CODES = {
  '00': 'Success',
  '03': 'Merchant VPA not found',
  '04': 'Merchant not found',
  '91': 'Timeout',
  '111': 'Invalid or empty parameter',
  'OL01': 'Merchant reference ID not found',
  'OL16': 'Invalid merchant ID/aggregator ID',
  'OL95': 'Invalid IP',
  'OL96': 'Key value null',
  'UO1': 'Duplicate request',
  'XP': 'Transaction not permitted'
};
```

### Error Handling Strategy

1. **API Errors:** Retry with exponential backoff (3 attempts)
2. **Network Errors:** Log and continue polling
3. **Timeout:** Mark payment as timeout, allow manual verification
4. **Invalid Response:** Log error, mark payment as failed
5. **Authentication Errors:** Refresh token and retry

## Testing Strategy

### Unit Tests

1. **Crypto Service Tests**
   - Test SHA-256 hashing
   - Test AES encryption
   - Test checksum generation with known values

2. **Kotak Payment Service Tests**
   - Mock Kotak API responses
   - Test token generation
   - Test transaction status checking
   - Test error handling

3. **Payment Verification Service Tests**
   - Test polling logic
   - Test timeout handling
   - Test success/failure scenarios

### Integration Tests

1. **Payment Flow Test**
   - Initiate payment
   - Verify payment record created
   - Simulate Kotak API response
   - Verify subscription activation

2. **Error Scenario Tests**
   - Test payment timeout
   - Test API failures
   - Test network errors
   - Test duplicate payments

### Manual Testing

1. **End-to-End Flow**
   - Doctor initiates payment
   - Scan QR code with UPI app
   - Make actual payment
   - Verify automatic verification
   - Verify dashboard redirect

2. **Edge Cases**
   - Payment timeout scenario
   - Multiple simultaneous payments
   - Network interruption during polling

## Security Considerations

### 1. Credential Management
- Store all Kotak API credentials in environment variables
- Never expose credentials in frontend code
- Use separate credentials for UAT and Production

### 2. Request Validation
- Validate all payment requests are from authenticated doctors
- Prevent duplicate transaction IDs
- Implement rate limiting (max 3 payment initiations per doctor per hour)

### 3. Data Protection
- Encrypt sensitive payment data at rest
- Use HTTPS for all API communications
- Log payment activities for audit trail

### 4. Checksum Verification
- Always generate and verify checksums for Kotak API calls
- Use secure random generation for transaction IDs
- Validate response checksums (if provided by Kotak)

## Frontend Design

### Payment Flow UI

```
┌─────────────────────────────────────┐
│  Subscription Plans                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Monthly Plan - ₹999         │   │
│  │ [Pay with UPI]              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Payment Details                    │
│                                     │
│  Amount: ₹999                       │
│  Pay to: merchant@kotak             │
│                                     │
│  ┌─────────────────┐                │
│  │                 │                │
│  │   QR CODE       │                │
│  │                 │                │
│  └─────────────────┘                │
│                                     │
│  Scan with any UPI app              │
│                                     │
│  ⏳ Waiting for payment...          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  ✓ Payment Successful!              │
│                                     │
│  Redirecting to dashboard...        │
└─────────────────────────────────────┘
```

### Component State Management

```typescript
interface PaymentState {
  loading: boolean;
  paymentInitiated: boolean;
  paymentDetails: {
    paymentId: string;
    txnId: string;
    merchantVPA: string;
    amount: number;
    qrCodeData: string;
  } | null;
  status: 'idle' | 'pending' | 'completed' | 'failed' | 'timeout';
  error: string | null;
  pollingInterval: any;
}
```

## Implementation Phases

### Phase 1: Backend Core Services
1. Implement CryptoService with checksum generation
2. Implement KotakPaymentService with OAuth and API calls
3. Create Payment model and database schema
4. Implement payment controller endpoints

### Phase 2: Payment Verification
1. Implement PaymentVerificationService with polling logic
2. Add subscription activation on payment success
3. Implement timeout and error handling
4. Add logging and monitoring

### Phase 3: Frontend Integration
1. Update SubscriptionComponent with UPI payment flow
2. Implement QR code generation and display
3. Add status polling and real-time updates
4. Implement auto-redirect on success

### Phase 4: Testing and Deployment
1. Write unit tests for all services
2. Perform integration testing with Kotak UAT environment
3. Conduct end-to-end testing with real payments
4. Deploy to production with monitoring

## Configuration Requirements

### Environment Variables

```bash
# Kotak API Configuration
KOTAK_API_BASE_URL=https://apigwuat.kotak.com:8443
KOTAK_CLIENT_ID=your_client_id
KOTAK_CLIENT_SECRET=your_client_secret
KOTAK_MERCHANT_VPA=merchant@kotak
KOTAK_MERCHANT_MOBILE=919XXXXXXXXX
KOTAK_AGGREGATOR_ID=AC001
KOTAK_MERCHANT_ID=MC001
KOTAK_SECRET_KEY=your_secret_key

# Payment Configuration
PAYMENT_TIMEOUT_MINUTES=10
PAYMENT_POLL_INTERVAL_SECONDS=5
PAYMENT_MAX_RETRIES=3
```

## Monitoring and Logging

### Key Metrics to Track
- Payment initiation rate
- Payment success rate
- Average verification time
- API error rate
- Timeout rate

### Logging Strategy
- Log all payment initiations
- Log all Kotak API calls and responses
- Log all status changes
- Log all errors with context
- Create daily payment summary reports

## Future Enhancements

1. **Webhook Integration:** If Kotak provides webhooks, replace polling with webhook-based verification
2. **Payment Analytics Dashboard:** Admin dashboard to view payment statistics
3. **Refund Support:** Implement refund functionality using Kotak Cashback API
4. **Multiple Payment Methods:** Support other payment methods alongside UPI
5. **Subscription Management:** Allow doctors to upgrade/downgrade plans
