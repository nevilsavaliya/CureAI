/**
 * Cache Invalidation Helper
 * Provides centralized cache invalidation strategies for different entities
 */

const CacheService = require('./CacheService');

class CacheInvalidation {
  constructor() {
    this.cache = CacheService;
  }

  /**
   * Invalidate user-related caches
   * @param {string} userId - User ID
   * @param {string} role - User role
   */
  async invalidateUser(userId, role) {
    await this.cache.delete(`user:${userId}:${role}`);
    
    // Invalidate role-specific caches
    if (role === 'patient') {
      await this.cache.delete(`patient:profile:${userId}`);
    } else if (role === 'doctor') {
      await this.cache.delete(`doctor:profile:${userId}`);
      // Invalidate doctor lists that might include this doctor
      await this.cache.deletePattern('doctors:*');
    } else if (role === 'hospital') {
      await this.cache.delete(`hospital:profile:${userId}`);
      await this.cache.deletePattern('hospitals:verified:*');
    }
  }

  /**
   * Invalidate patient-related caches
   * @param {string} patientId - Patient ID
   */
  async invalidatePatient(patientId) {
    await this.cache.delete(`patient:profile:${patientId}`);
    await this.cache.delete(`user:${patientId}:patient`);
  }

  /**
   * Invalidate doctor-related caches
   * @param {string} doctorId - Doctor ID
   */
  async invalidateDoctor(doctorId) {
    await this.cache.delete(`doctor:profile:${doctorId}`);
    await this.cache.delete(`user:${doctorId}:doctor`);
    
    // Invalidate all doctor lists as this doctor might be in them
    await this.cache.deletePattern('doctors:*');
  }

  /**
   * Invalidate hospital-related caches
   * @param {string} hospitalId - Hospital ID
   */
  async invalidateHospital(hospitalId) {
    await this.cache.delete(`hospital:profile:${hospitalId}`);
    await this.cache.delete(`user:${hospitalId}:hospital`);
    
    // Invalidate verified hospital lists
    await this.cache.deletePattern('hospitals:verified:*');
  }

  /**
   * Invalidate case-related caches
   * @param {string} caseId - Case ID
   * @param {string} patientId - Patient ID
   * @param {string} doctorId - Doctor ID
   */
  async invalidateCase(caseId, patientId = null, doctorId = null) {
    await this.cache.delete(`case:${caseId}`);
    
    // Invalidate case lists for patient
    if (patientId) {
      await this.cache.deletePattern(`cases:patient:${patientId}:*`);
    }
    
    // Invalidate case lists for doctor
    if (doctorId) {
      await this.cache.deletePattern(`cases:doctor:${doctorId}:*`);
    }
  }

  /**
   * Invalidate notification-related caches
   * @param {string} userId - User ID
   */
  async invalidateNotifications(userId) {
    await this.cache.deletePattern(`notifications:${userId}:*`);
    await this.cache.delete(`notifications:unread:${userId}`);
  }

  /**
   * Invalidate message-related caches
   * @param {string} caseId - Case ID
   */
  async invalidateMessages(caseId) {
    await this.cache.deletePattern(`messages:case:${caseId}:*`);
  }

  /**
   * Invalidate specialization caches
   * Should be called when specialization data changes
   */
  async invalidateSpecializations() {
    await this.cache.delete('specializations:all');
    await this.cache.deletePattern('doctors:specialization:*');
  }

  /**
   * Warm up critical caches
   * Pre-populate frequently accessed data
   */
  async warmUpCache() {
    // This method can be called on application startup
    // to pre-populate critical caches
    
    // Example: Pre-cache specializations
    try {
      const diseaseSpecializationMapping = require('../../services/diseaseSpecializationMapping');
      const specializations = diseaseSpecializationMapping.getAllSpecializations();
      await this.cache.set('specializations:all', specializations, 60 * 60 * 1000); // 1 hour
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }

  /**
   * Clear all caches (use with caution)
   */
  async clearAll() {
    await this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Export singleton instance
module.exports = new CacheInvalidation();
