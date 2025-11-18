/**
 * Simplified Payment Service
 * Focuses on core functionality without external payment gateways
 */

/**
 * Create a simple payment record for testing
 * @param {String} doctorId - Doctor's MongoDB ID
 * @param {Number} amount - Amount in rupees
 * @returns {Object} - Simple payment details
 */
const createSimplePayment = async (doctorId, amount = 30) => {
  try {
    const paymentId = `PAY_${Date.now()}_${doctorId.slice(-4)}`;
    
    return {
      success: true,
      paymentId: paymentId,
      amount: amount,
      currency: 'INR',
      doctorId: doctorId,
      status: 'created'
    };
  } catch (error) {
    console.error('Error creating simple payment:', error);
    throw new Error('Failed to create payment');
  }
};

/**
 * Simulate payment completion
 * @param {String} paymentId - Payment ID
 * @returns {Object} - Payment completion status
 */
const completePayment = async (paymentId) => {
  try {
    return {
      success: true,
      paymentId: paymentId,
      status: 'completed',
      completedAt: new Date()
    };
  } catch (error) {
    console.error('Error completing payment:', error);
    throw new Error('Failed to complete payment');
  }
};

module.exports = {
  createSimplePayment,
  completePayment
};