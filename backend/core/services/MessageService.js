const BaseService = require('./BaseService');
const { ValidationError, NotFoundError, AuthorizationError } = require('../errors');

/**
 * Message Service
 * Handles messaging business logic
 */
class MessageService extends BaseService {
  /**
   * @param {MessageRepository} messageRepository - Message repository instance
   * @param {Object} dependencies - Service dependencies {caseRepository, socketService}
   */
  constructor(messageRepository, dependencies = {}) {
    super(messageRepository);
    this.caseRepository = dependencies.caseRepository;
    this.socketService = dependencies.socketService;
  }

  /**
   * Send message
   * @param {string} senderId - Sender ID
   * @param {string} senderRole - Sender role
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(senderId, senderRole, messageData) {
    try {
      const { caseId, content, messageType = 'text' } = messageData;

      // Validate required fields
      this.validateRequiredFields(messageData, ['caseId', 'content']);

      // Verify case exists and user has access
      if (!this.caseRepository) {
        throw new Error('Case repository not configured');
      }

      const caseData = await this.caseRepository.findById(caseId);
      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      // Verify sender is part of the case
      const isPatient = senderRole === 'patient' && caseData.patientId.toString() === senderId;
      const isDoctor = senderRole === 'doctor' && caseData.doctorId.toString() === senderId;

      if (!isPatient && !isDoctor) {
        throw new AuthorizationError('Access denied. You are not part of this case');
      }

      // Determine receiver
      const receiverId = isPatient ? caseData.doctorId : caseData.patientId;
      const receiverRole = isPatient ? 'doctor' : 'patient';

      // Create message
      const message = await this.repository.create({
        caseId,
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        content,
        messageType
      });

      // Update case last message timestamp
      await this.caseRepository.updateLastMessage(caseId);

      // Broadcast message via WebSocket
      if (this.socketService) {
        try {
          this.socketService.emitMessage(caseId, message);
        } catch (socketError) {
          console.error('Failed to broadcast message via WebSocket:', socketError);
        }
      }

      return this.transformToDTO(message);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get messages for case
   * @param {string} caseId - Case ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} userRole - User role
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Paginated messages
   */
  async getMessagesForCase(caseId, userId, userRole, pagination = {}) {
    try {
      if (!caseId) {
        throw new ValidationError('Case ID is required');
      }

      // Verify user has access to case
      if (!this.caseRepository) {
        throw new Error('Case repository not configured');
      }

      const caseData = await this.caseRepository.findById(caseId);
      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      const isPatient = userRole === 'patient' && caseData.patientId.toString() === userId;
      const isDoctor = userRole === 'doctor' && caseData.doctorId.toString() === userId;

      if (!isPatient && !isDoctor) {
        throw new AuthorizationError('Access denied. You are not part of this case');
      }

      // Get messages
      const { page = 1, limit = 50 } = pagination;
      return await this.repository.findWithFilters({ caseId }, page, limit, {
        sort: { createdAt: 1 }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark messages as read
   * @param {string} caseId - Case ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of messages marked as read
   */
  async markMessagesAsRead(caseId, userId) {
    try {
      if (!caseId || !userId) {
        throw new ValidationError('Case ID and User ID are required');
      }

      // Get unread messages for user in this case
      const unreadMessages = await this.repository.findMany({
        caseId,
        receiverId: userId,
        read: false
      });

      // Update all to read
      const updates = unreadMessages.map(message => ({
        filter: { _id: message._id },
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
   * Get unread message count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread message count
   */
  async getUnreadCount(userId) {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      return await this.repository.count({
        receiverId: userId,
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
    return 'Message';
  }
}

module.exports = MessageService;
