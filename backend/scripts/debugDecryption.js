#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const encryption = require('../utils/encryption');

async function debugDecryption() {
  try {
    console.log('🔍 Debugging decryption process');
    console.log('==============================');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get the specific message that's failing
    const messageId = '693a683a635be18bba4e5213';
    
    console.log(`\n🔍 Testing message: ${messageId}`);
    
    // Test 1: Direct access (no populate)
    console.log('\n📝 Test 1: Direct access (no populate)');
    const directMessage = await Message.findById(messageId);
    console.log(`   Sender ID: ${directMessage.senderId}`);
    console.log(`   Recipient ID: ${directMessage.recipientId}`);
    console.log(`   Sender type: ${typeof directMessage.senderId}`);
    console.log(`   Recipient type: ${typeof directMessage.recipientId}`);
    
    try {
      const decrypted1 = directMessage.getDecryptedContent();
      console.log(`   ✅ Direct decryption: "${decrypted1}"`);
    } catch (error) {
      console.log(`   ❌ Direct decryption failed: ${error.message}`);
    }
    
    // Test 2: With populate
    console.log('\n📝 Test 2: With populate');
    const populatedMessage = await Message.findById(messageId)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email');
    
    console.log(`   Sender ID: ${populatedMessage.senderId._id}`);
    console.log(`   Recipient ID: ${populatedMessage.recipientId._id}`);
    console.log(`   Sender type: ${typeof populatedMessage.senderId}`);
    console.log(`   Recipient type: ${typeof populatedMessage.recipientId}`);
    console.log(`   Sender name: ${populatedMessage.senderId.name}`);
    console.log(`   Recipient name: ${populatedMessage.recipientId.name}`);
    
    try {
      const decrypted2 = populatedMessage.getDecryptedContent();
      console.log(`   ✅ Populated decryption: "${decrypted2}"`);
    } catch (error) {
      console.log(`   ❌ Populated decryption failed: ${error.message}`);
    }
    
    // Test 3: Manual decryption with different ID formats
    console.log('\n📝 Test 3: Manual decryption tests');
    
    const content = directMessage.content;
    const senderId1 = directMessage.senderId;
    const recipientId1 = directMessage.recipientId;
    const senderId2 = populatedMessage.senderId._id;
    const recipientId2 = populatedMessage.recipientId._id;
    
    console.log(`   Testing with direct IDs: ${senderId1} -> ${recipientId1}`);
    try {
      const manual1 = encryption.decryptMessage(content, senderId1, recipientId1);
      console.log(`   ✅ Manual decryption 1: "${manual1}"`);
    } catch (error) {
      console.log(`   ❌ Manual decryption 1 failed: ${error.message}`);
    }
    
    console.log(`   Testing with populated IDs: ${senderId2} -> ${recipientId2}`);
    try {
      const manual2 = encryption.decryptMessage(content, senderId2, recipientId2);
      console.log(`   ✅ Manual decryption 2: "${manual2}"`);
    } catch (error) {
      console.log(`   ❌ Manual decryption 2 failed: ${error.message}`);
    }
    
    // Test 4: Check if IDs are the same
    console.log('\n📝 Test 4: ID comparison');
    console.log(`   Direct sender == Populated sender: ${senderId1.toString() === senderId2.toString()}`);
    console.log(`   Direct recipient == Populated recipient: ${recipientId1.toString() === recipientId2.toString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

debugDecryption();