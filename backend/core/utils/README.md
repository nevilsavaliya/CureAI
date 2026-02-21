# Utils Module

## Overview

The utils module provides common utility functions and patterns used throughout the application. It includes resilience patterns, health checks, query optimization, and helper functions.

## Purpose

- Provide reusable utility functions
- Implement resilience patterns (circuit breaker, retry)
- Optimize database queries
- Health monitoring
- Response formatting
- Error handling utilities

## Architecture

```
utils/
├── circuitBreaker.js          # Circuit breaker pattern
├── retryHandler.js            # Retry logic with backoff
├── healthCheck.js             # Health check service
├── queryOptimization.js       # Database query optimization
├── responseHelpers.js         # Response formatting helpers
├── errorHandlingUtils.js      # Error handling utilities
├── cacheMonitor.js            # Cache monitoring
├── connectionPoolMonitor.js   # Connection pool monitoring
├── resilientService.js        # Resilient service wrapper
├── validationHelpers.js       # Validation utilities
└── index.js                   # Module exports
```

## Circuit Breaker

Implements the circuit breaker pattern to prevent cascading failures.

### Features

- Three states: CLOSED, OPEN, HALF_OPEN
- Configurable failure threshold
- Automatic recovery testing
- Request timeout
- Statistics tracking

### Usage

```javascript
const { manager } = require('./core/utils/circuitBreaker');

// Get or create circuit breaker
const breaker = manager.getBreaker('email-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  resetTimeout: 30000
});

// Execute operation through circuit breaker
try {
  const result = await breaker.execute(async () => {
    return await emailAPI.send(message);
  });
} catch (error) {
  if (error.circuitBreakerOpen) {
    // Circuit is open, service unavailable
    logger.warn('Email service circuit breaker is open');
  }
}

// Get circuit breaker state
const state = breaker.getState();
console.log(`State: ${state.state}, Failures: ${state.failureCount}`);

// Reset circuit breaker
breaker.reset();
```

### Configuration

```javascript
{
  name: 'service-name',
  failureThreshold: 5,      // Open circuit after 5 failures
  successThreshold: 2,      // Close circuit after 2 successes
  timeout: 60000,           // Operation timeout (ms)
  resetTimeout: 30000       // Time before retry (ms)
}
```

### States

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit is open, requests fail immediately
- **HALF_OPEN**: Testing if service has recovered

## Retry Handler

Implements retry logic with exponential backoff for transient failures.

### Features

- Configurable retry attempts
- Exponential backoff
- Retryable error detection
- Operation-specific configuration

### Usage

```javascript
const RetryHandler = require('./core/utils/retryHandler');

// Execute with retry
const result = await RetryHandler.executeWithRetry(
  async () => {
    return await externalAPI.call();
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  'External API call'
);

// Retry database operation
const data = await RetryHandler.retryDatabaseOperation(
  async () => {
    return await db.collection.find();
  },
  'Find users'
);

// Retry external API call
const response = await RetryHandler.retryExternalAPICall(
  async () => {
    return await fetch('https://api.example.com/data');
  },
  'Fetch data'
);
```

### Configuration

```javascript
{
  maxRetries: 3,                    // Maximum retry attempts
  initialDelay: 1000,               // Initial delay (ms)
  maxDelay: 10000,                  // Maximum delay (ms)
  backoffMultiplier: 2,             // Backoff multiplier
  retryableErrors: [                // Retryable error codes
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND'
  ],
  retryableStatusCodes: [           // Retryable HTTP status codes
    408, 429, 500, 502, 503, 504
  ]
}
```

## Health Check

Provides health check functionality for monitoring system status.

### Features

- Database connectivity check
- External service availability check
- Memory usage monitoring
- Custom health checks
- Aggregated health status

### Usage

