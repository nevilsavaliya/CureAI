const BaseRepository = require('./BaseRepository');
const Subscription = require('../../models/Subscription');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * Subscription Repository
 * Handles all database operations for Subscription model
 */
class SubscriptionRepository extends BaseRepository {
  constructor() {
    super(Subscription);
  }

  /**
   * Find subscription by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Document|null>} Subscription document or null
   */
  async findByDoctor(doctorId, options = {}) {
    try {
      if (!doctorId) {
        throw new ValidationError('Doctor ID is required');
      }
      
      return await this.findOne({ doctorId }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find subscription by doctor: ${error.message}`);
    }
  }

  /**
   * Find active subscriptions
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of active subscription documents
   */
  async findActive(options = {}) {
    try {
      return await this.findMany({ isActive: true }, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find active subscriptions: ${error.message}`);
    }
  }

  /**
   * Find expired subscriptions
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of expired subscription documents
   */
  async findExpired(options = {}) {
    try {
      const query = {
        expiryDate: { $lt: new Date() },
        isActive: true
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find expired subscriptions: ${error.message}`);
    }
  }

  /**
   * Find subscriptions expiring soon
   * @param {number} days - Number of days to check
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of subscription documents
   */
  async findExpiringSoon(days = 7, options = {}) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const query = {
        expiryDate: { $gte: now, $lte: futureDate },
        isActive: true
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find expiring subscriptions: ${error.message}`);
    }
  }

  /**
   * Create or update subscription for doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Document>} Subscription document
   */
  async createOrUpdate(doctorId, subscriptionData) {
    try {
      const existing = await this.findByDoctor(doctorId);
      
      if (existing) {
        return await this.update(existing._id, subscriptionData);
      }
      
      return await this.create({ doctorId, ...subscriptionData });
    } catch (error) {
      throw new DatabaseError(`Failed to create or update subscription: ${error.message}`);
    }
  }

  /**
   * Deactivate subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Document|null>} Updated subscription document
   */
  async deactivate(subscriptionId) {
    try {
      return await this.update(subscriptionId, { isActive: false });
    } catch (error) {
      throw new DatabaseError(`Failed to deactivate subscription: ${error.message}`);
    }
  }

  /**
   * Activate subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Document|null>} Updated subscription document
   */
  async activate(subscriptionId) {
    try {
      return await this.update(subscriptionId, { isActive: true });
    } catch (error) {
      throw new DatabaseError(`Failed to activate subscription: ${error.message}`);
    }
  }

  /**
   * Check if doctor has active subscription
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<boolean>} True if has active subscription, false otherwise
   */
  async hasActiveSubscription(doctorId) {
    try {
      const subscription = await this.findByDoctor(doctorId);
      
      if (!subscription || !subscription.isActive) {
        return false;
      }
      
      return new Date() < new Date(subscription.expiryDate);
    } catch (error) {
      throw new DatabaseError(`Failed to check subscription status: ${error.message}`);
    }
  }
}

module.exports = SubscriptionRepository;
