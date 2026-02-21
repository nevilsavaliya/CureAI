const BaseRepository = require('./BaseRepository');
const Patient = require('../../models/Patient');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Patient Repository
 * Handles all database operations for Patient model
 */
class PatientRepository extends BaseRepository {
  constructor() {
    super(Patient);
  }

  /**
   * Find patient by email
   * @param {string} email - Patient email
   * @param {Object} options - Query options
   * @returns {Promise<Document|null>} Patient document or null
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
      throw new DatabaseError(`Failed to find patient by email: ${error.message}`);
    }
  }

  /**
   * Search patients by name or email
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of matching patient documents
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
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to search patients: ${error.message}`);
    }
  }

  /**
   * Add extracted symptom to patient
   * @param {string} patientId - Patient ID
   * @param {Object} symptomData - Symptom data
   * @returns {Promise<Document|null>} Updated patient document
   */
  async addExtractedSymptom(patientId, symptomData) {
    try {
      const patient = await this.findById(patientId);
      if (!patient) {
        return null;
      }
      
      patient.extractedSymptoms.push({
        ...symptomData,
        extractedAt: new Date()
      });
      
      return await patient.save();
    } catch (error) {
      throw new DatabaseError(`Failed to add extracted symptom: ${error.message}`);
    }
  }

  /**
   * Add vital signs record
   * @param {string} patientId - Patient ID
   * @param {Object} vitalSignsData - Vital signs data
   * @returns {Promise<Document|null>} Updated patient document
   */
  async addVitalSigns(patientId, vitalSignsData) {
    try {
      const patient = await this.findById(patientId);
      if (!patient) {
        return null;
      }
      
      patient.vitalSigns.push({
        ...vitalSignsData,
        recordedAt: new Date()
      });
      
      return await patient.save();
    } catch (error) {
      throw new DatabaseError(`Failed to add vital signs: ${error.message}`);
    }
  }

  /**
   * Get patients with filters and pagination
   * @param {Object} filters - Filter conditions
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated patients
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
      throw new DatabaseError(`Failed to find patients with filters: ${error.message}`);
    }
  }
}

module.exports = PatientRepository;
