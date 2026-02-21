# Repositories Module

## Overview

The repositories module implements the Repository pattern to abstract database operations. It provides a consistent interface for data access and encapsulates query logic.

## Purpose

- Abstract database operations
- Provide consistent CRUD interface
- Encapsulate query logic
- Support transactions
- Optimize database queries
- Make data access testable

## Architecture

```
repositories/
├── BaseRepository.js           # Base class for all repositories
├── UserRepository.js           # User data access
├── CaseRepository.js           # Case data access
├── DoctorRepository.js         # Doctor data access
├── PatientRepository.js        # Patient data access
├── ConsultationRepository.js   # Consultation data access
├── MessageRepository.js        # Message data access
├── NotificationRepository.js   # Notification data access
├── HospitalRepository.js       # Hospital data access
├── SubscriptionRepository.js   # Subscription data access
├── SymptomRepository.js        # Symptom data access
├── FeedbackRepository.js       # Feedback data access
├── databaseOptimization.js     # Query optimization utilities
└── index.js                    # Module exports
```

## BaseRepository

Base class providing common CRUD operations for all repositories.

### Features

- Standard CRUD operations
- Pagination support
- Bulk operations
- Transaction support
- Query building utilities
- Query optimization (lean, projection, etc.)

### Usage

```javascript
const BaseRepository = require('./core/repositories/BaseRepository');
const User = require('../../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }
  
  // Add custom query methods
  async findByEmail(email) {
    return await this.findOne({ email });
  }
  
  async findByRole(role, options = {}) {
    return await this.findMany({ role }, options);
  }
  
  async searchUsers(query, options = {}) {
    const filter = {
      $or: [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
      ]
    };
    return await this.findMany(filter, options);
  }
}

module.exports = new UserRepository();
```

### Methods

#### Create Operations

```javascript
// Create single document
const user = await userRepository.create({
  email: 'user@example.com',
  password: 'hashed_password',
  name: 'John Doe'
});

// Bulk create
const users = await userRepository.bulkCreate([
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' }
]);
```

#### Read Operations

```javascript
// Find by ID
const user = await userRepository.findById(userId);

// Find by ID with options
const user = await userRepository.findById(userId, {
  populate: 'profile',
  select: 'name email',
  lean: true
});

// Find one
const user = await userRepository.findOne({ email: 'user@example.com' });

// Find many
const users = await userRepository.findMany({ role: 'doctor' });

// Find with options
const users = await userRepository.findMany(
  { role: 'doctor' },
  {
    populate: 'hospital',
    select: 'name specialization',
    sort: { createdAt: -1 },
    limit: 10,
    skip: 0
  }
);

// Paginate
const result = await userRepository.paginate(
  { role: 'patient' },
  1,  // page
  10, // limit
  { sort: { createdAt: -1 } }
);
// Returns: { data: [...], pagination: { page, limit, total, totalPages, ... } }

// Count
const count = await userRepository.count({ role: 'doctor' });

// Check existence
const exists = await userRepository.exists({ email: 'user@example.com' });
```

#### Update Operations

```javascript
// Update by ID
const updated = await userRepository.update(userId, {
  name: 'New Name',
  updatedAt: new Date()
});

// Update with options
const updated = await userRepository.update(
  userId,
  { name: 'New Name' },
  { new: true, runValidators: true }
);

// Bulk update
const modifiedCount = await userRepository.bulkUpdate([
  {
    filter: { role: 'doctor' },
    update: { verified: true }
  },
  {
    filter: { role: 'patient' },
    update: { active: true }
  }
]);
```

#### Delete Operations

```javascript
// Delete by ID
const deleted = await userRepository.delete(userId);

// Bulk delete
const deletedCount = await userRepository.bulkDelete([id1, id2, id3]);
```

#### Transactions

```javascript
// Execute operations in transaction
const result = await userRepository.withTransaction(async (session) => {
  const user = await User.create([userData], { session });
  const profile = await Profile.create([profileData], { session });
  return { user: user[0], profile: profile[0] };
});
```

### Query Building

