# Core Module

## Overview

The `core` module provides the foundational infrastructure for the healthcare platform backend. It implements cross-cutting concerns and shared functionality that is used throughout the application, following clean architecture principles and SOLID design patterns.

## Purpose

The core module serves as the backbone of the application, providing:

- **Configuration Management**: Centralized environment variable handling
- **Error Handling**: Unified error handling and response formatting
- **Data Access**: Repository pattern for database operations
- **Business Logic**: Base service classes and common patterns
- **Caching**: In-memory caching with TTL and LRU eviction
- **Validation**: Schema-based input validation and sanitization
- **Resilience**: Circuit breaker and retry patterns
- **Utilities**: Common helper functions and middleware

## Architecture

```
core/
├── config/          # Configuration management
├── errors/          # Error classes and handlers
├── services/        # Business logic services
├── repositories/    # Data access layer
├── middleware/      # Express middleware
├── controllers/     # Controller utilities
└── utils/           # Utility functions
```

## Module Structure

### Configuration (`config/`)

**Purpose**: Manage all application configuration from environment variables

**Key Files**:
- `ConfigService.js`: Singleton service for accessing configuration
- `startupValidation.js`: Validates required environment variables at startup

**Usage**:
```javascript
const ConfigService = require('./core/config/ConfigService');

const port = ConfigService.getPort();
const mongoUri = ConfigService.getMongoUri();
const jwtSecret = ConfigService.getJwtSecret();
```

### Errors (`errors/`)

**Purpose**: Provide consistent error handling across the application

**Key Files**:
- `AppError.js`: Base error class for operational errors
- `ErrorHandler.js`: Centralized error handling service
- `ValidationError.js`, `AuthenticationError.js`, etc.: Specific error types
- `errorMiddleware.js`: Express error handling middleware

**Usage**:
```javascript
const { NotFoundError, ValidationError } = require('./core/errors');

throw new NotFoundError('User not found');
throw new ValidationError('Invalid email format');
```

### Services (`services/`)

**Purpose**: Implement business logic and orchestration

**Key Files**:
- `BaseService.js`: Base class for all services
- `CacheService.js`: In-memory caching service
- `ValidationService.js`: Input validation service
- `AuthService.js`, `CaseService.js`, etc.: Domain-specific services

**Usage**:
```javascript
const BaseService = require('./core/services/BaseService');

class UserService extends BaseService {
  constructor(userRepository) {
    super(userRepository);
  }
  
  async createUser(data) {
    this.validateCreate(data);
    return await this.create(data);
  }
}
```

### Repositories (`repositories/`)

**Purpose**: Abstract database operations and provide data access layer

**Key Files**:
- `BaseRepository.js`: Base class for all repositories
- `UserRepository.js`, `CaseRepository.js`, etc.: Domain-specific repositories
- `databaseOptimization.js`: Query optimization utilities

**Usage**:
```javascript
const BaseRepository = require('./core/repositories/BaseRepository');
const User = require('../../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }
  
  async findByEmail(email) {
    return await this.findOne({ email });
  }
}
```

### Middleware (`middleware/`)

**Purpose**: Provide reusable Express middleware functions

**Key Files**:
- `asyncHandler.js`: Wraps async route handlers
- `validationMiddleware.js`: Request validation
- `rateLimitMiddleware.js`: Rate limiting
- `securityHeadersMiddleware.js`: Security headers
- `auditLoggingMiddleware.js`: Audit logging

**Usage**:
```javascript
const asyncHandler = require('./core/middleware/asyncHandler');
const { validateRequest } = require('./core/middleware/validationMiddleware');

router.post('/users', 
  validateRequest(userSchema),
  asyncHandler(async (req, res) => {
    // Handler code
  })
);
```

### Controllers (`controllers/`)

**Purpose**: Provide utilities for HTTP request/response handling

**Key Files**:
- `responseFormatter.js`: Standard response formatting
- `paginationUtils.js`: Pagination helpers
- `validationUtils.js`: Request validation utilities

