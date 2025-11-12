# Requirements Document

## Introduction

This document outlines the requirements for integrating Kotak Mahindra Bank's UPI payment gateway into the healthcare platform. The system will enable doctors to pay subscription fees via UPI QR code, with automatic payment verification and dashboard access upon successful payment.

## Glossary

- **Payment System**: The backend service that handles UPI payment initiation, verification, and subscription activation
- **Kotak API**: Kotak Mahindra Bank's UPI Merchant API for payment verification
- **UPI QR Code**: Quick Response code containing UPI payment details for scanning with any UPI app
- **Transaction Verification Service**: Background service that polls Kotak API to check payment status
- **Subscription Component**: Frontend Angular component that displays payment interface and handles user flow
- **Doctor Dashboard**: The main interface doctors access after successful subscription payment

## Requirements

### Requirement 1: UPI Payment Initiation

**User Story:** As a doctor, I want to initiate a subscription payment via UPI, so that I can access the platform features.

#### Acceptance Criteria

1. WHEN a doctor navigates to the subscription page, THE Subscription Component SHALL display subscription plan details including amount and duration
2. WHEN a doctor clicks "Pay with UPI", THE Payment System SHALL generate a unique transaction ID with prefix "KMB"
3. WHEN a transaction ID is generated, THE Payment System SHALL create a payment record with status "pending"
4. WHEN payment details are ready, THE Subscription Component SHALL display merchant UPI ID and payment amount
5. WHERE QR code generation is available, THE Subscription Component SHALL display a scannable UPI QR code

### Requirement 2: Payment Verification

**User Story:** As a doctor, I want my payment to be automatically verified, so that I don't have to wait for manual approval.

#### Acceptance Criteria

1. WHEN a payment is initiated, THE Transaction Verification Service SHALL start polling the Kotak API every 5 seconds
2. WHILE payment status is "pending", THE Transaction Verification Service SHALL continue checking transaction status via Kotak Check Transaction Status API
3. WHEN Kotak API returns status "C" (Complete), THE Payment System SHALL update payment record to "completed"
4. WHEN payment status becomes "completed", THE Payment System SHALL activate the doctor's subscription
5. IF Kotak API returns status "F" (Failed) or "R" (Rejected), THEN THE Payment System SHALL update payment record to "failed"
6. WHEN polling duration exceeds 10 minutes without completion, THE Transaction Verification Service SHALL stop polling and mark payment as "timeout"

### Requirement 3: Subscription Activation

**User Story:** As a doctor, I want my subscription to be activated immediately after payment, so that I can start using the platform without delay.

#### Acceptance Criteria

1. WHEN payment status changes to "completed", THE Payment System SHALL create a subscription record for the doctor
2. WHEN subscription is created, THE Payment System SHALL set subscription start date to current timestamp
3. WHEN subscription is created, THE Payment System SHALL calculate and set expiry date based on subscription duration
4. WHEN subscription is activated, THE Payment System SHALL set subscription status to "active"
5. WHEN subscription activation completes, THE Payment System SHALL emit a real-time notification to the frontend

### Requirement 4: Frontend Payment Flow

**User Story:** As a doctor, I want to see real-time payment status updates, so that I know when my payment is confirmed.

#### Acceptance Criteria

1. WHEN payment is initiated, THE Subscription Component SHALL display a loading indicator with message "Waiting for payment"
2. WHILE payment is pending, THE Subscription Component SHALL poll the backend every 3 seconds for status updates
3. WHEN payment is verified, THE Subscription Component SHALL display success message
4. WHEN payment is verified, THE Subscription Component SHALL automatically redirect to doctor dashboard within 2 seconds
5. IF payment fails, THEN THE Subscription Component SHALL display error message with retry option

### Requirement 5: Kotak API Integration

**User Story:** As the system, I need to securely communicate with Kotak API, so that payment verification is reliable and secure.

#### Acceptance Criteria

1. WHEN making API calls, THE Payment System SHALL obtain OAuth 2.0 access token from Kotak token endpoint
2. WHEN access token expires, THE Payment System SHALL automatically refresh the token
3. WHEN calling Check Transaction Status API, THE Payment System SHALL include required headers including Authorization and x-check checksum
4. WHEN generating checksum, THE Payment System SHALL use SHA-256 hash and AES encryption as per Kotak specification
5. WHEN API call fails, THE Payment System SHALL retry up to 3 times with exponential backoff

### Requirement 6: Payment Record Management

**User Story:** As an administrator, I want all payment transactions to be logged, so that I can track and audit payments.

#### Acceptance Criteria

1. WHEN payment is initiated, THE Payment System SHALL create a payment record with transaction ID, amount, doctor ID, and timestamp
2. WHEN payment status changes, THE Payment System SHALL update the payment record with new status and timestamp
3. WHEN payment is completed, THE Payment System SHALL store the RRN (Reference Number) from Kotak API
4. THE Payment System SHALL store all payment records in the database with proper indexing on transaction ID and doctor ID
5. THE Payment System SHALL maintain payment history for audit purposes

### Requirement 7: Error Handling

**User Story:** As a doctor, I want clear error messages when payment fails, so that I know what to do next.

#### Acceptance Criteria

1. IF Kotak API returns error code "03", THEN THE Payment System SHALL display "Merchant VPA not found" error
2. IF Kotak API returns error code "91", THEN THE Payment System SHALL display "Payment timeout" error
3. IF network error occurs, THEN THE Payment System SHALL display "Connection error, please try again" message
4. WHEN payment times out, THE Subscription Component SHALL provide option to check payment status manually
5. WHEN payment fails, THE Subscription Component SHALL provide option to retry payment with new transaction ID

### Requirement 8: Security and Configuration

**User Story:** As a system administrator, I want API credentials to be securely stored, so that unauthorized access is prevented.

#### Acceptance Criteria

1. THE Payment System SHALL store Kotak API credentials in environment variables
2. THE Payment System SHALL never expose API credentials in frontend code or API responses
3. THE Payment System SHALL validate all payment requests to ensure they originate from authenticated users
4. THE Payment System SHALL implement rate limiting on payment initiation to prevent abuse
5. THE Payment System SHALL log all payment-related activities for security audit
