/**
 * Consolidated Rate Limiting Middleware
 * Provides configurable rate limiting for different endpoint types
 * Consolidates rate limiting from:
 * - rateLimiter.js (hospital API)
 * - adminSecurityMiddleware.js (admin operations)
 * - validation.js (message sending)
 */

const logger = require('../services/logger');
const { getClientIP, getRequestMetadata } = require('./utils/requestUtils');

// In-memory store for rate limiting
// Structure: { key: { count: number, resetTime: timestamp, requests: [] } }
const rateLimitStore = new Map();

// Rate limit configurations
const RATE_LIMIT_CONFIGS = {
  HOSPITAL_API: {
    limit: parseInt(process.env.HOSPITAL_API_RATE_LIMIT) || 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'hospital_api'
  },
  ADMIN_OPERATIONS: {
    limit: parseInt(process.env.ADMIN_RATE_LIMIT) || 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'admin_ops'
  },
  MESSAGE_SENDING: {
    limit: parseInt(process.env.MESSAGE_RATE_LIMIT) || 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'messages'
  },
  DEFAULT: {
    limit: parseInt(process.env.DEFAULT_RATE_LIMIT) || 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'default'
  }
};

/**
 * Clean up expired entries from the rate limit store
 * Runs periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Generate rate limit key based on identifier and config
 * @param {string} identifier - Unique identifier (userId, hospitalId, IP)
 * @param {Object} config - Rate limit configuration
 * @returns {string} Rate limit key
 */
function generateRateLimitKey(identifier, config) {
  return `${config.keyPrefix}:${identifier}`;
}

/**
 * Get or initialize rate limit data
 * @param {string} key - Rate limit key
 * @param {Object} config - Rate limit configuration
 * @returns {Object} Rate limit data
 */
function getRateLimitData(key, config) {
  const now = Date.now();
  let rateLimitData = rateLimitStore.get(key);

  // If no data exists or the window has expired, create new entry
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + config.windowMs,
      requests: []
    };
    rateLimitStore.set(key, rateLimitData);
  }

  return rateLimitData;
}

/**
 * Set rate limit headers on response
 * @param {Object} res - Express response object
 * @param {Object} config - Rate limit configuration
 * @param {Object} rateLimitData - Current rate limit data
 */
function setRateLimitHeaders(res, config, rateLimitData) {
  const remaining = Math.max(0, config.limit - rateLimitData.count);
  const resetTime = Math.ceil(rateLimitData.resetTime / 1000);

  res.setHeader('X-RateLimit-Limit', config.limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime);
}

/**
 * Create rate limiting middleware with specific configuration
 * @param {string} configName - Name of rate limit configuration
 * @param {Function} identifierFn - Function to extract identifier from request
 * @returns {Function} Express middleware function
 */
function createRateLimiter(configName, identifierFn) {
  const config = RATE_LIMIT_CONFIGS[configName] || RATE_LIMIT_CONFIGS.DEFAULT;

  return (req, res, next) => {
    try {
      // Get identifier for this request
      const identifier = identifierFn(req);
      
      if (!identifier) {
        // If no identifier, skip rate limiting
        return next();
      }

      const key = generateRateLimitKey(identifier, config);
      const now = Date.now();

      // Get or initialize rate limit data
      const rateLimitData = getRateLimitData(key, config);

      // Increment request count
      rateLimitData.count += 1;
      rateLimitData.requests.push(now);

      // Set rate limit headers
      setRateLimitHeaders(res, config, rateLimitData);

      // Check if rate limit exceeded
      if (rateLimitData.count > config.limit) {
        const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);

        // Log rate limit exceeded
        logger.security.rateLimitExceeded({
          ...getRequestMetadata(req),
          identifier,
          configName,
          requestCount: rateLimitData.count,
          limit: config.limit
        });

        res.setHeader('Retry-After', retryAfter);

        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Too many requests.',
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            limit: config.limit,
            windowMs: config.windowMs,
            retryAfter: retryAfter,
            resetTime: new Date(rateLimitData.resetTime).toISOString()
          }
        });
      }

      // Allow request to proceed
      next();
    } catch (error) {
      logger.error('Rate limiting error', {
        type: 'RATE_LIMITER_ERROR',
        configName,
        error: error.message,
        stack: error.stack,
        ...getRequestMetadata(req)
      });

      // On error, allow request to proceed (fail open)
      next();
    }
  };
}

