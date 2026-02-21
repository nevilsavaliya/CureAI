/**
 * Pagination Utilities
 * Provides pagination helpers for list endpoints
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {Object} defaults - Default pagination values
 * @returns {Object} - Parsed pagination parameters
 */
const parsePaginationParams = (query, defaults = {}) => {
  const defaultPage = defaults.page || 1;
  const defaultLimit = defaults.limit || 10;
  const maxLimit = defaults.maxLimit || 100;

  let page = parseInt(query.page) || defaultPage;
  let limit = parseInt(query.limit) || defaultLimit;

  // Ensure positive values
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(limit, maxLimit));

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
};

/**
 * Build pagination metadata
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} totalItems - Total number of items
 * @returns {Object} - Pagination metadata
 */
const buildPaginationMeta = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Paginate array of items
 * @param {Array} items - Array of items to paginate
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object} - Paginated result with items and metadata
 */
const paginateArray = (items, page, limit) => {
  const totalItems = items.length;
  const skip = (page - 1) * limit;
  const paginatedItems = items.slice(skip, skip + limit);
  const pagination = buildPaginationMeta(page, limit, totalItems);

  return {
    items: paginatedItems,
    pagination
  };
};

/**
 * Build MongoDB pagination query options
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @param {Object} sortOptions - Sort options (e.g., { createdAt: -1 })
 * @returns {Object} - Query options for MongoDB
 */
const buildMongoosePaginationOptions = (page, limit, sortOptions = {}) => {
  const skip = (page - 1) * limit;

  return {
    skip,
    limit,
    sort: sortOptions
  };
};

/**
 * Parse sort parameters from request query
 * @param {Object} query - Request query object
 * @param {Object} defaults - Default sort options
 * @param {Array} allowedFields - Array of allowed sort fields
 * @returns {Object} - MongoDB sort object
 */
const parseSortParams = (query, defaults = {}, allowedFields = []) => {
  const defaultSortBy = defaults.sortBy || 'createdAt';
  const defaultOrder = defaults.order || 'desc';

  let sortBy = query.sortBy || defaultSortBy;
  let order = query.order || defaultOrder;

  // Validate sort field if allowedFields is provided
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    sortBy = defaultSortBy;
  }

  // Normalize order to 1 or -1
  const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;

  return {
    [sortBy]: sortOrder
  };
};

/**
 * Build filter object from query parameters
 * @param {Object} query - Request query object
 * @param {Array} filterableFields - Array of filterable field names
 * @returns {Object} - MongoDB filter object
 */
const buildFilterFromQuery = (query, filterableFields = []) => {
  const filter = {};

  for (const field of filterableFields) {
    if (query[field] !== undefined && query[field] !== '') {
      // Handle array values (comma-separated)
      if (typeof query[field] === 'string' && query[field].includes(',')) {
        filter[field] = { $in: query[field].split(',').map(v => v.trim()) };
      } else {
        filter[field] = query[field];
      }
    }
  }

  return filter;
};

/**
 * Execute paginated query on Mongoose model
 * @param {Object} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Pagination and sort options
 * @returns {Object} - Paginated result with items and metadata
 */
const executePaginatedQuery = async (model, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, populate = null, select = null } = options;

  const skip = (page - 1) * limit;

  // Build query
  let query = model.find(filter).sort(sort).skip(skip).limit(limit);

  // Add population if specified
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => {
        query = query.populate(pop);
      });
    } else {
      query = query.populate(populate);
    }
  }

  // Add field selection if specified
  if (select) {
    query = query.select(select);
  }

  // Execute query and count
  const [items, totalItems] = await Promise.all([
    query.exec(),
    model.countDocuments(filter)
  ]);

  const pagination = buildPaginationMeta(page, limit, totalItems);

  return {
    items,
    pagination
  };
};

/**
 * Build pagination links for API responses
 * @param {String} baseUrl - Base URL for the endpoint
 * @param {Object} pagination - Pagination metadata
 * @param {Object} queryParams - Additional query parameters
 * @returns {Object} - Pagination links
 */
const buildPaginationLinks = (baseUrl, pagination, queryParams = {}) => {
  const buildUrl = (page) => {
    const params = new URLSearchParams({ ...queryParams, page, limit: pagination.itemsPerPage });
    return `${baseUrl}?${params.toString()}`;
  };

  return {
    self: buildUrl(pagination.currentPage),
    first: buildUrl(1),
    last: buildUrl(pagination.totalPages),
    next: pagination.hasNextPage ? buildUrl(pagination.nextPage) : null,
    prev: pagination.hasPrevPage ? buildUrl(pagination.prevPage) : null
  };
};

module.exports = {
  parsePaginationParams,
  buildPaginationMeta,
  paginateArray,
  buildMongoosePaginationOptions,
  parseSortParams,
  buildFilterFromQuery,
  executePaginatedQuery,
  buildPaginationLinks
};
