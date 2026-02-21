/**
 * Consolidated Response Interceptor Middleware
 * Single middleware that intercepts responses and emits events for tracking
 * Consolidates response interception from:
 * - logging.js (response time tracking)
 * - performanceTracker.js (performance metrics)
 * - alertMiddleware.js (error and slow response tracking)
 * - apiMonitoring.js (API monitoring)
 * - errorTracking.js (error tracking)
 * - adminSecurityMiddleware.js (admin operation logging)
 */

const EventEmitter = require('events');
const { getRequestMetadata } = require('./utils/requestUtils');

// Event emitter for response events
const responseEvents = new EventEmitter();

// Performance tracking state
let requestCount = 0;
let totalResponseTime = 0;
let errorCount = 0;
let requestsInLastSecond = [];
let activeUsers = new Set();
let totalDataTransfer = 0;

// Initialize global performance counters
global.requestCount = 0;
global.requestsPerSecond = 0;
global.avgResponseTime = 0;
global.errorRate = 0;
global.activeUsers = 0;
global.bandwidth = 0;
global.avgPayloadSize = 0;
global.totalDataTransfer = 0;

// Clean up old requests every second
setInterval(() => {
  const now = Date.now();
  requestsInLastSecond = requestsInLastSecond.filter(time => now - time < 1000);
  global.requestsPerSecond = requestsInLastSecond.length;
}, 1000);

// Clean up old users every 5 minutes
setInterval(() => {
  if (activeUsers.size > 1000) {
    activeUsers.clear();
  }
}, 5 * 60 * 1000);

/**
 * Response interceptor middleware
 * Intercepts response and emits events for various tracking needs
 */
function responseInterceptor(req, res, next) {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Track request
  requestCount++;
  global.requestCount = requestCount;
  requestsInLastSecond.push(startTime);

  // Track user (using IP as identifier)
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  if (clientIP) {
    activeUsers.add(clientIP);
    global.activeUsers = activeUsers.size;
  }

  // Track request size
  const requestSize = parseInt(req.get('content-length')) || 0;

  // Store original methods
  const originalStatus = res.status;
  const originalJson = res.json;
  const originalEnd = res.end;

  // Track status code
  let statusCode = 200;

  // Override res.status to capture status codes
  res.status = function(code) {
    statusCode = code;
    res.statusCode = code;
    return originalStatus.call(this, code);
  };

  // Override res.json to capture JSON responses
  res.json = function(data) {
    // Emit json response event
    responseEvents.emit('json', {
      req,
      res,
      data,
      statusCode: res.statusCode || statusCode,
      startTime
    });

    return originalJson.call(this, data);
  };

  // Override res.end to capture response completion
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Update response time metrics
    totalResponseTime += responseTime;
    global.avgResponseTime = Math.round(totalResponseTime / requestCount);

    // Track errors
    if (res.statusCode >= 400) {
      errorCount++;
    }
    global.errorRate = ((errorCount / requestCount) * 100).toFixed(2);

    // Track response size
    const responseSize = parseInt(res.get('content-length')) || 
                        (chunk ? Buffer.byteLength(chunk, encoding) : 0);

    // Update data transfer
    const totalSize = requestSize + responseSize;
    totalDataTransfer += totalSize;
    global.totalDataTransfer = (totalDataTransfer / (1024 * 1024 * 1024)).toFixed(2); // GB
    global.avgPayloadSize = Math.round(totalDataTransfer / requestCount / 1024); // KB
    global.bandwidth = Math.round(totalDataTransfer / (process.uptime() || 1));

    // Emit response complete event
    responseEvents.emit('complete', {
      req,
      res,
      statusCode: res.statusCode,
      responseTime,
      requestSize,
      responseSize,
      totalSize,
      startTime,
      endTime,
      metadata: getRequestMetadata(req)
    });

    // Emit specific events based on status code
    if (res.statusCode >= 500) {
      responseEvents.emit('error:critical', {
        req,
        res,
        statusCode: res.statusCode,
        responseTime,
        metadata: getRequestMetadata(req)
      });
    } else if (res.statusCode === 429) {
      responseEvents.emit('error:rateLimit', {
        req,
        res,
        responseTime,
        metadata: getRequestMetadata(req)
      });
    } else if (res.statusCode === 401) {
      responseEvents.emit('error:auth', {
        req,
        res,
        responseTime,
        metadata: getRequestMetadata(req)
      });
    }

    // Emit slow response event (>5 seconds)
    if (responseTime > 5000) {
      responseEvents.emit('performance:slow', {
        req,
        res,
        responseTime,
        statusCode: res.statusCode,
        metadata: getRequestMetadata(req)
      });
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Get performance statistics
 * @returns {Object} Performance statistics
 */
function getPerformanceStats() {
  return {
    requestCount: global.requestCount,
    requestsPerSecond: global.requestsPerSecond,
    avgResponseTime: global.avgResponseTime,
    errorRate: parseFloat(global.errorRate),
    activeUsers: global.activeUsers,
    bandwidth: global.bandwidth,
    avgPayloadSize: global.avgPayloadSize,
    totalDataTransfer: parseFloat(global.totalDataTransfer)
  };
}

/**
 * Reset performance statistics
 * Useful for testing
 */
function resetPerformanceStats() {
  requestCount = 0;
  totalResponseTime = 0;
  errorCount = 0;
  requestsInLastSecond = [];
  activeUsers.clear();
  totalDataTransfer = 0;

  global.requestCount = 0;
  global.requestsPerSecond = 0;
  global.avgResponseTime = 0;
  global.errorRate = 0;
  global.activeUsers = 0;
  global.bandwidth = 0;
  global.avgPayloadSize = 0;
  global.totalDataTransfer = 0;
}

/**
 * Register event listener for response events
 * @param {string} event - Event name
 * @param {Function} listener - Event listener function
 */
function on(event, listener) {
  responseEvents.on(event, listener);
}

/**
 * Remove event listener
 * @param {string} event - Event name
 * @param {Function} listener - Event listener function
 */
function off(event, listener) {
  responseEvents.off(event, listener);
}

/**
 * Remove all event listeners for an event
 * @param {string} event - Event name (optional, removes all if not specified)
 */
function removeAllListeners(event) {
  responseEvents.removeAllListeners(event);
}

module.exports = {
  responseInterceptor,
  getPerformanceStats,
  resetPerformanceStats,
  on,
  off,
  removeAllListeners,
  responseEvents
};
