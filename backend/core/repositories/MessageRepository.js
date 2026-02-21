const BaseRepository = require('./BaseRepository');
const Message = require('../../models/Message');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Message Repository
 * Handles all database operations for Message model
 */
class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  /**
   * Find messages by case ID
   * @param {string} caseId - Case ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of message documents
   */
  async findByCase(caseId, options = {}) {
    try {
      if (!caseId) {
        throw new ValidationError('Case ID is required');
      }
      
      const defaultOptions = {
        sort: { sentAt: 1 },
        populate: ['senderId', 'recipientId'],
        ...options
      };
      
      return await this.findMany({ caseId }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find messages by case: ${error.message}`);
    }
  }

  /**
   * Find messages between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of message documents
   */
  async findBetweenUsers(userId1, userId2, options = {}) {
    try {
      if (!userId1 || !userId2) {
        throw new ValidationError('Both user IDs are required');
      }
      
      const query = {
        $or: [
          { senderId: userId1, recipientId: userId2 },
          { senderId: userId2, recipientId: userId1 }
        ]
      };
      
      const defaultOptions = {
        sort: { sentAt: 1 },
        ...options
      };
      
      return await this.findMany(query, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find messages between users: ${error.message}`);
    }
  }

  /**
   * Find unread messages for a user
   * @param {string} recipientId - Recipient user ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of unread message documents
   */
  async findUnread(recipientId, options = {}) {
    try {
      if (!recipientId) {
        throw new ValidationError('Recipient ID is required');
      }
      
      return await this.findMany({ recipientId, isRead: false }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find unread messages: ${error.message}`);
    }
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   * @returns {Promise<Document|null>} Updated message document
   */
  async markAsRead(messageId) {
    try {
      return await this.update(messageId, {
        isRead: true,
        readAt: new Date()
      });
    } catch (error) {
      throw new DatabaseError(`Failed to mark message as read: ${error.message}`);
    }
  }

  /**
   * Mark all messages as read for a case
   * @param {string} caseId - Case ID
   * @param {string} recipientId - Recipient user ID
   * @returns {Promise<number>} Number of updated messages
   */
  async markAllAsReadForCase(caseId, recipientId) {
    try {
      const result = await this.model.updateMany(
        { caseId, recipientId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      return result.modifiedCount;
    } catch (error) {
      throw new DatabaseError(`Failed to mark messages as read: ${error.message}`);
    }
  }

  /**
   * Get unread message count for a user
   * @param {string} recipientId - Recipient user ID
   * @returns {Promise<number>} Unread message count
   */
  async getUnreadCount(recipientId) {
    try {
      return await this.count({ recipientId, isRead: false });
    } catch (error) {
      throw new DatabaseError(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Create encrypted message
   * @param {Object} messageData - Message data
   * @returns {Promise<Document>} Created message document
   */
  async createEncrypted(messageData) {
    try {
      return await this.model.createEncrypted(messageData);
    } catch (error) {
      throw new DatabaseError(`Failed to create encrypted message: ${error.message}`);
    }
  }
}

module.exports = MessageRepository;
