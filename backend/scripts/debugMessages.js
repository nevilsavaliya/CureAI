#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');

async function debugMessages() {
  try {
    console.log('🔍 Debugging encrypted messages in database');
    console.log('============================================');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find all messages
    const allMessages = await Message.find({}).sort({ createdAt: -1 });
    console.log(`📊 Total messages in database: ${allMessages.length}`);
    
    // Find encrypted messages
    const encryptedMessages = await Message.find({ isEncrypted: true }).sort({ createdAt: -1 });
    console.log(`🔐 Encrypted messages: ${encryptedMessages.length}`);
    
    // Show details of each encrypted message
    for (const message of encryptedMessages) {
      console.log(`\n📝 Message ID: ${message._id}`);
      console.log(`   Created: ${message.createdAt}`);
      console.log(`   Sender: ${message.senderId}`);
      console.log(`   Recipient: ${message.recipientId}`);
      console.log(`   Content preview: ${message.content.substring(0, 100)}...`);
      
      // Try to decrypt
      try {
        const decrypted = message.getDecryptedContent();
        if (decrypted.includes('[Encrypted Message - Decryption Failed]')) {
          console.log(`   ❌ Decryption: FAILED`);
        } else {
          console.log(`   ✅ Decryption: SUCCESS`);
          console.log(`   Decrypted: ${decrypted}`);
        }
      } catch (error) {
        console.log(`   ❌ Decryption: ERROR - ${error.message}`);
      }
    }
    
    // Show recent non-encrypted messages
    const recentMessages = await Message.find({ isEncrypted: { $ne: true } }).sort({ createdAt: -1 }).limit(5);
    console.log(`\n📄 Recent non-encrypted messages: ${recentMessages.length}`);
    for (const message of recentMessages) {
      console.log(`   - ${message._id}: "${message.content}" (${message.createdAt})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

debugMessages();