/**
 * Query Optimization Utilities
 * Provides helpers for optimizing database queries
 */

/**
 * Apply lean query optimization
 * Lean queries return plain JavaScript objects instead of Mongoose documents
 * Use for read-only operations where you don't need Mongoose methods
 * 
 * @param {Query} query - Mongoose query object
 * @param {boolean} shouldLean - Whether to apply lean
 * @returns {Query} - Modified query
 */
function applyLean(query, shouldLean = true) {
  if (shouldLean) {
    return query.lean();
  }
  return query;
}

/**
 * Apply field projection to reduce data transfer
 * 
 * @param {Query} query - Mongoose query object
 * @param {string|Array|Object} fields - Fields to select
 * @returns {Query} - Modified query
 */
function applyProjection(query, fields) {
  if (!fields) return query;
  
  if (Array.isArray(fields)) {
    return query.select(fields.join(' '));
  }
  
  return query.select(fields);
}

/**
 * Apply pagination with optimized query
 * 
 * @param {Query} query - Mongoose query object
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Query} - Modified query
 */
function applyPagination(query, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
}

/**
 * Apply sorting with index optimization
 * 
 * @param {Query} query - Mongoose query object
 * @param {string|Object} sort - Sort specification
 * @returns {Query} - Modified query
 */
function applySort(query, sort) {
  if (!sort) return query;
  return query.sort(sort);
}

/**
 * Build optimized aggregation pipeline
 * Adds common optimizations like $match early, $project for field selection
 * 
 * @param {Array} stages - Aggregation pipeline stages
 * @param {Object} options - Optimization options
 * @returns {Array} - Optimized pipeline
 */
function optimizeAggregationPipeline(stages, options = {}) {
  const optimized = [];
  
  // Move $match stages to the beginning for better performance
  const matchStages = stages.filter(stage => stage.$match);
  const otherStages = stages.filter(stage => !stage.$match);
  
  optimized.push(...matchStages);
  optimized.push(...otherStages);
  
  // Add $project at the end if fields are specified
  if (options.fields) {
    const projection = {};
    options.fields.forEach(field => {
      projection[field] = 1;
    });
    optimized.push({ $project: projection });
  }
  
  return optimized;
}

/**
 * Create a query builder with optimization helpers
 * 
 * @param {Model} model - Mongoose model
 * @returns {Object} - Query builder
 */
function createQueryBuilder(model) {
  return {
    model,
    query: null,
    
    find(filter = {}) {
      this.query = model.find(filter);
      return this;
    },
    
    findOne(filter = {}) {
      this.query = model.findOne(filter);
      return this;
    },
    
    lean(shouldLean = true) {
      if (shouldLean && this.query) {
        this.query = this.query.lean();
      }
      return this;
    },
    
    select(fields) {
      if (this.query) {
        this.query = applyProjection(this.query, fields);
      }
      return this;
    },
    
    sort(sort) {
      if (this.query) {
        this.query = applySort(this.query, sort);
      }
      return this;
    },
    
    paginate(page, limit) {
      if (this.query) {
        this.query = applyPagination(this.query, page, limit);
      }
      return this;
    },
    
    populate(path, select) {
      if (this.query) {
        if (select) {
          this.query = this.query.populate({ path, select });
        } else {
          this.query = this.query.populate(path);
        }
      }
      return this;
    },
    
    async exec() {
      if (!this.query) {
        throw new Error('No query to execute');
      }
      return await this.query.exec();
    },
    
    async count() {
      if (!this.query) {
        throw new Error('No query to count');
      }
      return await this.query.countDocuments();
    }
  };
}

/**
 * Batch operations helper
 * Processes items in batches to avoid memory issues
 * 
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each batch
 * @param {number} batchSize - Size of each batch
 * @returns {Promise<Array>} - Results from all batches
 */
async function processBatch(items, processor, batchSize = 100) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Optimize populate operations
 * Reduces over-fetching by selecting only needed fields
 * 
 * @param {string} path - Path to populate
 * @param {Array} fields - Fields to select
 * @returns {Object} - Populate options
 */
function optimizePopulate(path, fields = []) {
  if (fields.length === 0) {
    return path;
  }
  
  return {
    path,
    select: fields.join(' ')
  };
}

/**
 * Create an optimized count query
 * Uses countDocuments for better performance
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @returns {Promise<number>} - Count result
 */
async function optimizedCount(model, filter = {}) {
  return await model.countDocuments(filter);
}

/**
 * Check if query uses indexed fields
 * Helps identify queries that might be slow
 * 
 * @param {Object} filter - Query filter
 * @param {Array} indexedFields - List of indexed fields
 * @returns {boolean} - Whether query uses indexed fields
 */
function usesIndexedFields(filter, indexedFields) {
  const filterKeys = Object.keys(filter);
  return filterKeys.some(key => indexedFields.includes(key));
}

/**
 * Query performance hints
 */
const QueryHints = {
  // Use lean for read-only queries
  USE_LEAN: 'Use .lean() for read-only queries to improve performance',
  
  // Use projection to reduce data transfer
  USE_PROJECTION: 'Use .select() to fetch only needed fields',
  
  // Use indexes
  USE_INDEXES: 'Ensure query uses indexed fields for better performance',
  
  // Avoid $where and $regex without anchors
  AVOID_WHERE: 'Avoid $where operator as it cannot use indexes',
  AVOID_UNANCHORED_REGEX: 'Anchor regex patterns with ^ for better performance',
  
  // Use aggregation for complex queries
  USE_AGGREGATION: 'Consider aggregation pipeline for complex queries',
  
  // Limit results
  LIMIT_RESULTS: 'Always limit query results to avoid memory issues'
};

module.exports = {
  applyLean,
  applyProjection,
  applyPagination,
  applySort,
  optimizeAggregationPipeline,
  createQueryBuilder,
  processBatch,
  optimizePopulate,
  optimizedCount,
  usesIndexedFields,
  QueryHints
};
