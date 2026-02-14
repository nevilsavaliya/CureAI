const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Case reference for case management system
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    index: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Patient', 'Doctor']
  },
  senderType: {
    type: String,
    enum: ['patient', 'doctor']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Patient', 'Doctor']
  },
  receiverType: {
    type: String,
    enum: ['patient', 'doctor']
  },
  content: {
    type: String,
    required: true,
    trim: true
    // Removed maxlength as encrypted content will be longer
  },
  // Store original content hash for search/indexing (without exposing content)
  contentHash: {
    type: String,
    index: true
  },
  // Encryption metadata
  isEncrypted: {
    type: Boolean,
    default: true
  },
  encryptionVersion: {
    type: String,
    default: '1.0'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  readAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ sentAt: -1 });
messageSchema.index({ recipientId: 1, recipientModel: 1 });
messageSchema.index({ caseId: 1, createdAt: 1 });
messageSchema.index({ caseId: 1, sentAt: 1 });

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Method to decrypt message content
messageSchema.methods.getDecryptedContent = function() {
  if (!this.isEncrypted) {
    return this.content;
  }
  
  const encryption = require('../utils/encryption');
  try {
    // Handle both populated and non-populated documents
    const senderId = this.senderId._id || this.senderId;
    const recipientId = this.recipientId._id || this.recipientId;
    
    return encryption.decryptMessage(this.content, senderId, recipientId);
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    // If decryption fails and ENCRYPTION_MASTER_KEY is not set, show a helpful message
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      return '[Message encrypted with different key - Please set ENCRYPTION_MASTER_KEY]';
    }
    return '[Encrypted Message - Decryption Failed]';
  }
};

// Static method to create encrypted message
messageSchema.statics.createEncrypted = async function(messageData) {
  const encryption = require('../utils/encryption');
  
  try {
    // Encrypt the content
    const encryptedContent = encryption.encryptMessage(
      messageData.content,
      messageData.senderId,
      messageData.recipientId
    );
    
    // Create content hash for indexing
    const contentHash = encryption.hashForIndex(messageData.content);
    
    // Create the message with encrypted content
    const message = new this({
      ...messageData,
      content: encryptedContent,
      contentHash: contentHash,
      isEncrypted: true,
      encryptionVersion: '1.0'
    });
    
    return await message.save();
  } catch (error) {
    console.error('Failed to create encrypted message:', error);
    throw new Error('Failed to create encrypted message');
  }
};

// Pre-save hook to set senderType and receiverType based on senderModel and recipientModel
messageSchema.pre('save', function(next) {
  if (this.senderModel && !this.senderType) {
    this.senderType = this.senderModel.toLowerCase();
  }
  if (this.recipientModel && !this.receiverType) {
    this.receiverType = this.recipientModel.toLowerCase();
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
