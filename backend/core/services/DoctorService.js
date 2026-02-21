const BaseService = require('./BaseService');
const { ValidationError, NotFoundError } = require('../errors');
const CacheService = require('./CacheService');
const CacheInvalidation = require('./CacheInvalidation');

/**
 * Doctor Service
 * Handles doctor management business logic
 */
class DoctorService extends BaseService {
  /**
   * @param {DoctorRepository} doctorRepository - Doctor repository instance
   * @param {Object} dependencies - Service dependencies {patientRepository, predictionModel}
   */
  constructor(doctorRepository, dependencies = {}) {
    super(doctorRepository);
    this.patientRepository = dependencies.patientRepository;
    this.predictionModel = dependencies.predictionModel;
    this.cache = CacheService;
    this.cacheInvalidation = CacheInvalidation;
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes for doctor lists (reduced for 512MB)
  }

  /**
   * Get recommended doctors by specializations
   * Uses Universal Doctor Matcher service to ensure General Medicine doctors are included
   * @param {Array<string>} specializations - List of specializations
   * @param {Object} options - Options {location, limit}
   * @returns {Promise<Array>} List of recommended doctors
   */
  async getRecommendedDoctors(specializations = [], options = {}) {
    try {
      const { location = null, limit = 20 } = options;

      // Create cache key
      const cacheKey = `doctors:recommended:${specializations.sort().join(',')}:${location}:${limit}`;
      
      // Try to get from cache
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Use Universal Doctor Matcher service
      const universalDoctorMatcher = require('../../services/universalDoctorMatcher');
      const doctors = await universalDoctorMatcher.getRecommendedDoctors(specializations, {
        location,
        limit
      });

      // Cache the result
      await this.cache.set(cacheKey, doctors, this.cacheTTL);

      return doctors;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Match doctors by specializations with ML-based matching
   * @param {Array<string>} specializations - List of specializations
   * @param {Object} options - Options {patientId, location, limit}
   * @returns {Promise<Array>} List of matched doctors
   */
  async matchDoctors(specializations = [], options = {}) {
    try {
      const { patientId, location = null, limit = 20 } = options;

      // Use Universal Doctor Matcher service
      const universalDoctorMatcher = require('../../services/universalDoctorMatcher');
      const doctors = await universalDoctorMatcher.getRecommendedDoctors(specializations, {
        location,
        limit
      });

      return doctors;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get patient records for doctor
   * @param {string} doctorId - Doctor ID
   * @param {string} doctorEmail - Doctor email
   * @returns {Promise<Array>} List of patient records
   */
  async getPatientRecords(doctorId, doctorEmail) {
    try {
      // Find doctor by email
      const doctor = await this.repository.findByEmail(doctorEmail);
      if (!doctor) {
        throw new NotFoundError('Doctor profile not found');
      }

      // Get predictions matching doctor's speciality
      if (!this.predictionModel) {
        throw new Error('Prediction model not configured');
      }

      const predictions = await this.predictionModel
        .find({
          'diseases.specialization': doctor.speciality
        })
        .populate('patientId', 'name email bloodGroup')
        .populate('symptomId')
        .sort({ createdAt: -1 })
        .limit(50);

      return predictions;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get patient detail
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Patient details with predictions
   */
  async getPatientDetail(patientId) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }

      // Get patient
      const patient = await this.patientRepository.findById(patientId, {
        select: 'name email dateOfBirth bloodGroup contactNumber'
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Get predictions for patient
      if (!this.predictionModel) {
        throw new Error('Prediction model not configured');
      }

      const predictions = await this.predictionModel
        .find({ patientId })
        .populate('symptomId')
        .sort({ createdAt: -1 });

      return {
        ...patient.toObject(),
        predictions
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all available specializations
   * @returns {Promise<Array>} List of specializations
   */
  async getAllSpecializations() {
    try {
      // Cache specializations as they rarely change
      const cacheKey = 'specializations:all';
      
      return await this.cache.getOrSet(cacheKey, async () => {
        const diseaseSpecializationMapping = require('../../services/diseaseSpecializationMapping');
        return diseaseSpecializationMapping.getAllSpecializations();
      }, 60 * 60 * 1000); // 1 hour TTL
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search doctors
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of doctors
   */
  async searchDoctors(searchTerm, filters = {}, options = {}) {
    try {
      return await this.repository.search(searchTerm, filters, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get doctors by specialization
   * @param {string|Array<string>} specializations - Specialization(s)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of doctors
   */
  async getDoctorsBySpecialization(specializations, options = {}) {
    try {
      const specArray = Array.isArray(specializations) ? specializations : [specializations];
      const cacheKey = `doctors:specialization:${specArray.sort().join(',')}:${JSON.stringify(options)}`;
      
      return await this.cache.getOrSet(cacheKey, async () => {
        return await this.repository.findBySpecialization(specializations, options);
      }, this.cacheTTL);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get active doctors with subscription
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of active doctors
   */
  async getActiveDoctors(filters = {}, options = {}) {
    try {
      return await this.repository.findActiveWithSubscription(filters, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update doctor subscription
   * @param {string} doctorId - Doctor ID
   * @param {string} status - Subscription status
   * @param {Date} expiryDate - Subscription expiry date
   * @returns {Promise<Object>} Updated doctor
   */
  async updateSubscription(doctorId, status, expiryDate = null) {
    try {
      if (!doctorId) {
        throw new ValidationError('Doctor ID is required');
      }

      if (!status) {
        throw new ValidationError('Subscription status is required');
      }

      const doctor = await this.repository.updateSubscription(doctorId, status, expiryDate);

      if (!doctor) {
        throw new NotFoundError('Doctor not found');
      }

      // Invalidate doctor caches
      await this.cacheInvalidation.invalidateDoctor(doctorId);

      return this.transformToDTO(doctor);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update doctor profile
   * @param {string} doctorId - Doctor ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated doctor
   */
  async updateProfile(doctorId, updateData) {
    try {
      if (!doctorId) {
        throw new ValidationError('Doctor ID is required');
      }

      // Validate update data
      this.validateUpdate(updateData);

      // Remove fields that shouldn't be updated directly
      const { password, subscriptionStatus, rating, totalReviews, ...safeUpdateData } = updateData;

      const doctor = await this.repository.update(doctorId, safeUpdateData);

      if (!doctor) {
        throw new NotFoundError('Doctor not found');
      }

      // Invalidate doctor caches
      await this.cacheInvalidation.invalidateDoctor(doctorId);

      return this.transformToDTO(doctor);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get doctor statistics
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Doctor statistics
   */
  async getDoctorStatistics(doctorId) {
    try {
      if (!doctorId) {
        throw new ValidationError('Doctor ID is required');
      }

      const doctor = await this.repository.findById(doctorId);
      if (!doctor) {
        throw new NotFoundError('Doctor not found');
      }

      // Get case statistics if CaseRepository is available
      let caseStats = {
        total: 0,
        pending: 0,
        ongoing: 0,
        treated: 0,
        rejected: 0
      };

      // This would require CaseRepository to be injected
      // For now, return basic doctor info
      return {
        doctor: this.transformToDTO(doctor),
        cases: caseStats,
        rating: doctor.rating || 0,
        totalReviews: doctor.totalReviews || 0
      };
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
    const { password, __v, ...dto } = obj;

    return dto;
  }

  /**
   * Get entity name for error messages
   * @returns {string} Entity name
   */
  getEntityName() {
    return 'Doctor';
  }
}

module.exports = DoctorService;
