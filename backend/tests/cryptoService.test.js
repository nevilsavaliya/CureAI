/**
 * CryptoService Unit Tests
 * Tests for SHA-256 hashing, AES encryption, and checksum generation
 */

const cryptoService = require('../services/cryptoService');
const crypto = require('crypto');

describe('CryptoService', () => {
  describe('sha256', () => {
    test('should generate SHA-256 hash for known input', () => {
      const input = 'test123';
      const expectedHash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
      
      const result = cryptoService.sha256(input);
      
      expect(result).toBe(expectedHash);
      expect(result).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    test('should generate consistent hash for same input', () => {
      const input = 'consistent-test';
      
      const hash1 = cryptoService.sha256(input);
      const hash2 = cryptoService.sha256(input);
      
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different inputs', () => {
      const input1 = 'test1';
      const input2 = 'test2';
      
      const hash1 = cryptoService.sha256(input1);
      const hash2 = cryptoService.sha256(input2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should throw error for empty input', () => {
      expect(() => cryptoService.sha256('')).toThrow('Data is required for SHA-256 hashing');
      expect(() => cryptoService.sha256(null)).toThrow('Data is required for SHA-256 hashing');
      expect(() => cryptoService.sha256(undefined)).toThrow('Data is required for SHA-256 hashing');
    });

    test('should handle special characters', () => {
      const input = 'test@#$%^&*()_+{}[]|\\:";\'<>?,./';
      const result = cryptoService.sha256(input);
      
      expect(result).toHaveLength(64);
      expect(typeof result).toBe('string');
    });
  });

  describe('hexStringToByteArray', () => {
    test('should convert valid hex string to buffer', () => {
      const hexString = '48656c6c6f'; // "Hello" in hex
      const result = cryptoService.hexStringToByteArray(hexString);
      
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString('utf8')).toBe('Hello');
    });

    test('should throw error for invalid hex string', () => {
      expect(() => cryptoService.hexStringToByteArray('xyz')).toThrow('Invalid hex string');
      expect(() => cryptoService.hexStringToByteArray('12g')).toThrow('Invalid hex string');
    });

    test('should throw error for odd-length hex string', () => {
      expect(() => cryptoService.hexStringToByteArray('123')).toThrow('Invalid hex string');
    });

    test('should throw error for empty input', () => {
      expect(() => cryptoService.hexStringToByteArray('')).toThrow('Invalid hex string');
      expect(() => cryptoService.hexStringToByteArray(null)).toThrow('Invalid hex string');
    });
  });

  describe('aesEncrypt', () => {
    test('should encrypt data with AES-128-CBC', () => {
      // 16-byte key (32 hex characters)
      const key = '0123456789abcdef0123456789abcdef';
      // Sample data hash (64 hex characters)
      const data = 'a'.repeat(64);
      
      const result = cryptoService.aesEncrypt(key, data);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Result should be base64 encoded
      expect(() => Buffer.from(result, 'base64')).not.toThrow();
    });

    test('should produce consistent output for same inputs', () => {
      const key = '0123456789abcdef0123456789abcdef';
      const data = 'b'.repeat(64);
      
      const result1 = cryptoService.aesEncrypt(key, data);
      const result2 = cryptoService.aesEncrypt(key, data);
      
      // With zero IV, same inputs should produce same output
      expect(result1).toBe(result2);
    });

    test('should throw error for missing key', () => {
      const data = 'a'.repeat(64);
      
      expect(() => cryptoService.aesEncrypt(null, data)).toThrow('Key and data are required for AES encryption');
      expect(() => cryptoService.aesEncrypt('', data)).toThrow('Key and data are required for AES encryption');
    });

    test('should throw error for missing data', () => {
      const key = '0123456789abcdef0123456789abcdef';
      
      expect(() => cryptoService.aesEncrypt(key, null)).toThrow('Key and data are required for AES encryption');
      expect(() => cryptoService.aesEncrypt(key, '')).toThrow('Key and data are required for AES encryption');
    });

    test('should throw error for invalid hex key', () => {
      const key = 'invalid-key';
      const data = 'a'.repeat(64);
      
      expect(() => cryptoService.aesEncrypt(key, data)).toThrow();
    });
  });

  describe('generateChecksum', () => {
    test('should generate checksum from input string and secret key', () => {
      const inputString = 'test-input-string';
      const secretKey = '0123456789abcdef0123456789abcdef';
      
      const result = cryptoService.generateChecksum(inputString, secretKey);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Should be base64 encoded
      expect(() => Buffer.from(result, 'base64')).not.toThrow();
    });

    test('should generate consistent checksum for same inputs', () => {
      const inputString = 'consistent-test';
      const secretKey = '0123456789abcdef0123456789abcdef';
      
      const checksum1 = cryptoService.generateChecksum(inputString, secretKey);
      const checksum2 = cryptoService.generateChecksum(inputString, secretKey);
      
      expect(checksum1).toBe(checksum2);
    });

    test('should generate different checksums for different inputs', () => {
      const secretKey = '0123456789abcdef0123456789abcdef';
      
      const checksum1 = cryptoService.generateChecksum('input1', secretKey);
      const checksum2 = cryptoService.generateChecksum('input2', secretKey);
      
      expect(checksum1).not.toBe(checksum2);
    });

    test('should throw error for missing parameters', () => {
      const secretKey = '0123456789abcdef0123456789abcdef';
      
      expect(() => cryptoService.generateChecksum('', secretKey)).toThrow('Input string and secret key are required');
      expect(() => cryptoService.generateChecksum('test', '')).toThrow('Input string and secret key are required');
      expect(() => cryptoService.generateChecksum(null, secretKey)).toThrow('Input string and secret key are required');
    });
  });

  describe('generateCheckTransactionChecksum', () => {
    const validParams = {
      type: 'CHECKSTATUS',
      txnId: 'KMB123456789',
      refId: 'REF123',
      orderId: 'ORD123',
      dateTime: '20231115T120000',
      amount: '999',
      aggregatorVPA: 'merchant@kotak',
      customerId: '919876543210',
      secretKey: '0123456789abcdef0123456789abcdef'
    };

    test('should generate checksum with all required parameters', () => {
      const result = cryptoService.generateCheckTransactionChecksum(validParams);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Should be base64 encoded
      expect(() => Buffer.from(result, 'base64')).not.toThrow();
    });

    test('should generate consistent checksum for same parameters', () => {
      const checksum1 = cryptoService.generateCheckTransactionChecksum(validParams);
      const checksum2 = cryptoService.generateCheckTransactionChecksum(validParams);
      
      expect(checksum1).toBe(checksum2);
    });

    test('should generate different checksums for different transaction IDs', () => {
      const params1 = { ...validParams, txnId: 'KMB111' };
      const params2 = { ...validParams, txnId: 'KMB222' };
      
      const checksum1 = cryptoService.generateCheckTransactionChecksum(params1);
      const checksum2 = cryptoService.generateCheckTransactionChecksum(params2);
      
      expect(checksum1).not.toBe(checksum2);
    });

    test('should throw error for missing type', () => {
      const params = { ...validParams };
      delete params.type;
      
      expect(() => cryptoService.generateCheckTransactionChecksum(params))
        .toThrow('All parameters are required for checksum generation');
    });

    test('should throw error for missing txnId', () => {
      const params = { ...validParams };
      delete params.txnId;
      
      expect(() => cryptoService.generateCheckTransactionChecksum(params))
        .toThrow('All parameters are required for checksum generation');
    });

    test('should throw error for missing amount', () => {
      const params = { ...validParams };
      delete params.amount;
      
      expect(() => cryptoService.generateCheckTransactionChecksum(params))
        .toThrow('All parameters are required for checksum generation');
    });

    test('should throw error for missing secretKey', () => {
      const params = { ...validParams };
      delete params.secretKey;
      
      expect(() => cryptoService.generateCheckTransactionChecksum(params))
        .toThrow('All parameters are required for checksum generation');
    });

    test('should handle numeric amount parameter', () => {
      const params = { ...validParams, amount: 999 };
      
      // Should convert to string internally
      const result = cryptoService.generateCheckTransactionChecksum(params);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Integration: Full checksum flow', () => {
    test('should complete full checksum generation flow', () => {
      const params = {
        type: 'CHECKSTATUS',
        txnId: 'KMB987654321',
        refId: 'KMB987654321',
        orderId: 'KMB987654321',
        dateTime: '20231115T143000',
        amount: '1499',
        aggregatorVPA: 'test@kotak',
        customerId: '919999999999',
        secretKey: 'fedcba9876543210fedcba9876543210'
      };

      // Generate checksum
      const checksum = cryptoService.generateCheckTransactionChecksum(params);
      
      // Verify checksum properties
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
      
      // Verify it's valid base64
      const decoded = Buffer.from(checksum, 'base64');
      expect(decoded.length).toBeGreaterThan(0);
      
      // Verify consistency
      const checksum2 = cryptoService.generateCheckTransactionChecksum(params);
      expect(checksum).toBe(checksum2);
    });
  });
});
