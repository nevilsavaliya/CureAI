const { DatabaseError } = require('../errors');
const { applyLean, applyProjection, applyPagination, applySort } = require('../utils/queryOptimization');

/**
 * Base Repository class providing common CRUD operations for all repositories
 * Implements the Repository pattern to abstract database operations
 * Includes query optimization features for better performance
 */
class BaseRepository {
  /**
   * @param {mongoose.Model} model - Mongoose model for this repository
   */
  constructor(model) {
    if (!model) {
      throw new Error('Model is required for BaseRepository');
    }
    this.model = model;
  }

  /**
   * Create a new document
   * @param {Object} data - Data to create
   * @returns {Promise<Document>} Created document
   */
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Find document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options (populate, select, lean)
   * @returns {Promise<Document|null>} Found document or null
   */
  async findById(id, options = {}) {
    try {
      let query = this.model.findById(id);
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      if (options.select) {
        query = applyProjection(query, options.select);
      }
      
      // Use lean by default for better performance unless explicitly disabled
      const shouldLean = options.lean !== false;
      if (shouldLean) {
        query = applyLean(query);
      }
      
      return await query.exec();
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.model.modelName} by ID: ${error.message}`);
    }
  }

  /**
   * Find one document matching query
   * @param {Object} query - Query conditions
   * @param {Object} options - Query options (populate, select, lean)
   * @returns {Promise<Document|null>} Found document or null
   */
  async findOne(query, options = {}) {
    try {
      let dbQuery = this.model.findOne(query);
      
      if (options.populate) {
        dbQuery = dbQuery.populate(options.populate);
      }
      
      if (options.select) {
        dbQuery = applyProjection(dbQuery, options.select);
      }
      
      // Use lean by default for better performance unless explicitly disabled
      const shouldLean = options.lean !== false;
      if (shouldLean) {
        dbQuery = applyLean(dbQuery);
      }
      
      return await dbQuery.exec();
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Find multiple documents matching query
   * @param {Object} query - Query conditions
   * @param {Object} options - Query options (populate, select, sort, limit, skip, lean)
   * @returns {Promise<Document[]>} Array of documents
   */
  async findMany(query = {}, options = {}) {
    try {
      let dbQuery = this.model.find(query);
      
      if (options.populate) {
        dbQuery = dbQuery.populate(options.populate);
      }
      
      if (options.select) {
        dbQuery = applyProjection(dbQuery, options.select);
      }
      
      if (options.sort) {
        dbQuery = applySort(dbQuery, options.sort);
      }
      
      if (options.limit) {
        dbQuery = dbQuery.limit(options.limit);
      }
      
      if (options.skip) {
        dbQuery = dbQuery.skip(options.skip);
      }
      
      // Use lean by default for better performance unless explicitly disabled
      const shouldLean = options.lean !== false;
      if (shouldLean) {
        dbQuery = applyLean(dbQuery);
      }
      
      return await dbQuery.exec();
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.model.modelName} documents: ${error.message}`);
    }
  }

  /**
   * Update document by ID
   * @param {string} id - Document ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Document|null>} Updated document or null
   */
  async update(id, data, options = {}) {
    try {
      const updateOptions = {
        new: true,
        runValidators: true,
        ...options
      };
      
      return await this.model.findByIdAndUpdate(id, data, updateOptions);
    } catch (error) {
      throw new DatabaseError(`Failed to update ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Delete document by ID
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async delete(id) {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      throw new DatabaseError(`Failed to delete ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Paginate query results
   * @param {Object} query - Query conditions
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page
   * @param {Object} options - Query options (populate, select, sort)
   * @returns {Promise<Object>} Paginated result with data and metadata
   */
  async paginate(query = {}, page = 1, limit = 10, options = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        this.findMany(query, { ...options, skip, limit }),
        this.model.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new DatabaseError(`Failed to paginate ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Bulk create documents
   * @param {Array<Object>} dataArray - Array of data objects
   * @returns {Promise<Document[]>} Created documents
   */
  async bulkCreate(dataArray) {
    try {
      return await this.model.insertMany(dataArray, { ordered: false });
    } catch (error) {
      throw new DatabaseError(`Failed to bulk create ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Bulk update documents
   * @param {Array<Object>} updates - Array of update operations {filter, update}
   * @returns {Promise<number>} Number of modified documents
   */
  async bulkUpdate(updates) {
    try {
      const bulkOps = updates.map(({ filter, update }) => ({
        updateOne: {
          filter,
          update,
          upsert: false
        }
      }));
      
      const result = await this.model.bulkWrite(bulkOps);
      return result.modifiedCount;
    } catch (error) {
      throw new DatabaseError(`Failed to bulk update ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Bulk delete documents
   * @param {Array<string>} ids - Array of document IDs
   * @returns {Promise<number>} Number of deleted documents
   */
  async bulkDelete(ids) {
    try {
      const result = await this.model.deleteMany({ _id: { $in: ids } });
      return result.deletedCount;
    } catch (error) {
      throw new DatabaseError(`Failed to bulk delete ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Execute operations within a transaction
   * @param {Function} callback - Async function to execute within transaction
   * @returns {Promise<any>} Result of callback
   */
  async withTransaction(callback) {
    const session = await this.model.db.startSession();
    session.startTransaction();
    
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw new DatabaseError(`Transaction failed for ${this.model.modelName}: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Build query object from filters
   * @param {Object} filters - Filter conditions
   * @returns {Object} MongoDB query object
   */
  buildQuery(filters) {
    const query = {};
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      
      if (value === null || value === undefined) {
        return;
      }
      
      // Handle array values (IN query)
      if (Array.isArray(value)) {
        query[key] = { $in: value };
      }
      // Handle range queries
      else if (typeof value === 'object' && (value.$gte || value.$lte || value.$gt || value.$lt)) {
        query[key] = value;
      }
      // Handle regex search
      else if (typeof value === 'string' && value.startsWith('/') && value.endsWith('/')) {
        query[key] = new RegExp(value.slice(1, -1), 'i');
      }
      // Direct match
      else {
        query[key] = value;
      }
    });
    
    return query;
  }

  /**
   * Build sort object
   * @param {string} sortBy - Field to sort by
   * @param {string} order - Sort order ('asc' or 'desc')
   * @returns {Object} MongoDB sort object
   */
  buildSort(sortBy, order = 'asc') {
    if (!sortBy) {
      return {};
    }
    
    return {
      [sortBy]: order === 'desc' ? -1 : 1
    };
  }

  /**
   * Build projection object
   * @param {Array<string>} fields - Fields to include
   * @returns {Object} MongoDB projection object
   */
  buildProjection(fields) {
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return {};
    }
    
    return fields.reduce((projection, field) => {
      projection[field] = 1;
      return projection;
    }, {});
  }

  /**
   * Count documents matching query
   * @param {Object} query - Query conditions
   * @returns {Promise<number>} Document count
   */
  async count(query = {}) {
    try {
      return await this.model.countDocuments(query);
    } catch (error) {
      throw new DatabaseError(`Failed to count ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Check if document exists
   * @param {Object} query - Query conditions
   * @returns {Promise<boolean>} True if exists, false otherwise
   */
  async exists(query) {
    try {
      const count = await this.model.countDocuments(query).limit(1);
      return count > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check existence of ${this.model.modelName}: ${error.message}`);
    }
  }
}

module.exports = BaseRepository;
