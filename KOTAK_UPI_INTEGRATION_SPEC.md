# Kotak UPI Payment Integration - Spec Complete

## Overview

A complete specification for integrating Kotak Mahindra Bank's UPI payment gateway with automated payment verification for doctor subscriptions.

## What's Included

### 1. Requirements Document
Location: `.kiro/specs/kotak-upi-payment-integration/requirements.md`

Covers 8 major requirements:
- UPI payment initiation with QR codes
- Automatic payment verification via polling
- Subscription activation on payment success
- Real-time frontend updates
- Secure Kotak API integration
- Complete payment logging
- Comprehensive error handling
- Security and configuration

### 2. Design Document
Location: `.kiro/specs/kotak-upi-payment-integration/design.md`

Includes:
- Complete system architecture
- Backend services (KotakPaymentService, PaymentVerificationService, CryptoService)
- Data models (Payment, updated Subscription)
- API endpoints and interfaces
- Checksum generation logic (SHA-256 + AES encryption)
- Frontend component design with QR code display
- Security considerations
- Testing strategy
- Implementation phases

### 3. Implementation Tasks
Location: `.kiro/specs/kotak-upi-payment-integration/tasks.md`

11 major tasks with 35+ sub-tasks covering:
- Environment setup
- Crypto service implementation
- Kotak API integration
- Payment verification polling
- Database models
- Backend controllers and routes
- Frontend UI updates
- QR code generation
- Error handling
- Logging and monitoring
- Documentation
- Automated testing

## Key Features

### For Doctors
1. Click "Pay with UPI" button
2. See payment details and QR code
3. Scan QR with any UPI app and pay
4. System automatically verifies payment (no manual approval needed)
5. Auto-redirect to dashboard within 2 seconds of payment confirmation

### Technical Highlights
- **Automatic Verification**: Background polling service checks Kotak API every 5 seconds
- **Secure Integration**: OAuth 2.0 authentication + SHA-256/AES checksums
- **Timeout Handling**: 10-minute payment window with graceful timeout
- **Real-time Updates**: Frontend polls every 3 seconds for status
- **Complete Audit Trail**: All payments logged with full details
- **Error Recovery**: Retry logic, manual verification option, user-friendly error messages

## How to Start Implementation

### Option 1: Execute Tasks One by One
Open `.kiro/specs/kotak-upi-payment-integration/tasks.md` and click "Start task" next to each task item.

### Option 2: Start with First Task
The first task is setting up environment variables. You'll need:
- Kotak API credentials (client_id, client_secret)
- Merchant VPA (UPI ID)
- Merchant mobile number
- Aggregator ID and Merchant ID
- Secret key for checksum generation

### Recommended Order
1. Task 1: Environment setup
2. Task 2: Crypto service (checksum generation)
3. Task 3: Kotak API service
4. Task 4: Database models
5. Task 5: Payment verification service
6. Task 6: Backend controllers
7. Task 7: Frontend updates
8. Task 8-11: Error handling, logging, docs, tests

## Environment Variables Needed

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

## Payment Flow Diagram

```
Doctor → Click "Pay with UPI"
    ↓
Backend → Generate txnId, Create payment record
    ↓
Frontend → Display QR code + payment details
    ↓
Doctor → Scan QR, Pay via UPI app
    ↓
Backend → Poll Kotak API every 5 seconds
    ↓
Kotak API → Returns status "C" (Complete)
    ↓
Backend → Activate subscription
    ↓
Frontend → Show success, redirect to dashboard
```

## Next Steps

1. **Get Kotak API Credentials**: Contact Kotak to get your merchant account credentials
2. **Set Up Environment**: Add all required environment variables
3. **Start Implementation**: Begin with Task 1 in the tasks.md file
4. **Test in UAT**: Use Kotak UAT environment for testing
5. **Deploy to Production**: Switch to production endpoints after testing

## Questions?

- Review the requirements document for detailed acceptance criteria
- Check the design document for architecture and technical details
- Follow the tasks document for step-by-step implementation
- Each task references specific requirements it fulfills

---

**Ready to start?** Open `.kiro/specs/kotak-upi-payment-integration/tasks.md` and click "Start task" on Task 1!
