const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    index: true
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['patient', 'doctor']
  },
  
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'case_request',
      'case_accepted',
      'case_rejected',
      'case_treated',
      'new_message',
      'feedback_received',
      'video_consultation_scheduled'
    ]
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  
  // Related Data
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedUserType: {
    type: String,
    enum: ['patient', 'doctor']
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ caseId: 1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return await notification.save();
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, isRead: false });
};

// Static method to delete old read notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    isRead: true,
    readAt: { $lt: cutoffDate }
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
