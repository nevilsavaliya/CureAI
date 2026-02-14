#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

async function testMessageController() {
  try {
    console.log('🔍 Testing message controller behavior');
    console.log('====================================');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Simulate what the controller does
    const caseId = '693a626ae9667eb9493efd4f'; // From your logs
    
    console.log(`\n🔍 Fetching messages for case: ${caseId}`);
    
    const messages = await Message.find({ caseId })
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .sort({ createdAt: 1 });
    
    console.log(`📊 Found ${messages.length} messages`);
    
    // Process each message like the controller does
    const decryptedMessages = messages.map((message, index) => {
      console.log(`\n📝 Processing message ${index + 1}:`);
      console.log(`   ID: ${message._id}`);
      console.log(`   Encrypted: ${message.isEncrypted}`);
      console.log(`   Sender: ${message.senderId ? message.senderId.name : 'Unknown'}`);
      console.log(`   Recipient: ${message.recipientId ? message.recipientId.name : 'Unknown'}`);
      
      try {
        const messageObj = message.toObject();
        console.log(`   Original content: ${messageObj.content.substring(0, 50)}...`);
        
        const decryptedContent = message.getDecryptedContent();
        console.log(`   ✅ Decrypted content: "${decryptedContent}"`);
        
        messageObj.content = decryptedContent;
        return messageObj;
      } catch (error) {
        console.log(`   ❌ Decryption error: ${error.message}`);
        const messageObj = message.toObject();
        messageObj.content = '[Encrypted Message - Decryption Failed]';
        return messageObj;
      }
    });
    
    console.log(`\n✅ Successfully processed ${decryptedMessages.length} messages`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

testMessageController();