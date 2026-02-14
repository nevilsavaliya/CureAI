const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 32; // 256 bits

class E2EEncryption {
  constructor() {
    // Master key from environment (should be 64 hex characters = 32 bytes)
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || this.generateMasterKey();
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      console.warn('⚠️  ENCRYPTION_MASTER_KEY not set in environment. Using generated key (not persistent).');
    }
  }

  /**
   * Generate a new master key (for initial setup)
   */
  generateMasterKey() {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * Generate a key pair for a user (public/private key pair)
   */
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  /**
   * Derive a symmetric key from the master key and user-specific data
   */
  deriveUserKey(userId, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(SALT_LENGTH);
    }
    
    const key = crypto.pbkdf2Sync(
      Buffer.from(this.masterKey, 'hex'),
      Buffer.concat([Buffer.from(userId, 'utf8'), salt]),
      100000, // iterations
      KEY_LENGTH,
      'sha256'
    );
    
    return { key, salt };
  }

  /**
   * Encrypt a message using AES-256-CBC
   */
  encryptMessage(plaintext, senderId, recipientId) {
    try {
      // Generate a unique key for this conversation
      const conversationId = this.generateConversationId(senderId, recipientId);
      const salt = crypto.randomBytes(SALT_LENGTH);
      const { key } = this.deriveUserKey(conversationId, salt);
      
      // Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Create cipher using modern API
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      // Encrypt the message
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine all components
      const encryptedData = {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: 'aes-256-cbc'
      };
      
      return JSON.stringify(encryptedData);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt a message using AES-256-CBC
   */
  decryptMessage(encryptedData, senderId, recipientId) {
    try {
      const data = JSON.parse(encryptedData);
      const { encrypted, iv, salt, algorithm } = data;
      
      if (algorithm !== 'aes-256-cbc') {
        throw new Error('Unsupported encryption algorithm');
      }
      
      // Derive the same key used for encryption
      const conversationId = this.generateConversationId(senderId, recipientId);
      const { key } = this.deriveUserKey(conversationId, Buffer.from(salt, 'hex'));
      
      // Create decipher using modern API
      const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
      
      // Decrypt the message
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Generate a consistent conversation ID for two users
   */
  generateConversationId(userId1, userId2) {
    // Sort IDs to ensure consistent conversation ID regardless of order
    const sortedIds = [userId1.toString(), userId2.toString()].sort();
    return crypto.createHash('sha256')
      .update(sortedIds.join(':'))
      .digest('hex');
  }

  /**
   * Encrypt file data
   */
  encryptFile(fileBuffer, senderId, recipientId) {
    try {
      const conversationId = this.generateConversationId(senderId, recipientId);
      const salt = crypto.randomBytes(SALT_LENGTH);
      const { key } = this.deriveUserKey(conversationId, salt);
      
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
      ]);
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
      };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Decrypt file data
   */
  decryptFile(encryptedFile, senderId, recipientId) {
    try {
      const { encryptedData, iv, salt } = encryptedFile;
      
      const conversationId = this.generateConversationId(senderId, recipientId);
      const { key } = this.deriveUserKey(conversationId, Buffer.from(salt, 'hex'));
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
      
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);
      
      return decrypted;
    } catch (error) {
      console.error('File decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  }

  /**
   * Hash sensitive data (for indexing without exposing content)
   */
  hashForIndex(data) {
    return crypto.createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Singleton instance
const encryption = new E2EEncryption();

module.exports = encryption;