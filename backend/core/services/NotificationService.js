const BaseService = require('./BaseService');
const { ValidationError, NotFoundError } = require('../errors');

/**
 * Notification Service
 * Handles notification management business logic
 */
class NotificationService extends BaseService {
  /**
   * @param {NotificationRepository} notificationRepository - Notification repository instance
   */
  constructor(notificationRepository) {
    super(notificationRepository);
  }

  /**
   * Create notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(notificationData) {
    try {
      const { userId, userType, type, title, message } = notificationData;

      // Validate required fields
      this.validateRequiredFields(notificationData, ['userId', 'userType', 'type', 'title', 'message']);

      // Create notification
      const notification = await this.repository.create(notificationData);

      return this.transformToDTO(notification);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get notifications for user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options {read, type}
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Paginated notifications
   */
  async getNotificationsForUser(userId, filters = {}, pagination = {}) {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const query = { userId, ...filters };
      const { page = 1, limit = 20 } = pagination;

      return await this.repository.findWithFilters(query, page, limit, {
        sort: { createdAt: -1 }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      if (!notificationId) {
        throw new ValidationError('Notification ID is required');
      }

      const notification = await this.repository.findById(notificationId);
      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      // Verify user owns this notification
      if (notification.userId.toString() !== userId) {
        throw new ValidationError('Access denied');
      }

      const updated = await this.repository.update(notificationId, {
        read: true,
        readAt: new Date()
      });

      return this.transformToDTO(updated);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark all notifications as read for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markAllAsRead(userId) {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get all unread notifications for user
      const unreadNotifications = await this.repository.findMany({
        userId,
        read: false
      });

      // Update all to read
      const updates = unreadNotifications.map(notification => ({
        filter: { _id: notification._id },
        update: { read: true, readAt: new Date() }
      }));

      if (updates.length > 0) {
        return await this.repository.bulkUpdate(updates);
      }

      return 0;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteNotification(notificationId, userId) {
    try {
      if (!notificationId) {
        throw new ValidationError('Notification ID is required');
      }

      const notification = await this.repository.findById(notificationId);
      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      // Verify user owns this notification
      if (notification.userId.toString() !== userId) {
        throw new ValidationError('Access denied');
      }

      return await this.repository.delete(notificationId);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get unread count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread notification count
   */
  async getUnreadCount(userId) {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      return await this.repository.count({
        userId,
        read: false
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get entity name for error messages
   * @returns {string} Entity name
   */
  getEntityName() {
    return 'Notification';
  }
}

module.exports = NotificationService;
