/**
 * Enhanced Security Headers Middleware
 * Uses ConfigService for dynamic configuration
 * Implements comprehensive security headers including CSP, HSTS, etc.
 */

const ConfigService = require('../config/ConfigService');
const logger = require('../../services/logger');

/**
 * Generate Content Security Policy header value
 * @returns {string} CSP header value
 */
function generateCSP() {
  const corsOrigins = ConfigService.getCorsOrigins();
  const frontendUrl = ConfigService.getFrontendUrl();
  const apiUrl = ConfigService.getApiUrl();
  const socketUrl = ConfigService.getSocketUrl();
  
  // Combine all allowed origins
  const allowedOrigins = new Set(['\'self\'']);
  
  if (frontendUrl) allowedOrigins.add(frontendUrl);
  if (apiUrl) allowedOrigins.add(apiUrl);
  if (socketUrl) allowedOrigins.add(socketUrl);
  corsOrigins.forEach(origin => allowedOrigins.add(origin));
  
  const connectSrc = Array.from(allowedOrigins).join(' ');
  
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
  if (ConfigService.isProduction()) {
    directives.push('upgrade-insecure-requests');
  }
  
  return directives.join('; ');
}

/**
 * Security headers middleware
 * Applies comprehensive security headers to all responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function securityHeaders(req, res, next) {
  try {
    // Strict Transport Security (HSTS)
    if (ConfigService.isSslEnabled()) {
      const hstsConfig = ConfigService.getHstsConfig();
      
      let hstsHeader = `max-age=${hstsConfig.maxAge}`;
      if (hstsConfig.includeSubdomains) hstsHeader += '; includeSubDomains';
      if (hstsConfig.preload) hstsHeader += '; preload';
      
      res.setHeader('Strict-Transport-Security', hstsHeader);
    }
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', generateCSP());
    
    // X-Frame-Options - Prevents clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options - Prevents MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection - Legacy XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy - Controls referrer information
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
    
    // Cross-Origin Policies (production only)
    if (ConfigService.isProduction()) {
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
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
}

/**
 * HTTPS redirect middleware
 * Redirects HTTP requests to HTTPS in production
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function httpsRedirect(req, res, next) {
  try {
    const sslEnabled = ConfigService.isSslEnabled();
    
    if (sslEnabled && !req.secure && req.get('x-forwarded-proto') !== 'https') {
      const sslConfig = ConfigService.getSslConfig();
      const host = sslConfig.domain || req.get('host');
      const httpsPort = sslConfig.port || 443;
      
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
}

/**
 * CORS middleware with dynamic origin validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function dynamicCors(req, res, next) {
  try {
    const allowedOrigins = ConfigService.getCorsOrigins();
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-2FA-Token');
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
}

/**
 * Request size limit middleware
 * Prevents large payload attacks
 * @param {Object} options - Size limit options
 * @returns {Function} Express middleware function
 */
function requestSizeLimit(options = {}) {
  const {
    jsonLimit = '10mb',
    urlEncodedLimit = '10mb',
    rawLimit = '10mb'
  } = options;
  
  return (req, res, next) => {
    try {
      const contentLength = parseInt(req.get('content-length') || '0', 10);
      const maxSize = 10 * 1024 * 1024; // 10MB default
      
      if (contentLength > maxSize) {
        logger.security.requestSizeExceeded({
          type: 'REQUEST_SIZE_EXCEEDED',
          contentLength,
          maxSize,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip
        });
        
        return res.status(413).json({
          success: false,
          message: 'Request entity too large',
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            maxSize: maxSize,
            receivedSize: contentLength
          }
        });
      }
      
      next();
    } catch (error) {
      logger.error('Request size limit middleware error', {
        type: 'REQUEST_SIZE_LIMIT_ERROR',
        error: error.message,
        url: req.originalUrl
      });
      
      next();
    }
  };
}

/**
 * Get security configuration for monitoring/debugging
 * @returns {Object} Current security configuration
 */
function getSecurityConfig() {
  return {
    sslEnabled: ConfigService.isSslEnabled(),
    allowedOrigins: ConfigService.getCorsOrigins(),
    hstsConfig: ConfigService.getHstsConfig(),
    csp: generateCSP(),
    environment: ConfigService.getNodeEnv()
  };
}

module.exports = {
  securityHeaders,
  httpsRedirect,
  dynamicCors,
  requestSizeLimit,
  getSecurityConfig,
  generateCSP
};
