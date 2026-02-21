const BaseRepository = require('./BaseRepository');
const Feedback = require('../../models/Feedback');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Feedback Repository
 * Handles all database operations for Feedback model
 */
class FeedbackRepository extends BaseRepository {
  constructor() {
    super(Feedback);
  }

  /**
   * Find feedback by consultation ID
   * @param {string} consultationId - Consultation ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of feedback documents
   */
  async findByConsultation(consultationId, options = {}) {
    try {
      if (!consultationId) {
        throw new ValidationError('Consultation ID is required');
      }
      
      return await this.findMany({ consultationId }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find feedback by consultation: ${error.message}`);
    }
  }

  /**
   * Find feedback by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of feedback documents
   */
  async findByUser(userId, options = {}) {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }
      
      const defaultOptions = {
        sort: { submittedAt: -1 },
        ...options
      };
      
      return await this.findMany({ userId }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find feedback by user: ${error.message}`);
    }
  }

  /**
   * Find feedback by user role
   * @param {string} userRole - User role (patient, doctor)
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of feedback documents
   */
  async findByRole(userRole, options = {}) {
    try {
      if (!userRole) {
        throw new ValidationError('User role is required');
      }
      
      return await this.findMany({ userRole }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find feedback by role: ${error.message}`);
    }
  }

  /**
   * Get average rating for consultations
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} Average rating
   */
  async getAverageRating(filters = {}) {
    try {
      const result = await this.model.aggregate([
        ...(Object.keys(filters).length > 0 ? [{ $match: filters }] : []),
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      return result.length > 0 ? result[0].avgRating : 0;
    } catch (error) {
      throw new DatabaseError(`Failed to get average rating: ${error.message}`);
    }
  }

  /**
   * Get feedback statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Feedback statistics
   */
  async getStatistics(filters = {}) {
    try {
      const result = await this.model.aggregate([
        ...(Object.keys(filters).length > 0 ? [{ $match: filters }] : []),
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      const stats = {
        total: 0,
        avgRating: 0,
        byRating: {}
      };
      
      let totalRating = 0;
      
      result.forEach(item => {
        stats.byRating[item._id] = item.count;
        stats.total += item.count;
        totalRating += item._id * item.count;
      });
      
      if (stats.total > 0) {
        stats.avgRating = totalRating / stats.total;
      }
      
      return stats;
    } catch (error) {
      throw new DatabaseError(`Failed to get feedback statistics: ${error.message}`);
    }
  }
}

module.exports = FeedbackRepository;
