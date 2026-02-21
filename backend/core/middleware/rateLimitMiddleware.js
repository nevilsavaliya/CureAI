/**
 * Enhanced Rate Limiting Middleware
 * Uses ConfigService for dynamic configuration
 * Provides comprehensive rate limiting for all endpoint types
 */

const ConfigService = require('../config/ConfigService');
const logger = require('../../services/logger');

// In-memory store for rate limiting
// Structure: { key: { count: number, resetTime: timestamp, requests: [] } }
const rateLimitStore = new Map();

/**
 * Clean up expired entries from the rate limit store
 * Runs periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.debug('Rate limit store cleanup', {
      type: 'RATE_LIMIT_CLEANUP',
      cleanedEntries: cleanedCount,
      remainingEntries: rateLimitStore.size
    });
  }
}

// Run cleanup every 5 minutes (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Generate rate limit key based on identifier and config type
 * @param {string} identifier - Unique identifier (userId, hospitalId, IP)
 * @param {string} configType - Type of rate limit configuration
 * @returns {string} Rate limit key
 */
function generateRateLimitKey(identifier, configType) {
  return `${configType}:${identifier}`;
}

/**
 * Get or initialize rate limit data
 * @param {string} key - Rate limit key
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit data
 */
function getRateLimitData(key, windowMs) {
  const now = Date.now();
  let rateLimitData = rateLimitStore.get(key);

  // If no data exists or the window has expired, create new entry
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + windowMs,
      requests: [],
      firstRequest: now
    };
    rateLimitStore.set(key, rateLimitData);
  }

  return rateLimitData;
}

/**
 * Set rate limit headers on response
 * @param {Object} res - Express response object
 * @param {number} limit - Rate limit
 * @param {Object} rateLimitData - Current rate limit data
 */
function setRateLimitHeaders(res, limit, rateLimitData) {
  const remaining = Math.max(0, limit - rateLimitData.count);
  const resetTime = Math.ceil(rateLimitData.resetTime / 1000);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime);
}

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Log rate limit violation
 * @param {Object} req - Express request object
 * @param {string} identifier - Rate limit identifier
 * @param {string} configType - Configuration type
 * @param {Object} rateLimitData - Rate limit data
 * @param {number} limit - Rate limit
 */
function logRateLimitViolation(req, identifier, configType, rateLimitData, limit) {
  logger.security.rateLimitExceeded({
    type: 'RATE_LIMIT_EXCEEDED',
    configType,
    identifier,
    requestCount: rateLimitData.count,
    limit,
    endpoint: req.originalUrl,
    method: req.method,
    ip: getClientIP(req),
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    resetTime: new Date(rateLimitData.resetTime).toISOString()
  });
}

/**
 * Create rate limiting middleware with specific configuration
 * @param {string} configType - Type of rate limit configuration (default, auth, api, etc.)
 * @param {Function} identifierFn - Function to extract identifier from request
 * @returns {Function} Express middleware function
 */
function createRateLimiter(configType, identifierFn) {
  return (req, res, next) => {
    try {
      // Check if rate limiting is enabled
      if (!ConfigService.isRateLimitEnabled()) {
        return next();
      }

      // Get rate limit configuration
      const config = ConfigService.getRateLimitConfig(configType);
      if (!config) {
        logger.warn('Rate limit configuration not found', {
          type: 'RATE_LIMIT_CONFIG_MISSING',
          configType
        });
        return next();
      }

      // Get identifier for this request
      const identifier = identifierFn(req);
      
      if (!identifier) {
        // If no identifier, skip rate limiting
        return next();
      }

      const key = generateRateLimitKey(identifier, configType);
      const now = Date.now();

      // Get or initialize rate limit data
      const rateLimitData = getRateLimitData(key, config.windowMs);

      // Increment request count
      rateLimitData.count += 1;
      rateLimitData.requests.push(now);

      // Set rate limit headers
      setRateLimitHeaders(res, config.limit, rateLimitData);

      // Check if rate limit exceeded
      if (rateLimitData.count > config.limit) {
        const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);

        // Log rate limit violation
        logRateLimitViolation(req, identifier, configType, rateLimitData, config.limit);

        res.setHeader('Retry-After', retryAfter);

        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Too many requests.',
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            type: configType,
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
        configType,
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl
      });

      // On error, allow request to proceed (fail open)
      next();
    }
  };
}

