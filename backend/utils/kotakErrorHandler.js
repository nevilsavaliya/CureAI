/**
 * Kotak Payment Error Handler Utility
 * Provides comprehensive error code mapping and user-friendly error messages
 */

/**
 * Kotak API Error Code Mappings
 * Maps Kotak error codes to user-friendly messages
 */
const KOTAK_ERROR_CODES = {
  '00': 'Success',
  '03': 'Merchant VPA not found',
  '04': 'Merchant not found',
  '91': 'Payment timeout',
  '111': 'Invalid or empty parameter',
  'OL01': 'Merchant reference ID not found',
  'OL16': 'Invalid merchant ID or aggregator ID',
  'OL95': 'Invalid IP address',
  'OL96': 'Key value is null',
  'UO1': 'Duplicate request',
  'XP': 'Transaction not permitted'
};

/**
 * Payment Status Mappings
 * Maps Kotak payment status codes to user-friendly descriptions
 */
const PAYMENT_STATUS_MESSAGES = {
  'C': 'Payment completed successfully',
  'P': 'Payment is pending',
  'F': 'Payment failed',
  'R': 'Payment was rejected',
  'TIMEOUT': 'Payment verification timed out',
  'ERROR': 'An error occurred during payment processing',
  'NETWORK_ERROR': 'Network connection error'
};

/**
 * Get user-friendly error message from Kotak error code
 * @param {string} errorCode - Kotak error code
 * @returns {string} - User-friendly error message
 */
function getErrorMessage(errorCode) {
  if (!errorCode) {
    return 'Unknown error occurred';
  }
  
  return KOTAK_ERROR_CODES[errorCode] || `Unknown error (code: ${errorCode})`;
}

/**
 * Get user-friendly message for payment status
 * @param {string} status - Payment status code (C, P, F, R, etc.)
 * @returns {string} - User-friendly status message
 */
function getStatusMessage(status) {
  if (!status) {
    return 'Unknown payment status';
  }
  
  return PAYMENT_STATUS_MESSAGES[status] || `Unknown status: ${status}`;
}

/**
 * Format error response for API
 * @param {string} errorCode - Kotak error code
 * @param {string} technicalMessage - Technical error message (optional)
 * @returns {Object} - Formatted error response
 */
function formatErrorResponse(errorCode, technicalMessage = null) {
  return {
    success: false,
    error: true,
    errorCode: errorCode,
    message: getErrorMessage(errorCode),
    technicalMessage: technicalMessage,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format payment status response for API
 * @param {string} status - Payment status code
 * @param {Object} additionalData - Additional data to include (optional)
 * @returns {Object} - Formatted status response
 */
function formatStatusResponse(status, additionalData = {}) {
  return {
    success: status === 'C',
    status: status,
    message: getStatusMessage(status),
    ...additionalData,
    timestamp: new Date().toISOString()
  };
}

/**
 * Determine if error is retryable
 * @param {string} errorCode - Kotak error code
 * @returns {boolean} - True if error is retryable
 */
function isRetryableError(errorCode) {
  // Network errors and timeouts are retryable
  const retryableCodes = ['91', 'NETWORK_ERROR', 'TIMEOUT'];
  return retryableCodes.includes(errorCode);
}

/**
 * Determine if payment status is final (no further polling needed)
 * @param {string} status - Payment status code
 * @returns {boolean} - True if status is final
 */
function isFinalStatus(status) {
  const finalStatuses = ['C', 'F', 'R', 'TIMEOUT', 'ERROR'];
  return finalStatuses.includes(status);
}

/**
 * Get recommended action for user based on error code
 * @param {string} errorCode - Kotak error code
 * @returns {string} - Recommended action message
 */
function getRecommendedAction(errorCode) {
  const actions = {
    '03': 'Please contact support to verify merchant configuration.',
    '04': 'Please contact support to verify merchant setup.',
    '91': 'Your payment may still be processing. Please check your UPI app or try verifying the payment status again in a few minutes.',
    '111': 'Please try initiating the payment again.',
    'OL01': 'Please try initiating a new payment.',
    'OL16': 'Please contact support for assistance.',
    'OL95': 'Please contact support for assistance.',
    'OL96': 'Please try again or contact support if the issue persists.',
    'UO1': 'A payment with this transaction ID already exists. Please refresh the page.',
    'XP': 'This transaction is not permitted. Please contact support.',
    'NETWORK_ERROR': 'Please check your internet connection and try again.',
    'TIMEOUT': 'Payment verification timed out. If you completed the payment, please use the "Check Status" button to verify.'
  };
  
  return actions[errorCode] || 'Please try again or contact support if the issue persists.';
}

/**
 * Create comprehensive error object with all details
 * @param {string} errorCode - Kotak error code
 * @param {string} technicalMessage - Technical error message (optional)
 * @param {Object} context - Additional context (optional)
 * @returns {Object} - Comprehensive error object
 */
function createErrorObject(errorCode, technicalMessage = null, context = {}) {
  return {
    errorCode: errorCode,
    userMessage: getErrorMessage(errorCode),
    technicalMessage: technicalMessage,
    recommendedAction: getRecommendedAction(errorCode),
    isRetryable: isRetryableError(errorCode),
    timestamp: new Date().toISOString(),
    context: context
  };
}

/**
 * Log error with context
 * @param {string} operation - Operation name
 * @param {Object} error - Error object
 * @param {Object} context - Additional context
 */
function logError(operation, error, context = {}) {
  const errorLog = {
    operation: operation,
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    context: context
  };
  
  console.error(`[Kotak Payment Error] ${operation}:`, JSON.stringify(errorLog, null, 2));
}

module.exports = {
  KOTAK_ERROR_CODES,
  PAYMENT_STATUS_MESSAGES,
  getErrorMessage,
  getStatusMessage,
  formatErrorResponse,
  formatStatusResponse,
  isRetryableError,
  isFinalStatus,
  getRecommendedAction,
  createErrorObject,
  logError
};