```javascript
const healthCheck = require('./core/utils/healthCheck');

// Register custom health check
healthCheck.registerCheck('database', async () => {
  const isConnected = mongoose.connection.readyState === 1;
  return {
    status: isConnected ? 'healthy' : 'unhealthy',
    message: isConnected ? 'Database connected' : 'Database disconnected'
  };
});

// Run all health checks
const health = await healthCheck.check();
console.log(health);
// {
//   status: 'healthy',
//   timestamp: '2026-02-19T10:30:00.000Z',
//   checks: {
//     database: { status: 'healthy', message: 'Database connected' },
//     memory: { status: 'healthy', usage: '45%' }
//   }
// }

// Check specific service
const dbHealth = await healthCheck.checkService('database');
```

## Query Optimization

Utilities for optimizing database queries.

### Features

- Lean query optimization
- Field projection
- Pagination
- Sort optimization
- Aggregation pipeline optimization

### Usage

```javascript
const {
  applyLean,
  applyProjection,
  applyPagination,
  applySort,
  optimizeAggregationPipeline,
  createQueryBuilder
} = require('./core/utils/queryOptimization');

// Apply lean
let query = User.find({ role: 'doctor' });
query = applyLean(query);

// Apply projection
query = applyProjection(query, ['name', 'email', 'specialization']);

// Apply pagination
query = applyPagination(query, 1, 10);

// Apply sort
query = applySort(query, { createdAt: -1 });

// Execute query
const users = await query.exec();

// Query builder
const builder = createQueryBuilder(User);
const users = await builder
  .filter({ role: 'doctor' })
  .select(['name', 'email'])
  .sort({ createdAt: -1 })
  .paginate(1, 10)
  .lean()
  .exec();
```

## Response Helpers

Utilities for formatting API responses.

### Usage

```javascript
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendCreatedResponse,
  sendNotFoundResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendValidationErrorResponse,
  sendPaginatedResponse
} = require('./core/utils/responseHelpers');

// Success response
sendSuccessResponse(res, userData, 'User retrieved successfully');

// Created response
sendCreatedResponse(res, newUser, 'User created successfully');

// Error responses
sendNotFoundResponse(res, 'User not found');
sendUnauthorizedResponse(res, 'Invalid credentials');
sendForbiddenResponse(res, 'Access denied');

// Validation error
sendValidationErrorResponse(res, [
  { field: 'email', message: 'Invalid format' }
]);

// Paginated response
sendPaginatedResponse(res, users, 1, 10, 100, 'Users retrieved');
```

## Error Handling Utils

Utilities for error handling in middleware and services.

### Usage

```javascript
const {
  createMiddlewareErrorHandler,
  wrapMiddleware,
  wrapServiceMethod,
  handleDatabaseError,
  handleExternalServiceError
} = require('./core/utils/errorHandlingUtils');

// Create error handler
const handler = createMiddlewareErrorHandler('Authentication');

// Wrap middleware
const safeMiddleware = wrapMiddleware(authMiddleware, 'Authentication');

// Wrap service method
const safeMethod = wrapServiceMethod(
  userService.createUser,
  'Failed to create user'
);

// Handle database error
try {
  await db.collection.insert(data);
} catch (error) {
  handleDatabaseError(error, 'insert user');
}

// Handle external service error
try {
  await emailAPI.send(message);
} catch (error) {
  handleExternalServiceError(error, 'Email Service', 'send email');
}
```

## Cache Monitor

Monitors cache performance and health.

### Usage

```javascript
const CacheMonitor = require('./core/utils/cacheMonitor');

// Get cache health report
const report = CacheMonitor.getHealthReport();
console.log(report);
// {
//   status: 'healthy',
//   hitRate: '85.5%',
//   size: 450,
//   memoryUsage: '45 MB',
//   recommendations: []
// }

// Start monitoring
CacheMonitor.startMonitoring(60000); // Check every minute

// Stop monitoring
CacheMonitor.stopMonitoring();

// Get performance metrics
const metrics = CacheMonitor.getPerformanceMetrics();
```

## Connection Pool Monitor

Monitors database connection pool.

### Usage

