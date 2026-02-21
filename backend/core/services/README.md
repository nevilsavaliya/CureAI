# Services Module

## Overview

The services module implements the business logic layer of the application. Services orchestrate operations, enforce business rules, and coordinate between controllers and repositories.

## Purpose

- Separate business logic from HTTP handling
- Provide reusable business operations
- Enforce business rules and validation
- Coordinate between multiple repositories
- Make code more testable and maintainable

## Architecture

```
services/
├── BaseService.js          # Base class for all services
├── AuthService.js          # Authentication logic
├── CaseService.js          # Case management logic
├── DoctorService.js        # Doctor management logic
├── PatientService.js       # Patient management logic
├── HospitalService.js      # Hospital management logic
├── MessageService.js       # Messaging logic
├── NotificationService.js  # Notification logic
├── CacheService.js         # Caching service
├── ValidationService.js    # Validation service
├── validationSchemas.js    # Validation schemas
└── index.js                # Module exports
```

## BaseService

Base class providing common patterns for all services.

### Features

- Standard CRUD operations
- Input validation
- Error handling
- DTO transformations
- Sanitization utilities

### Usage

```javascript
const BaseService = require('./core/services/BaseService');

class UserService extends BaseService {
  constructor(userRepository) {
    super(userRepository);
  }
  
  // Override to add custom validation
  validateCreate(data) {
    super.validateCreate(data);
    this.validateRequiredFields(data, ['email', 'password', 'name']);
    this.validateEmail(data.email);
    this.validatePassword(data.password);
  }
  
  // Add custom business logic
  async createUser(data) {
    // Validate
    this.validateCreate(data);
    
    // Check for duplicates
    const existing = await this.repository.findOne({ email: data.email });
    if (existing) {
      throw new ValidationError('Email already exists');
    }
    
    // Create user
    return await this.create(data);
  }
  
  // Override DTO transformation
  transformToDTO(entity) {
    const dto = super.transformToDTO(entity);
    // Remove sensitive fields
    delete dto.password;
    delete dto.resetToken;
    return dto;
  }
}
```

### Methods

#### CRUD Operations

```javascript
// Create
const user = await userService.create({ email, password, name });

// Read
const user = await userService.getById(userId);
const users = await userService.getAll(filters, { page: 1, limit: 10 });

// Update
const updated = await userService.update(userId, { name: 'New Name' });

// Delete
await userService.delete(userId);
```

#### Validation

```javascript
// Validate required fields
service.validateRequiredFields(data, ['email', 'password']);

// Validate email
service.validateEmail('user@example.com');

// Validate password
service.validatePassword('password123');

// Custom validation
service.validateCreate(data);
service.validateUpdate(data);
```

#### Sanitization

```javascript
// Sanitize string
const clean = service.sanitizeInput('<script>alert("xss")</script>');

// Sanitize object
const cleanData = service.sanitizeObject(userData);
```

## Domain Services

### AuthService

Handles authentication and authorization logic.

**Responsibilities**:
- User login/logout
- Token generation and validation
- Password reset
- OTP verification
- Session management

**Usage**:
```javascript
const authService = require('./core/services/AuthService');

// Login
const { user, token } = await authService.login(email, password);

// Verify token
const user = await authService.verifyToken(token);

// Reset password
await authService.resetPassword(userId, newPassword);

// Generate OTP
const otp = await authService.generateOTP(userId);

// Verify OTP
const isValid = await authService.verifyOTP(userId, otp);
```

### CaseService

Manages medical case operations.

**Responsibilities**:
- Case creation and updates
- Case assignment to doctors
- Case status management
- Case filtering and search
- Case statistics

**Usage**:
```javascript
const caseService = require('./core/services/CaseService');

// Create case
const medicalCase = await caseService.createCase({
  patientId,
  symptoms,
  description
});

// Assign to doctor
await caseService.assignCase(caseId, doctorId);

// Update status
await caseService.updateStatus(caseId, 'in_progress');

// Get patient cases
const cases = await caseService.getPatientCases(patientId);

// Get doctor cases
const cases = await caseService.getDoctorCases(doctorId);
```

### DoctorService

Manages doctor profiles and availability.

**Responsibilities**:
- Doctor profile management
- Specialization management
- Availability scheduling
- Doctor search and filtering
- Rating and reviews

