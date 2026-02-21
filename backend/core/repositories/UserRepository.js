const BaseRepository = require('./BaseRepository');
const User = require('../../models/User');
const { DatabaseError, ValidationError } = require('../errors');

/**
 * User Repository
 * Handles all database operations for User model
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @param {Object} options - Query options
   * @returns {Promise<Document|null>} User document or null
   */
  async findByEmail(email, options = {}) {
    try {
      if (!email) {
        throw new ValidationError('Email is required');
      }
      
      return await this.findOne({ email: email.toLowerCase() }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find users by role
   * @param {string} role - User role (patient, doctor, admin)
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of user documents
   */
  async findByRole(role, options = {}) {
    try {
      if (!role) {
        throw new ValidationError('Role is required');
      }
      
      return await this.findMany({ role }, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find users by role: ${error.message}`);
    }
  }

  /**
   * Find active users
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of active user documents
   */
  async findActive(filters = {}, options = {}) {
    try {
      const query = { ...filters, isActive: true };
      return await this.findMany(query, options);
    } catch (error) {
      throw new DatabaseError(`Failed to find active users: ${error.message}`);
    }
  }

  /**
   * Search users by name or email
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters (role, isActive)
   * @param {Object} options - Query options
   * @returns {Promise<Document[]>} Array of matching user documents
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
      throw new DatabaseError(`Failed to search users: ${error.message}`);
    }
  }

  /**
   * Create user with hashed password
   * @param {Object} userData - User data
   * @returns {Promise<Document>} Created user document
   */
  async create(userData) {
    try {
      // Password hashing is handled by the User model's pre-save hook
      return await super.create(userData);
    } catch (error) {
      if (error.code === 11000) {
        throw new ValidationError('Email already exists');
      }
      throw new DatabaseError(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password (will be hashed)
   * @returns {Promise<Document|null>} Updated user document
   */
  async updatePassword(userId, newPassword) {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }
      
      const user = await this.findById(userId);
      if (!user) {
        return null;
      }
      
      // Set new password and save (pre-save hook will hash it)
      user.password = newPassword;
      return await user.save();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Verify user password
   * @param {string} userId - User ID
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>} True if password matches, false otherwise
   */
  async verifyPassword(userId, password) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        return false;
      }
      
      return await user.comparePassword(password);
    } catch (error) {
      throw new DatabaseError(`Failed to verify password: ${error.message}`);
    }
  }

  /**
   * Update last login timestamp
   * @param {string} userId - User ID
   * @returns {Promise<Document|null>} Updated user document
   */
  async updateLastLogin(userId) {
    try {
      return await this.update(userId, { lastLogin: new Date() });
    } catch (error) {
      throw new DatabaseError(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Deactivate user
   * @param {string} userId - User ID
   * @returns {Promise<Document|null>} Updated user document
   */
  async deactivate(userId) {
    try {
      return await this.update(userId, { isActive: false });
    } catch (error) {
      throw new DatabaseError(`Failed to deactivate user: ${error.message}`);
    }
  }

  /**
   * Activate user
   * @param {string} userId - User ID
   * @returns {Promise<Document|null>} Updated user document
   */
  async activate(userId) {
    try {
      return await this.update(userId, { isActive: true });
    } catch (error) {
      throw new DatabaseError(`Failed to activate user: ${error.message}`);
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if email exists, false otherwise
   */
  async emailExists(email) {
    try {
      return await this.exists({ email: email.toLowerCase() });
    } catch (error) {
      throw new DatabaseError(`Failed to check email existence: ${error.message}`);
    }
  }

  /**
   * Get user statistics by role
   * @returns {Promise<Object>} User statistics
   */
  async getStatsByRole() {
    try {
      const stats = await this.model.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ]);
      
      return stats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          active: stat.active,
          inactive: stat.count - stat.active
        };
        return acc;
      }, {});
    } catch (error) {
      throw new DatabaseError(`Failed to get user statistics: ${error.message}`);
    }
  }

  /**
   * Find users with filters and pagination
   * @param {Object} filters - Filter conditions
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated users
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
      throw new DatabaseError(`Failed to find users with filters: ${error.message}`);
    }
  }
}

module.exports = UserRepository;
