const BaseRepository = require('./BaseRepository');
const Symptom = require('../../models/Symptom');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Symptom Repository
 * Handles all database operations for Symptom model
 */
class SymptomRepository extends BaseRepository {
  constructor() {
    super(Symptom);
  }

  /**
   * Find symptoms by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of symptom documents
   */
  async findByPatient(patientId, options = {}) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }
      
      const defaultOptions = {
        sort: { submittedAt: -1 },
        ...options
      };
      
      return await this.findMany({ patientId }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find symptoms by patient: ${error.message}`);
    }
  }

  /**
   * Find recent symptoms for a patient
   * @param {string} patientId - Patient ID
   * @param {number} days - Number of days to look back
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of symptom documents
   */
  async findRecentByPatient(patientId, days = 30, options = {}) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const query = {
        patientId,
        submittedAt: { $gte: cutoffDate }
      };
      
      return await this.findMany(query, {
        sort: { submittedAt: -1 },
        ...options
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find recent symptoms: ${error.message}`);
    }
  }

  /**
   * Search symptoms by text
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of matching symptom documents
   */
  async search(searchTerm, filters = {}, options = {}) {
    try {
      if (!searchTerm) {
        return await this.findMany(filters, options);
      }
      
      const query = {
        ...filters,
        symptomText: { $regex: searchTerm, $options: 'i' }
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to search symptoms: ${error.message}`);
    }
  }
}

module.exports = SymptomRepository;
