/**
 * Optimized Middleware Configuration
 * Defines the recommended middleware stack order and configuration
 * for optimal performance and security
 */

const express = require('express');
const cors = require('cors');
const configService = require('../core/config/ConfigService');

// Import consolidated middleware
const { responseInterceptor } = require('./responseInterceptor');
const { 
  requestLogger, 
  errorLogger, 
  addLoggingContext,
  initializeLogging 
} = require('./consolidatedLogging');
const { 
  rateLimitByIP,
  rateLimitHospitalApi,
  rateLimitAdminOperations,
  rateLimitMessages
} = require('./consolidatedRateLimiter');
const { 
  securityChain,
  adminSecurityChain,
  sanitizeInput,
  validateRequestFormat
} = require('./consolidatedSecurity');
const { securityHeaders, httpsRedirect, dynamicCors } = require('./securityHeaders');
const { ensureEncryption, addEncryptionHeaders } = require('./encryptionMiddleware');
const { authenticate, authorize } = require('./auth');

// Import optimization utilities
const { 
  skipForPaths, 
  onlyForPaths,
  skipForMethods,
  batchMiddleware,
  cacheMiddleware
} = require('./optimizedMiddleware');

/**
 * Get CORS configuration
 * @returns {Object} CORS configuration
 */
function getCorsConfig() {
  const corsOrigins = configService.getCorsOrigins();

  return {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-2FA-Token', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400 // 24 hours
  };
}

/**
 * Global middleware stack
 * Applied to all requests in optimal order
 * @returns {Array<Function>} Array of middleware functions
 */
function getGlobalMiddleware() {
  return [
    // 1. HTTPS redirect (if SSL enabled)
    configService.isSslEnabled() ? httpsRedirect : null,
    
    // 2. Security headers (early for all responses)
    securityHeaders,
    
    // 3. CORS (before body parsing)
    cors(getCorsConfig()),
    
    // 4. Response interceptor (single interception point)
    responseInterceptor,
    
    // 5. Request logging (after response interceptor setup)
    requestLogger,
    
    // 6. Encryption middleware (before body parsing)
    ensureEncryption,
    addEncryptionHeaders,
    
    // 7. Body parsing
    express.json({ limit: '10mb' }),
    express.urlencoded({ extended: true, limit: '10mb' }),
    
    // 8. Security validation and sanitization
    ...securityChain,
    
    // 9. Logging context (after body parsing)
    addLoggingContext,
    
    // 10. Static file serving (skip for API routes)
    skipForPaths('/api', express.static('uploads'))
  ].filter(Boolean); // Remove null entries
}

/**
 * API-specific middleware
 * Applied to /api/* routes
 * @returns {Array<Function>} Array of middleware functions
 */
function getApiMiddleware() {
  return [
    // Rate limiting for public API endpoints
    skipForPaths(['/api/auth', '/api/health'], rateLimitByIP)
  ];
}

/**
 * Protected route middleware
 * Applied to routes requiring authentication
 * @returns {Array<Function>} Array of middleware functions
 */
function getProtectedMiddleware() {
  return [
    authenticate
  ];
}

/**
 * Admin route middleware
 * Applied to /api/admin/* routes
 * @returns {Array<Function>} Array of middleware functions
 */
function getAdminMiddleware() {
  return [
    authenticate,
    authorize('admin'),
    ...adminSecurityChain,
    rateLimitAdminOperations
  ];
}

/**
 * Hospital API middleware
 * Applied to hospital API routes
 * @returns {Array<Function>} Array of middleware functions
 */
function getHospitalApiMiddleware() {
  const { authenticateHospitalApi } = require('./hospitalApiAuth');
  
  return [
    authenticateHospitalApi,
    rateLimitHospitalApi
  ];
}

/**
 * Message route middleware
 * Applied to message endpoints
 * @returns {Array<Function>} Array of middleware functions
 */
function getMessageMiddleware() {
  return [
    authenticate,
    rateLimitMessages
  ];
}

/**
 * Error handling middleware
 * Applied at the end of the middleware stack
 * @returns {Array<Function>} Array of middleware functions
 */
function getErrorMiddleware() {
  const { globalErrorHandler } = require('./alertMiddleware');
  
  return [
    errorLogger,
    globalErrorHandler
  ];
}

/**
 * Initialize all middleware systems
 * Call this once during application startup
 */
function initializeMiddleware() {
  // Initialize logging event listeners
  initializeLogging();
  
  console.log('✓ Middleware systems initialized');
}

/**
 * Get optimized middleware configuration for specific route type
 * @param {string} type - Route type (global, api, protected, admin, hospital, message, error)
 * @returns {Array<Function>} Optimized middleware array
 */
function getMiddlewareForRoute(type) {
  switch (type) {
    case 'global':
      return getGlobalMiddleware();
    case 'api':
      return getApiMiddleware();
    case 'protected':
      return getProtectedMiddleware();
    case 'admin':
      return getAdminMiddleware();
    case 'hospital':
      return getHospitalApiMiddleware();
    case 'message':
      return getMessageMiddleware();
    case 'error':
      return getErrorMiddleware();
    default:
      return [];
  }
}

/**
 * Apply middleware to Express app
 * @param {Object} app - Express application instance
 */
function applyMiddleware(app) {
  // Initialize middleware systems
  initializeMiddleware();
  
  // Apply global middleware
  const globalMiddleware = getGlobalMiddleware();
  globalMiddleware.forEach(middleware => {
    if (middleware) {
      app.use(middleware);
    }
  });
  
  console.log('✓ Global middleware applied');
}

/**
 * Get middleware performance recommendations
 * @returns {Object} Performance recommendations
 */
function getPerformanceRecommendations() {
  return {
    order: [
      '1. HTTPS redirect (if needed)',
      '2. Security headers',
      '3. CORS',
      '4. Response interceptor (single point)',
      '5. Request logging',
      '6. Encryption checks',
      '7. Body parsing',
      '8. Security validation',
      '9. Logging context',
      '10. Static files (conditional)',
      '11. Authentication (route-specific)',
      '12. Authorization (route-specific)',
      '13. Rate limiting (route-specific)',
      '14. Route handlers',
      '15. Error handling'
    ],
    optimizations: [
      'Use single response interceptor instead of multiple',
      'Apply rate limiting only to specific routes',
      'Skip static file middleware for API routes',
      'Use conditional middleware execution',
      'Cache expensive middleware operations',
      'Batch related middleware together',
      'Use early returns to skip unnecessary processing'
    ],
    antiPatterns: [
      'Multiple response interceptions',
      'Global rate limiting on all routes',
      'Expensive operations in every request',
      'Synchronous operations in middleware',
      'Deep middleware chains without optimization'
    ]
  };
}

module.exports = {
  // Configuration getters
  getCorsConfig,
  getGlobalMiddleware,
  getApiMiddleware,
  getProtectedMiddleware,
  getAdminMiddleware,
  getHospitalApiMiddleware,
  getMessageMiddleware,
  getErrorMiddleware,
  
  // Utility functions
  initializeMiddleware,
  applyMiddleware,
  getMiddlewareForRoute,
  getPerformanceRecommendations
};
