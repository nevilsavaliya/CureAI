/**
 * @deprecated This middleware has been consolidated into responseInterceptor.js
 * Please use the new consolidated middleware for better performance and maintainability.
 * See backend/middleware/MIGRATION_GUIDE.md for migration instructions.
 */

// Performance tracking middleware
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
global.avgQueryTime = 0;
global.queriesPerSecond = 0;

// Clean up old requests every second
setInterval(() => {
  const now = Date.now();
  requestsInLastSecond = requestsInLastSecond.filter(time => now - time < 1000);
  global.requestsPerSecond = requestsInLastSecond.length;
}, 1000);

// Performance tracking middleware
const performanceTracker = (req, res, next) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime();
  
  // Track request
  requestCount++;
  global.requestCount = requestCount;
  requestsInLastSecond.push(startTime);
  
  // Track user (simplified - using IP as identifier)
  if (req.ip) {
    activeUsers.add(req.ip);
    global.activeUsers = activeUsers.size;
  }
  
  // Track request size
  const requestSize = parseInt(req.get('content-length')) || 0;
  
  // Override res.end to capture response metrics
  const originalEnd = res.end;
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
    
    // Update average payload size
    global.avgPayloadSize = Math.round(totalDataTransfer / requestCount / 1024); // KB
    
    // Update bandwidth (bytes per second over last minute)
    global.bandwidth = Math.round(totalDataTransfer / (process.uptime() || 1));
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Database query tracking (to be used with mongoose middleware)
const trackDatabaseQuery = (queryTime) => {
  if (!global.totalQueryTime) global.totalQueryTime = 0;
  if (!global.queryCount) global.queryCount = 0;
  
  global.totalQueryTime += queryTime;
  global.queryCount++;
  global.avgQueryTime = Math.round(global.totalQueryTime / global.queryCount);
  
  // Calculate queries per second (simplified)
  global.queriesPerSecond = (global.queryCount / (process.uptime() || 1)).toFixed(2);
};

// Clean up old users every 5 minutes
setInterval(() => {
  // In a real implementation, you'd track user activity timestamps
  // For now, we'll just clear very old entries periodically
  if (activeUsers.size > 1000) {
    activeUsers.clear();
  }
}, 5 * 60 * 1000);

module.exports = {
  performanceTracker,
  trackDatabaseQuery
};