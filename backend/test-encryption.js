#!/usr/bin/env node

/**
 * Test script for E2E encryption functionality
 * This script tests the encryption and decryption of messages
 */

const encryption = require('./utils/encryption');
const mongoose = require('mongoose');
require('dotenv').config();

async function testEncryption() {
  console.log('🔐 Testing E2E Encryption Implementation');
  console.log('=====================================\n');

  // Test basic encryption/decryption
  console.log('1. Testing Basic Message Encryption/Decryption:');
  
  const testMessage = "This is a confidential medical message between patient and doctor.";
  const senderId = "patient123";
  const recipientId = "doctor456";
  
  console.log(`Original message: "${testMessage}"`);
  
  try {
    // Encrypt message
    const encryptedData = encryption.encryptMessage(testMessage, senderId, recipientId);
    console.log(`Encrypted data length: ${encryptedData.length} characters`);
    console.log(`Encrypted data preview: ${encryptedData.substring(0, 100)}...`);
    
    // Decrypt message
    const decryptedMessage = encryption.decryptMessage(encryptedData, senderId, recipientId);
    console.log(`Decrypted message: "${decryptedMessage}"`);
    
    // Verify integrity
    const isValid = testMessage === decryptedMessage;
    console.log(`✅ Encryption/Decryption test: ${isValid ? 'PASSED' : 'FAILED'}\n`);
    
  } catch (error) {
    console.log(`❌ Encryption test FAILED: ${error.message}\n`);
  }

  // Test conversation ID generation
  console.log('2. Testing Conversation ID Generation:');
  
  const conversationId1 = encryption.generateConversationId(senderId, recipientId);
  const conversationId2 = encryption.generateConversationId(recipientId, senderId);
  
  console.log(`Conversation ID (sender->recipient): ${conversationId1}`);
  console.log(`Conversation ID (recipient->sender): ${conversationId2}`);
  console.log(`✅ Conversation ID consistency: ${conversationId1 === conversationId2 ? 'PASSED' : 'FAILED'}\n`);

  // Test file encryption (if needed)
  console.log('3. Testing File Encryption:');
  
  const testFileContent = Buffer.from('This is a test medical file content', 'utf8');
  
  try {
    const encryptedFile = encryption.encryptFile(testFileContent, senderId, recipientId);
    console.log(`Encrypted file size: ${encryptedFile.encryptedData.length} bytes`);
    
    const decryptedFile = encryption.decryptFile(encryptedFile, senderId, recipientId);
    const isFileValid = testFileContent.equals(decryptedFile);
    
    console.log(`✅ File encryption test: ${isFileValid ? 'PASSED' : 'FAILED'}\n`);
    
  } catch (error) {
    console.log(`❌ File encryption test FAILED: ${error.message}\n`);
  }

  // Test with MongoDB (if available)
  console.log('4. Testing Database Integration:');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Database connection: PASSED');
    
    const Message = require('./models/Message');
    
    // Test creating encrypted message
    const testMessageData = {
      senderId: new mongoose.Types.ObjectId(),
      senderModel: 'Patient',
      recipientId: new mongoose.Types.ObjectId(),
      recipientModel: 'Doctor',
      content: 'Test encrypted message for database'
    };
    
    const encryptedMessage = await Message.createEncrypted(testMessageData);
    console.log('✅ Encrypted message creation: PASSED');
    
    // Test decryption
    const decryptedContent = encryptedMessage.getDecryptedContent();
    const isDbValid = decryptedContent === testMessageData.content;
    console.log(`✅ Database encryption/decryption: ${isDbValid ? 'PASSED' : 'FAILED'}`);
    
    // Clean up test message
    await Message.findByIdAndDelete(encryptedMessage._id);
    console.log('✅ Test cleanup: PASSED\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.log(`❌ Database integration test: ${error.message}\n`);
  }

  // Test security features
  console.log('5. Testing Security Features:');
  
  try {
    // Test that different user pairs get different encryption
    const message1 = encryption.encryptMessage("Same message", "user1", "user2");
    const message2 = encryption.encryptMessage("Same message", "user3", "user4");
    
    const isDifferent = message1 !== message2;
    console.log(`✅ Different user pairs get different encryption: ${isDifferent ? 'PASSED' : 'FAILED'}`);
    
    // Test that same message encrypted twice is different (due to random IV)
    const message3 = encryption.encryptMessage("Same message", "user1", "user2");
    const message4 = encryption.encryptMessage("Same message", "user1", "user2");
    
    const isRandomized = message3 !== message4;
    console.log(`✅ Same message encrypted twice is different: ${isRandomized ? 'PASSED' : 'FAILED'}`);
    
    // Test hash function
    const hash1 = encryption.hashForIndex("test content");
    const hash2 = encryption.hashForIndex("test content");
    const hash3 = encryption.hashForIndex("different content");
    
    const isHashConsistent = hash1 === hash2 && hash1 !== hash3;
    console.log(`✅ Hash function consistency: ${isHashConsistent ? 'PASSED' : 'FAILED'}`);
    
  } catch (error) {
    console.log(`❌ Security features test: ${error.message}`);
  }

  console.log('\n🔐 E2E Encryption Test Complete!');
  console.log('=====================================');
}

// Run tests
if (require.main === module) {
  testEncryption().catch(console.error);
}

module.exports = { testEncryption };