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
    trim: true,
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
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
