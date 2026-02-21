# Controller Utilities

This directory contains utility functions and helpers for Express controllers to standardize request handling, validation, response formatting, and pagination.

## Overview

The controller utilities provide a consistent interface for:
- Async error handling
- Response formatting
- Request validation
- Pagination and filtering

## Modules

### asyncHandler

Wraps async route handlers to automatically catch errors and pass them to error middleware.

**Usage:**
```javascript
const { asyncHandler } = require('../core/controllers');

exports.getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  return sendSuccess(res, { user }, 'User retrieved successfully');
});
```

### Response Formatter

Provides standardized response formats for all API endpoints.

**Available Functions:**
- `sendSuccess(res, data, message, statusCode)` - Send success response
- `sendError(res, message, statusCode, details)` - Send error response
- `sendPaginated(res, data, pagination, message)` - Send paginated response
- `sendCreated(res, data, message)` - Send 201 created response
- `sendNoContent(res)` - Send 204 no content response
- `sendValidationError(res, errors)` - Send validation error response
- `sendUnauthorized(res, message)` - Send 401 unauthorized response
- `sendForbidden(res, message)` - Send 403 forbidden response
- `sendNotFound(res, message)` - Send 404 not found response

**Usage:**
```javascript
const { asyncHandler, sendSuccess, sendNotFound } = require('../core/controllers');

exports.getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  return sendSuccess(res, { user }, 'User retrieved successfully');
});
```

### Validation Utils

Provides validation helpers for request data.

**Available Functions:**
- `validateRequest(req)` - Validate using express-validator
- `checkValidation(req, res, next)` - Middleware to check validation
- `validateRequiredFields(body, fields)` - Check required fields
- `isValidEmail(email)` - Validate email format
- `isValidObjectId(id)` - Validate MongoDB ObjectId
- `validatePassword(password)` - Validate password strength
- `isValidPhone(phone)` - Validate phone number
- `validateDate(date)` - Validate date format
- `isInRange(value, min, max)` - Validate numeric range
- `sanitizeString(input)` - Sanitize string input
- `validateArray(value, minLength, maxLength)` - Validate array

**Usage:**
```javascript
const { asyncHandler, validateRequiredFields, sendError, sendSuccess } = require('../core/controllers');

exports.createUser = asyncHandler(async (req, res) => {
  // Validate required fields
  const missingFields = validateRequiredFields(req.body, ['name', 'email', 'password']);
  
  if (missingFields) {
    return sendError(res, `Missing required fields: ${missingFields.join(', ')}`, 400);
  }
  
  const user = await userService.create(req.body);
  return sendSuccess(res, { user }, 'User created successfully', 201);
});
```

**With express-validator:**
```javascript
const { body } = require('express-validator');
const { asyncHandler, checkValidation, sendSuccess } = require('../core/controllers');

// Validation rules
const createUserValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Controller
exports.createUser = [
  ...createUserValidation,
  checkValidation,
  asyncHandler(async (req, res) => {
    const user = await userService.create(req.body);
    return sendSuccess(res, { user }, 'User created successfully', 201);
  })
];
```

### Pagination Utils

Provides pagination helpers for list endpoints.

**Available Functions:**
- `parsePaginationParams(query, defaults)` - Parse page and limit from query
- `buildPaginationMeta(page, limit, totalItems)` - Build pagination metadata
- `paginateArray(items, page, limit)` - Paginate array in memory
- `buildMongoosePaginationOptions(page, limit, sort)` - Build Mongoose query options
- `parseSortParams(query, defaults, allowedFields)` - Parse sort parameters
- `buildFilterFromQuery(query, filterableFields)` - Build filter from query
- `executePaginatedQuery(model, filter, options)` - Execute paginated Mongoose query
- `buildPaginationLinks(baseUrl, pagination, queryParams)` - Build pagination links

**Usage:**
```javascript
const { 
  asyncHandler, 
  parsePaginationParams, 
  parseSortParams,
  buildFilterFromQuery,
  executePaginatedQuery,
  sendPaginated 
} = require('../core/controllers');

exports.getUsers = asyncHandler(async (req, res) => {
  // Parse pagination parameters
  const { page, limit } = parsePaginationParams(req.query, { limit: 20, maxLimit: 100 });
  
  // Parse sort parameters
  const sort = parseSortParams(req.query, { sortBy: 'createdAt', order: 'desc' }, ['name', 'email', 'createdAt']);
  
  // Build filter from query
  const filter = buildFilterFromQuery(req.query, ['role', 'status']);
  
  // Execute paginated query
  const result = await executePaginatedQuery(User, filter, {
    page,
    limit,
    sort,
    populate: 'profile',
    select: 'name email role status'
  });
  
  return sendPaginated(res, result.items, result.pagination, 'Users retrieved successfully');
});
```

## Best Practices

### 1. Always Use asyncHandler

Wrap all async route handlers with `asyncHandler` to ensure errors are caught:

```javascript
// ✅ Good
exports.getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  return sendSuccess(res, { user });
});

// ❌ Bad
exports.getUser = async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
```

### 2. Use Standardized Response Formats

Always use response formatter functions instead of raw `res.json()`:

```javascript
// ✅ Good
return sendSuccess(res, { user }, 'User retrieved successfully');

// ❌ Bad
return res.json({ success: true, message: 'User retrieved successfully', user });
```

### 3. Validate Input Early

Validate request data at the beginning of the controller:

```javascript
exports.createUser = asyncHandler(async (req, res) => {
  // Validate first
  const missingFields = validateRequiredFields(req.body, ['name', 'email']);
  if (missingFields) {
    return sendError(res, `Missing fields: ${missingFields.join(', ')}`, 400);
  }
  
  // Then process
  const user = await userService.create(req.body);
  return sendCreated(res, { user }, 'User created successfully');
});
```

### 4. Keep Controllers Thin

Controllers should only handle HTTP concerns. Business logic belongs in services:

```javascript
// ✅ Good
exports.createUser = asyncHandler(async (req, res) => {
  const user = await userService.create(req.body);
  return sendCreated(res, { user });
});

// ❌ Bad
exports.createUser = asyncHandler(async (req, res) => {
  // Validate email
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return sendError(res, 'Email already exists', 400);
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  
  // Create user
  const user = new User({ ...req.body, password: hashedPassword });
  await user.save();
  
  return sendCreated(res, { user });
});
```

### 5. Use Pagination for List Endpoints

Always paginate list endpoints to prevent performance issues:

```javascript
exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit } = parsePaginationParams(req.query);
  const sort = parseSortParams(req.query);
  
  const result = await executePaginatedQuery(User, {}, { page, limit, sort });
  
  return sendPaginated(res, result.items, result.pagination);
});
```

## Migration Guide

### Before (Old Pattern)

```javascript
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### After (New Pattern)

```javascript
const { asyncHandler, sendSuccess, sendNotFound } = require('../core/controllers');

exports.getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  return sendSuccess(res, { user }, 'User retrieved successfully');
});
```

## Response Format Standards

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "count": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  },
  "data": [ ... ]
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    }
  ]
}
```
