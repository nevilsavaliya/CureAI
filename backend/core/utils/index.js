/**
 * Utility functions module exports
 */

const errorHandlingUtils = require('./errorHandlingUtils');
const validationHelpers = require('./validationHelpers');
const responseHelpers = require('./responseHelpers');
const cacheMonitor = require('./cacheMonitor');
const initializeCache = require('./initializeCache');
const RetryHandler = require('./retryHandler');
const { CircuitBreaker, CircuitBreakerManager, CircuitState, manager: circuitBreakerManager } = require('./circuitBreaker');
const { ResilientService, createResilientEmailService, createResilientPaymentService } = require('./resilientService');
const healthCheck = require('./healthCheck');

module.exports = {
  // Error handling utilities
  ...errorHandlingUtils,
  
  // Validation helpers
  ...validationHelpers,
  
  // Response helpers
  ...responseHelpers,
  
  // Cache utilities
  cacheMonitor,
  initializeCache,
  
  // Resilience utilities
  RetryHandler,
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,
  circuitBreakerManager,
  ResilientService,
  createResilientEmailService,
  createResilientPaymentService,
  healthCheck
};
