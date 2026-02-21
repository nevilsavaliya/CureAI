const BaseRepository = require('./BaseRepository');
const Doctor = require('../../models/Doctor');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Doctor Repository
 * Handles all database operations for Doctor model
 */
class DoctorRepository extends BaseRepository {
  constructor() {
    super(Doctor);
  }

  /**
   * Find doctor by email
   * @param {string} email - Doctor email
   * @param {Object} options - Query options
   * @returns {Promise<Document|null>} Doctor document or null
   */
  async findByEmail(email, options = {}) {
    try {
      if (!email) {
        throw new ValidationError('Email is required');
      }
      
      // For authentication, we need the Mongoose document with methods
      // So we disable lean by default
      const queryOptions = {
        lean: false,
        ...options
      };
      
      return await this.findOne({ email: email.toLowerCase() }, queryOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find doctor by email: ${error.message}`);
    }
  }

  /**
   * Find doctors by specialization
   * @param {string|Array<string>} specializations - Specialization(s)
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of doctor documents
   */
  async findBySpecialization(specializations, options = {}) {
    try {
      const query = Array.isArray(specializations)
        ? { specializations: { $in: specializations } }
        : { specializations: specializations };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find doctors by specialization: ${error.message}`);
    }
  }

  /**
   * Find active doctors with subscription
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of active doctor documents
   */
  async findActiveWithSubscription(filters = {}, options = {}) {
    try {
      const query = {
        ...filters,
        isActive: true,
        subscriptionStatus: 'active',
        isShadowBanned: { $ne: true } // Exclude shadow-banned doctors
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find active doctors: ${error.message}`);
    }
  }

  /**
   * Find doctors by subscription status
   * @param {string} status - Subscription status (pending, active, expired)
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of doctor documents
   */
  async findBySubscriptionStatus(status, options = {}) {
    try {
      return await this.findMany({ subscriptionStatus: status }, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find doctors by subscription status: ${error.message}`);
    }
  }

  /**
   * Search doctors by name, email, or specialization
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of matching doctor documents
   */
  async search(searchTerm, filters = {}, options = {}) {
    try {
      if (!searchTerm) {
        return await this.findMany(filters, options);
      }
      
      const query = {
        ...filters,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { specializations: { $regex: searchTerm, $options: 'i' } }
        ]
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to search doctors: ${error.message}`);
    }
  }

  /**
   * Update subscription status
   * @param {string} doctorId - Doctor ID
   * @param {string} status - Subscription status
   * @param {Date} expiryDate - Subscription expiry date
   * @returns {Promise<Document|null>} Updated doctor document
   */
  async updateSubscription(doctorId, status, expiryDate = null) {
    try {
      const updateData = {
        subscriptionStatus: status
      };
      
      if (status === 'active') {
        updateData.subscriptionStartDate = new Date();
        if (expiryDate) {
          updateData.subscriptionExpiryDate = expiryDate;
        }
      }
      
      return await this.update(doctorId, updateData);
    } catch (error) {
      throw new DatabaseError(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Update doctor rating
   * @param {string} doctorId - Doctor ID
   * @param {number} newRating - New rating to add
   * @returns {Promise<Document|null>} Updated doctor document
   */
  async updateRating(doctorId, newRating) {
    try {
      const doctor = await this.findById(doctorId);
      if (!doctor) {
        return null;
      }
      
      const totalReviews = doctor.totalReviews + 1;
      const currentTotal = doctor.rating * doctor.totalReviews;
      const newAverage = (currentTotal + newRating) / totalReviews;
      
      return await this.update(doctorId, {
        rating: newAverage,
        totalReviews: totalReviews
      });
    } catch (error) {
      throw new DatabaseError(`Failed to update rating: ${error.message}`);
    }
  }

  /**
   * Get doctors with filters and pagination
   * @param {Object} filters - Filter conditions
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated doctors
   */
  async findWithFilters(filters = {}, page = 1, limit = 10, options = {}) {
    try {
      const query = this.buildQuery(filters);
      
      // Exclude password from results by default
      const selectOptions = options.select || '-password';
      
      return await this.paginate(query, page, limit, {
        ...options,
        select: selectOptions
      });
    } catch (error) {
      throw new DatabaseError(`Failed to find doctors with filters: ${error.message}`);
    }
  }
}

module.exports = DoctorRepository;
