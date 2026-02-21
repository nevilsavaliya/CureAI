const BaseRepository = require('./BaseRepository');
const Consultation = require('../../models/Consultation');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Consultation Repository
 * Handles all database operations for Consultation model
 */
class ConsultationRepository extends BaseRepository {
  constructor() {
    super(Consultation);
  }

  /**
   * Find consultations by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of consultation documents
   */
  async findByPatient(patientId, options = {}) {
    try {
      if (!patientId) {
        throw new ValidationError('Patient ID is required');
      }
      
      const defaultOptions = {
        sort: { scheduledDate: -1 },
        populate: ['doctorId', 'patientId'],
        ...options
      };
      
      return await this.findMany({ patientId }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find consultations by patient: ${error.message}`);
    }
  }

  /**
   * Find consultations by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of consultation documents
   */
  async findByDoctor(doctorId, options = {}) {
    try {
      if (!doctorId) {
        throw new ValidationError('Doctor ID is required');
      }
      
      const defaultOptions = {
        sort: { scheduledDate: -1 },
        populate: ['doctorId', 'patientId'],
        ...options
      };
      
      return await this.findMany({ doctorId }, defaultOptions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find consultations by doctor: ${error.message}`);
    }
  }

  /**
   * Find consultations by status
   * @param {string} status - Consultation status
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of consultation documents
   */
  async findByStatus(status, options = {}) {
    try {
      if (!status) {
        throw new ValidationError('Status is required');
      }
      
      return await this.findMany({ status }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find consultations by status: ${error.message}`);
    }
  }

  /**
   * Find upcoming consultations for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of upcoming consultation documents
   */
  async findUpcomingByDoctor(doctorId, options = {}) {
    try {
      const query = {
        doctorId,
        scheduledDate: { $gte: new Date() },
        status: { $in: ['scheduled', 'in-progress'] }
      };
      
      return await this.findMany(query, {
        sort: { scheduledDate: 1 },
        ...options
      });
    } catch (error) {
      throw new DatabaseError(`Failed to find upcoming consultations: ${error.message}`);
    }
  }

  /**
   * Update consultation status
   * @param {string} consultationId - Consultation ID
   * @param {string} status - New status
   * @returns {Promise<Document|null>} Updated consultation document
   */
  async updateStatus(consultationId, status) {
    try {
      if (!status) {
        throw new ValidationError('Status is required');
      }
      
      const updateData = { status };
      
      if (status === 'in-progress') {
        updateData.startedAt = new Date();
      } else if (status === 'completed') {
        updateData.endedAt = new Date();
      }
      
      return await this.update(consultationId, updateData);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update consultation status: ${error.message}`);
    }
  }
}

module.exports = ConsultationRepository;
