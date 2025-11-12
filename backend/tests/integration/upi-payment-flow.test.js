/**
 * UPI Payment Flow Integration Tests
 * Tests the complete UPI payment journey including initiation, verification, and subscription activation
 */

// Set up test environment variables for Kotak config BEFORE any imports
process.env.KOTAK_API_BASE_URL = 'https://test.kotak.com';
process.env.KOTAK_CLIENT_ID = 'test_client_id';
process.env.KOTAK_CLIENT_SECRET = 'test_client_secret';
process.env.KOTAK_MERCHANT_VPA = 'test@kotak';
process.env.KOTAK_MERCHANT_MOBILE = '919876543210';
process.env.KOTAK_AGGREGATOR_ID = 'TEST_AGG';
process.env.KOTAK_MERCHANT_ID = 'TEST_MERCH';
process.env.KOTAK_SECRET_KEY = 'test_secret_key_32_characters_long';

// Mock Kotak API responses
jest.mock('../../services/kotakPaymentService');

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Doctor = require('../../models/Doctor');
const Payment = require('../../models/Payment');
const Subscription = require('../../models/Subscription');
const kotakPaymentService = require('../../services/kotakPaymentService');
const paymentVerificationService = require('../../services/paymentVerificationService');

describe('UPI Payment Flow Integration Tests', () => {
  let doctorToken;
  let doctorId;
  let doctor;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }
  });

  afterAll(async () => {
    // Clean up test data
    await Doctor.deleteMany({ email: /test.*upi.*@doctor\.com/ });
    await Payment.deleteMany({});
    await Subscription.deleteMany({});
    
    // Stop all active verifications
    paymentVerificationService.stopAllVerifications();
    
    await mongoose.connection.close();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('1. UPI Payment Initiation', () => {
    beforeAll(async () => {
      // Create test doctor
      const doctorData = {
        name: 'Test UPI Doctor',
        email: 'test.upi@doctor.com',
        password: 'UpiDoc123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS, MD',
        specializations: ['General Medicine'],
        experienceYears: 10,
        subscriptionStatus: 'pending'
      };

      doctor = await Doctor.create(doctorData);
      doctorId = doctor._id;

      // Login as doctor
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: doctorData.email,
          password: doctorData.password
        });
      
      doctorToken = loginResponse.body.token;
    });

    it('should successfully initiate UPI payment with valid data', async () => {
      const paymentData = {
        amount: 999,
        planId: 'monthly',
        planName: 'Monthly Subscription',
        duration: 30
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData);

      // Debug: Log the response
      if (response.status !== 200) {
        console.log('Error Response:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.paymentId).toBeDefined();
      expect(response.body.payment.txnId).toMatch(/^KMB/);
      expect(response.body.payment.merchantVPA).toBeDefined();
      expect(response.body.payment.amount).toBe(999);
      expect(response.body.payment.qrCodeData).toContain('upi://pay');
      expect(response.body.payment.status).toBe('pending');
      expect(response.body.payment.expiresAt).toBeDefined();

      // Verify payment record created in database
      const payment = await Payment.findById(response.body.payment.paymentId);
      expect(payment).toBeDefined();
      expect(payment.doctorId.toString()).toBe(doctorId.toString());
      expect(payment.status).toBe('pending');
      expect(payment.metadata.planName).toBe('Monthly Subscription');
    });

    it('should reject payment initiation with invalid amount', async () => {
      const paymentData = {
        amount: -100,
        planId: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('amount');
    });

    it('should reject payment initiation without authentication', async () => {
      const paymentData = {
        amount: 999,
        planId: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .send(paymentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject payment initiation for doctor with active subscription', async () => {
      // Create doctor with active subscription
      const activeDoctor = await Doctor.create({
        name: 'Active Subscription Doctor',
        email: 'test.upi.active@doctor.com',
        password: 'ActiveDoc123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        specializations: ['Cardiology'],
        experienceYears: 5,
        subscriptionStatus: 'active'
      });

      // Login as active doctor
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.upi.active@doctor.com',
          password: 'ActiveDoc123!'
        });

      const activeToken = loginResponse.body.token;

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${activeToken}`)
        .send({ amount: 999, planId: 'monthly' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('active subscription');

      // Clean up
      await Doctor.findByIdAndDelete(activeDoctor._id);
    });
  });

  describe('2. Rate Limiting on Payment Initiation', () => {
    let rateLimitDoctor;
    let rateLimitToken;

    beforeAll(async () => {
      // Create test doctor for rate limiting
      rateLimitDoctor = await Doctor.create({
        name: 'Rate Limit Test Doctor',
        email: 'test.upi.ratelimit@doctor.com',
        password: 'RateDoc123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        specializations: ['Neurology'],
        experienceYears: 8,
        subscriptionStatus: 'pending'
      });

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.upi.ratelimit@doctor.com',
          password: 'RateDoc123!'
        });
      
      rateLimitToken = loginResponse.body.token;
    });

    afterAll(async () => {
      await Doctor.findByIdAndDelete(rateLimitDoctor._id);
    });

    it('should allow up to 3 payment initiations per hour', async () => {
      const paymentData = {
        amount: 999,
        planId: 'monthly'
      };

      // First payment - should succeed
      const response1 = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${rateLimitToken}`)
        .send(paymentData)
        .expect(200);
      expect(response1.body.success).toBe(true);

      // Second payment - should succeed
      const response2 = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${rateLimitToken}`)
        .send(paymentData)
        .expect(200);
      expect(response2.body.success).toBe(true);

      // Third payment - should succeed
      const response3 = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${rateLimitToken}`)
        .send(paymentData)
        .expect(200);
      expect(response3.body.success).toBe(true);
    });

    it('should reject 4th payment initiation within same hour', async () => {
      const paymentData = {
        amount: 999,
        planId: 'monthly'
      };

      // Fourth payment - should be rate limited
      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${rateLimitToken}`)
        .send(paymentData)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('limit exceeded');
      expect(response.body.retryAfter).toBeDefined();
    });
  });

  describe('3. Payment Verification Polling Mechanism', () => {
    let paymentId;
    let txnId;

    beforeEach(async () => {
      // Create a payment for testing
      const paymentData = {
        amount: 999,
        planId: 'monthly',
        planName: 'Monthly Subscription',
        duration: 30
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData);

      paymentId = response.body.payment.paymentId;
      txnId = response.body.payment.txnId;
    });

    afterEach(async () => {
      // Stop verification for this payment
      paymentVerificationService.stopVerification(paymentId);
      
      // Clean up payment
      await Payment.findByIdAndDelete(paymentId);
    });

    it('should start verification polling automatically after payment initiation', async () => {
      // Wait a moment for verification to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check verification status
      const verificationStatus = paymentVerificationService.getVerificationStatus(paymentId);
      
      expect(verificationStatus).toBeDefined();
      expect(verificationStatus.isActive).toBe(true);
      expect(verificationStatus.attemptCount).toBeGreaterThanOrEqual(0);
    });

    it('should poll Kotak API and update payment status to completed', async () => {
      // Mock successful payment response
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'C',
        message: 'Transaction successful',
        rrn: 'RRN123456789',
        userMessage: 'Payment completed successfully',
        rawResponse: {
          responseCode: '00',
          status: 'C'
        }
      });

      // Wait for polling to occur (at least one poll)
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Check payment status
      const payment = await Payment.findById(paymentId);
      expect(payment.status).toBe('completed');
      expect(payment.rrn).toBe('RRN123456789');
      expect(payment.completedAt).toBeDefined();

      // Verify verification has stopped
      const verificationStatus = paymentVerificationService.getVerificationStatus(paymentId);
      expect(verificationStatus).toBeNull();
    });

    it('should update payment status to failed when Kotak returns failure', async () => {
      // Mock failed payment response
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'F',
        message: 'Transaction failed',
        userMessage: 'Payment failed due to insufficient funds',
        rawResponse: {
          responseCode: '51',
          status: 'F'
        }
      });

      // Wait for polling to occur
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Check payment status
      const payment = await Payment.findById(paymentId);
      expect(payment.status).toBe('failed');
      expect(payment.completedAt).toBeDefined();

      // Verify verification has stopped
      const verificationStatus = paymentVerificationService.getVerificationStatus(paymentId);
      expect(verificationStatus).toBeNull();
    });

    it('should continue polling while payment is pending', async () => {
      // Mock pending payment response
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'P',
        message: 'Transaction pending',
        userMessage: 'Payment is being processed',
        rawResponse: {
          responseCode: '68',
          status: 'P'
        }
      });

      // Wait for a few polls
      await new Promise(resolve => setTimeout(resolve, 12000));

      // Check payment status - should still be pending
      const payment = await Payment.findById(paymentId);
      expect(payment.status).toBe('pending');
      expect(payment.verificationAttempts).toBeGreaterThan(1);

      // Verify verification is still active
      const verificationStatus = paymentVerificationService.getVerificationStatus(paymentId);
      expect(verificationStatus).toBeDefined();
      expect(verificationStatus.isActive).toBe(true);
    });
  });

  describe('4. Subscription Activation on Successful Payment', () => {
    let paymentId;
    let subscriptionDoctor;
    let subscriptionToken;

    beforeAll(async () => {
      // Create test doctor for subscription activation
      subscriptionDoctor = await Doctor.create({
        name: 'Subscription Test Doctor',
        email: 'test.upi.subscription@doctor.com',
        password: 'SubDoc123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        specializations: ['Pediatrics'],
        experienceYears: 12,
        subscriptionStatus: 'pending'
      });

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.upi.subscription@doctor.com',
          password: 'SubDoc123!'
        });
      
      subscriptionToken = loginResponse.body.token;
    });

    afterAll(async () => {
      await Doctor.findByIdAndDelete(subscriptionDoctor._id);
      if (paymentId) {
        await Payment.findByIdAndDelete(paymentId);
      }
    });

    it('should create subscription record when payment completes', async () => {
      // Initiate payment
      const paymentData = {
        amount: 999,
        planId: 'monthly',
        planName: 'Monthly Subscription',
        duration: 30
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${subscriptionToken}`)
        .send(paymentData);

      paymentId = response.body.payment.paymentId;

      // Mock successful payment
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'C',
        message: 'Transaction successful',
        rrn: 'RRN987654321',
        userMessage: 'Payment completed successfully',
        rawResponse: {
          responseCode: '00',
          status: 'C'
        }
      });

      // Wait for verification and subscription activation
      await new Promise(resolve => setTimeout(resolve, 7000));

      // Check subscription created
      const subscription = await Subscription.findOne({ doctorId: subscriptionDoctor._id });
      expect(subscription).toBeDefined();
      expect(subscription.isActive).toBe(true);
      expect(subscription.paymentId.toString()).toBe(paymentId);
      expect(subscription.paymentMethod).toBe('upi');
      expect(subscription.paidAmount).toBe(999);
      expect(subscription.planName).toBe('Monthly Subscription');
    });

    it('should set correct subscription start and expiry dates', async () => {
      const subscription = await Subscription.findOne({ doctorId: subscriptionDoctor._id });
      
      expect(subscription.startDate).toBeDefined();
      expect(subscription.expiryDate).toBeDefined();

      // Calculate expected expiry (30 days from start)
      const expectedExpiry = new Date(subscription.startDate);
      expectedExpiry.setDate(expectedExpiry.getDate() + 30);

      // Allow 1 minute tolerance for test execution time
      const timeDiff = Math.abs(subscription.expiryDate - expectedExpiry);
      expect(timeDiff).toBeLessThan(60000);
    });

    it('should store payment reference in subscription', async () => {
      const subscription = await Subscription.findOne({ doctorId: subscriptionDoctor._id });
      const payment = await Payment.findById(paymentId);

      expect(subscription.transactionId).toBe(payment.txnId);
      expect(subscription.paymentId.toString()).toBe(paymentId);
    });
  });

  describe('5. Timeout Scenarios and Error Handling', () => {
    let timeoutPaymentId;

    afterEach(async () => {
      if (timeoutPaymentId) {
        paymentVerificationService.stopVerification(timeoutPaymentId);
        await Payment.findByIdAndDelete(timeoutPaymentId);
        timeoutPaymentId = null;
      }
    });

    it('should mark payment as timeout after maximum polling duration', async () => {
      // Create payment
      const paymentData = {
        amount: 999,
        planId: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData);

      timeoutPaymentId = response.body.payment.paymentId;

      // Mock pending response that never completes
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'P',
        message: 'Transaction pending',
        userMessage: 'Payment is being processed'
      });

      // Temporarily reduce timeout for testing (modify service instance)
      const originalMaxDuration = paymentVerificationService.maxDurationMs;
      paymentVerificationService.maxDurationMs = 15000; // 15 seconds for test

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 16000));

      // Check payment status
      const payment = await Payment.findById(timeoutPaymentId);
      expect(payment.status).toBe('timeout');
      expect(payment.completedAt).toBeDefined();

      // Verify verification has stopped
      const verificationStatus = paymentVerificationService.getVerificationStatus(timeoutPaymentId);
      expect(verificationStatus).toBeNull();

      // Restore original timeout
      paymentVerificationService.maxDurationMs = originalMaxDuration;
    }, 20000); // Increase test timeout

    it('should handle API errors gracefully and continue polling', async () => {
      // Create payment
      const paymentData = {
        amount: 999,
        planId: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData);

      timeoutPaymentId = response.body.payment.paymentId;

      // Mock API error first, then success
      let callCount = 0;
      kotakPaymentService.checkTransactionStatus.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          // First two calls fail
          return Promise.reject(new Error('Network error'));
        } else {
          // Third call succeeds
          return Promise.resolve({
            status: 'C',
            message: 'Transaction successful',
            rrn: 'RRN111222333',
            userMessage: 'Payment completed successfully',
            rawResponse: {
              responseCode: '00',
              status: 'C'
            }
          });
        }
      });

      // Wait for recovery and completion
      await new Promise(resolve => setTimeout(resolve, 18000));

      // Check payment eventually completed
      const payment = await Payment.findById(timeoutPaymentId);
      expect(payment.status).toBe('completed');
      expect(payment.rrn).toBe('RRN111222333');
    }, 20000);

    it('should handle rejected payment status', async () => {
      // Create payment
      const paymentData = {
        amount: 999,
        planId: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData);

      timeoutPaymentId = response.body.payment.paymentId;

      // Mock rejected payment
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'R',
        message: 'Transaction rejected',
        userMessage: 'Payment rejected by bank',
        rawResponse: {
          responseCode: '05',
          status: 'R'
        }
      });

      // Wait for verification
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Check payment status
      const payment = await Payment.findById(timeoutPaymentId);
      expect(payment.status).toBe('failed');
      expect(payment.completedAt).toBeDefined();
    });
  });

  describe('6. Payment Status Retrieval', () => {
    let statusPaymentId;

    beforeAll(async () => {
      // Create a payment
      const paymentData = {
        amount: 999,
        planId: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData);

      statusPaymentId = response.body.payment.paymentId;
    });

    afterAll(async () => {
      paymentVerificationService.stopVerification(statusPaymentId);
      await Payment.findByIdAndDelete(statusPaymentId);
    });

    it('should retrieve payment status for authenticated doctor', async () => {
      const response = await request(app)
        .get(`/api/payments/${statusPaymentId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.paymentId).toBe(statusPaymentId);
      expect(response.body.payment.status).toBeDefined();
      expect(response.body.payment.amount).toBe(999);
    });

    it('should reject status request without authentication', async () => {
      const response = await request(app)
        .get(`/api/payments/${statusPaymentId}/status`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject status request for payment belonging to different doctor', async () => {
      // Create another doctor
      const otherDoctor = await Doctor.create({
        name: 'Other Doctor',
        email: 'test.upi.other@doctor.com',
        password: 'OtherDoc123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        specializations: ['Surgery'],
        experienceYears: 7,
        subscriptionStatus: 'pending'
      });

      // Login as other doctor
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.upi.other@doctor.com',
          password: 'OtherDoc123!'
        });

      const otherToken = loginResponse.body.token;

      // Try to access first doctor's payment
      const response = await request(app)
        .get(`/api/payments/${statusPaymentId}/status`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');

      // Clean up
      await Doctor.findByIdAndDelete(otherDoctor._id);
    });

    it('should return 404 for non-existent payment', async () => {
      const fakePaymentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/payments/${fakePaymentId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('7. Manual Payment Verification', () => {
    let verifyPaymentId;

    beforeEach(async () => {
      // Create a payment
      const paymentData = {
        amount: 999,
        planId: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData);

      verifyPaymentId = response.body.payment.paymentId;
    });

    afterEach(async () => {
      paymentVerificationService.stopVerification(verifyPaymentId);
      await Payment.findByIdAndDelete(verifyPaymentId);
    });

    it('should manually verify payment and return completed status', async () => {
      // Mock successful payment
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'C',
        message: 'Transaction successful',
        rrn: 'RRN444555666',
        userMessage: 'Payment completed successfully',
        rawResponse: {
          responseCode: '00',
          status: 'C'
        }
      });

      const response = await request(app)
        .post(`/api/payments/${verifyPaymentId}/verify`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.verified).toBe(true);
      expect(response.body.status).toBe('completed');

      // Verify payment updated in database
      const payment = await Payment.findById(verifyPaymentId);
      expect(payment.status).toBe('completed');
      expect(payment.rrn).toBe('RRN444555666');
    });

    it('should return pending status when payment not yet completed', async () => {
      // Mock pending payment
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'P',
        message: 'Transaction pending',
        userMessage: 'Payment is being processed',
        rawResponse: {
          responseCode: '68',
          status: 'P'
        }
      });

      const response = await request(app)
        .post(`/api/payments/${verifyPaymentId}/verify`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.verified).toBe(false);
      expect(response.body.status).toBe('pending');
    });

    it('should return failed status when payment failed', async () => {
      // Mock failed payment
      kotakPaymentService.checkTransactionStatus.mockResolvedValue({
        status: 'F',
        message: 'Transaction failed',
        userMessage: 'Payment failed',
        rawResponse: {
          responseCode: '51',
          status: 'F'
        }
      });

      const response = await request(app)
        .post(`/api/payments/${verifyPaymentId}/verify`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.verified).toBe(false);
      expect(response.body.status).toBe('failed');
    });

    it('should reject manual verification without authentication', async () => {
      const response = await request(app)
        .post(`/api/payments/${verifyPaymentId}/verify`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('8. Different Payment Status Responses', () => {
    it('should handle all Kotak status codes correctly', async () => {
      const statusTests = [
        { status: 'C', expectedStatus: 'completed', description: 'Complete' },
        { status: 'F', expectedStatus: 'failed', description: 'Failed' },
        { status: 'R', expectedStatus: 'failed', description: 'Rejected' },
        { status: 'P', expectedStatus: 'pending', description: 'Pending' }
      ];

      for (const test of statusTests) {
        // Create payment
        const paymentData = {
          amount: 999,
          planId: 'monthly'
        };

        const response = await request(app)
          .post('/api/payments/initiate')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send(paymentData);

        const paymentId = response.body.payment.paymentId;

        // Mock Kotak response
        kotakPaymentService.checkTransactionStatus.mockResolvedValue({
          status: test.status,
          message: `Transaction ${test.description.toLowerCase()}`,
          userMessage: `Payment ${test.description.toLowerCase()}`,
          rawResponse: {
            status: test.status
          }
        });

        // Wait for verification
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Check payment status
        const payment = await Payment.findById(paymentId);
        expect(payment.status).toBe(test.expectedStatus);

        // Clean up
        paymentVerificationService.stopVerification(paymentId);
        await Payment.findByIdAndDelete(paymentId);
      }
    }, 30000);
  });
});
