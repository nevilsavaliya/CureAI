# Implementation Plan

- [-] 1. Set up Kotak API configuration and environment
  - Create environment variables for Kotak API credentials
  - Add configuration validation on server startup
  - _Requirements: 5.1, 5.2, 8.1, 8.2_

- [x] 2. Implement Crypto Service for checksum generation
  - [x] 2.1 Create cryptoService.js with SHA-256 hashing
    - Implement SHA-256 hash function using Node.js crypto module
    - _Requirements: 5.4_

  - [x] 2.2 Implement AES encryption with CBC mode
    - Create AES encryption function with zero IV as per Kotak spec
    - Implement hex string to byte array conversion
    - _Requirements: 5.4_

  - [x] 2.3 Create checksum generation for Check Transaction Status API
    - Implement input string concatenation logic
    - Combine SHA-256 and AES encryption
    - Return Base64 encoded checksum
    - _Requirements: 5.4_

- [x] 3. Implement Kotak Payment Service
  - [x] 3.1 Create kotakPaymentService.js with OAuth token management
    - Implement getAccessToken() method
    - Add token caching with expiry handling
    - Implement automatic token refresh
    - _Requirements: 5.1, 5.2_

  - [x] 3.2 Implement Check Transaction Status API integration
    - Create checkTransactionStatus() method
    - Generate required checksum using CryptoService
    - Add proper headers including Authorization and x-check
    - Parse and return response
    - _Requirements: 5.3, 5.4_

  - [x] 3.3 Add error handling and retry logic
    - Implement exponential backoff for retries
    - Map Kotak error codes to user-friendly messages
    - Add comprehensive error logging
    - _Requirements: 5.5, 7.1, 7.2, 7.3_

- [x] 4. Create Payment model and database schema
  - [x] 4.1 Define Payment schema in models/Payment.js
    - Add all required fields (txnId, doctorId, amount, status, etc.)
    - Create indexes on txnId and doctorId
    - Add timestamps and metadata fields
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 4.2 Update Subscription model
    - Add paymentId reference field
    - Add paymentMethod and transactionId fields
    - Add paidAmount field
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Implement Payment Verification Service
  - [x] 5.1 Create paymentVerificationService.js with polling logic
    - Implement startVerification() method
    - Create in-memory map to track active verifications
    - Set up 5-second polling interval
    - _Requirements: 2.1, 2.2_

  - [x] 5.2 Implement pollPaymentStatus() method
    - Call KotakPaymentService.checkTransactionStatus()
    - Handle different status responses (C, P, F, R)
    - Update payment record with latest status
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 5.3 Add timeout handling
    - Track polling duration and attempt count
    - Stop polling after 10 minutes
    - Mark payment as timeout if not completed
    - _Requirements: 2.6_

  - [x] 5.4 Implement subscription activation on success
    - Create subscription record when payment completes
    - Calculate subscription start and expiry dates
    - Set subscription status to active
    - Store payment reference in subscription
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.5 Add cleanup and stop verification methods
    - Implement stopVerification() to clear intervals
    - Clean up completed/failed verifications from memory
    - _Requirements: 2.2_

- [x] 6. Create Payment Controller and Routes
  - [x] 6.1 Implement POST /api/payments/initiate endpoint
    - Validate authenticated doctor
    - Generate unique transaction ID with KMB prefix
    - Create payment record in database
    - Start payment verification polling
    - Return payment details including merchant VPA and QR data
    - _Requirements: 1.2, 1.3, 6.1, 8.3_

  - [x] 6.2 Implement GET /api/payments/:paymentId/status endpoint
    - Fetch payment record from database
    - Return current status and subscription ID if completed
    - _Requirements: 6.2_

  - [x] 6.3 Add POST /api/payments/:paymentId/verify endpoint
    - Manually trigger verification check
    - Return immediate status from Kotak API
    - _Requirements: 7.4_

  - [x] 6.4 Add rate limiting middleware
    - Limit payment initiation to 3 per doctor per hour
    - Return appropriate error message when limit exceeded
    - _Requirements: 8.4_

  - [x] 6.5 Create payment routes file
    - Set up Express router with all payment endpoints
    - Add authentication middleware
    - Register routes in main app
    - _Requirements: 8.3_

- [x] 7. Update Frontend Subscription Component
  - [x] 7.1 Add UPI payment initiation to subscription.service.ts
    - Create initiateUPIPayment() method
    - Create getPaymentStatus() method
    - Add polling logic with 3-second interval
    - _Requirements: 1.1, 4.2_

  - [x] 7.2 Update subscription.component.ts with payment flow
    - Add payment state management
    - Implement initiatePayment() method
    - Add startStatusPolling() method
    - Implement auto-redirect on success
    - Handle payment errors and timeouts
    - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4, 4.5, 7.4, 7.5_

  - [x] 7.3 Update subscription.component.html with UPI UI
    - Add "Pay with UPI" button
    - Create payment details section with merchant VPA and amount
    - Add QR code display area
    - Add loading indicator for payment verification
    - Add success message with auto-redirect countdown
    - Add error message display with retry button
    - _Requirements: 1.1, 1.4, 1.5, 4.1, 4.3, 4.4, 4.5_

  - [x] 7.4 Add QR code generation
    - Install qrcode library (npm install qrcode)
    - Generate UPI QR code from payment details
    - Display QR code in component
    - _Requirements: 1.5_

  - [x] 7.5 Update subscription.component.css
    - Style payment details section
    - Style QR code display
    - Add loading animations
    - Style success/error messages
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

- [x] 8. Add comprehensive error handling
  - [x] 8.1 Map Kotak error codes to user messages
    - Create error code mapping object
    - Implement getErrorMessage() utility function
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.2 Add frontend error display
    - Show user-friendly error messages
    - Provide retry option for failed payments
    - Add manual status check option for timeouts
    - _Requirements: 7.4, 7.5_

- [x] 9. Implement logging and monitoring
  - [x] 9.1 Add payment activity logging
    - Log payment initiation with doctor ID and amount
    - Log all Kotak API calls with request/response
    - Log status changes with timestamps
    - Log errors with full context
    - _Requirements: 6.5, 8.5_

  - [x] 9.2 Add payment metrics tracking
    - Track payment success/failure rates
    - Track average verification time
    - Track API error rates
    - _Requirements: 6.5_

- [x] 10. Create setup and testing documentation
  - [x] 10.1 Create KOTAK_UPI_SETUP_GUIDE.md
    - Document environment variable setup
    - Provide step-by-step configuration instructions
    - Include UAT and Production endpoint details
    - Add troubleshooting section
    - _Requirements: 8.1_

  - [x] 10.2 Create KOTAK_UPI_TESTING_GUIDE.md
    - Document how to test payment flow
    - Provide test UPI IDs for UAT environment
    - Include manual testing checklist
    - Add common issues and solutions
    - _Requirements: All_

- [x] 11. Write automated tests
  - [x] 11.1 Create unit tests for CryptoService
    - Test SHA-256 hashing with known inputs
    - Test AES encryption
    - Test checksum generation
    - _Requirements: 5.4_

  - [x] 11.2 Create unit tests for KotakPaymentService
    - Mock Kotak API responses
    - Test token generation and refresh
    - Test transaction status checking
    - Test error handling
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 11.3 Create integration tests for UPI payment flow
    - Test UPI payment initiation endpoint
    - Test payment verification polling mechanism
    - Test subscription activation on successful payment
    - Test timeout scenarios and error handling
    - Test rate limiting on payment initiation
    - Mock Kotak API responses for different payment statuses
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.6, 3.1, 3.2, 3.3, 3.4, 8.4_
