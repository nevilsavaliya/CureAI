#!/usr/bin/env node

/**
 * Script to clean up messages that cannot be decrypted due to key mismatch
 * This is useful when switching from temporary keys to a permanent master key
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');

async function cleanupFailedEncryption() {
  try {
    console.log('🧹 Cleaning up failed encrypted messages');
    console.log('=======================================');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Option 1: Delete messages that cannot be decrypted
    const result = await Message.deleteMany({
      _id: {
        $in: [
          '693a66a3e3818a76ffad5266',
          '693a66b1e3818a76ffad5283', 
          '693a66cbe3818a76ffad5294'
        ]
      }
    });
    
    console.log(`🗑️  Deleted ${result.deletedCount} messages that could not be decrypted`);
    
    // Verify cleanup
    const remainingEncrypted = await Message.find({ isEncrypted: true });
    console.log(`📊 Remaining encrypted messages: ${remainingEncrypted.length}`);
    
    console.log('\n✅ Cleanup complete!');
    console.log('💡 New messages will be encrypted with the proper master key');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

cleanupFailedEncryption();