# Error Handling Module

## Overview

The error handling module provides a unified approach to error management across the application. It implements custom error classes, centralized error handling, and consistent error response formatting.

## Purpose

- Provide consistent error handling across the application
- Classify errors as operational or programming errors
- Format error responses for API clients
- Log errors with appropriate context
- Prevent sensitive information leakage

## Architecture

```
errors/
├── AppError.js              # Base error class
├── ErrorHandler.js          # Centralized error handler
├── ValidationError.js       # Validation errors
├── AuthenticationError.js   # Authentication errors
├── AuthorizationError.js    # Authorization errors
├── NotFoundError.js         # Resource not found errors
├── DatabaseError.js         # Database errors
├── ExternalServiceError.js  # External service errors
├── errorMiddleware.js       # Express error middleware
└── index.js                 # Module exports
```

## Error Classes

### AppError (Base Class)

Base class for all operational errors.

**Properties**:
- `message`: Error message
- `statusCode`: HTTP status code
- `isOperational`: Whether error is operational (true) or programming error (false)
- `code`: Error code for client identification
- `timestamp`: When error occurred

**Usage**:
```javascript
const AppError = require('./core/errors/AppError');

throw new AppError('Something went wrong', 500);
```

### ValidationError

For input validation failures.

**Usage**:
```javascript
const { ValidationError } = require('./core/errors');

throw new ValidationError('Invalid email format');
throw new ValidationError('Validation failed', [
  { field: 'email', message: 'Invalid format' },
  { field: 'password', message: 'Too short' }
]);
```

### AuthenticationError

For authentication failures.

**Usage**:
```javascript
const { AuthenticationError } = require('./core/errors');

throw new AuthenticationError('Invalid credentials');
throw new AuthenticationError('Token expired');
```

### AuthorizationError

For authorization failures.

**Usage**:
```javascript
const { AuthorizationError } = require('./core/errors');

throw new AuthorizationError('Insufficient permissions');
throw new AuthorizationError('Access denied to this resource');
```

### NotFoundError

For resource not found errors.

**Usage**:
```javascript
const { NotFoundError } = require('./core/errors');

throw new NotFoundError('User not found');
throw new NotFoundError('Case', caseId); // Resource type and ID
```

### DatabaseError

For database operation failures.

**Usage**:
```javascript
const { DatabaseError } = require('./core/errors');

throw new DatabaseError('Failed to connect to database');
throw new DatabaseError('Query timeout');
```

### ExternalServiceError

For external service failures.

**Usage**:
```javascript
const { ExternalServiceError } = require('./core/errors');

throw new ExternalServiceError('Email service unavailable', 'MailerSend');
throw new ExternalServiceError('Payment gateway timeout', 'Razorpay');
```

## ErrorHandler Service

Centralized service for handling all errors.

### Methods

#### handleError(error, req, res)

Main error handling method.

```javascript
const errorHandler = require('./core/errors/ErrorHandler');

try {
  // Operation
} catch (error) {
  errorHandler.handleError(error, req, res);
}
```

#### isOperationalError(error)

Check if error is operational.

```javascript
if (errorHandler.isOperationalError(error)) {
  // Handle gracefully
} else {
  // Programming error - log and exit
}
```

#### formatErrorResponse(error, req)

Format error for API response.

```javascript
const response = errorHandler.formatErrorResponse(error, req);
// Returns: { success: false, error: { message, code, statusCode, ... } }
```

#### logError(error, req)

Log error with context.

```javascript
errorHandler.logError(error, req);
// Logs error with request details, user info, etc.
```

## Error Middleware

Express middleware for catching and handling errors.

### Usage

```javascript
const { errorMiddleware } = require('./core/errors');

// Add at the end of middleware stack
app.use(errorMiddleware);
```

### Features

- Catches all errors from routes and middleware
- Formats errors consistently
- Logs errors with context
- Prevents sensitive data leakage
- Handles different error types appropriately

## Error Response Format

All errors are returned in a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

