const BaseService = require('./BaseService');
const { ValidationError, NotFoundError } = require('../errors');
const CacheService = require('./CacheService');
const CacheInvalidation = require('./CacheInvalidation');

/**
 * Patient Service
 * Handles patient management business logic
 */
class PatientService extends BaseService {
  /**
   * @param {PatientRepository} patientRepository - Patient repository instance
   */
  constructor(patientRepository) {
    super(patientRepository);
    this.cache = CacheService;
    this.cacheInvalidation = CacheInvalidation;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes for patient profiles (reduced for 512MB)
  }

  /**
   * Get patient profile
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Patient profile
   */
  async getProfile(patientId) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }

      const cacheKey = `patient:profile:${patientId}`;
      
      return await this.cache.getOrSet(cacheKey, async () => {
        const patient = await this.repository.findById(patientId, {
          select: '-password'
        });

        if (!patient) {
          throw new NotFoundError('Patient not found');
        }

        return this.transformToDTO(patient);
      }, this.cacheTTL);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update patient profile
   * @param {string} patientId - Patient ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated patient
   */
  async updateProfile(patientId, updateData) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }

      // Validate update data
      this.validateUpdate(updateData);

      // Remove fields that shouldn't be updated directly
      const { password, email, ...safeUpdateData } = updateData;

      const patient = await this.repository.update(patientId, safeUpdateData);

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Invalidate cache
      await this.cacheInvalidation.invalidatePatient(patientId);

      return this.transformToDTO(patient);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Add medical history entry
   * @param {string} patientId - Patient ID
   * @param {Object} historyData - Medical history data
   * @returns {Promise<Object>} Updated patient
   */
  async addMedicalHistory(patientId, historyData) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }

      const patient = await this.repository.findById(patientId);
      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Add to medical history
      const currentHistory = patient.medicalHistory || '';
      const newHistory = currentHistory 
        ? `${currentHistory}\n${historyData.entry}` 
        : historyData.entry;

      const updated = await this.repository.update(patientId, {
        medicalHistory: newHistory
      });

      return this.transformToDTO(updated);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Add allergy
   * @param {string} patientId - Patient ID
   * @param {string} allergy - Allergy to add
   * @returns {Promise<Object>} Updated patient
   */
  async addAllergy(patientId, allergy) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }

      if (!allergy) {
        throw new ValidationError('Allergy is required');
      }

      const patient = await this.repository.findById(patientId);
      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Add allergy if not already present
      const allergies = patient.allergies || [];
      if (!allergies.includes(allergy)) {
        allergies.push(allergy);
        const updated = await this.repository.update(patientId, { allergies });
        return this.transformToDTO(updated);
      }

      return this.transformToDTO(patient);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search patients
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of patients
   */
  async searchPatients(searchTerm, filters = {}, options = {}) {
    try {
      return await this.repository.search(searchTerm, filters, options);
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
    return 'Patient';
  }
}

module.exports = PatientService;
