const BaseRepository = require('./BaseRepository');
const Notification = require('../../models/Notification');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Notification Repository
 * Handles all database operations for Notification model
 */
class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  /**
   * Find notifications by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of notification documents
   */
  async findByUser(userId, options = {}) {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }
      
      const defaultOptions = {
        sort: { createdAt: -1 },
        ...options
      };
      
      return await this.findMany({ userId }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find notifications by user: ${error.message}`);
    }
  }

  /**
   * Find unread notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of unread notification documents
   */
  async findUnread(userId, options = {}) {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }
      
      const defaultOptions = {
        sort: { createdAt: -1 },
        ...options
      };
      
      return await this.findMany({ userId, isRead: false }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find unread notifications: ${error.message}`);
    }
  }

  /**
   * Find notifications by type
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of notification documents
   */
  async findByType(userId, type, options = {}) {
    try {
      if (!userId || !type) {
        throw new ValidationError('User ID and type are required');
      }
      
      return await this.findMany({ userId, type }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find notifications by type: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Document|null>} Updated notification document
   */
  async markAsRead(notificationId) {
    try {
      return await this.update(notificationId, {
        isRead: true,
        readAt: new Date()
      });
    } catch (error) {
      throw new DatabaseError(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of updated notifications
   */
  async markAllAsRead(userId) {
    try {
      const result = await this.model.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      return result.modifiedCount;
    } catch (error) {
      throw new DatabaseError(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread notification count
   */
  async getUnreadCount(userId) {
    try {
      return await this.count({ userId, isRead: false });
    } catch (error) {
      throw new DatabaseError(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Create notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Document>} Created notification document
   */
  async createNotification(notificationData) {
    try {
      return await this.create(notificationData);
    } catch (error) {
      throw new DatabaseError(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Delete old read notifications
   * @param {number} daysOld - Number of days old
   * @returns {Promise<number>} Number of deleted notifications
   */
  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await this.model.deleteMany({
        isRead: true,
        readAt: { $lt: cutoffDate }
      });
      
      return result.deletedCount;
    } catch (error) {
      throw new DatabaseError(`Failed to delete old notifications: ${error.message}`);
    }
  }

  /**
   * Get notifications with pagination
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated notifications
   */
  async findByUserPaginated(userId, page = 1, limit = 20, options = {}) {
    try {
      const defaultOptions = {
        sort: { createdAt: -1 },
        ...options
      };
      
      return await this.paginate({ userId }, page, limit, defaultOptions);
    } catch (error) {
      throw new DatabaseError(`Failed to find paginated notifications: ${error.message}`);
    }
  }
}

module.exports = NotificationRepository;
