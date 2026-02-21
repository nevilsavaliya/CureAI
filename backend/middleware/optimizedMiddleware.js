/**
 * Optimized Middleware Utilities
 * Provides performance optimizations for middleware execution
 * - Caching for expensive operations
 * - Early returns to skip unnecessary processing
 * - Conditional middleware execution
 */

const NodeCache = require('node-cache');
const { getClientIP } = require('./utils/requestUtils');

// Cache for middleware results
// TTL: 5 minutes for most cached data
const middlewareCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false // Better performance, but be careful with mutations
});

/**
 * Cache middleware results for expensive operations
 * @param {string} keyFn - Function to generate cache key from request
 * @param {Function} middleware - Middleware function to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Function} Cached middleware function
 */
function cacheMiddleware(keyFn, middleware, ttl = 300) {
  return async (req, res, next) => {
    try {
      // Generate cache key
      const cacheKey = typeof keyFn === 'function' ? keyFn(req) : keyFn;
      
      if (!cacheKey) {
        // No cache key, execute middleware normally
        return middleware(req, res, next);
      }

      // Check cache
      const cached = middlewareCache.get(cacheKey);
      if (cached !== undefined) {
        // Cache hit - attach cached data to request
        Object.assign(req, cached);
        return next();
      }

      // Cache miss - execute middleware and cache result
      const originalNext = next;
      next = (err) => {
        if (!err && req.cacheableData) {
          // Cache the data
          middlewareCache.set(cacheKey, req.cacheableData, ttl);
        }
        originalNext(err);
      };

      return middleware(req, res, next);
    } catch (error) {
      // On error, execute middleware normally
      return middleware(req, res, next);
    }
  };
}

/**
 * Skip middleware execution based on condition
 * Provides early return to avoid unnecessary processing
 * @param {Function} condition - Function that returns true to skip
 * @param {Function} middleware - Middleware to conditionally execute
 * @returns {Function} Conditional middleware function
 */
function skipIf(condition, middleware) {
  return (req, res, next) => {
    if (condition(req, res)) {
      return next();
    }
    return middleware(req, res, next);
  };
}

/**
 * Execute middleware only if condition is met
 * @param {Function} condition - Function that returns true to execute
 * @param {Function} middleware - Middleware to conditionally execute
 * @returns {Function} Conditional middleware function
 */
function onlyIf(condition, middleware) {
  return (req, res, next) => {
    if (!condition(req, res)) {
      return next();
    }
    return middleware(req, res, next);
  };
}

/**
 * Skip middleware for specific paths
 * @param {Array<string>|string} paths - Paths to skip
 * @param {Function} middleware - Middleware to conditionally execute
 * @returns {Function} Conditional middleware function
 */
function skipForPaths(paths, middleware) {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  return skipIf(
    (req) => pathArray.some(path => req.path.startsWith(path)),
    middleware
  );
}

/**
 * Execute middleware only for specific paths
 * @param {Array<string>|string} paths - Paths to execute for
 * @param {Function} middleware - Middleware to conditionally execute
 * @returns {Function} Conditional middleware function
 */
function onlyForPaths(paths, middleware) {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  return onlyIf(
    (req) => pathArray.some(path => req.path.startsWith(path)),
    middleware
  );
}

/**
 * Skip middleware for specific HTTP methods
 * @param {Array<string>|string} methods - Methods to skip
 * @param {Function} middleware - Middleware to conditionally execute
 * @returns {Function} Conditional middleware function
 */
function skipForMethods(methods, middleware) {
  const methodArray = Array.isArray(methods) ? methods : [methods];
  return skipIf(
    (req) => methodArray.includes(req.method),
    middleware
  );
}

/**
 * Execute middleware only for specific HTTP methods
 * @param {Array<string>|string} methods - Methods to execute for
 * @param {Function} middleware - Middleware to conditionally execute
 * @returns {Function} Conditional middleware function
 */
function onlyForMethods(methods, middleware) {
  const methodArray = Array.isArray(methods) ? methods : [methods];
  return onlyIf(
    (req) => methodArray.includes(req.method),
    middleware
  );
}

/**
 * Batch multiple middleware into a single function
 * Reduces function call overhead
 * @param {Array<Function>} middlewares - Array of middleware functions
 * @returns {Function} Batched middleware function
 */