```javascript
// Build query from filters
const query = userRepository.buildQuery({
  role: 'doctor',
  specialization: ['Cardiology', 'Neurology'],
  age: { $gte: 30, $lte: 50 },
  name: '/john/i' // Regex search
});

// Build sort
const sort = userRepository.buildSort('createdAt', 'desc');

// Build projection
const projection = userRepository.buildProjection(['name', 'email', 'role']);
```

## Domain Repositories

### UserRepository

Manages user data access.

**Custom Methods**:
```javascript
// Find by email
const user = await userRepository.findByEmail('user@example.com');

// Find by role
const doctors = await userRepository.findByRole('doctor');

// Search users
const users = await userRepository.searchUsers('john');

// Find active users
const activeUsers = await userRepository.findActive();
```

### CaseRepository

Manages medical case data access.

**Custom Methods**:
```javascript
// Find by patient
const cases = await caseRepository.findByPatient(patientId);

// Find by doctor
const cases = await caseRepository.findByDoctor(doctorId);

// Find by status
const cases = await caseRepository.findByStatus('open');

// Find urgent cases
const urgentCases = await caseRepository.findUrgent();

// Get case statistics
const stats = await caseRepository.getStatistics(doctorId);
```

### DoctorRepository

Manages doctor data access.

**Custom Methods**:
```javascript
// Find by specialization
const doctors = await doctorRepository.findBySpecialization('Cardiology');

// Find available doctors
const doctors = await doctorRepository.findAvailable();

// Search doctors
const doctors = await doctorRepository.search({
  specialization: 'Cardiology',
  location: 'New York',
  rating: { $gte: 4.0 }
});

// Get doctor with cases
const doctor = await doctorRepository.findWithCases(doctorId);
```

### PatientRepository

Manages patient data access.

**Custom Methods**:
```javascript
// Find with medical history
const patient = await patientRepository.findWithHistory(patientId);

// Find by age range
const patients = await patientRepository.findByAgeRange(18, 65);

// Get patient statistics
const stats = await patientRepository.getStatistics(patientId);
```

### MessageRepository

Manages message data access.

**Custom Methods**:
```javascript
// Find conversation
const messages = await messageRepository.findConversation(user1Id, user2Id);

// Find unread messages
const unread = await messageRepository.findUnread(userId);

// Mark as read
await messageRepository.markAsRead(messageId);

// Get conversation list
const conversations = await messageRepository.getConversations(userId);
```

### NotificationRepository

Manages notification data access.

**Custom Methods**:
```javascript
// Find user notifications
const notifications = await notificationRepository.findByUser(userId);

// Find unread notifications
const unread = await notificationRepository.findUnread(userId);

// Mark as read
await notificationRepository.markAsRead(notificationId);

// Mark all as read
await notificationRepository.markAllAsRead(userId);
```

## Query Optimization

### Lean Queries

Use lean queries for better performance when you don't need Mongoose document methods:

```javascript
// With lean (faster, plain objects)
const users = await userRepository.findMany({ role: 'doctor' }, { lean: true });

// Without lean (slower, Mongoose documents)
const users = await userRepository.findMany({ role: 'doctor' }, { lean: false });
```

### Field Projection

Select only needed fields to reduce data transfer:

```javascript
const users = await userRepository.findMany(
  { role: 'doctor' },
  { select: 'name email specialization' }
);
```

### Population

Populate related documents efficiently:

```javascript
const cases = await caseRepository.findMany(
  { status: 'open' },
  {
    populate: [
      { path: 'patient', select: 'name email' },
      { path: 'doctor', select: 'name specialization' }
    ]
  }
);
```

### Indexes

Ensure frequently queried fields are indexed:

```javascript
// In model definition
userSchema.index({ email: 1 });
userSchema.index({ role: 1, createdAt: -1 });
caseSchema.index({ patientId: 1, status: 1 });
```

### Aggregation

Use aggregation for complex queries:

```javascript
async getCaseStatistics(doctorId) {
  return await this.model.aggregate([
    { $match: { doctorId: mongoose.Types.ObjectId(doctorId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);
}
```

## Best Practices

### 1. Use Repository Methods

Always use repository methods instead of direct model access:

```javascript
// Good
const user = await userRepository.findById(userId);

// Bad
const user = await User.findById(userId);
```

### 2. Add Custom Methods

Add domain-specific query methods to repositories:

