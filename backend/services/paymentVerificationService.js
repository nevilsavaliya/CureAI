const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const kotakPaymentService = require('./kotakPaymentService');
const paymentLogger = require('./paymentLogger');
const paymentMetrics = require('./paymentMetrics');

/**
 * Payment Verification Service
 * Handles background polling of Kotak API to verify payment status
 * and activates subscriptions upon successful payment
 */
class PaymentVerificationService {
  constructor() {
    // In-memory map to track active verifications
    // Key: paymentId, Value: { intervalId, startTime, attemptCount }
    this.activeVerifications = new Map();
    
    // Configuration
    this.pollIntervalMs = 5000; // 5 seconds
    this.maxDurationMs = 10 * 60 * 1000; // 10 minutes
    this.maxAttempts = Math.floor(this.maxDurationMs / this.pollIntervalMs); // 120 attempts
  }

  /**
   * Start verification polling for a payment
   * @param {string} paymentId - Payment document ID
   * @returns {Promise<void>}
   */
  async startVerification(paymentId) {
    try {
      // Check if verification is already running
      if (this.activeVerifications.has(paymentId)) {
        console.log(`Verification already running for payment ${paymentId}`);
        return;
      }

      // Fetch payment record
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error(`Payment not found: ${paymentId}`);
      }

      // Check if payment is already in final state
      if (['completed', 'failed', 'timeout'].includes(payment.status)) {
        console.log(`Payment ${paymentId} already in final state: ${payment.status}`);
        return;
      }

      console.log(`Starting verification polling for payment ${paymentId} (txnId: ${payment.txnId})`);

      // Initialize verification tracking
      const verificationData = {
        startTime: Date.now(),
        attemptCount: 0,
        intervalId: null
      };

      // Set up polling interval
      verificationData.intervalId = setInterval(async () => {
        await this.pollPaymentStatus(paymentId);
      }, this.pollIntervalMs);

      // Store in active verifications map
      this.activeVerifications.set(paymentId, verificationData);

      // Perform first check immediately
      await this.pollPaymentStatus(paymentId);

    } catch (error) {
      console.error(`Error starting verification for payment ${paymentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Poll Kotak API for payment status
   * @param {string} paymentId - Payment document ID
   * @returns {Promise<void>}
   */
  async pollPaymentStatus(paymentId) {
    try {
      // Get verification data
      const verificationData = this.activeVerifications.get(paymentId);
      if (!verificationData) {
        console.log(`No active verification found for payment ${paymentId}`);
        return;
      }

      // Increment attempt count
      verificationData.attemptCount++;

      // Check timeout
      const elapsedTime = Date.now() - verificationData.startTime;
      if (elapsedTime >= this.maxDurationMs || verificationData.attemptCount > this.maxAttempts) {
        console.log(`Payment ${paymentId} verification timeout after ${verificationData.attemptCount} attempts`);
        await this.handlePaymentTimeout(paymentId);
        return;
      }

      // Fetch payment record
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        console.error(`Payment not found during polling: ${paymentId}`);
        this.stopVerification(paymentId);
        return;
      }

      // Check if payment is already in final state
      if (['completed', 'failed', 'timeout'].includes(payment.status)) {
        console.log(`Payment ${paymentId} already in final state: ${payment.status}`);
        this.stopVerification(paymentId);
        return;
      }

      console.log(`Polling payment status (attempt ${verificationData.attemptCount}/${this.maxAttempts}): ${payment.txnId}`);

      // Log verification poll
      paymentLogger.logVerificationPoll({
        paymentId: paymentId,
        txnId: payment.txnId,
        attemptCount: verificationData.attemptCount,
        maxAttempts: this.maxAttempts,
        status: payment.status,
        elapsedTime: elapsedTime
      });

      // Call Kotak API to check transaction status
      const statusResponse = await kotakPaymentService.checkTransactionStatus({
        txnId: payment.txnId,
        customerId: payment.metadata?.customerId || payment.merchantVPA.split('@')[0],
        amount: payment.amount
      });

      // Update verification attempts in database
      payment.verificationAttempts = verificationData.attemptCount;
      payment.kotakResponse = statusResponse.rawResponse || statusResponse;
      await payment.save();

      // Handle different status responses
      if (statusResponse.status === 'C') {
        // Payment completed
        console.log(`Payment ${paymentId} completed successfully`);
        await this.handlePaymentSuccess(payment, statusResponse);
      } else if (statusResponse.status === 'F' || statusResponse.status === 'R') {
        // Payment failed or rejected
        console.log(`Payment ${paymentId} failed with status: ${statusResponse.status}`);
        await this.handlePaymentFailure(payment, statusResponse.userMessage || statusResponse.message);
      } else if (statusResponse.status === 'P') {
        // Payment still pending, continue polling
        console.log(`Payment ${paymentId} still pending, will check again in ${this.pollIntervalMs / 1000}s`);
      } else if (statusResponse.error) {
        // API error occurred, log but continue polling
        console.warn(`API error while checking payment ${paymentId}:`, statusResponse.message);
        // Increment API error counter
        paymentMetrics.incrementCounter('apiErrors');
        // Don't stop polling on API errors, they might be temporary
      }

    } catch (error) {
      console.error(`Error polling payment status for ${paymentId}:`, error.message);
      // Don't stop polling on errors, they might be temporary network issues
      // The timeout mechanism will eventually stop polling if issues persist
    }
  }

  /**
   * Handle successful payment
   * @param {Object} payment - Payment document
   * @param {Object} kotakResponse - Response from Kotak API
   * @returns {Promise<void>}
   */
  async handlePaymentSuccess(payment, kotakResponse) {
    try {
      const oldStatus = payment.status;
      
      // Update payment record
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.rrn = kotakResponse.rrn || payment.rrn;
      payment.kotakResponse = kotakResponse.rawResponse || kotakResponse;
      await payment.save();

      console.log(`Payment ${payment._id} marked as completed`);

      // Log status change
      paymentLogger.logStatusChange({
        paymentId: payment._id.toString(),
        txnId: payment.txnId,
        oldStatus,
        newStatus: 'completed',
        reason: 'Payment verified successfully',
        verificationAttempts: payment.verificationAttempts
      });

      // Update metrics
      paymentMetrics.incrementCounter('completed');
      paymentMetrics.incrementCounter('completedAmount', payment.amount);

      // Stop verification polling
      this.stopVerification(payment._id.toString());

      // Activate subscription
      await this.activateSubscription(payment);

    } catch (error) {
      console.error(`Error handling payment success for ${payment._id}:`, error.message);
      
      // Log error
      paymentLogger.logPaymentError({
        paymentId: payment._id.toString(),
        txnId: payment.txnId,
        doctorId: payment.doctorId,
        operation: 'handlePaymentSuccess',
        error,
        context: { kotakResponse }
      });
      
      throw error;
    }
  }

  /**
   * Handle failed payment
   * @param {Object} payment - Payment document
   * @param {string} reason - Failure reason
   * @returns {Promise<void>}
   */
  async handlePaymentFailure(payment, reason) {
    try {
      const oldStatus = payment.status;
      
      // Update payment record
      payment.status = 'failed';
      payment.completedAt = new Date();
      
      // Add failure reason to kotakResponse if not already present
      if (!payment.kotakResponse) {
        payment.kotakResponse = {};
      }
      payment.kotakResponse.failureReason = reason;
      
      await payment.save();

      console.log(`Payment ${payment._id} marked as failed: ${reason}`);

      // Log status change
      paymentLogger.logStatusChange({
        paymentId: payment._id.toString(),
        txnId: payment.txnId,
        oldStatus,
        newStatus: 'failed',
        reason,
        verificationAttempts: payment.verificationAttempts
      });

      // Update metrics
      paymentMetrics.incrementCounter('failed');

      // Stop verification polling
      this.stopVerification(payment._id.toString());

    } catch (error) {
      console.error(`Error handling payment failure for ${payment._id}:`, error.message);
      
      // Log error
      paymentLogger.logPaymentError({
        paymentId: payment._id.toString(),
        txnId: payment.txnId,
        doctorId: payment.doctorId,
        operation: 'handlePaymentFailure',
        error,
        context: { reason }
      });
      
      throw error;
    }
  }

  /**
   * Handle payment timeout
   * @param {string} paymentId - Payment document ID
   * @returns {Promise<void>}
   */
  async handlePaymentTimeout(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        console.error(`Payment not found during timeout handling: ${paymentId}`);
        this.stopVerification(paymentId);
        return;
      }

      const verificationData = this.activeVerifications.get(paymentId);
      const elapsedTime = verificationData ? Date.now() - verificationData.startTime : 0;

      // Only update if still pending
      if (payment.status === 'pending') {
        const oldStatus = payment.status;
        
        payment.status = 'timeout';
        payment.completedAt = new Date();
        
        if (!payment.kotakResponse) {
          payment.kotakResponse = {};
        }
        payment.kotakResponse.timeoutReason = 'Payment verification exceeded maximum duration';
        
        await payment.save();

        console.log(`Payment ${paymentId} marked as timeout after ${payment.verificationAttempts} attempts`);

        // Log timeout
        paymentLogger.logVerificationTimeout({
          paymentId,
          txnId: payment.txnId,
          attemptCount: payment.verificationAttempts,
          elapsedTime
        });

        // Log status change
        paymentLogger.logStatusChange({
          paymentId,
          txnId: payment.txnId,
          oldStatus,
          newStatus: 'timeout',
          reason: 'Verification timeout',
          verificationAttempts: payment.verificationAttempts
        });

        // Update metrics
        paymentMetrics.incrementCounter('timeout');
      }

      // Stop verification polling
      this.stopVerification(paymentId);

    } catch (error) {
      console.error(`Error handling payment timeout for ${paymentId}:`, error.message);
      
      // Log error
      if (payment) {
        paymentLogger.logPaymentError({
          paymentId,
          txnId: payment.txnId,
          doctorId: payment.doctorId,
          operation: 'handlePaymentTimeout',
          error,
          context: {}
        });
      }
      
      // Still stop verification even if update fails
      this.stopVerification(paymentId);
    }
  }

  /**
   * Activate subscription after successful payment
   * @param {Object} payment - Payment document
   * @returns {Promise<Object>} - Created subscription
   */
  async activateSubscription(payment) {
    try {
      console.log(`Activating subscription for doctor ${payment.doctorId}`);

      // Calculate subscription dates
      const startDate = new Date();
      const duration = payment.metadata?.duration || 30; // Default 30 days
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + duration);

      // Check if subscription already exists
      let subscription = await Subscription.findOne({ doctorId: payment.doctorId });

      if (subscription) {
        // Update existing subscription
        console.log(`Updating existing subscription for doctor ${payment.doctorId}`);
        
        subscription.planName = payment.metadata?.planName || subscription.planName;
        subscription.planPrice = payment.amount;
        subscription.startDate = startDate;
        subscription.expiryDate = expiryDate;
        subscription.isActive = true;
        subscription.paymentId = payment._id;
        subscription.paymentMethod = 'upi';
        subscription.transactionId = payment.txnId;
        subscription.paidAmount = payment.amount;
        
        await subscription.save();
      } else {
        // Create new subscription
        console.log(`Creating new subscription for doctor ${payment.doctorId}`);
        
        subscription = new Subscription({
          doctorId: payment.doctorId,
          planName: payment.metadata?.planName || 'Monthly Plan',
          planPrice: payment.amount,
          startDate: startDate,
          expiryDate: expiryDate,
          isActive: true,
          paymentId: payment._id,
          paymentMethod: 'upi',
          transactionId: payment.txnId,
          paidAmount: payment.amount
        });
        
        await subscription.save();
      }

      console.log(`Subscription activated successfully for doctor ${payment.doctorId}, expires on ${expiryDate.toISOString()}`);

      // Update Doctor model subscription status
      const Doctor = require('../models/Doctor');
      await Doctor.findByIdAndUpdate(payment.doctorId, {
        subscriptionStatus: 'active',
        subscriptionStartDate: startDate,
        subscriptionExpiryDate: expiryDate,
        'paymentInfo.transactionId': payment.txnId,
        'paymentInfo.amount': payment.amount,
        'paymentInfo.paymentDate': startDate
      });

      console.log(`Doctor ${payment.doctorId} subscription status updated to active`);

      // Log subscription activation
      paymentLogger.logSubscriptionActivation({
        paymentId: payment._id.toString(),
        txnId: payment.txnId,
        doctorId: payment.doctorId,
        subscriptionId: subscription._id,
        planName: subscription.planName,
        expiryDate: expiryDate.toISOString()
      });

      return subscription;

    } catch (error) {
      console.error(`Error activating subscription for payment ${payment._id}:`, error.message);
      
      // Log error
      paymentLogger.logPaymentError({
        paymentId: payment._id.toString(),
        txnId: payment.txnId,
        doctorId: payment.doctorId,
        operation: 'activateSubscription',
        error,
        context: { duration: payment.metadata?.duration }
      });
      
      throw error;
    }
  }

  /**
   * Stop verification polling for a payment
   * @param {string} paymentId - Payment document ID
   * @returns {void}
   */
  stopVerification(paymentId) {
    const verificationData = this.activeVerifications.get(paymentId);
    
    if (verificationData) {
      // Clear the interval
      if (verificationData.intervalId) {
        clearInterval(verificationData.intervalId);
        console.log(`Stopped verification polling for payment ${paymentId}`);
      }
      
      // Remove from active verifications
      this.activeVerifications.delete(paymentId);
      
      console.log(`Cleaned up verification data for payment ${paymentId}`);
    }
  }

  /**
   * Get active verification status
   * @param {string} paymentId - Payment document ID
   * @returns {Object|null} - Verification status or null if not active
   */
  getVerificationStatus(paymentId) {
    const verificationData = this.activeVerifications.get(paymentId);
    
    if (!verificationData) {
      return null;
    }

    const elapsedTime = Date.now() - verificationData.startTime;
    const remainingTime = Math.max(0, this.maxDurationMs - elapsedTime);

    return {
      isActive: true,
      attemptCount: verificationData.attemptCount,
      maxAttempts: this.maxAttempts,
      elapsedTimeMs: elapsedTime,
      remainingTimeMs: remainingTime,
      startTime: new Date(verificationData.startTime).toISOString()
    };
  }

  /**
   * Get all active verifications (for monitoring/debugging)
   * @returns {Array} - List of active verification statuses
   */
  getAllActiveVerifications() {
    const activeList = [];
    
    for (const [paymentId, verificationData] of this.activeVerifications.entries()) {
      const elapsedTime = Date.now() - verificationData.startTime;
      const remainingTime = Math.max(0, this.maxDurationMs - elapsedTime);
      
      activeList.push({
        paymentId,
        attemptCount: verificationData.attemptCount,
        maxAttempts: this.maxAttempts,
        elapsedTimeMs: elapsedTime,
        remainingTimeMs: remainingTime,
        startTime: new Date(verificationData.startTime).toISOString()
      });
    }
    
    return activeList;
  }

  /**
   * Stop all active verifications (useful for graceful shutdown)
   * @returns {number} - Number of verifications stopped
   */
  stopAllVerifications() {
    const count = this.activeVerifications.size;
    
    for (const paymentId of this.activeVerifications.keys()) {
      this.stopVerification(paymentId);
    }
    
    console.log(`Stopped ${count} active verifications`);
    return count;
  }
}

// Export singleton instance
module.exports = new PaymentVerificationService();