function batchMiddleware(middlewares) {
  return async (req, res, next) => {
    let index = 0;

    const executeNext = (err) => {
      if (err) {
        return next(err);
      }

      if (index >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[index++];
      
      try {
        middleware(req, res, executeNext);
      } catch (error) {
        next(error);
      }
    };

    executeNext();
  };
}

/**
 * Memoize expensive middleware operations
 * Caches results based on request properties
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Function to generate cache key
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Memoized function
 */
function memoize(fn, keyFn, ttl = 300) {
  return async (...args) => {
    const key = keyFn(...args);
    
    const cached = middlewareCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    middlewareCache.set(key, result, ttl);
    
    return result;
  };
}

/**
 * Throttle middleware execution
 * Limits how often middleware can execute for the same identifier
 * @param {Function} middleware - Middleware to throttle
 * @param {number} intervalMs - Minimum interval between executions in ms
 * @param {Function} keyFn - Function to generate throttle key
 * @returns {Function} Throttled middleware function
 */
function throttle(middleware, intervalMs, keyFn) {
  const lastExecution = new Map();

  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    const last = lastExecution.get(key);

    if (last && (now - last) < intervalMs) {
      // Skip execution, too soon
      return next();
    }

    lastExecution.set(key, now);
    
    // Clean up old entries periodically
    if (lastExecution.size > 1000) {
      const cutoff = now - intervalMs;
      for (const [k, time] of lastExecution.entries()) {
        if (time < cutoff) {
          lastExecution.delete(k);
        }
      }
    }

    return middleware(req, res, next);
  };
}

/**
 * Debounce middleware execution
 * Delays execution until no more calls for specified time
 * @param {Function} middleware - Middleware to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @param {Function} keyFn - Function to generate debounce key
 * @returns {Function} Debounced middleware function
 */
function debounce(middleware, delayMs, keyFn) {
  const timers = new Map();

  return (req, res, next) => {
    const key = keyFn(req);
    
    // Clear existing timer
    if (timers.has(key)) {
      clearTimeout(timers.get(key));
    }

    // Set new timer
    const timer = setTimeout(() => {
      timers.delete(key);
      middleware(req, res, next);
    }, delayMs);

    timers.set(key, timer);
  };
}

/**
 * Parallel middleware execution
 * Executes multiple middleware in parallel (use with caution)
 * @param {Array<Function>} middlewares - Array of middleware functions
 * @returns {Function} Parallel middleware function
 */
function parallel(middlewares) {
  return async (req, res, next) => {
    try {
      await Promise.all(
        middlewares.map(middleware => 
          new Promise((resolve, reject) => {
            middleware(req, res, (err) => {
              if (err) reject(err);
              else resolve();
            });
          })
        )
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return middlewareCache.getStats();
}

/**
 * Clear middleware cache
 * @param {string} key - Optional specific key to clear
 */
function clearCache(key) {
  if (key) {
    middlewareCache.del(key);
  } else {
    middlewareCache.flushAll();
  }
}

/**
 * Optimize middleware chain
 * Applies various optimizations to a middleware chain
 * @param {Array<Object>} chain - Array of middleware configurations
 * @returns {Array<Function>} Optimized middleware chain
 */
function optimizeChain(chain) {
  return chain.map(config => {
    let middleware = config.middleware;

    // Apply caching if specified
    if (config.cache) {
      middleware = cacheMiddleware(
        config.cache.keyFn,
        middleware,
        config.cache.ttl
      );
    }

    // Apply conditional execution
    if (config.skipIf) {
      middleware = skipIf(config.skipIf, middleware);
    }
    if (config.onlyIf) {
      middleware = onlyIf(config.onlyIf, middleware);
    }
    if (config.skipForPaths) {
      middleware = skipForPaths(config.skipForPaths, middleware);
    }
    if (config.onlyForPaths) {
      middleware = onlyForPaths(config.onlyForPaths, middleware);
    }

    // Apply throttling if specified
    if (config.throttle) {
      middleware = throttle(
        middleware,
        config.throttle.intervalMs,
        config.throttle.keyFn
      );
    }

    return middleware;
  });
}

module.exports = {
  // Caching
  cacheMiddleware,
  memoize,
  getCacheStats,
  clearCache,
  
  // Conditional execution
  skipIf,
  onlyIf,
  skipForPaths,
  onlyForPaths,
  skipForMethods,
  onlyForMethods,
  
  // Batching and optimization
  batchMiddleware,
  optimizeChain,
  
  // Timing control
  throttle,
  debounce,
  parallel,
  
  // Cache instance (for advanced usage)
  middlewareCache
};
