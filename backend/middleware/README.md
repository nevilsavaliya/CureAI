# Middleware System Documentation

## Overview

This directory contains the optimized middleware system for the healthcare platform backend. The middleware has been refactored to improve performance, maintainability, and scalability.

## Architecture

### Consolidated Middleware

The new system consolidates duplicate functionality into unified middleware:

1. **responseInterceptor.js** - Single response interception with event system
2. **consolidatedRateLimiter.js** - Unified rate limiting for all endpoints
3. **consolidatedSecurity.js** - Combined security middleware
4. **consolidatedLogging.js** - Unified logging with event-based tracking
5. **optimizedMiddleware.js** - Performance optimization utilities
6. **middlewareConfig.js** - Centralized middleware configuration

### Core Middleware (Unchanged)

These middleware remain as-is and are still actively used:

- **auth.js** - JWT authentication and authorization
- **adminRoleAuth.js** - Admin role-based access control
- **hospitalApiAuth.js** - Hospital API key authentication
- **encryptionMiddleware.js** - Message encryption handling
- **securityHeaders.js** - Security headers and CORS
- **upload.js** - File upload handling
- **validation.js** - Input validation

### Deprecated Middleware

These files are deprecated and will be removed in a future release:

- ~~performanceTracker.js~~ → Use responseInterceptor.js
- ~~rateLimiter.js~~ → Use consolidatedRateLimiter.js
- ~~adminSecurityMiddleware.js~~ (partial) → Use consolidatedSecurity.js

## Quick Start

### Basic Setup

```javascript
const { applyMiddleware } = require('./middleware/middlewareConfig');

// Apply all global middleware
applyMiddleware(app);
```

### Route-Specific Middleware

```javascript
const { getMiddlewareForRoute } = require('./middleware/middlewareConfig');

// Admin routes
app.use('/api/admin', getMiddlewareForRoute('admin'), adminRoutes);

// Hospital API routes
app.use('/api/hospitals/api', getMiddlewareForRoute('hospital'), hospitalRoutes);

// Protected routes
app.use('/api/profile', getMiddlewareForRoute('protected'), profileRoutes);
```

## Middleware Components

### 1. Response Interceptor

Single point of response interception with event-based tracking.

**Features:**
- Performance metrics tracking
- Response time monitoring
- Error detection
- Event-based extensibility

**Usage:**
```javascript
const { responseInterceptor, responseEvents } = require('./middleware/responseInterceptor');

app.use(responseInterceptor);

// Listen to events
responseEvents.on('complete', (data) => {
  console.log(`Request completed in ${data.responseTime}ms`);
});

responseEvents.on('performance:slow', (data) => {
  console.log(`Slow response: ${data.responseTime}ms`);
});
```

**Available Events:**
- `complete` - Response completed
- `json` - JSON response sent
- `error:critical` - 5xx error
- `error:auth` - 401 error
- `error:rateLimit` - 429 error
- `performance:slow` - Slow response (>5s)

### 2. Consolidated Rate Limiter

Unified rate limiting with configurable limits per endpoint type.

**Features:**
- Configurable rate limits via environment variables
- Multiple rate limit configurations
- In-memory store with automatic cleanup
- Detailed rate limit headers

**Usage:**
```javascript
const { 
  rateLimitHospitalApi,
  rateLimitAdminOperations,
  rateLimitMessages,
  rateLimitByIP
} = require('./middleware/consolidatedRateLimiter');

// Hospital API (100 req/hour)
router.post('/api/patient-data', rateLimitHospitalApi, controller);

// Admin operations (50 req/hour)
router.post('/admin/action', rateLimitAdminOperations, controller);

// Message sending (10 req/minute)
router.post('/messages', rateLimitMessages, controller);

// Public endpoints (100 req/hour by IP)
router.get('/public', rateLimitByIP, controller);
```

**Configuration:**
```env
HOSPITAL_API_RATE_LIMIT=100
ADMIN_RATE_LIMIT=50
MESSAGE_RATE_LIMIT=10
DEFAULT_RATE_LIMIT=100
```

### 3. Consolidated Security

