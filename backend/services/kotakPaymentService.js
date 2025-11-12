const axios = require('axios');
const kotakConfig = require('../config/kotakConfig');
const cryptoService = require('./cryptoService');
const kotakErrorHandler = require('../utils/kotakErrorHandler');
const paymentLogger = require('./paymentLogger');

/**
 * Kotak Payment Service
 * Handles OAuth token management and API integration with Kotak Mahindra Bank UPI API
 */
class KotakPaymentService {
  constructor() {
    this.config = kotakConfig.getConfig();
    this.tokenCache = {
      accessToken: null,
      expiresAt: null
    };
  }

  /**
   * Get user-friendly error message from Kotak error code
   * @param {string} errorCode - Kotak error code
   * @returns {string} - User-friendly error message
   */
  getErrorMessage(errorCode) {
    return kotakErrorHandler.getErrorMessage(errorCode);
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute API call with exponential backoff retry logic
   * @param {Function} apiCall - Async function to execute
   * @param {number} maxRetries - Maximum number of retries
   * @param {string} operationName - Name of operation for logging
   * @returns {Promise<any>} - API call result
   */
  async executeWithRetry(apiCall, maxRetries = null, operationName = 'API call') {
    const retries = maxRetries !== null ? maxRetries : this.config.paymentMaxRetries;
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Calculate exponential backoff delay: 1s, 2s, 4s, 8s...
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
          console.log(`Retry attempt ${attempt}/${retries} for ${operationName} after ${delay}ms delay`);
          await this.sleep(delay);
        }

        const result = await apiCall();
        
        if (attempt > 0) {
          console.log(`${operationName} succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication errors or client errors (4xx except 429)
        if (error.response) {
          const status = error.response.status;
          if (status === 401 || status === 403 || (status >= 400 && status < 500 && status !== 429)) {
            console.error(`${operationName} failed with non-retryable error (${status})`);
            throw error;
          }
        }

        if (attempt === retries) {
          console.error(`${operationName} failed after ${retries + 1} attempts`);
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Get OAuth 2.0 access token from Kotak API
   * Implements token caching and automatic refresh
   * @returns {Promise<string>} - Access token
   */
  async getAccessToken() {
    try {
      // Check if we have a valid cached token
      if (this.tokenCache.accessToken && this.tokenCache.expiresAt) {
        const now = Date.now();
        const bufferTime = 60000; // 1 minute buffer before expiry
        
        if (now < (this.tokenCache.expiresAt - bufferTime)) {
          console.log('Using cached Kotak access token');
          return this.tokenCache.accessToken;
        }
      }

      // Token expired or not available, fetch new token with retry logic
      console.log('Fetching new Kotak access token...');
      
      const token = await this.executeWithRetry(async () => {
        const tokenUrl = `${this.config.baseURL}${this.config.endpoints.token}`;
        
        // Prepare OAuth 2.0 client credentials request
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        
        const response = await axios.post(tokenUrl, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret
          },
          timeout: 30000 // 30 second timeout
        });

        if (!response.data || !response.data.access_token) {
          throw new Error('Invalid token response from Kotak API');
        }

        return response.data;
      }, this.config.paymentMaxRetries, 'Get Access Token');

      // Cache the token with expiry time
      this.tokenCache.accessToken = token.access_token;
      
      // Calculate expiry time (expires_in is in seconds)
      const expiresIn = token.expires_in || 3600; // Default 1 hour
      this.tokenCache.expiresAt = Date.now() + (expiresIn * 1000);

      console.log(`Kotak access token obtained, expires in ${expiresIn} seconds`);
      
      return this.tokenCache.accessToken;
    } catch (error) {
      console.error('Error getting Kotak access token:', error.message);
      
      // Clear cached token on error
      this.tokenCache.accessToken = null;
      this.tokenCache.expiresAt = null;
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          throw new Error('Invalid Kotak API credentials');
        } else if (status === 403) {
          throw new Error('Access forbidden - check Kotak API permissions');
        } else {
          throw new Error(`Kotak token API error: ${data?.error_description || data?.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        throw new Error('Network error connecting to Kotak API');
      } else {
        throw new Error(`Token request failed: ${error.message}`);
      }
    }
  }

  /**
   * Clear cached token (useful for testing or forcing refresh)
   */
  clearTokenCache() {
    this.tokenCache.accessToken = null;
    this.tokenCache.expiresAt = null;
    console.log('Kotak token cache cleared');
  }

  /**
   * Get token cache status (for debugging)
   * @returns {Object} - Token cache status
   */
  getTokenCacheStatus() {
    const now = Date.now();
    return {
      hasToken: !!this.tokenCache.accessToken,
      expiresAt: this.tokenCache.expiresAt,
      isValid: this.tokenCache.expiresAt && now < this.tokenCache.expiresAt,
      timeUntilExpiry: this.tokenCache.expiresAt ? Math.max(0, this.tokenCache.expiresAt - now) : 0
    };
  }

  /**
   * Validate VPA (Virtual Payment Address)
   * Optional method for future use
   * @param {Object} params - VPA validation parameters
   * @param {string} params.vpa - VPA to validate
   * @param {string} params.customerId - Customer ID
   * @returns {Promise<Object>} - Validation response
   */
  async validateVPA({ vpa, customerId }) {
    try {
      // Validate required parameters
      if (!vpa || !customerId) {
        throw new Error('vpa and customerId are required');
      }

      // Get access token
      const accessToken = await this.getAccessToken();

      // Execute API call with retry logic
      const result = await this.executeWithRetry(async () => {
        const apiUrl = `${this.config.baseURL}${this.config.endpoints.validateVPA}`;
        
        const requestBody = {
          vpa,
          customerId,
          aggregatorId: this.config.aggregatorId,
          merchantId: this.config.merchantId
        };

        console.log(`Validating VPA: ${vpa}`);

        const response = await axios.post(apiUrl, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          timeout: 30000
        });

        return response.data;
      }, this.config.paymentMaxRetries, `Validate VPA (${vpa})`);

      return {
        success: result.responseCode === '00',
        valid: result.valid || false,
        responseCode: result.responseCode,
        message: result.message,
        userMessage: this.getErrorMessage(result.responseCode),
        rawResponse: result
      };
    } catch (error) {
      console.error('Error validating VPA:', error.message);
      
      return {
        success: false,
        valid: false,
        error: true,
        message: error.message,
        userMessage: 'Unable to validate VPA'
      };
    }
  }