**Usage**:
```javascript
const { sendSuccess, sendError } = require('./core/controllers/responseFormatter');

sendSuccess(res, data, 'User created successfully', 201);
sendError(res, 'User not found', 404);
```

### Utils (`utils/`)

**Purpose**: Provide common utility functions and patterns

**Key Files**:
- `circuitBreaker.js`: Circuit breaker pattern implementation
- `retryHandler.js`: Retry logic with exponential backoff
- `healthCheck.js`: Health check service
- `queryOptimization.js`: Database query optimization
- `responseHelpers.js`: Response formatting helpers

**Usage**:
```javascript
const RetryHandler = require('./core/utils/retryHandler');
const { manager } = require('./core/utils/circuitBreaker');

// Retry database operation
await RetryHandler.retryDatabaseOperation(async () => {
  return await db.collection.find();
});

// Use circuit breaker for external API
const breaker = manager.getBreaker('email-service');
await breaker.execute(async () => {
  return await emailAPI.send(message);
});
```

## Dependencies

### Internal Dependencies
- `models/`: Mongoose models for database schemas
- `services/logger.js`: Application logging service

### External Dependencies
- `mongoose`: MongoDB ODM
- `express`: Web framework
- `jsonwebtoken`: JWT authentication

## Design Patterns

### Repository Pattern
Abstracts data access logic and provides a consistent interface for database operations.

### Service Layer Pattern
Separates business logic from HTTP handling, making code more testable and maintainable.

### Singleton Pattern
Used for ConfigService and CacheService to ensure single instances.

### Circuit Breaker Pattern
Prevents cascading failures by failing fast when external services are unavailable.

### Retry Pattern
Handles transient failures with exponential backoff.

## Best Practices

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Dependency Injection**: Services receive dependencies through constructors
3. **Error Handling**: All errors are caught and handled consistently
4. **Validation**: All input is validated before processing
5. **Caching**: Frequently accessed data is cached to improve performance
6. **Logging**: All operations are logged with appropriate context
7. **Testing**: All modules are designed to be easily testable

## Configuration

The core module requires the following environment variables:

### Required
- `JWT_SECRET`: Secret key for JWT token generation
- `MONGODB_URI`: MongoDB connection string

### Optional
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `API_BASE_URL`: Base URL for API
- `RATE_LIMIT_ENABLED`: Enable rate limiting (default: true)

See `.env.example` for complete list of configuration options.

## Testing

Run tests for the core module:

```bash
npm test -- core/
```

## Performance Considerations

1. **Caching**: CacheService uses LRU eviction to manage memory
2. **Query Optimization**: Repositories use lean queries and indexes
3. **Connection Pooling**: MongoDB connection pool is configured for optimal performance
4. **Async Operations**: All I/O operations are asynchronous

## Security

1. **Input Validation**: All input is validated and sanitized
2. **Error Messages**: Sensitive information is never exposed in error messages
3. **Rate Limiting**: Protects against abuse and DoS attacks
4. **Audit Logging**: Security-relevant events are logged

## Monitoring

The core module provides health check endpoints and metrics:

```javascript
const healthCheck = require('./core/utils/healthCheck');

// Get health status
const health = await healthCheck.check();

// Get cache statistics
const cacheStats = CacheService.getStats();

// Get circuit breaker status
const breakerStatus = circuitBreakerManager.getAllStates();
```

## Migration Guide

When migrating existing code to use the core module:

1. Replace direct database calls with repository methods
2. Move business logic from controllers to services
3. Use ConfigService instead of process.env
4. Replace custom error handling with ErrorHandler
5. Add caching for frequently accessed data
6. Wrap external API calls with circuit breakers

## Contributing

When adding new functionality to the core module:

1. Follow existing patterns and conventions
2. Add comprehensive JSDoc comments
3. Write unit tests for new code
4. Update this README if adding new modules
5. Ensure backward compatibility

## Support

For questions or issues with the core module, contact the backend team or create an issue in the project repository.