/**
 * Rate limiter for authentication endpoints
 * Uses IP address as identifier
 */
const rateLimitAuth = createRateLimiter(
  'auth',
  (req) => getClientIP(req)
);

/**
 * Rate limiter for general API requests
 * Uses user ID or IP address as identifier
 */
const rateLimitApi = createRateLimiter(
  'api',
  (req) => req.user?.id?.toString() || getClientIP(req)
);

/**
 * Rate limiter for hospital API requests
 * Uses hospital ID as identifier
 */
const rateLimitHospitalApi = createRateLimiter(
  'hospitalApi',
  (req) => req.hospital?.id?.toString()
);

/**
 * Rate limiter for admin operations
 * Uses admin ID as identifier
 */
const rateLimitAdminOperations = createRateLimiter(
  'adminOperations',
  (req) => req.admin?._id?.toString() || req.user?.id?.toString()
);

/**
 * Rate limiter for message sending
 * Uses user ID as identifier
 */
const rateLimitMessages = createRateLimiter(
  'messages',
  (req) => req.user?.id?.toString()
);

/**
 * Rate limiter for file uploads
 * Uses user ID or IP address as identifier
 */
const rateLimitFileUpload = createRateLimiter(
  'fileUpload',
  (req) => req.user?.id?.toString() || getClientIP(req)
);

/**
 * Generic rate limiter using IP address
 * Can be used for public endpoints
 */
const rateLimitByIP = createRateLimiter(
  'default',
  (req) => getClientIP(req)
);

/**
 * Get current rate limit status for an identifier
 * @param {string} configType - Type of rate limit configuration
 * @param {string} identifier - Unique identifier
 * @returns {Object} Rate limit status
 */
function getRateLimitStatus(configType, identifier) {
  const config = ConfigService.getRateLimitConfig(configType);
  if (!config) {
    return null;
  }

  const key = generateRateLimitKey(identifier, configType);
  const rateLimitData = rateLimitStore.get(key);

  if (!rateLimitData) {
    return {
      count: 0,
      remaining: config.limit,
      resetTime: null,
      limit: config.limit
    };
  }

  const now = Date.now();

  // Check if window has expired
  if (now > rateLimitData.resetTime) {
    return {
      count: 0,
      remaining: config.limit,
      resetTime: null,
      limit: config.limit
    };
  }

  return {
    count: rateLimitData.count,
    remaining: Math.max(0, config.limit - rateLimitData.count),
    resetTime: new Date(rateLimitData.resetTime).toISOString(),
    limit: config.limit
  };
}

/**
 * Reset rate limit for a specific identifier
 * @param {string} configType - Type of rate limit configuration
 * @param {string} identifier - Unique identifier
 */
function resetRateLimit(configType, identifier) {
  const key = generateRateLimitKey(identifier, configType);
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
  const configs = ConfigService.getAllRateLimitConfigs();
  const stats = {
    enabled: ConfigService.isRateLimitEnabled(),
    totalKeys: rateLimitStore.size,
    byConfig: {}
  };

  for (const configType in configs) {
    if (configType === 'enabled') continue;
    
    const config = configs[configType];
    const keys = Array.from(rateLimitStore.keys()).filter(key => 
      key.startsWith(`${configType}:`)
    );
    
    stats.byConfig[configType] = {
      activeKeys: keys.length,
      limit: config.limit,
      windowMs: config.windowMs
    };
  }

  return stats;
}

module.exports = {
  // Middleware functions
  rateLimitAuth,
  rateLimitApi,
  rateLimitHospitalApi,
  rateLimitAdminOperations,
  rateLimitMessages,
  rateLimitFileUpload,
  rateLimitByIP,
  
  // Utility functions
  createRateLimiter,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitStats,
  getClientIP
};