Combined security middleware for validation, sanitization, and session management.

**Features:**
- Input sanitization (XSS prevention)
- Request format validation
- Session timeout validation
- Suspicious activity detection
- 2FA enforcement

**Usage:**
```javascript
const { 
  securityChain,
  adminSecurityChain,
  sanitizeInput,
  require2FA
} = require('./middleware/consolidatedSecurity');

// Apply to all routes
app.use(securityChain);

// Admin routes
router.use('/admin', adminSecurityChain);

// Sensitive operations
router.post('/admin/delete-user', require2FA, controller);
```

### 4. Consolidated Logging

Unified logging system using response interceptor events.

**Features:**
- Request/response logging
- Error tracking
- Alert integration
- API monitoring
- Audit logging

**Usage:**
```javascript
const { 
  requestLogger,
  errorLogger,
  addLoggingContext,
  initializeLogging
} = require('./middleware/consolidatedLogging');

// Initialize event listeners
initializeLogging();

// Apply middleware
app.use(requestLogger);
app.use(addLoggingContext);

// Use in routes
router.post('/action', (req, res) => {
  req.logHospitalAction('api_access', { action: 'patient_data' });
  req.sendAlert('CRITICAL_ERROR', { message: 'Error occurred' });
  req.trackError(error, { context: 'additional info' });
});
```

### 5. Optimized Middleware

Performance optimization utilities for middleware execution.

**Features:**
- Middleware caching
- Conditional execution
- Early returns
- Batching
- Throttling/Debouncing

**Usage:**
```javascript
const { 
  cacheMiddleware,
  skipForPaths,
  onlyForPaths,
  batchMiddleware,
  throttle
} = require('./middleware/optimizedMiddleware');

// Cache expensive middleware
const cachedAuth = cacheMiddleware(
  (req) => `auth:${req.headers.authorization}`,
  authenticate,
  300 // 5 minutes
);

// Skip for specific paths
const conditionalMiddleware = skipForPaths('/public', rateLimiter);

// Batch multiple middleware
const batched = batchMiddleware([
  sanitizeInput,
  validateRequestFormat,
  checkPermissions
]);

// Throttle execution
const throttled = throttle(
  expensiveMiddleware,
  1000, // 1 second
  (req) => req.user.id
);
```

## Middleware Order

Optimal middleware order for best performance:

```
1. HTTPS Redirect (if SSL enabled)
2. Security Headers
3. CORS
4. Response Interceptor
5. Request Logging
6. Encryption Checks
7. Body Parsing
8. Security Validation & Sanitization
9. Logging Context
10. Static Files (conditional)
11. Authentication (route-specific)
12. Authorization (route-specific)
13. Rate Limiting (route-specific)
14. Route Handlers
15. Error Handling
```

## Performance Optimizations

### 1. Single Response Interception

**Before:**
```javascript
// Multiple middleware overriding res.end
app.use(logging);        // Overrides res.end
app.use(performance);    // Overrides res.end
app.use(monitoring);     // Overrides res.end
app.use(alerting);       // Overrides res.end
```

**After:**
```javascript
// Single interception with events
app.use(responseInterceptor);
responseEvents.on('complete', handleLogging);
responseEvents.on('complete', handlePerformance);
responseEvents.on('complete', handleMonitoring);
```

**Benefit:** Reduces overhead from ~4 function wrappings to 1

### 2. Conditional Middleware Execution

**Before:**
```javascript
// Middleware runs for all requests
app.use(expensiveMiddleware);
```

**After:**
```javascript
// Middleware runs only when needed
app.use(onlyForPaths('/api/admin', expensiveMiddleware));
```

**Benefit:** Skips unnecessary processing for non-matching routes

### 3. Middleware Caching

**Before:**
```javascript
// Database query on every request
async function authenticate(req, res, next) {
  const user = await User.findById(req.userId);
  req.user = user;
  next();
}
```

**After:**
```javascript
// Cached for 5 minutes
const cachedAuth = cacheMiddleware(
  (req) => `user:${req.userId}`,
  authenticate,
  300
);
```

**Benefit:** Reduces database queries by ~95% for active users

