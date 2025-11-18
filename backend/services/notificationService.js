const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Create a notification
   * @param {Object} data - Notification data
   * @param {String} data.userId - User ID to receive notification
   * @param {String} data.userType - User type ('patient' or 'doctor')
   * @param {String} data.type - Notification type
   * @param {String} data.title - Notification title
   * @param {String} data.message - Notification message
   * @param {String} data.caseId - Related case ID (optional)
   * @param {String} data.relatedUserId - Related user ID (optional)
   * @param {String} data.relatedUserType - Related user type (optional)
   * @returns {Promise<Notification>}
   */
  async createNotification(data) {
    try {
      const notification = await Notification.createNotification(data);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create case request notification (sent to doctor)
   * @param {String} doctorId - Doctor ID
   * @param {String} patientId - Patient ID
   * @param {String} patientName - Patient name
   * @param {String} caseId - Case ID
   * @returns {Promise<Notification>}
   */
  async createCaseRequestNotification(doctorId, patientId, patientName, caseId) {
    return await this.createNotification({
      userId: doctorId,
      userType: 'doctor',
      type: 'case_request',
      title: 'New Case Request',
      message: `${patientName} has requested a consultation`,
      caseId,
      relatedUserId: patientId,
      relatedUserType: 'patient'
    });
  }

  /**
   * Create case accepted notification (sent to patient)
   * @param {String} patientId - Patient ID
   * @param {String} doctorId - Doctor ID
   * @param {String} doctorName - Doctor name
   * @param {String} caseId - Case ID
   * @returns {Promise<Notification>}
   */
  async createCaseAcceptedNotification(patientId, doctorId, doctorName, caseId) {
    return await this.createNotification({
      userId: patientId,
      userType: 'patient',
      type: 'case_accepted',
      title: 'Case Accepted',
      message: `Dr. ${doctorName} has accepted your consultation request`,
      caseId,
      relatedUserId: doctorId,
      relatedUserType: 'doctor'
    });
  }

  /**
   * Create case rejected notification (sent to patient)
   * @param {String} patientId - Patient ID
   * @param {String} doctorId - Doctor ID
   * @param {String} doctorName - Doctor name
   * @param {String} caseId - Case ID
   * @returns {Promise<Notification>}
   */
  async createCaseRejectedNotification(patientId, doctorId, doctorName, caseId) {
    return await this.createNotification({
      userId: patientId,
      userType: 'patient',
      type: 'case_rejected',
      title: 'Case Rejected',
      message: `Dr. ${doctorName} has declined your consultation request`,
      caseId,
      relatedUserId: doctorId,
      relatedUserType: 'doctor'
    });
  }

  /**
   * Create case treated notification (sent to patient)
   * @param {String} patientId - Patient ID
   * @param {String} doctorId - Doctor ID
   * @param {String} doctorName - Doctor name
   * @param {String} caseId - Case ID
   * @returns {Promise<Notification>}
   */
  async createCaseTreatedNotification(patientId, doctorId, doctorName, caseId) {
    return await this.createNotification({
      userId: patientId,
      userType: 'patient',
      type: 'case_treated',
      title: 'Treatment Completed',
      message: `Dr. ${doctorName} has marked your case as treated. Please provide feedback`,
      caseId,
      relatedUserId: doctorId,
      relatedUserType: 'doctor'
    });
  }

  /**
   * Create new message notification
   * @param {String} receiverId - Receiver user ID
   * @param {String} receiverType - Receiver user type ('patient' or 'doctor')
   * @param {String} senderId - Sender user ID
   * @param {String} senderType - Sender user type ('patient' or 'doctor')
   * @param {String} senderName - Sender name
   * @param {String} caseId - Case ID
   * @returns {Promise<Notification>}
   */
  async createNewMessageNotification(receiverId, receiverType, senderId, senderType, senderName, caseId) {
    return await this.createNotification({
      userId: receiverId,
      userType: receiverType,
      type: 'new_message',
      title: 'New Message',
      message: `${senderName} sent you a message`,
      caseId,
      relatedUserId: senderId,
      relatedUserType: senderType
    });
  }

  /**
   * Create feedback received notification (sent to doctor)
   * @param {String} doctorId - Doctor ID
   * @param {String} patientId - Patient ID
   * @param {String} patientName - Patient name
   * @param {Number} rating - Rating value (1-5)
   * @param {String} caseId - Case ID
   * @returns {Promise<Notification>}
   */
  async createFeedbackReceivedNotification(doctorId, patientId, patientName, rating, caseId) {
    return await this.createNotification({
      userId: doctorId,
      userType: 'doctor',
      type: 'feedback_received',
      title: 'New Feedback Received',
      message: `${patientName} has provided feedback (${rating} stars)`,
      caseId,
      relatedUserId: patientId,
      relatedUserType: 'patient'
    });
  }

  /**
   * Get notifications for a user with filtering
   * @param {String} userId - User ID
   * @param {Object} filters - Filter options
   * @param {String} filters.type - Notification type filter (optional)
   * @param {Boolean} filters.isRead - Read status filter (optional)
   * @param {Number} filters.limit - Limit number of results (default: 50)
   * @param {Number} filters.skip - Skip number of results (default: 0)
   * @returns {Promise<Array>}
   */
  async getNotifications(userId, filters = {}) {
    try {
      const query = { userId };

      // Add optional filters
      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.isRead !== undefined) {
        query.isRead = filters.isRead;
      }

      const limit = parseInt(filters.limit) || 50;
      const skip = parseInt(filters.skip) || 0;

      const notifications = await Notification.find(query)
        .populate('caseId', 'status symptoms createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {String} userId - User ID
   * @returns {Promise<Number>}
   */
  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for authorization)
   * @returns {Promise<Notification>}
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Verify user owns this notification (convert both to strings for comparison)
      if (notification.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized access to notification');
      }

      // Mark as read if not already read
      if (!notification.isRead) {
        await notification.markAsRead();
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete old read notifications (cleanup utility)
   * @param {Number} daysOld - Number of days old (default: 30)
   * @returns {Promise<Object>}
   */
  async deleteOldNotifications(daysOld = 30) {
    try {
      const result = await Notification.deleteOldNotifications(daysOld);
      return result;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications by case ID
   * @param {String} caseId - Case ID
   * @returns {Promise<Array>}
   */
  async getNotificationsByCaseId(caseId) {
    try {
      const notifications = await Notification.find({ caseId })
        .sort({ createdAt: -1 });
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications by case ID:', error);
      throw error;
    }
  }

  /**
   * Get notifications by type for a user
   * @param {String} userId - User ID
   * @param {String} type - Notification type
   * @returns {Promise<Array>}
   */
  async getNotificationsByType(userId, type) {
    try {
      const notifications = await Notification.find({ userId, type })
        .populate('caseId', 'status symptoms createdAt')
        .sort({ createdAt: -1 });
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications by type:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();
