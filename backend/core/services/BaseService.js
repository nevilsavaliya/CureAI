const { ValidationError, NotFoundError } = require('../errors');

/**
 * Base Service class providing common patterns for all services
 * Implements standard CRUD operations and utilities
 */
class BaseService {
  /**
   * @param {BaseRepository} repository - Repository instance for data access
   */
  constructor(repository) {
    if (!repository) {
      throw new Error('Repository is required for BaseService');
    }
    this.repository = repository;
  }

  /**
   * Create a new entity
   * @param {Object} data - Entity data
   * @returns {Promise<Object>} Created entity DTO
   */
  async create(data) {
    try {
      // Validate data before creation
      this.validateCreate(data);
      
      // Create entity using repository
      const entity = await this.repository.create(data);
      
      // Transform to DTO
      return this.transformToDTO(entity);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get entity by ID
   * @param {string} id - Entity ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Entity DTO
   */
  async getById(id, options = {}) {
    try {
      if (!id) {
        throw new ValidationError('ID is required');
      }
      
      const entity = await this.repository.findById(id, options);
      
      if (!entity) {
        throw new NotFoundError(`${this.getEntityName()} not found`);
      }
      
      return this.transformToDTO(entity);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all entities with filters and pagination
   * @param {Object} filters - Filter conditions
   * @param {Object} pagination - Pagination options {page, limit}
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated entities
   */
  async getAll(filters = {}, pagination = {}, options = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      
      const result = await this.repository.findWithFilters(filters, page, limit, options);
      
      return {
        data: result.data.map(entity => this.transformToDTO(entity)),
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update entity by ID
   * @param {string} id - Entity ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated entity DTO
   */
  async update(id, data) {
    try {
      if (!id) {
        throw new ValidationError('ID is required');
      }
      
      // Validate update data
      this.validateUpdate(data);
      
      // Update entity using repository
      const entity = await this.repository.update(id, data);
      
      if (!entity) {
        throw new NotFoundError(`${this.getEntityName()} not found`);
      }
      
      return this.transformToDTO(entity);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    try {
      if (!id) {
        throw new ValidationError('ID is required');
      }
      
      const deleted = await this.repository.delete(id);
      
      if (!deleted) {
        throw new NotFoundError(`${this.getEntityName()} not found`);
      }
      
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Validate data for creation
   * Override in child classes for specific validation
   * @param {Object} data - Data to validate
   */
  validateCreate(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid data provided');
    }
  }

  /**
   * Validate data for update
   * Override in child classes for specific validation
   * @param {Object} data - Data to validate
   */
  validateUpdate(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid data provided');
    }
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array<string>} requiredFields - List of required field names
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
    return true;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {boolean} True if valid
   */
  validatePassword(password) {
    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }
    return true;
  }

  /**
   * Handle errors and rethrow appropriately
   * @param {Error} error - Error to handle
   */
  handleError(error) {
    // If it's already an AppError, just rethrow it
    if (error.isOperational) {
      throw error;
    }
    
    // Log unexpected errors
    console.error(`Service error in ${this.constructor.name}:`, error);
    
    // Rethrow the error
    throw error;
  }

  /**
   * Transform entity to DTO (Data Transfer Object)
   * Override in child classes for specific transformations
   * @param {Object} entity - Entity to transform
   * @returns {Object} DTO
   */
  transformToDTO(entity) {
    if (!entity) {
      return null;
    }
    
    // Convert Mongoose document to plain object
    const obj = entity.toObject ? entity.toObject() : entity;
    
    // Remove sensitive fields by default
    const { __v, ...dto } = obj;
    
    return dto;
  }

  /**
   * Transform DTO to entity data
   * Override in child classes for specific transformations
   * @param {Object} dto - DTO to transform
   * @returns {Object} Entity data
   */
  transformFromDTO(dto) {
    if (!dto) {
      return null;
    }
    
    // Remove fields that shouldn't be set directly
    const { _id, createdAt, updatedAt, ...entityData } = dto;
    
    return entityData;
  }

  /**
   * Get entity name for error messages
   * Override in child classes
   * @returns {string} Entity name
   */
  getEntityName() {
    return 'Entity';
  }

  /**
   * Sanitize input string
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Remove potentially dangerous characters
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Sanitize object recursively
   * @param {Object} obj - Object to sanitize
   * @returns {Object} Sanitized object
   */
  sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

module.exports = BaseService;
