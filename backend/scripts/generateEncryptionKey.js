#!/usr/bin/env node

/**
 * Generate a secure encryption master key for E2E message encryption
 * This script generates a cryptographically secure 256-bit (32 byte) key
 * encoded as a 64-character hexadecimal string
 */

const crypto = require('crypto');

function generateEncryptionKey() {
  // Generate 32 random bytes (256 bits)
  const key = crypto.randomBytes(32);
  
  // Convert to hexadecimal string
  const hexKey = key.toString('hex');
  
  console.log('🔐 Generated Encryption Master Key:');
  console.log('');
  console.log(`ENCRYPTION_MASTER_KEY=${hexKey}`);
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Copy the key above to your .env file');
  console.log('2. Keep this key secure and never share it');
  console.log('3. Use the same key across all server instances');
  console.log('4. If you lose this key, encrypted messages cannot be decrypted');
  console.log('');
  console.log('⚠️  Security Notes:');
  console.log('- Store this key securely (use environment variables)');
  console.log('- Never commit this key to version control');
  console.log('- Consider using a key management service in production');
  console.log('- Rotate this key periodically for enhanced security');
  
  return hexKey;
}

// Generate and display the key
if (require.main === module) {
  generateEncryptionKey();
}

module.exports = { generateEncryptionKey };