/**
 * Rate limiter for hospital API requests
 * Uses hospital ID as identifier
 */
const rateLimitHospitalApi = createRateLimiter(
  'HOSPITAL_API',
  (req) => req.hospital?.id?.toString()
);

/**
 * Rate limiter for admin operations
 * Uses admin ID as identifier
 */
const rateLimitAdminOperations = createRateLimiter(
  'ADMIN_OPERATIONS',
  (req) => req.admin?._id?.toString() || req.user?.id?.toString()
);

/**
 * Rate limiter for message sending
 * Uses user ID as identifier
 */
const rateLimitMessages = createRateLimiter(
  'MESSAGE_SENDING',
  (req) => req.user?.id?.toString()
);

/**
 * Generic rate limiter using IP address
 * Can be used for public endpoints
 */
const rateLimitByIP = createRateLimiter(
  'DEFAULT',
  (req) => getClientIP(req)
);

/**
 * Get current rate limit status for an identifier
 * @param {string} configName - Name of rate limit configuration
 * @param {string} identifier - Unique identifier
 * @returns {Object} Rate limit status
 */
function getRateLimitStatus(configName, identifier) {
  const config = RATE_LIMIT_CONFIGS[configName] || RATE_LIMIT_CONFIGS.DEFAULT;
  const key = generateRateLimitKey(identifier, config);
  const rateLimitData = rateLimitStore.get(key);

  if (!rateLimitData) {
    return {
      count: 0,
      remaining: config.limit,
      resetTime: null
    };
  }

  const now = Date.now();

  // Check if window has expired
  if (now > rateLimitData.resetTime) {
    return {
      count: 0,
      remaining: config.limit,
      resetTime: null
    };
  }

  return {
    count: rateLimitData.count,
    remaining: Math.max(0, config.limit - rateLimitData.count),
    resetTime: new Date(rateLimitData.resetTime).toISOString()
  };
}

/**
 * Reset rate limit for a specific identifier
 * @param {string} configName - Name of rate limit configuration
 * @param {string} identifier - Unique identifier
 */
function resetRateLimit(configName, identifier) {
  const config = RATE_LIMIT_CONFIGS[configName] || RATE_LIMIT_CONFIGS.DEFAULT;
  const key = generateRateLimitKey(identifier, config);
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limit data
 * Useful for testing or maintenance
 */
function clearAllRateLimits() {
  rateLimitStore.clear();
}

/**
 * Get rate limit statistics
 * @returns {Object} Statistics about rate limiting
 */
function getRateLimitStats() {
  const stats = {
    totalKeys: rateLimitStore.size,
    byConfig: {}
  };

  for (const configName in RATE_LIMIT_CONFIGS) {
    const config = RATE_LIMIT_CONFIGS[configName];
    const keys = Array.from(rateLimitStore.keys()).filter(key => 
      key.startsWith(config.keyPrefix)
    );
    
    stats.byConfig[configName] = {
      activeKeys: keys.length,
      limit: config.limit,
      windowMs: config.windowMs
    };
  }

  return stats;
}

module.exports = {
  // Middleware functions
  rateLimitHospitalApi,
  rateLimitAdminOperations,
  rateLimitMessages,
  rateLimitByIP,
  
  // Utility functions
  createRateLimiter,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitStats,
  
  // Configurations (for testing)
  RATE_LIMIT_CONFIGS
};