**Usage**:
```javascript
const doctorService = require('./core/services/DoctorService');

// Update profile
await doctorService.updateProfile(doctorId, profileData);

// Set availability
await doctorService.setAvailability(doctorId, schedule);

// Search doctors
const doctors = await doctorService.search({
  specialization: 'Cardiology',
  location: 'New York',
  available: true
});

// Get doctor stats
const stats = await doctorService.getStats(doctorId);
```

### PatientService

Manages patient profiles and medical history.

**Responsibilities**:
- Patient profile management
- Medical history tracking
- Appointment management
- Health records

**Usage**:
```javascript
const patientService = require('./core/services/PatientService');

// Update profile
await patientService.updateProfile(patientId, profileData);

// Add medical history
await patientService.addMedicalHistory(patientId, historyData);

// Get appointments
const appointments = await patientService.getAppointments(patientId);
```

### HospitalService

Manages hospital operations and integrations.

**Responsibilities**:
- Hospital registration
- API key management
- Emergency case handling
- Hospital statistics

**Usage**:
```javascript
const hospitalService = require('./core/services/HospitalService');

// Register hospital
const hospital = await hospitalService.register(hospitalData);

// Generate API key
const apiKey = await hospitalService.generateAPIKey(hospitalId);

// Handle emergency
await hospitalService.handleEmergency(emergencyData);
```

### MessageService

Handles messaging between users.

**Responsibilities**:
- Send messages
- Retrieve conversations
- Mark messages as read
- Message notifications

**Usage**:
```javascript
const messageService = require('./core/services/MessageService');

// Send message
await messageService.sendMessage({
  senderId,
  receiverId,
  content,
  caseId
});

// Get conversation
const messages = await messageService.getConversation(user1Id, user2Id);

// Mark as read
await messageService.markAsRead(messageId);
```

### NotificationService

Manages user notifications.

**Responsibilities**:
- Create notifications
- Send notifications
- Mark as read
- Notification preferences

**Usage**:
```javascript
const notificationService = require('./core/services/NotificationService');

// Create notification
await notificationService.create({
  userId,
  type: 'case_assigned',
  title: 'New Case Assigned',
  message: 'You have been assigned a new case'
});

// Get user notifications
const notifications = await notificationService.getUserNotifications(userId);

// Mark as read
await notificationService.markAsRead(notificationId);
```

## CacheService

In-memory caching service with TTL and LRU eviction.

### Features

- TTL (Time To Live) support
- LRU (Least Recently Used) eviction
- Memory management
- Cache statistics
- Pattern-based deletion

### Usage

```javascript
const CacheService = require('./core/services/CacheService');

// Set value with TTL
await CacheService.set('user:123', userData, 5 * 60 * 1000); // 5 minutes

// Get value
const user = await CacheService.get('user:123');

// Delete value
await CacheService.delete('user:123');

// Delete pattern
await CacheService.deletePattern('user:*');

// Cache-aside pattern
const user = await CacheService.getOrSet('user:123', async () => {
  return await userRepository.findById('123');
}, 5 * 60 * 1000);

// Get statistics
const stats = CacheService.getStats();
console.log(`Hit rate: ${stats.hitRate}`);

// Clear all cache
await CacheService.clear();
```

### Configuration

```javascript
// Default configuration
{
  defaultTTL: 5 * 60 * 1000,    // 5 minutes
  maxEntries: 1000,              // Maximum cache entries
  maxMemoryMB: 100               // Soft memory limit
}
```

## ValidationService

Schema-based validation service.

### Features

- Schema registration
- Type validation
- Custom validators
- Sanitization
- Middleware factory

### Usage

```javascript
const validationService = require('./core/services/ValidationService');

// Register schema
validationService.registerSchema('createUser', {
  email: {
    type: 'email',
    required: true
  },
  password: {
    type: 'string',
    required: true,
    minLength: 6
  },
  name: {
    type: 'string',
    required: true,
    maxLength: 100
  },
  age: {
    type: 'integer',
    min: 18,
    max: 120
  }
});

// Validate data
const result = validationService.validate('createUser', userData);
if (!result.isValid) {
  throw new ValidationError('Validation failed', result.errors);
}

// Use sanitized data
const cleanData = result.sanitized;

// Validation middleware
router.post('/users', 
  validationService.middleware('createUser'),
  asyncHandler(async (req, res) => {
    // req.body is now validated and sanitized
  })
);
```

### Validators

