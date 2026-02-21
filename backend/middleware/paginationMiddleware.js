/**
 * Pagination Middleware
 * Automatically parses and validates pagination parameters from request
 */

const { parsePaginationParams, parseSortParams } = require('../core/controllers/paginationUtils');

/**
 * Pagination middleware
 * Parses pagination parameters and attaches them to req.pagination
 * 
 * @param {Object} options - Middleware options
 * @param {number} options.defaultLimit - Default items per page
 * @param {number} options.maxLimit - Maximum items per page
 * @param {string} options.defaultSortBy - Default sort field
 * @param {string} options.defaultOrder - Default sort order (asc/desc)
 * @param {Array} options.allowedSortFields - Allowed fields for sorting
 * @returns {Function} Express middleware
 */
function paginationMiddleware(options = {}) {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    defaultSortBy = 'createdAt',
    defaultOrder = 'desc',
    allowedSortFields = []
  } = options;

  return (req, res, next) => {
    // Parse pagination parameters
    const pagination = parsePaginationParams(req.query, {
      page: 1,
      limit: defaultLimit,
      maxLimit
    });

    // Parse sort parameters
    const sort = parseSortParams(
      req.query,
      { sortBy: defaultSortBy, order: defaultOrder },
      allowedSortFields
    );

    // Attach to request object
    req.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
      sort
    };

    next();
  };
}

/**
 * Create pagination response helper
 * Adds a helper method to response object for sending paginated data
 */
function paginationResponseMiddleware(req, res, next) {
  /**
   * Send paginated response
   * @param {Array} data - Array of items
   * @param {number} total - Total count of items
   * @param {Object} additionalMeta - Additional metadata to include
   */
  res.sendPaginated = function(data, total, additionalMeta = {}) {
    const { page, limit } = req.pagination || { page: 1, limit: 10 };
    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        ...additionalMeta
      }
    });
  };

  next();
}

/**
 * Validate pagination parameters
 * Ensures pagination parameters are within acceptable ranges
 */
function validatePagination(options = {}) {
  const {
    minLimit = 1,
    maxLimit = 100,
    maxPage = 1000
  } = options;

  return (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate page number
    if (page < 1) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Page number must be greater than 0',
          code: 'INVALID_PAGE'
        }
      });
    }

    if (page > maxPage) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Page number cannot exceed ${maxPage}`,
          code: 'PAGE_TOO_LARGE'
        }
      });
    }

    // Validate limit
    if (limit < minLimit) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Limit must be at least ${minLimit}`,
          code: 'LIMIT_TOO_SMALL'
        }
      });
    }

    if (limit > maxLimit) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Limit cannot exceed ${maxLimit}`,
          code: 'LIMIT_TOO_LARGE'
        }
      });
    }

    next();
  };
}

/**
 * Default pagination configuration for different resource types
 */
const PaginationDefaults = {
  // Small lists (notifications, messages)
  small: {
    defaultLimit: 20,
    maxLimit: 50
  },
  
  // Medium lists (cases, consultations)
  medium: {
    defaultLimit: 10,
    maxLimit: 50
  },
  
  // Large lists (users, doctors, patients)
  large: {
    defaultLimit: 10,
    maxLimit: 100
  },
  
  // Search results
  search: {
    defaultLimit: 15,
    maxLimit: 50
  }
};

module.exports = {
  paginationMiddleware,
  paginationResponseMiddleware,
  validatePagination,
  PaginationDefaults
};
