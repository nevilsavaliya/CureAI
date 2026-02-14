#!/usr/bin/env node

/**
 * Test script to verify encryption key is loaded in server environment
 */

require('dotenv').config();
const encryption = require('../utils/encryption');

console.log('🔐 Testing Server Encryption Configuration');
console.log('=========================================');

console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- ENCRYPTION_MASTER_KEY set:', !!process.env.ENCRYPTION_MASTER_KEY);
console.log('- ENCRYPTION_MASTER_KEY length:', process.env.ENCRYPTION_MASTER_KEY ? process.env.ENCRYPTION_MASTER_KEY.length : 0);

// Test encryption/decryption
try {
  const testMessage = "Test message for server encryption";
  const senderId = "test_sender_123";
  const recipientId = "test_recipient_456";
  
  console.log('\nTesting encryption/decryption:');
  const encrypted = encryption.encryptMessage(testMessage, senderId, recipientId);
  console.log('- Encryption: ✅ Success');
  
  const decrypted = encryption.decryptMessage(encrypted, senderId, recipientId);
  console.log('- Decryption: ✅ Success');
  console.log('- Message match:', testMessage === decrypted ? '✅' : '❌');
  
  console.log('\n✅ Encryption system is working correctly!');
  console.log('💡 If your server is still showing decryption errors, restart it to load the new environment variables.');
  
} catch (error) {
  console.error('\n❌ Encryption test failed:', error.message);
}