### With Details

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Development Mode

In development, stack traces are included:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 500,
    "stack": "Error: ...\n    at ..."
  }
}
```

## Error Codes

Standard error codes used throughout the application:

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: External service unavailable
- `INTERNAL_SERVER_ERROR`: Unexpected error
- `BAD_REQUEST`: Invalid request
- `CONFLICT`: Resource conflict (e.g., duplicate)
- `INVALID_TOKEN`: JWT token invalid
- `TOKEN_EXPIRED`: JWT token expired

## Best Practices

### 1. Use Appropriate Error Classes

```javascript
// Good
throw new NotFoundError('User not found');

// Bad
throw new Error('User not found');
```

### 2. Provide Context

```javascript
// Good
throw new ValidationError('Invalid email format', [
  { field: 'email', message: 'Must be valid email' }
]);

// Bad
throw new ValidationError('Invalid');
```

### 3. Never Expose Sensitive Data

```javascript
// Good
throw new AuthenticationError('Invalid credentials');

// Bad
throw new AuthenticationError(`Password ${password} is incorrect`);
```

### 4. Use Async Error Handling

```javascript
const asyncHandler = require('./core/middleware/asyncHandler');

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(user);
}));
```

### 5. Log Errors Appropriately

```javascript
// Operational errors - log as warning
logger.warn('User not found', { userId });

// Programming errors - log as error
logger.error('Unexpected error', { error: error.stack });
```

## Error Handling Flow

```
1. Error occurs in route/middleware
   ↓
2. Error is caught by asyncHandler or try/catch
   ↓
3. Error is passed to error middleware
   ↓
4. ErrorHandler classifies error
   ↓
5. Error is logged with context
   ↓
6. Error response is formatted
   ↓
7. Response is sent to client
```

## Testing

### Unit Tests

```javascript
const { ValidationError, NotFoundError } = require('./core/errors');

describe('Error Classes', () => {
  it('should create ValidationError', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });
  
  it('should create NotFoundError', () => {
    const error = new NotFoundError('User not found');
    expect(error.statusCode).toBe(404);
  });
});
```

### Integration Tests

```javascript
describe('Error Handling', () => {
  it('should return 404 for non-existent resource', async () => {
    const response = await request(app)
      .get('/api/users/invalid-id')
      .expect(404);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
```

## Monitoring

### Error Tracking

Errors are automatically logged with context:

```javascript
{
  timestamp: '2026-02-19T10:30:00.000Z',
  error: {
    name: 'ValidationError',
    message: 'Invalid email format',
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    stack: '...'
  },
  request: {
    id: 'uuid',
    method: 'POST',
    url: '/api/users',
    ip: '127.0.0.1',
    userAgent: '...'
  },
  user: {
    id: 'user-id',
    email: 'user@example.com',
    role: 'patient'
  }
}
```

### Error Metrics

Track error rates and types:

```javascript
const errorStats = {
  totalErrors: 0,
  errorsByType: {},
  errorsByEndpoint: {},
  errorRate: 0
};
```

## Troubleshooting

### Common Issues

**Issue**: Errors not being caught
**Solution**: Ensure asyncHandler is used for async routes

**Issue**: Stack traces exposed in production
**Solution**: Check NODE_ENV is set to 'production'

**Issue**: Errors not logged
**Solution**: Verify logger is configured correctly

## Migration Guide

### From Custom Error Handling

**Before**:
```javascript
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
```

**After**:
```javascript
if (!user) {
  throw new NotFoundError('User not found');
}
```

### From Try/Catch Everywhere

**Before**:
```javascript
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**After**:
```javascript
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(user);
}));
```

## Contributing

When adding new error types:

1. Extend AppError class
2. Set appropriate statusCode
3. Add error code constant
4. Update this README
5. Add tests for new error type

## Support

For error handling issues:
1. Check error logs for context
2. Verify error middleware is registered
3. Ensure asyncHandler is used for async routes
4. Check NODE_ENV setting
5. Review error response format
