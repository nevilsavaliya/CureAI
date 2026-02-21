const BaseService = require('./BaseService');
const { ValidationError, NotFoundError } = require('../errors');
const CacheService = require('./CacheService');
const CacheInvalidation = require('./CacheInvalidation');

/**
 * Hospital Service
 * Handles hospital management business logic
 */
class HospitalService extends BaseService {
  /**
   * @param {HospitalRepository} hospitalRepository - Hospital repository instance
   */
  constructor(hospitalRepository) {
    super(hospitalRepository);
    this.cache = CacheService;
    this.cacheInvalidation = CacheInvalidation;
    this.cacheTTL = 15 * 60 * 1000; // 15 minutes for hospital data (reduced for 512MB)
  }

  /**
   * Register new hospital
   * @param {Object} hospitalData - Hospital registration data
   * @returns {Promise<Object>} Created hospital info
   */
  async registerHospital(hospitalData) {
    try {
      const { hospitalName, email, password, contactNumber, address } = hospitalData;

      // Validate required fields
      this.validateRequiredFields(hospitalData, ['hospitalName', 'email', 'password', 'contactNumber', 'address']);
      this.validateEmail(email);
      this.validatePassword(password);

      // Check if email already exists
      const existingHospital = await this.repository.findByEmail(email);
      if (existingHospital) {
        throw new ValidationError('Hospital with this email already exists');
      }

      // Create hospital with pending verification
      const hospital = await this.repository.create({
        ...hospitalData,
        verificationStatus: 'pending'
      });

      return {
        hospitalId: hospital._id,
        hospitalName: hospital.hospitalName,
        email: hospital.email,
        verificationStatus: 'pending'
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get hospital profile
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Object>} Hospital profile
   */
  async getProfile(hospitalId) {
    try {
      if (!hospitalId) {
        throw new ValidationError('Hospital ID is required');
      }

      const cacheKey = `hospital:profile:${hospitalId}`;
      
      return await this.cache.getOrSet(cacheKey, async () => {
        const hospital = await this.repository.findById(hospitalId, {
          select: '-password -apiSecret'
        });

        if (!hospital) {
          throw new NotFoundError('Hospital not found');
        }

        return this.transformToDTO(hospital);
      }, this.cacheTTL);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update hospital profile
   * @param {string} hospitalId - Hospital ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated hospital
   */
  async updateProfile(hospitalId, updateData) {
    try {
      if (!hospitalId) {
        throw new ValidationError('Hospital ID is required');
      }

      // Validate update data
      this.validateUpdate(updateData);

      // Remove fields that shouldn't be updated directly
      const { password, email, verificationStatus, apiKey, apiSecret, ...safeUpdateData } = updateData;

      const hospital = await this.repository.update(hospitalId, safeUpdateData);

      if (!hospital) {
        throw new NotFoundError('Hospital not found');
      }

      // Invalidate cache
      await this.cacheInvalidation.invalidateHospital(hospitalId);

      return this.transformToDTO(hospital);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update verification status (admin only)
   * @param {string} hospitalId - Hospital ID
   * @param {string} status - Verification status
   * @returns {Promise<Object>} Updated hospital
   */
  async updateVerificationStatus(hospitalId, status) {
    try {
      if (!hospitalId) {
        throw new ValidationError('Hospital ID is required');
      }

      if (!['pending', 'verified', 'rejected'].includes(status)) {
        throw new ValidationError('Invalid verification status');
      }

      const hospital = await this.repository.update(hospitalId, {
        verificationStatus: status
      });

      if (!hospital) {
        throw new NotFoundError('Hospital not found');
      }

      // Invalidate cache
      await this.cacheInvalidation.invalidateHospital(hospitalId);

      return this.transformToDTO(hospital);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search hospitals
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of hospitals
   */
  async searchHospitals(searchTerm, filters = {}, options = {}) {
    try {
      return await this.repository.search(searchTerm, filters, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get verified hospitals
   * @param {Object} filters - Additional filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Paginated hospitals
   */
  async getVerifiedHospitals(filters = {}, pagination = {}) {
    try {
      const query = { ...filters, verificationStatus: 'verified' };
      const { page = 1, limit = 20 } = pagination;

      const cacheKey = `hospitals:verified:${JSON.stringify(filters)}:${page}:${limit}`;
      
      return await this.cache.getOrSet(cacheKey, async () => {
        return await this.repository.findWithFilters(query, page, limit);
      }, this.cacheTTL);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Transform entity to DTO
   * @param {Object} entity - Entity to transform
   * @returns {Object} DTO
   */
  transformToDTO(entity) {
    if (!entity) {
      return null;
    }

    const obj = entity.toObject ? entity.toObject() : entity;

    // Remove sensitive fields
    const { password, apiSecret, __v, ...dto } = obj;

    return dto;
  }

  /**
   * Get entity name for error messages
   * @returns {string} Entity name
   */
  getEntityName() {
    return 'Hospital';
  }
}

module.exports = HospitalService;
