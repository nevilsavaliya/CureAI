#!/usr/bin/env node

/**
 * Script to handle messages that were encrypted with temporary keys
 * This script will identify and optionally clean up messages that cannot be decrypted
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const encryption = require('../utils/encryption');

async function fixEncryptedMessages() {
  try {
    console.log('🔧 Fixing Encrypted Messages');
    console.log('============================');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find all encrypted messages
    const encryptedMessages = await Message.find({ isEncrypted: true });
    console.log(`📊 Found ${encryptedMessages.length} encrypted messages`);
    
    let successCount = 0;
    let failureCount = 0;
    const failedMessages = [];
    
    // Test decryption for each message
    for (const message of encryptedMessages) {
      try {
        const decrypted = encryption.decryptMessage(
          message.content, 
          message.senderId, 
          message.recipientId
        );
        
        if (decrypted && decrypted !== '[Encrypted Message - Decryption Failed]') {
          successCount++;
          console.log(`✅ Message ${message._id}: Decryption successful`);
        } else {
          failureCount++;
          failedMessages.push(message._id);
          console.log(`❌ Message ${message._id}: Decryption failed`);
        }
      } catch (error) {
        failureCount++;
        failedMessages.push(message._id);
        console.log(`❌ Message ${message._id}: Decryption error - ${error.message}`);
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Successfully decrypted: ${successCount} messages`);
    console.log(`❌ Failed to decrypt: ${failureCount} messages`);
    
    if (failedMessages.length > 0) {
      console.log('\n🔧 Options for failed messages:');
      console.log('1. Keep them as encrypted (they will show as "[Encrypted Message - Decryption Failed]")');
      console.log('2. Delete them (CAUTION: This will permanently remove the messages)');
      console.log('3. Mark them as unencrypted with placeholder text');
      
      // For now, just report the issues
      console.log('\n📋 Failed message IDs:');
      failedMessages.forEach(id => console.log(`   - ${id}`));
      
      console.log('\n💡 Recommendation:');
      console.log('   - If these are test messages, you can delete them');
      console.log('   - If these are important messages, keep them as encrypted');
      console.log('   - Future messages will encrypt/decrypt properly with the fixed key');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

// Add command line options
const args = process.argv.slice(2);
if (args.includes('--delete-failed')) {
  console.log('⚠️  WARNING: This will delete messages that cannot be decrypted!');
  console.log('⚠️  Make sure you have a backup before proceeding.');
  // Add deletion logic here if needed
}

fixEncryptedMessages();