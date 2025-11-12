# Integration Testing Guide

This document provides comprehensive guidance for running integration tests for the Healthcare Platform MVP.

## Overview

The integration tests cover all major user flows:
1. **Patient Flow** - Signup, login, symptom submission, doctor viewing, messaging, and consultations
2. **Doctor Flow** - Signup, subscription payment, dashboard access, patient messages, and consultation booking
3. **Admin Flow** - Login, metrics viewing, and user management
4. **Email & Video** - OTP emails, consultation emails, and video link functionality

## Prerequisites

1. **MongoDB** - Ensure MongoDB is running locally or have a test database URL
2. **Environment Variables** - Create a `.env` file in the backend directory with:
   ```
   MONGODB_URI=mongodb://localhost:27017/healthcare-test
   JWT_SECRET=your_test_jwt_secret
   RAZORPAY_KEY_ID=your_test_key
   RAZORPAY_KEY_SECRET=your_test_secret
   EMAIL_USER=your_test_email@gmail.com
   EMAIL_PASS=your_test_email_password
   ```

3. **Dependencies** - Install test dependencies:
   ```bash
   cd backend
   npm install
   ```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites

#### Patient Flow Tests
```bash
npm run test:patient
```

Tests covered:
- Patient signup with name, DOB, email, password, blood group
- Password validation (matching confirmPassword)
- Patient login and authentication
- Dashboard access with valid token
- Chatbot symptom submission
- Viewing registered doctors only (active subscriptions)
- Messaging doctors
- Receiving consultation details with video links

#### Doctor Flow Tests
```bash
npm run test:doctor
```

Tests covered:
- Doctor signup with name, DOB, email, password, degree, speciality, experience
- Mandatory subscription payment flow
- Subscription order creation
- Payment verification and activation
- Subscription guard blocking dashboard access
- Doctor dashboard access after payment
- Viewing patient messages
- Booking consultations with patients
- Video call link generation
- Email sending to both patient and doctor

#### Admin Flow Tests
```bash
npm run test:admin
```

Tests covered:
- Admin login with admin@gmail.com / admin@123
- Viewing metrics from all collections (patients, doctors, admins)
- Total user counts and active users
- User management across all collections
- Filtering users by collection type
- Searching users by name and email
- Viewing detailed user information
- Role-based access control

#### Email and Video Tests
```bash
npm run test:email
```

Tests covered:
- OTP email generation for password reset
- OTP verification
- Password reset with valid OTP
- Consultation booking emails with video links
- Video link uniqueness for each consultation
- Video link format validation
- Video link access without authentication
- Consultation status management

## Test Structure

Each test suite follows this structure:

```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup: Connect to database, create test data
  });

  afterAll(async () => {
    // Cleanup: Remove test data, close connections
  });

  describe('Sub-feature', () => {
    it('should perform specific action', async () => {
      // Test implementation
    });
  });
});
```

## Expected Test Results

### Patient Flow (7 test groups, ~20 tests)
- ✓ Patient signup validation
- ✓ Login authentication
- ✓ Dashboard access control
- ✓ Symptom submission
- ✓ Doctor filtering (active subscriptions only)
- ✓ Messaging functionality
- ✓ Consultation retrieval

### Doctor Flow (7 test groups, ~15 tests)
- ✓ Doctor signup validation
- ✓ Subscription payment flow
- ✓ Subscription guard enforcement
- ✓ Dashboard access after payment
- ✓ Patient message viewing
- ✓ Consultation booking
- ✓ Video link generation

### Admin Flow (5 test groups, ~15 tests)
- ✓ Admin authentication
- ✓ Metrics calculation
- ✓ User listing and filtering
- ✓ User search functionality
- ✓ Role-based access control

### Email & Video (5 test groups, ~15 tests)
- ✓ OTP email sending
- ✓ OTP verification
- ✓ Password reset
- ✓ Consultation email sending
- ✓ Video link functionality

## Troubleshooting

### Database Connection Issues
If tests fail with database connection errors:
1. Ensure MongoDB is running: `sudo systemctl status mongod`
2. Check MONGODB_URI in .env file
3. Verify network connectivity

### Authentication Failures
If authentication tests fail:
1. Check JWT_SECRET is set in .env
2. Verify bcrypt is properly installed
3. Check password hashing in models

### Email Tests Failing
If email tests fail:
1. Verify EMAIL_USER and EMAIL_PASS in .env
2. Check if Gmail "Less secure app access" is enabled (for Gmail)
3. Consider using test email service like Ethereal

### Payment Tests Failing
If subscription payment tests fail:
1. Verify Razorpay credentials in .env
2. Check if test mode is enabled
3. Review payment gateway configuration

## Test Data Cleanup

Tests automatically clean up their data in `afterAll` hooks. However, if tests are interrupted:

```bash
# Connect to MongoDB
mongo healthcare-test

# Remove test data
db.patients.deleteMany({ email: /test.*@patient\.com/ })
db.doctors.deleteMany({ email: /test.*@doctor\.com/ })
db.messages.deleteMany({})
db.consultations.deleteMany({})
db.otps.deleteMany({})
```

## Continuous Integration

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  run: |
    cd backend
    npm install
    npm test
  env:
    MONGODB_URI: ${{ secrets.MONGODB_TEST_URI }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## Coverage Report

To generate test coverage report:

```bash
npm test -- --coverage
```

Coverage goals:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## Manual Testing Checklist

After automated tests pass, perform manual testing:

### Patient Flow
- [ ] Sign up as new patient
- [ ] Login with patient credentials
- [ ] Submit symptoms via chatbot
- [ ] View disease prediction
- [ ] See list of registered doctors
- [ ] Send message to doctor
- [ ] Receive consultation email
- [ ] Click video link from email

### Doctor Flow
- [ ] Sign up as new doctor
- [ ] Redirected to subscription page
- [ ] Complete payment (test mode)
- [ ] Access doctor dashboard
- [ ] View patient messages
- [ ] Book consultation with patient
- [ ] Verify email sent to both parties
- [ ] Join video call from email link

### Admin Flow
- [ ] Login as admin (admin@gmail.com / admin@123)
- [ ] View platform metrics
- [ ] Browse all users
- [ ] Filter by collection type
- [ ] Search for specific users
- [ ] View user details

## Support

For issues or questions:
1. Check test output for specific error messages
2. Review test logs in console
3. Verify environment configuration
4. Check database state

## Next Steps

After all tests pass:
1. Deploy to staging environment
2. Run tests against staging
3. Perform user acceptance testing
4. Deploy to production
