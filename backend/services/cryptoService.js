const crypto = require('crypto');

/**
 * Crypto Service for Kotak UPI Payment Integration
 * Handles SHA-256 hashing, AES encryption, and checksum generation
 * as per Kotak Mahindra Bank API specifications
 */
class CryptoService {
  /**
   * Generate SHA-256 hash of input data
   * @param {string} data - Input string to hash
   * @returns {string} - Hex string representation of hash
   */
  sha256(data) {
    if (!data) {
      throw new Error('Data is required for SHA-256 hashing');
    }
    
    const hash = crypto.createHash('sha256');
    hash.update(data, 'utf8');
    return hash.digest('hex');
  }

  /**
   * Convert hex string to byte array
   * @param {string} hexString - Hex string to convert
   * @returns {Buffer} - Byte array buffer
   */
  hexStringToByteArray(hexString) {
    if (!hexString || hexString.length % 2 !== 0) {
      throw new Error('Invalid hex string');
    }
    
    return Buffer.from(hexString, 'hex');
  }

  /**
   * AES encryption with CBC mode and zero IV
   * @param {string} key - Secret key for encryption (hex string)
   * @param {string} data - Data to encrypt (hex string)
   * @returns {string} - Base64 encoded encrypted data
   */
  aesEncrypt(key, data) {
    if (!key || !data) {
      throw new Error('Key and data are required for AES encryption');
    }

    try {
      // Convert hex strings to byte arrays
      const keyBytes = this.hexStringToByteArray(key);
      const dataBytes = this.hexStringToByteArray(data);
      
      // Create zero IV (initialization vector) as per Kotak specification
      const iv = Buffer.alloc(16, 0);
      
      // Create cipher with AES-128-CBC mode
      const cipher = crypto.createCipheriv('aes-128-cbc', keyBytes, iv);
      
      // Disable automatic padding as we'll handle it manually if needed
      cipher.setAutoPadding(true);
      
      // Encrypt the data
      let encrypted = cipher.update(dataBytes);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Return Base64 encoded result
      return encrypted.toString('base64');
    } catch (error) {
      throw new Error(`AES encryption failed: ${error.message}`);
    }
  }

  /**
   * Generate checksum for Check Transaction Status API
   * As per Kotak specification:
   * Input String = type + txnId + refId + orderId + dateTime + amount + aggregatorVPA + customerId
   * Hash = SHA256(Input String)
   * Encrypted = AES_CBC_Encrypt(SecretKey, Hash)
   * Checksum = Base64(Encrypted)
   * 
   * @param {Object} params - Parameters for checksum generation
   * @param {string} params.type - Transaction type
   * @param {string} params.txnId - Transaction ID
   * @param {string} params.refId - Reference ID
   * @param {string} params.orderId - Order ID
   * @param {string} params.dateTime - Date time string
   * @param {string} params.amount - Transaction amount
   * @param {string} params.aggregatorVPA - Aggregator VPA
   * @param {string} params.customerId - Customer ID
   * @param {string} params.secretKey - Secret key for encryption (hex string)
   * @returns {string} - Base64 encoded checksum
   */
  generateCheckTransactionChecksum(params) {
    const {
      type,
      txnId,
      refId,
      orderId,
      dateTime,
      amount,
      aggregatorVPA,
      customerId,
      secretKey
    } = params;

    // Validate required parameters
    if (!type || !txnId || !refId || !orderId || !dateTime || 
        !amount || !aggregatorVPA || !customerId || !secretKey) {
      throw new Error('All parameters are required for checksum generation');
    }

    try {
      // Step 1: Concatenate input string
      const inputString = `${type}${txnId}${refId}${orderId}${dateTime}${amount}${aggregatorVPA}${customerId}`;
      
      // Step 2: Generate SHA-256 hash
      const hash = this.sha256(inputString);
      
      // Step 3: Encrypt hash with AES
      const checksum = this.aesEncrypt(secretKey, hash);
      
      return checksum;
    } catch (error) {
      throw new Error(`Checksum generation failed: ${error.message}`);
    }
  }

  /**
   * Generate checksum for other Kotak API calls
   * Generic method that can be used for different API endpoints
   * 
   * @param {string} inputString - Concatenated input string
   * @param {string} secretKey - Secret key for encryption (hex string)
   * @returns {string} - Base64 encoded checksum
   */
  generateChecksum(inputString, secretKey) {
    if (!inputString || !secretKey) {
      throw new Error('Input string and secret key are required');
    }

    try {
      // Generate SHA-256 hash
      const hash = this.sha256(inputString);
      
      // Encrypt hash with AES
      const checksum = this.aesEncrypt(secretKey, hash);
      
      return checksum;
    } catch (error) {
      throw new Error(`Checksum generation failed: ${error.message}`);
    }
  }
}

module.exports = new CryptoService();