```javascript
class UserRepository extends BaseRepository {
  async findVerifiedDoctors() {
    return await this.findMany({
      role: 'doctor',
      verified: true
    });
  }
}
```

### 3. Use Transactions

Use transactions for operations that must succeed or fail together:

```javascript
await userRepository.withTransaction(async (session) => {
  await User.create([userData], { session });
  await Profile.create([profileData], { session });
  await Notification.create([notificationData], { session });
});
```

### 4. Optimize Queries

Use lean queries, projections, and indexes:

```javascript
// Optimized query
const users = await userRepository.findMany(
  { role: 'doctor', verified: true },
  {
    select: 'name email specialization',
    lean: true,
    sort: { createdAt: -1 },
    limit: 10
  }
);
```

### 5. Handle Errors

Wrap database operations in try-catch:

```javascript
async findByEmail(email) {
  try {
    return await this.findOne({ email });
  } catch (error) {
    throw new DatabaseError(`Failed to find user by email: ${error.message}`);
  }
}
```

## Testing

### Unit Tests

```javascript
const UserRepository = require('./UserRepository');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('UserRepository', () => {
  let userRepository;
  
  beforeEach(() => {
    userRepository = new UserRepository();
  });
  
  it('should find user by email', async () => {
    const mockUser = { email: 'test@example.com', name: 'Test' };
    User.findOne = jest.fn().mockResolvedValue(mockUser);
    
    const user = await userRepository.findByEmail('test@example.com');
    
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(user).toEqual(mockUser);
  });
});
```

### Integration Tests

```javascript
describe('UserRepository Integration', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });
  
  it('should create and find user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };
    
    const created = await userRepository.create(userData);
    const found = await userRepository.findById(created._id);
    
    expect(found.email).toBe(userData.email);
  });
  
  it('should paginate users', async () => {
    // Create test users
    await userRepository.bulkCreate([
      { email: 'user1@example.com', name: 'User 1' },
      { email: 'user2@example.com', name: 'User 2' },
      { email: 'user3@example.com', name: 'User 3' }
    ]);
    
    const result = await userRepository.paginate({}, 1, 2);
    
    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.totalPages).toBe(2);
  });
});
```

## Performance Monitoring

### Query Performance

Monitor slow queries:

```javascript
const startTime = Date.now();
const users = await userRepository.findMany(query);
const duration = Date.now() - startTime;

if (duration > 100) {
  logger.warn('Slow query detected', {
    repository: 'UserRepository',
    method: 'findMany',
    duration,
    query
  });
}
```

### Connection Pool

Monitor database connections:

```javascript
const mongoose = require('mongoose');

setInterval(() => {
  const stats = {
    connected: mongoose.connection.readyState === 1,
    poolSize: mongoose.connection.client.s.options.maxPoolSize,
    activeConnections: mongoose.connection.client.s.topology.s.pool.totalConnectionCount
  };
  logger.info('Database connection stats', stats);
}, 60000);
```

## Troubleshooting

### Common Issues

**Issue**: Queries are slow
**Solution**: Add indexes, use lean queries, limit fields with projection

**Issue**: Memory usage is high
**Solution**: Use pagination, limit result sets, use lean queries

**Issue**: Transaction fails
**Solution**: Ensure MongoDB replica set is configured, check session handling

**Issue**: Duplicate key error
**Solution**: Check unique indexes, handle conflicts in application logic

## Migration Guide

### From Direct Model Access

**Before**:
```javascript
const user = await User.findById(userId);
const users = await User.find({ role: 'doctor' });
```

**After**:
```javascript
const user = await userRepository.findById(userId);
const users = await userRepository.findMany({ role: 'doctor' });
```

### Adding Custom Methods

```javascript
// 1. Extend BaseRepository
class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }
  
  // 2. Add custom method
  async findByEmail(email) {
    return await this.findOne({ email });
  }
}

// 3. Export singleton
module.exports = new UserRepository();
```

## Contributing

When creating new repositories:

1. Extend BaseRepository
2. Pass model to super constructor
3. Add domain-specific query methods
4. Add JSDoc comments
5. Write unit tests
6. Update this README

## Support

For repository-related issues:
1. Check model is properly defined
2. Verify indexes are created
3. Review query performance
4. Check transaction configuration
5. Monitor connection pool
