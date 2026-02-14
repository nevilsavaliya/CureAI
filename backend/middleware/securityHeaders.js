/**
 * Security Headers Middleware for Healthcare Platform
 * Provides configurable security headers with dynamic URL support
 */

const logger = require('../services/logger');

/**
 * Get allowed origins from environment configuration
 * @returns {Array<string>} Array of allowed origin URLs
 */
const getAllowedOrigins = () => {
  const origins = [];
  
  // Add frontend URL from environment
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Add CORS origins
  if (process.env.CORS_ORIGINS) {
    const corsOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
    corsOrigins.forEach(origin => {
      if (origin && !origins.includes(origin)) {
        origins.push(origin);
      }
    });
  }
  
  // Add API URL if different from frontend
  if (process.env.API_URL && !origins.includes(process.env.API_URL)) {
    origins.push(process.env.API_URL);
  }
  
  // Add Socket URL if different
  if (process.env.SOCKET_URL && !origins.includes(process.env.SOCKET_URL)) {
    origins.push(process.env.SOCKET_URL);
  }
  
  // Fallback to localhost for development
  if (origins.length === 0) {
    origins.push('http://localhost:4200', 'https://localhost');
  }
  
  return origins;
};

/**
 * Generate Content Security Policy header value
 * @returns {string} CSP header value
 */
const generateCSP = () => {
  const allowedOrigins = getAllowedOrigins();
  const connectSrc = ['\'self\'', ...allowedOrigins].join(' ');
  
  const directives = [
    "default-src 'self'",
    `connect-src ${connectSrc}`,
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  
  // Add upgrade-insecure-requests only in production
  if (process.env.NODE_ENV === 'production') {
    directives.push('upgrade-insecure-requests');
  }
  
  return directives.join('; ');
};

/**
 * Security headers middleware
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
const securityHeaders = (req, res, next) => {
  try {
    // Strict Transport Security (HSTS)
    if (process.env.SSL_ENABLED === 'true') {
      const hstsMaxAge = process.env.HSTS_MAX_AGE || '31536000';
      const hstsIncludeSubDomains = process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false';
      const hstsPreload = process.env.HSTS_PRELOAD !== 'false';
      
      let hstsHeader = `max-age=${hstsMaxAge}`;
      if (hstsIncludeSubDomains) hstsHeader += '; includeSubDomains';
      if (hstsPreload) hstsHeader += '; preload';
      
      res.setHeader('Strict-Transport-Security', hstsHeader);
    }
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', generateCSP());
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy (formerly Feature Policy)
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', ');
    res.setHeader('Permissions-Policy', permissionsPolicy);
    
    // Cross-Origin Embedder Policy
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
  } catch (error) {
    logger.error('Security headers middleware error', {
      type: 'SECURITY_HEADERS_ERROR',
      error: error.message,
      stack: error.stack,
      url: req.originalUrl
    });
    
    // Continue without security headers rather than blocking the request
    next();
  }
};

/**
 * HTTPS redirect middleware with configurable URLs
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
const httpsRedirect = (req, res, next) => {
  try {
    const sslEnabled = process.env.SSL_ENABLED === 'true';
    
    if (sslEnabled && !req.secure && req.get('x-forwarded-proto') !== 'https') {
      // Get the host from environment or request
      const host = process.env.SSL_DOMAIN || process.env.SERVER_NAME || req.get('host');
      const httpsPort = process.env.SSL_PORT || 443;
      
      // Construct HTTPS URL
      let httpsUrl;
      if (httpsPort === 443 || httpsPort === '443') {
        httpsUrl = `https://${host}${req.url}`;
      } else {
        httpsUrl = `https://${host}:${httpsPort}${req.url}`;
      }
      
      logger.info('Redirecting HTTP to HTTPS', {
        type: 'HTTPS_REDIRECT',
        originalUrl: req.url,
        httpsUrl,
        host,
        port: httpsPort
      });
      
      return res.redirect(301, httpsUrl);
    }
    
    next();
  } catch (error) {
    logger.error('HTTPS redirect middleware error', {
      type: 'HTTPS_REDIRECT_ERROR',
      error: error.message,
      url: req.originalUrl
    });
    
    // Continue without redirect rather than blocking the request
    next();
  }
};

/**
 * CORS middleware with dynamic origin validation
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
const dynamicCors = (req, res, next) => {
  try {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.get('Origin');
    
    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      // Allow same-origin requests
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  } catch (error) {
    logger.error('Dynamic CORS middleware error', {
      type: 'DYNAMIC_CORS_ERROR',
      error: error.message,
      origin: req.get('Origin'),
      url: req.originalUrl
    });
    
    // Continue without CORS headers rather than blocking the request
    next();
  }
};

/**
 * Get security configuration for monitoring/debugging
 * @returns {Object} Current security configuration
 */
const getSecurityConfig = () => {
  return {
    sslEnabled: process.env.SSL_ENABLED === 'true',
    allowedOrigins: getAllowedOrigins(),
    hstsMaxAge: process.env.HSTS_MAX_AGE || '31536000',
    hstsIncludeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    hstsPreload: process.env.HSTS_PRELOAD !== 'false',
    csp: generateCSP(),
    environment: process.env.NODE_ENV || 'development'
  };
};

module.exports = {
  securityHeaders,
  httpsRedirect,
  dynamicCors,
  getAllowedOrigins,
  generateCSP,
  getSecurityConfig
};