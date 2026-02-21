const BaseRepository = require('./BaseRepository');
const Case = require('../../models/Case');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Case Repository
 * Handles all database operations for Case model
 */
class CaseRepository extends BaseRepository {
  constructor() {
    super(Case);
  }

  /**
   * Find cases by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of case documents
   */
  async findByPatient(patientId, options = {}) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }
      
      const defaultOptions = {
        sort: { createdAt: -1 },
        populate: ['doctorId', 'patientId'],
        ...options
      };
      
      return await this.findMany({ patientId }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find cases by patient: ${error.message}`);
    }
  }

  /**
   * Find cases by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of case documents
   */
  async findByDoctor(doctorId, options = {}) {
    try {
      if (!doctorId) {
        throw new ValidationError('Doctor ID is required');
      }
      
      const defaultOptions = {
        sort: { createdAt: -1 },
        populate: ['doctorId', 'patientId'],
        ...options
      };
      
      return await this.findMany({ doctorId }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find cases by doctor: ${error.message}`);
    }
  }

  /**
   * Find cases by status
   * @param {string} status - Case status (pending, ongoing, treated, rejected)
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of case documents
   */
  async findByStatus(status, options = {}) {
    try {
      if (!status) {
        throw new ValidationError('Status is required');
      }
      
      const defaultOptions = {
        sort: { createdAt: -1 },
        populate: ['doctorId', 'patientId'],
        ...options
      };
      
      return await this.findMany({ status }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find cases by status: ${error.message}`);
    }
  }

  /**
   * Find cases by patient and status
   * @param {string} patientId - Patient ID
   * @param {string} status - Case status
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of case documents
   */
  async findByPatientAndStatus(patientId, status, options = {}) {
    try {
      if (!patientId || !status) {
        throw new ValidationError('Patient ID and status are required');
      }
      
      const defaultOptions = {
        sort: { createdAt: -1 },
        populate: ['doctorId', 'patientId'],
        ...options
      };
      
      return await this.findMany({ patientId, status }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find cases by patient and status: ${error.message}`);
    }
  }

  /**
   * Find cases by doctor and status
   * @param {string} doctorId - Doctor ID
   * @param {string} status - Case status
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of case documents
   */
  async findByDoctorAndStatus(doctorId, status, options = {}) {
    try {
      if (!doctorId || !status) {
        throw new ValidationError('Doctor ID and status are required');
      }
      
      const defaultOptions = {
        sort: { createdAt: -1 },
        populate: ['doctorId', 'patientId'],
        ...options
      };
      
      return await this.findMany({ doctorId, status }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find cases by doctor and status: ${error.message}`);
    }
  }

  /**
   * Find pending cases for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of pending case documents
   */
  async findPendingByDoctor(doctorId, options = {}) {
    try {
      return await this.findByDoctorAndStatus(doctorId, 'pending', options);
    } catch (error) {
      throw new DatabaseError(`Failed to find pending cases: ${error.message}`);
    }
  }

  /**
   * Find ongoing cases for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of ongoing case documents
   */
  async findOngoingByDoctor(doctorId, options = {}) {
    try {
      return await this.findByDoctorAndStatus(doctorId, 'ongoing', options);
    } catch (error) {
      throw new DatabaseError(`Failed to find ongoing cases: ${error.message}`);
    }
  }

  /**
   * Find cases with filters and pagination
   * @param {Object} filters - Filter conditions
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated cases
   */
  async findWithFilters(filters = {}, page = 1, limit = 10, options = {}) {
    try {
      const query = this.buildQuery(filters);
      
      const defaultOptions = {
        sort: { createdAt: -1 },
        populate: ['doctorId', 'patientId'],
        ...options
      };
      
      return await this.paginate(query, page, limit, defaultOptions);
    } catch (error) {
      throw new DatabaseError(`Failed to find cases with filters: ${error.message}`);
    }
  }

  /**
   * Search cases by symptoms or conditions
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of matching case documents
   */
  async search(searchTerm, filters = {}, options = {}) {
    try {
      if (!searchTerm) {
        return await this.findMany(filters, options);
      }
      
      const query = {
        ...filters,
        $or: [
          { symptoms: { $regex: searchTerm, $options: 'i' } },
          { predictedConditions: { $regex: searchTerm, $options: 'i' } },
          { diagnosis: { $regex: searchTerm, $options: 'i' } }
        ]
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to search cases: ${error.message}`);
    }
  }

  /**
   * Update case status
   * @param {string} caseId - Case ID
   * @param {string} status - New status
   * @returns {Promise<Document|null>} Updated case document
   */
  async updateStatus(caseId, status) {
    try {
      if (!status) {
        throw new ValidationError('Status is required');
      }
      
      const updateData = { status };
      
      // Set timestamp based on status
      if (status === 'ongoing') {
        updateData.acceptedAt = new Date();
      } else if (status === 'treated') {
        updateData.treatedAt = new Date();
      } else if (status === 'rejected') {
        updateData.rejectedAt = new Date();
      }
      
      return await this.update(caseId, updateData);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update case status: ${error.message}`);
    }
  }

  /**
   * Add feedback to case
   * @param {string} caseId - Case ID
   * @param {number} rating - Rating (1-5)
   * @param {string} comment - Feedback comment
   * @returns {Promise<Document|null>} Updated case document
   */
  async addFeedback(caseId, rating, comment) {
    try {
      if (!rating || rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }
      
      return await this.update(caseId, {
        feedback: {
          rating,
          comment,
          submittedAt: new Date()
        }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to add feedback: ${error.message}`);
    }
  }

  /**
   * Update last message timestamp
   * @param {string} caseId - Case ID
   * @returns {Promise<Document|null>} Updated case document
   */
  async updateLastMessage(caseId) {
    try {
      return await this.update(caseId, { lastMessageAt: new Date() });
    } catch (error) {
      throw new DatabaseError(`Failed to update last message: ${error.message}`);
    }
  }

  /**
   * Get case statistics
   * @param {Object} filters - Optional filters (doctorId, patientId, dateRange)
   * @returns {Promise<Object>} Case statistics
   */
  async getStatistics(filters = {}) {
    try {
      const matchStage = {};
      
      if (filters.doctorId) {
        matchStage.doctorId = filters.doctorId;
      }
      
      if (filters.patientId) {
        matchStage.patientId = filters.patientId;
      }
      
      if (filters.startDate || filters.endDate) {
        matchStage.createdAt = {};
        if (filters.startDate) {
          matchStage.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          matchStage.createdAt.$lte = new Date(filters.endDate);
        }
      }
      
      const stats = await this.model.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgFeedbackRating: { $avg: '$feedback.rating' }
          }
        }
      ]);
      
      const result = {
        total: 0,
        byStatus: {},
        avgRating: 0
      };
      
      let totalRatings = 0;
      let ratingCount = 0;
      
      stats.forEach(stat => {
        result.total += stat.count;
        result.byStatus[stat._id] = stat.count;
        
        if (stat.avgFeedbackRating) {
          totalRatings += stat.avgFeedbackRating * stat.count;
          ratingCount += stat.count;
        }
      });
      
      if (ratingCount > 0) {
        result.avgRating = totalRatings / ratingCount;
      }
      
      return result;
    } catch (error) {
      throw new DatabaseError(`Failed to get case statistics: ${error.message}`);
    }
  }

  /**
   * Get cases by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of case documents
   */
  async findByDateRange(startDate, endDate, options = {}) {
    try {
      const query = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find cases by date range: ${error.message}`);
    }
  }

  /**
   * Find cases by symptom conversation ID
   * @param {string} conversationId - Symptom conversation ID
   * @param {Object} options - Query options
   * @returns {Promise<Document|null>} Case document or null
   */
  async findByConversationId(conversationId, options = {}) {
    try {
      if (!conversationId) {
        throw new ValidationError('Conversation ID is required');
      }
      
      return await this.findOne({ symptomConversationId: conversationId }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find case by conversation ID: ${error.message}`);
    }
  }
}

module.exports = CaseRepository;