### 4. Batched Middleware

**Before:**
```javascript
// Multiple function calls
app.use(middleware1);
app.use(middleware2);
app.use(middleware3);
```

**After:**
```javascript
// Single function call
app.use(batchMiddleware([middleware1, middleware2, middleware3]));
```

**Benefit:** Reduces function call overhead

## Configuration

### Environment Variables

```env
# Rate Limiting
HOSPITAL_API_RATE_LIMIT=100
ADMIN_RATE_LIMIT=50
MESSAGE_RATE_LIMIT=10
DEFAULT_RATE_LIMIT=100

# Security
TRUSTED_PROXIES=127.0.0.1,::1
SESSION_TIMEOUT_MINUTES=30

# Performance
MIDDLEWARE_CACHE_TTL=300
ENABLE_MIDDLEWARE_CACHING=true
```

## Monitoring

### Performance Metrics

```javascript
const { getPerformanceStats } = require('./middleware/responseInterceptor');

// Get current stats
const stats = getPerformanceStats();
console.log(stats);
// {
//   requestCount: 1000,
//   requestsPerSecond: 10,
//   avgResponseTime: 150,
//   errorRate: 2.5,
//   activeUsers: 50,
//   bandwidth: 1024000,
//   avgPayloadSize: 1024,
//   totalDataTransfer: 1.5
// }
```

### Rate Limit Status

```javascript
const { getRateLimitStatus } = require('./middleware/consolidatedRateLimiter');

// Check rate limit status
const status = getRateLimitStatus('HOSPITAL_API', hospitalId);
console.log(status);
// {
//   count: 45,
//   remaining: 55,
//   resetTime: '2026-02-19T11:00:00.000Z'
// }
```

### Cache Statistics

```javascript
const { getCacheStats } = require('./middleware/optimizedMiddleware');

// Get cache stats
const stats = getCacheStats();
console.log(stats);
// {
//   keys: 150,
//   hits: 1000,
//   misses: 100,
//   ksize: 150,
//   vsize: 15000
// }
```

## Testing

### Unit Tests

```javascript
const { rateLimitHospitalApi, resetRateLimit } = require('./middleware/consolidatedRateLimiter');

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimit('HOSPITAL_API', 'test-hospital-id');
  });

  it('should allow requests within limit', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```javascript
const request = require('supertest');
const app = require('../server');

describe('Middleware Integration', () => {
  it('should apply all middleware correctly', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.headers['x-ratelimit-limit']).toBeDefined();
  });
});
```

## Migration

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions from old middleware to new consolidated system.

## Troubleshooting

### High Memory Usage

**Issue:** Middleware cache growing too large

**Solution:**
```javascript
const { clearCache } = require('./middleware/optimizedMiddleware');

// Clear cache periodically
setInterval(() => {
  clearCache();
}, 60 * 60 * 1000); // Every hour
```

### Rate Limiting Not Working

**Issue:** Rate limits not being enforced

**Solution:**
1. Check environment variables are set
2. Verify middleware is applied to routes
3. Check identifier function returns valid value

### Slow Response Times

**Issue:** Middleware adding too much overhead

**Solution:**
1. Use conditional middleware execution
2. Enable middleware caching
3. Batch related middleware
4. Profile middleware execution

## Best Practices

1. **Apply middleware in correct order** - Follow recommended order
2. **Use conditional execution** - Skip unnecessary middleware
3. **Cache expensive operations** - Reduce database queries
4. **Monitor performance** - Track metrics regularly
5. **Test thoroughly** - Unit and integration tests
6. **Document changes** - Keep documentation updated
7. **Use events for extensibility** - Don't modify core middleware
8. **Configure via environment** - Avoid hardcoded values

## Support

For questions or issues:
1. Check this README
2. Review MIDDLEWARE_AUDIT.md
3. See MIGRATION_GUIDE.md
4. Check individual middleware files for JSDoc comments

## Contributing

When adding new middleware:
1. Follow existing patterns
2. Add JSDoc comments
3. Include unit tests
4. Update this README
5. Consider performance impact
6. Use TypeScript types if available
