const BaseRepository = require('./BaseRepository');
const Hospital = require('../../models/Hospital');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Hospital Repository
 * Handles all database operations for Hospital model
 */
class HospitalRepository extends BaseRepository {
  constructor() {
    super(Hospital);
  }

  /**
   * Find hospital by email
   * @param {string} email - Hospital email
   * @param {Object} options - Query options
   * @returns {Promise<Document|null>} Hospital document or null
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
      throw new DatabaseError(`Failed to find hospital by email: ${error.message}`);
    }
  }

  /**
   * Find hospital by API key
   * @param {string} apiKey - Hospital API key
   * @param {Object} options - Query options
   * @returns {Promise<Document|null>} Hospital document or null
   */
  async findByApiKey(apiKey, options = {}) {
    try {
      if (!apiKey) {
        throw new ValidationError('API key is required');
      }
      
      return await this.findOne({ apiKey }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find hospital by API key: ${error.message}`);
    }
  }

  /**
   * Find hospital by registration number
   * @param {string} registrationNumber - Hospital registration number
   * @param {Object} options - Query options
   * @returns {Promise<Document|null>} Hospital document or null
   */
  async findByRegistrationNumber(registrationNumber, options = {}) {
    try {
      if (!registrationNumber) {
        throw new ValidationError('Registration number is required');
      }
      
      return await this.findOne({ registrationNumber }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find hospital by registration number: ${error.message}`);
    }
  }

  /**
   * Find hospitals by verification status
   * @param {string} status - Verification status (pending, verified, rejected)
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of hospital documents
   */
  async findByVerificationStatus(status, options = {}) {
    try {
      if (!status) {
        throw new ValidationError('Status is required');
      }
      
      return await this.findMany({ verificationStatus: status }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find hospitals by verification status: ${error.message}`);
    }
  }

  /**
   * Find verified and active hospitals
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of hospital documents
   */
  async findVerifiedAndActive(filters = {}, options = {}) {
    try {
      const query = {
        ...filters,
        verificationStatus: 'verified',
        isActive: true
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find verified hospitals: ${error.message}`);
    }
  }

  /**
   * Search hospitals by name or location
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of matching hospital documents
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
          { hospitalName: { $regex: searchTerm, $options: 'i' } },
          { 'address.city': { $regex: searchTerm, $options: 'i' } },
          { 'address.state': { $regex: searchTerm, $options: 'i' } }
        ]
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to search hospitals: ${error.message}`);
    }
  }

  /**
   * Update verification status
   * @param {string} hospitalId - Hospital ID
   * @param {string} status - Verification status
   * @param {string} adminId - Admin ID who verified
   * @param {string} rejectionReason - Reason for rejection (optional)
   * @returns {Promise<Document|null>} Updated hospital document
   */
  async updateVerificationStatus(hospitalId, status, adminId, rejectionReason = null) {
    try {
      const updateData = {
        verificationStatus: status
      };
      
      if (status === 'verified') {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = adminId;
      } else if (status === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      return await this.update(hospitalId, updateData);
    } catch (error) {
      throw new DatabaseError(`Failed to update verification status: ${error.message}`);
    }
  }

  /**
   * Generate and save API credentials
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Object>} API credentials
   */
  async generateApiCredentials(hospitalId) {
    try {
      const hospital = await this.findById(hospitalId);
      if (!hospital) {
        throw new ValidationError('Hospital not found');
      }
      
      const credentials = hospital.generateApiCredentials();
      await hospital.save();
      
      return credentials;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to generate API credentials: ${error.message}`);
    }
  }

  /**
   * Update last API access
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Document|null>} Updated hospital document
   */
  async updateLastApiAccess(hospitalId) {
    try {
      return await this.update(hospitalId, {
        lastApiAccess: new Date(),
        $inc: { apiAccessCount: 1 }
      });
    } catch (error) {
      throw new DatabaseError(`Failed to update last API access: ${error.message}`);
    }
  }

  /**
   * Get hospitals with filters and pagination
   * @param {Object} filters - Filter conditions
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated hospitals
   */
  async findWithFilters(filters = {}, page = 1, limit = 10, options = {}) {
    try {
      const query = this.buildQuery(filters);
      
      // Exclude password and apiSecret from results by default
      const selectOptions = options.select || '-password -apiSecret';
      
      return await this.paginate(query, page, limit, {
        ...options,
        select: selectOptions
      });
    } catch (error) {
      throw new DatabaseError(`Failed to find hospitals with filters: ${error.message}`);
    }
  }
}

module.exports = HospitalRepository;
