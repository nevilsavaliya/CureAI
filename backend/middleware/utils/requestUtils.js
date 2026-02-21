/**
 * Shared utility functions for middleware
 * Consolidates duplicate helper functions across middleware files
 */

/**
 * Get client IP address from request
 * Handles various proxy configurations
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Get user agent from request
 * @param {Object} req - Express request object
 * @returns {string} User agent string
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Get request metadata for logging and tracking
 * @param {Object} req - Express request object
 * @returns {Object} Request metadata
 */
function getRequestMetadata(req) {
  return {
    method: req.method,
    url: req.originalUrl,
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    userRole: req.user?.role,
    hospitalId: req.hospital?.id || req.user?.hospitalId
  };
}

/**
 * Check if request is from a trusted proxy
 * @param {Object} req - Express request object
 * @returns {boolean} True if from trusted proxy
 */
function isFromTrustedProxy(req) {
  const configService = require('../core/config/ConfigService');
  const trustedProxies = configService.getTrustedProxies();
  const clientIP = getClientIP(req);
  return trustedProxies.includes(clientIP);
}

module.exports = {
  getClientIP,
  getUserAgent,
  getRequestMetadata,
  isFromTrustedProxy
};
