/**
 * Rate Limiting Middleware for Hospital API
 * Limits API calls to 100 requests per hour per hospital
 */

const logger = require('../services/logger');
const { trackRateLimitError } = require('./errorTracking');
const { trackRateLimitExceeded } = require('./apiMonitoring');

// In-memory store for rate limiting
// Structure: { hospitalId: { count: number, resetTime: timestamp } }
const rateLimitStore = new Map();

// Configuration
const RATE_LIMIT = 100; // requests per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Clean up expired entries from the rate limit store
 * Runs periodically to prevent memory leaks
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [hospitalId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(hospitalId);
    }
  }
};

// Run cleanup every 5 minutes (only in non-test environment)
let cleanupInterval;
if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Rate limiting middleware
 * Must be used after hospitalApiAuth middleware to access req.hospital
 */
exports.rateLimitHospitalApi = (req, res, next) => {
  try {
    // Ensure hospital is authenticated (should be set by hospitalApiAuth middleware)
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for rate limiting.'
      });
    }

    const hospitalId = req.hospital.id.toString();
    const now = Date.now();

    // Get or initialize rate limit data for this hospital
    let rateLimitData = rateLimitStore.get(hospitalId);

    // If no data exists or the window has expired, create new entry
    if (!rateLimitData || now > rateLimitData.resetTime) {
      rateLimitData = {
        count: 0,
        resetTime: now + WINDOW_MS
      };
      rateLimitStore.set(hospitalId, rateLimitData);
    }

    // Increment request count
    rateLimitData.count += 1;

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, RATE_LIMIT - rateLimitData.count);
    const resetTime = Math.ceil(rateLimitData.resetTime / 1000); // Convert to seconds

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    // Check if rate limit exceeded
    if (rateLimitData.count > RATE_LIMIT) {
      const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000); // seconds
      
      // Track rate limit exceeded in monitoring
      trackRateLimitExceeded({
        hospitalId: hospitalId,
        hospitalName: req.hospital.name || req.hospital.hospitalName,
        requestCount: rateLimitData.count,
        limit: RATE_LIMIT
      }, req);
      
      // Log rate limit exceeded
      logger.security.rateLimitExceeded({
        hospitalId: hospitalId,
        hospitalName: req.hospital.name || req.hospital.hospitalName,
        endpoint: req.originalUrl,
        requestCount: rateLimitData.count,
        limit: RATE_LIMIT,
        ip: logger.getClientIP(req)
      });
      
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Too many API requests.',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          limit: RATE_LIMIT,
          windowMs: WINDOW_MS,
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
      hospitalId: req.hospital?.id,
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });

    // On error, allow request to proceed (fail open)
    // This prevents rate limiting issues from blocking legitimate requests
    next();
  }
};

/**
 * Get current rate limit status for a hospital (for testing/monitoring)
 */
exports.getRateLimitStatus = (hospitalId) => {
  const rateLimitData = rateLimitStore.get(hospitalId.toString());
  
  if (!rateLimitData) {
    return {
      count: 0,
      remaining: RATE_LIMIT,
      resetTime: null
    };
  }

  const now = Date.now();
  
  // Check if window has expired
  if (now > rateLimitData.resetTime) {
    return {
      count: 0,
      remaining: RATE_LIMIT,
      resetTime: null
    };
  }

  return {
    count: rateLimitData.count,
    remaining: Math.max(0, RATE_LIMIT - rateLimitData.count),
    resetTime: new Date(rateLimitData.resetTime).toISOString()
  };
};

/**
 * Reset rate limit for a specific hospital (for testing/admin purposes)
 */
exports.resetRateLimit = (hospitalId) => {
  rateLimitStore.delete(hospitalId.toString());
};

/**
 * Clear all rate limit data (for testing purposes)
 */
exports.clearAllRateLimits = () => {
  rateLimitStore.clear();
};

module.exports.RATE_LIMIT = RATE_LIMIT;
module.exports.WINDOW_MS = WINDOW_MS;