```javascript
// Email
validationService.isValidEmail('user@example.com');

// Phone
validationService.isValidPhone('+1234567890');

// ObjectId
validationService.isValidObjectId('507f1f77bcf86cd799439011');

// Password
const result = validationService.validatePassword('password123', {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true
});

// Date
const result = validationService.isValidDate('2026-02-19');
```

### Sanitization

```javascript
// Sanitize string (prevent XSS)
const clean = validationService.sanitizeString('<script>alert("xss")</script>');

// Sanitize HTML
const clean = validationService.sanitizeHtml('<p>Hello</p>');

// Sanitize object
const cleanData = validationService.sanitizeObject(userData);
```

## Best Practices

### 1. Single Responsibility

Each service should have a single, well-defined responsibility.

```javascript
// Good - focused on user management
class UserService extends BaseService {
  async createUser(data) { }
  async updateUser(id, data) { }
  async deleteUser(id) { }
}

// Bad - mixing concerns
class UserService extends BaseService {
  async createUser(data) { }
  async sendEmail(to, subject) { } // Should be in EmailService
  async processPayment(amount) { } // Should be in PaymentService
}
```

### 2. Dependency Injection

Inject dependencies through constructor.

```javascript
// Good
class UserService extends BaseService {
  constructor(userRepository, emailService) {
    super(userRepository);
    this.emailService = emailService;
  }
}

// Bad
class UserService extends BaseService {
  constructor(userRepository) {
    super(userRepository);
    this.emailService = require('../services/emailService'); // Hard dependency
  }
}
```

### 3. Validation

Always validate input before processing.

```javascript
async createUser(data) {
  // Validate
  this.validateCreate(data);
  this.validateRequiredFields(data, ['email', 'password']);
  this.validateEmail(data.email);
  
  // Process
  return await this.create(data);
}
```

### 4. Error Handling

Use appropriate error classes.

```javascript
async getUser(id) {
  const user = await this.repository.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return this.transformToDTO(user);
}
```

### 5. DTO Transformation

Always transform entities to DTOs before returning.

```javascript
transformToDTO(entity) {
  const dto = super.transformToDTO(entity);
  // Remove sensitive fields
  delete dto.password;
  delete dto.resetToken;
  // Add computed fields
  dto.fullName = `${dto.firstName} ${dto.lastName}`;
  return dto;
}
```

## Testing

### Unit Tests

```javascript
const UserService = require('./UserService');
const UserRepository = require('../repositories/UserRepository');

describe('UserService', () => {
  let userService;
  let mockRepository;
  
  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn()
    };
    userService = new UserService(mockRepository);
  });
  
  it('should create user', async () => {
    const userData = { email: 'test@example.com', password: 'password123' };
    mockRepository.create.mockResolvedValue(userData);
    
    const user = await userService.create(userData);
    
    expect(mockRepository.create).toHaveBeenCalledWith(userData);
    expect(user).toBeDefined();
  });
  
  it('should throw error for invalid email', async () => {
    const userData = { email: 'invalid', password: 'password123' };
    
    await expect(userService.create(userData))
      .rejects.toThrow(ValidationError);
  });
});
```

### Integration Tests

```javascript
describe('UserService Integration', () => {
  it('should create and retrieve user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };
    
    const created = await userService.create(userData);
    const retrieved = await userService.getById(created._id);
    
    expect(retrieved.email).toBe(userData.email);
    expect(retrieved.password).toBeUndefined(); // Should be removed in DTO
  });
});
```

## Performance

### Caching

Cache frequently accessed data:

```javascript
async getUser(id) {
  return await CacheService.getOrSet(`user:${id}`, async () => {
    return await this.repository.findById(id);
  }, 5 * 60 * 1000);
}
```

### Batch Operations

Use batch operations for multiple items:

```javascript
async createUsers(usersData) {
  // Validate all
  usersData.forEach(data => this.validateCreate(data));
  
  // Create in batch
  return await this.repository.bulkCreate(usersData);
}
```

## Contributing

When creating new services:

1. Extend BaseService
2. Inject dependencies through constructor
3. Implement validation methods
4. Override DTO transformations
5. Add comprehensive JSDoc comments
6. Write unit tests
7. Update this README

## Support

For service-related issues:
1. Check service dependencies are injected
2. Verify validation logic
3. Review error handling
4. Check DTO transformations
5. Review test coverage