  /**
   * Check transaction status via Kotak API
   * @param {Object} params - Transaction parameters
   * @param {string} params.txnId - Transaction ID (KMB prefix)
   * @param {string} params.customerId - Customer ID (doctor mobile number)
   * @param {string} params.amount - Transaction amount
   * @returns {Promise<Object>} - Transaction status response
   */
  async checkTransactionStatus({ txnId, customerId, amount }) {
    const startTime = Date.now();
    
    try {
      // Validate required parameters
      if (!txnId || !customerId || !amount) {
        throw new Error('txnId, customerId, and amount are required');
      }

      // Get access token
      const accessToken = await this.getAccessToken();

      // Prepare request parameters
      const type = 'CHECKSTATUS';
      const refId = txnId; // Using txnId as refId
      const orderId = txnId; // Using txnId as orderId
      const dateTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]; // Format: YYYYMMDDTHHmmss
      const aggregatorVPA = this.config.merchantVPA;

      // Generate checksum using CryptoService
      const checksum = cryptoService.generateCheckTransactionChecksum({
        type,
        txnId,
        refId,
        orderId,
        dateTime,
        amount: amount.toString(),
        aggregatorVPA,
        customerId,
        secretKey: this.config.secretKey
      });

      // Prepare request body
      const requestBody = {
        type,
        txnId,
        refId,
        orderId,
        dateTime,
        amount: amount.toString(),
        aggregatorVPA,
        customerId,
        aggregatorId: this.config.aggregatorId,
        merchantId: this.config.merchantId
      };

      // Execute API call with retry logic
      const result = await this.executeWithRetry(async () => {
        // Make API call
        const apiUrl = `${this.config.baseURL}${this.config.endpoints.checkTransactionStatus}`;
        
        console.log(`Checking transaction status for txnId: ${txnId}`);

        const response = await axios.post(apiUrl, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'x-check': checksum
          },
          timeout: 30000 // 30 second timeout
        });

        return response.data;
      }, this.config.paymentMaxRetries, `Check Transaction Status (${txnId})`);

      const duration = Date.now() - startTime;

      // Parse and return response
      console.log(`Transaction status response for ${txnId}:`, {
        status: result.status,
        responseCode: result.responseCode,
        message: result.message
      });

      // Log successful API call
      paymentLogger.logKotakAPICall({
        endpoint: this.config.endpoints.checkTransactionStatus,
        method: 'POST',
        txnId,
        requestData: { ...requestBody, aggregatorId: '***', merchantId: '***' },
        responseData: result,
        duration,
        success: true
      });

      // Map error codes to user-friendly messages
      const userMessage = result.responseCode && result.responseCode !== '00' 
        ? this.getErrorMessage(result.responseCode)
        : result.message;

      return {
        success: result.responseCode === '00' || result.status === 'C',
        status: result.status, // C=Complete, P=Pending, F=Failed, R=Rejected
        responseCode: result.responseCode,
        message: result.message,
        userMessage: userMessage,
        txnId: result.txnId,
        rrn: result.rrn, // Reference number
        amount: result.amount,
        timestamp: result.timestamp,
        rawResponse: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('Error checking transaction status:', error.message);
      
      // Comprehensive error logging
      const errorContext = {
        txnId,
        customerId,
        amount,
        timestamp: new Date().toISOString(),
        errorMessage: error.message
      };

      // Log failed API call
      paymentLogger.logKotakAPICall({
        endpoint: this.config.endpoints.checkTransactionStatus,
        method: 'POST',
        txnId,
        requestData: { txnId, customerId, amount },
        responseData: error.response?.data,
        duration,
        success: false,
        error
      });

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        errorContext.httpStatus = status;
        errorContext.responseData = data;
        
        console.error('Kotak API error response:', errorContext);
        
        const responseCode = data?.responseCode || status.toString();
        const userMessage = this.getErrorMessage(responseCode);
        
        return {
          success: false,
          error: true,
          status: 'ERROR',
          responseCode: responseCode,
          message: data?.message || 'API error',
          userMessage: userMessage,
          rawResponse: data
        };
      } else if (error.request) {
        console.error('Network error:', errorContext);
        
        return {
          success: false,
          error: true,
          status: 'NETWORK_ERROR',
          message: 'Network error connecting to Kotak API',
          userMessage: 'Connection error, please try again'
        };
      } else {
        console.error('Transaction status check error:', errorContext);
        
        return {
          success: false,
          error: true,
          status: 'ERROR',
          message: error.message,
          userMessage: 'An error occurred while checking payment status'
        };
      }
    }
  }
}

module.exports = new KotakPaymentService();
