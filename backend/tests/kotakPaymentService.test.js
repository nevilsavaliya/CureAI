/**
 * KotakPaymentService Unit Tests
 * Tests for OAuth token management, API integration, and error handling
 */

const kotakPaymentService = require('../services/kotakPaymentService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

// Mock dependencies
jest.mock('../config/kotakConfig', () => ({
  getConfig: () => ({
    baseURL: 'https://test-api.kotak.com',
    endpoints: {
      token: '/oauth/token',
      checkTransactionStatus: '/api/v1/checkstatus',
      validateVPA: '/api/v1/validatevpa'
    },
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    merchantVPA: 'test@kotak',
    merchantMobile: '919876543210',
    aggregatorId: 'AGG001',
    merchantId: 'MER001',
    secretKey: '0123456789abcdef0123456789abcdef',
    paymentMaxRetries: 3
  })
}));

jest.mock('../services/cryptoService', () => ({
  generateCheckTransactionChecksum: jest.fn(() => 'mock-checksum-base64')
}));

jest.mock('../utils/kotakErrorHandler', () => ({
  getErrorMessage: jest.fn((code) => {
    const messages = {
      '00': 'Success',
      '03': 'Merchant VPA not found',
      '91': 'Timeout'
    };
    return messages[code] || 'Unknown error';
  })
}));

jest.mock('../services/paymentLogger', () => ({
  logKotakAPICall: jest.fn()
}));

describe('KotakPaymentService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear token cache
    kotakPaymentService.clearTokenCache();
    
    // Reset axios mock to default implementation
    axios.post.mockReset();
  });

  describe('getAccessToken', () => {
    test('should fetch new access token successfully', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-access-token-123',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      };

      axios.post.mockResolvedValueOnce(mockTokenResponse);

      const token = await kotakPaymentService.getAccessToken();

      expect(token).toBe('test-access-token-123');
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        'https://test-api.kotak.com/oauth/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          auth: {
            username: 'test-client-id',
            password: 'test-client-secret'
          }
        })
      );
    });

    test('should cache token and reuse it', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'cached-token',
          expires_in: 3600
        }
      };

      axios.post.mockResolvedValueOnce(mockTokenResponse);

      // First call - should fetch token
      const token1 = await kotakPaymentService.getAccessToken();
      expect(token1).toBe('cached-token');
      expect(axios.post).toHaveBeenCalledTimes(1);

      // Second call - should use cached token
      const token2 = await kotakPaymentService.getAccessToken();
      expect(token2).toBe('cached-token');
      expect(axios.post).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    test('should refresh token when expired', async () => {
      const mockTokenResponse1 = {
        data: {
          access_token: 'token-1',
          expires_in: 1 // Expires in 1 second
        }
      };

      const mockTokenResponse2 = {
        data: {
          access_token: 'token-2',
          expires_in: 3600
        }
      };

      axios.post
        .mockResolvedValueOnce(mockTokenResponse1)
        .mockResolvedValueOnce(mockTokenResponse2);

      // First call
      const token1 = await kotakPaymentService.getAccessToken();
      expect(token1).toBe('token-1');

      // Wait for token to expire (1 second + buffer)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second call - should fetch new token
      const token2 = await kotakPaymentService.getAccessToken();
      expect(token2).toBe('token-2');
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    test('should handle 401 authentication error', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'invalid_client' }
        }
      });

      await expect(kotakPaymentService.getAccessToken())
        .rejects.toThrow('Invalid Kotak API credentials');
    });

    test('should handle network error', async () => {
      axios.post.mockRejectedValueOnce({
        request: {},
        message: 'Network error',
        response: undefined
      });

      await expect(kotakPaymentService.getAccessToken())
        .rejects.toThrow();
    });

    test('should retry on server error', async () => {
      axios.post
        .mockRejectedValueOnce({
          response: { status: 500, data: {} }
        })
        .mockResolvedValueOnce({
          data: {
            access_token: 'retry-token',
            expires_in: 3600
          }
        });

      const token = await kotakPaymentService.getAccessToken();
      
      expect(token).toBe('retry-token');
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearTokenCache', () => {
    test('should clear cached token', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-token',
          expires_in: 3600
        }
      };

      axios.post.mockResolvedValue(mockTokenResponse);

      // Get token
      await kotakPaymentService.getAccessToken();
      expect(axios.post).toHaveBeenCalledTimes(1);

      // Clear cache
      kotakPaymentService.clearTokenCache();

      // Get token again - should fetch new one
      await kotakPaymentService.getAccessToken();
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTokenCacheStatus', () => {
    test('should return cache status', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-token',
          expires_in: 3600
        }
      };

      axios.post.mockResolvedValueOnce(mockTokenResponse);

      // Before getting token
      let status = kotakPaymentService.getTokenCacheStatus();
      expect(status.hasToken).toBe(false);

      // After getting token
      await kotakPaymentService.getAccessToken();
      status = kotakPaymentSice.getAccessToken();
      status = kotakPaymentService.getTokenCacheStatus();
      expect(status.hasToken).toBe(true);
      expect(status.isValid).toBe(true);
      expect(status.timeUntilExpiry).toBeGreaterThan(0);
    });
  });

  describe('checkTransactionStatus', () => {
    beforeEach(() => {
      // Mock token response for all tests
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: {
              access_token: 'test-token',
              expires_in: 3600
            }
          });
        }
        if (url.includes('/checkstatus')) {
          return Promise.resolve({
            data: {
              status: 'C',
              responseCode: '00',
              message: 'Success',
              txnId: 'KMB123456'
            }
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });
    });

    test('should check transaction status successfully', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: { access_token: 'test-token', expires_in: 3600 }
          });
        }
        return Promise.resolve({
          data: {
            status: 'C',
            responseCode: '00',
            message: 'Transaction completed',
            txnId: 'KMB123456',
            rrn: 'RRN123456789',
            amount: '999',
            timestamp: '2023-11-15T12:00:00Z'
          }
        });
      });

      const result = await kotakPaymentService.checkTransactionStatus({
        txnId: 'KMB123456',
        customerId: '919876543210',
        amount: 999
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('C');
      expect(result.responseCode).toBe('00');
      expect(result.txnId).toBe('KMB123456');
      expect(result.rrn).toBe('RRN123456789');
    });

    test('should handle pending transaction', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: { access_token: 'test-token', expires_in: 3600 }
          });
        }
        return Promise.resolve({
          data: {
            status: 'P',
            responseCode: '00',
            message: 'Transaction pending',
            txnId: 'KMB123456'
          }
        });
      });

      const result = await kotakPaymentService.checkTransactionStatus({
        txnId: 'KMB123456',
        customerId: '919876543210',
        amount: 999
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('P');
    });

    test('should handle failed transaction', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: { access_token: 'test-token', expires_in: 3600 }
          });
        }
        return Promise.resolve({
          data: {
            status: 'F',
            responseCode: '91',
            message: 'Transaction failed',
            txnId: 'KMB123456'
          }
        });
      });

      const result = await kotakPaymentService.checkTransactionStatus({
        txnId: 'KMB123456',
        customerId: '919876543210',
        amount: 999
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('F');
      expect(result.responseCode).toBe('91');
    });

    test('should return error for missing parameters', async () => {
      const result = await kotakPaymentService.checkTransactionStatus({
        txnId: 'KMB123456',
        customerId: '919876543210'
        // missing amount
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain('required');
    });

    test('should handle API error response', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: { access_token: 'test-token', expires_in: 3600 }
          });
        }
        return Promise.reject({
          response: {
            status: 400,
            data: {
              responseCode: '03',
              message: 'Merchant VPA not found'
            }
          }
        });
      });

      const result = await kotakPaymentService.checkTransactionStatus({
        txnId: 'KMB123456',
        customerId: '919876543210',
        amount: 999
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.status).toBe('ERROR');
    });

    test('should handle network error', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: { access_token: 'test-token', expires_in: 3600 }
          });
        }
        return Promise.reject({
          request: {},
          message: 'Network error'
        });
      });

      const result = await kotakPaymentService.checkTransactionStatus({
        txnId: 'KMB123456',
        customerId: '919876543210',
        amount: 999
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.status).toBe('NETWORK_ERROR');
      expect(result.userMessage).toBe('Connection error, please try again');
    });

    test('should retry on transient errors', async () => {
      let callCount = 0;
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: { access_token: 'test-token', expires_in: 3600 }
          });
        }
        callCount++;
        if (callCount === 1) {
          return Promise.reject({
            response: { status: 500, data: {} }
          });
        }
        return Promise.resolve({
          data: {
            status: 'C',
            responseCode: '00',
            message: 'Success',
            txnId: 'KMB123456'
          }
        });
      });

      const result = await kotakPaymentService.checkTransactionStatus({
        txnId: 'KMB123456',
        customerId: '919876543210',
        amount: 999
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('C');
    });
  });

  describe('validateVPA', () => {
    test('should validate VPA successfully', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: { access_token: 'test-token', expires_in: 3600 }
          });
        }
        return Promise.resolve({
          data: {
            responseCode: '00',
            valid: true,
            message: 'VPA is valid'
          }
        });
      });

      const result = await kotakPaymentService.validateVPA({
        vpa: 'test@upi',
        customerId: '919876543210'
      });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.responseCode).toBe('00');
    });

    test('should handle invalid VPA', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/oauth/token')) {
          return Promise.resolve({
            data: { access_token: 'test-token', expires_in: 3600 }
          });
        }
        return Promise.resolve({
          data: {
            responseCode: '03',
            valid: false,
            message: 'VPA not found'
          }
        });
      });

      const result = await kotakPaymentService.validateVPA({
        vpa: 'invalid@upi',
        customerId: '919876543210'
      });

      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
    });

    test('should return error for missing parameters', async () => {
      const result = await kotakPaymentService.validateVPA({
        vpa: 'test@upi'
        // missing customerId
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
    });
  });

  describe('executeWithRetry', () => {
    test('should execute function successfully on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await kotakPaymentService.executeWithRetry(mockFn, 3, 'Test operation');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('success');

      const result = await kotakPaymentService.executeWithRetry(mockFn, 3, 'Test operation');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should not retry on 401 error', async () => {
      const mockFn = jest.fn().mockRejectedValue({
        response: { status: 401 }
      });

      await expect(
        kotakPaymentService.executeWithRetry(mockFn, 3, 'Test operation')
      ).rejects.toMatchObject({
        response: { status: 401 }
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should exhaust retries and throw error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(
        kotakPaymentService.executeWithRetry(mockFn, 2, 'Test operation')
      ).rejects.toThrow('Persistent error');

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('getErrorMessage', () => {
    test('should return user-friendly error message', () => {
      expect(kotakPaymentService.getErrorMessage('00')).toBe('Success');
      expect(kotakPaymentService.getErrorMessage('03')).toBe('Merchant VPA not found');
      expect(kotakPaymentService.getErrorMessage('91')).toBe('Timeout');
    });
  });
});