```javascript
const ConnectionPoolMonitor = require('./core/utils/connectionPoolMonitor');

// Get pool status
const status = ConnectionPoolMonitor.getPoolStatus();
console.log(status);
// {
//   totalConnections: 10,
//   availableConnections: 7,
//   activeConnections: 3,
//   poolSize: 10,
//   utilizationRate: '30%'
// }

// Start monitoring
ConnectionPoolMonitor.startMonitoring(30000); // Check every 30 seconds

// Stop monitoring
ConnectionPoolMonitor.stopMonitoring();
```

## Resilient Service

Wrapper for creating resilient services with circuit breaker and retry.

### Usage

```javascript
const { createResilientService } = require('./core/utils/resilientService');

// Create resilient service
const resilientEmailService = createResilientService(emailService, {
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000
  }
});

// Use resilient service
await resilientEmailService.send(message);
```

## Validation Helpers

Common validation utilities.

### Usage

```javascript
const {
  isValidEmail,
  isValidPhone,
  isValidObjectId,
  isValidDate,
  isValidUrl,
  sanitizeInput,
  validateRequired
} = require('./core/utils/validationHelpers');

// Validate email
if (!isValidEmail(email)) {
  throw new ValidationError('Invalid email format');
}

// Validate phone
if (!isValidPhone(phone)) {
  throw new ValidationError('Invalid phone number');
}

// Validate ObjectId
if (!isValidObjectId(id)) {
  throw new ValidationError('Invalid ID format');
}

// Sanitize input
const clean = sanitizeInput(userInput);

// Validate required fields
validateRequired({ email, password }, ['email', 'password']);
```

## Best Practices

### 1. Use Circuit Breakers for External Services

```javascript
const breaker = manager.getBreaker('payment-gateway');
await breaker.execute(async () => {
  return await paymentAPI.charge(amount);
});
```

### 2. Retry Transient Failures

```javascript
await RetryHandler.retryDatabaseOperation(async () => {
  return await db.collection.find();
});
```

### 3. Monitor Health

```javascript
app.get('/health', async (req, res) => {
  const health = await healthCheck.check();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### 4. Optimize Queries

```javascript
const users = await User.find({ role: 'doctor' })
  .select('name email')
  .lean()
  .limit(10);
```

### 5. Format Responses Consistently

```javascript
sendSuccessResponse(res, data, 'Operation successful');
```

## Testing

### Unit Tests

```javascript
const RetryHandler = require('./retryHandler');

describe('RetryHandler', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Transient error');
      return 'success';
    };
    
    const result = await RetryHandler.executeWithRetry(operation, {
      maxRetries: 3
    });
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});
```

### Integration Tests

```javascript
describe('Circuit Breaker Integration', () => {
  it('should open circuit after failures', async () => {
    const breaker = manager.getBreaker('test-service', {
      failureThreshold: 2
    });
    
    // Cause failures
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Service error');
        });
      } catch (error) {}
    }
    
    expect(breaker.isOpen()).toBe(true);
  });
});
```

## Performance

### Circuit Breaker Overhead

Circuit breaker adds minimal overhead (~1-2ms per request).

### Retry Overhead

Retry adds delay based on backoff strategy. Configure appropriately for your use case.

### Query Optimization

Lean queries can be 2-3x faster than regular queries for large result sets.

## Troubleshooting

### Common Issues

**Issue**: Circuit breaker always open
**Solution**: Check failure threshold and service health

**Issue**: Retries exhausted
**Solution**: Increase max retries or check service availability

**Issue**: Slow queries
**Solution**: Add indexes, use lean queries, limit fields

**Issue**: Memory usage high
**Solution**: Monitor cache size, use pagination

## Contributing

When adding new utilities:

1. Follow existing patterns
2. Add comprehensive JSDoc comments
3. Write unit tests
4. Update this README
5. Consider performance impact

## Support

For utility-related issues:
1. Check configuration
2. Review logs
3. Monitor performance
4. Check dependencies
5. Review test coverage
