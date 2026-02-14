# Admin User Management Models

This document describes the enhanced database models for the Admin User Management System, implementing role-based permissions and comprehensive audit trails.

## Models Overview

### 1. Enhanced Admin Model (`Admin.js`)

The Admin model has been enhanced with root admin identification, permissions system, and security tracking.

#### New Fields Added:
- `isRootAdmin`: Boolean flag identifying root admin (admin@gmail.com)
- `permissions`: Array of resource-action permissions for regular admins
- `createdBy`: Reference to the admin who created this admin account
- `failedLoginAttempts`: Counter for failed login attempts
- `accountLockedUntil`: Timestamp for account lockout expiration
- `lastLoginIP`: IP address of last successful login
- `lastLoginUserAgent`: User agent string of last successful login

#### Key Methods:
- `isRoot()`: Check if admin is root admin
- `hasPermission(resource, action)`: Check specific permissions
- `setDefaultPermissions()`: Set default permissions for regular admins
- `handleFailedLogin()`: Handle failed login attempts and account locking
- `isAccountLocked()`: Check if account is currently locked
- `updateLastLogin(ipAddress, userAgent)`: Update login info with security tracking

#### Permissions System:
Regular admins have permissions for specific resources:
- `patients`: read, create, update, delete
- `doctors`: read, create, update, delete  
- `hospitals`: read, create, update, delete
- `admins`: Only root admin has access

### 2. AuditLog Model (`AuditLog.js`)

Comprehensive audit logging for all admin actions with performance-optimized indexes.

#### Key Fields:
- `adminId`: Reference to admin performing action
- `adminEmail`: Email of admin (for redundancy)
- `action`: Type of action performed (enum of predefined actions)
- `targetUserId`: ID of user being acted upon
- `targetUserType`: Type of target user (patient, doctor, hospital, admin)
- `details`: Object containing IP, user agent, reason, and additional data
- `status`: Success/failure status of the action
- `timestamp`: When the action occurred

#### Action Types:
- `USER_REMOVED`, `USER_RESTORED`
- `ADMIN_ADDED`, `ADMIN_REMOVED`
- `USER_UPDATED`, `PERMISSION_CHANGED`
- `LOGIN_SUCCESS`, `LOGIN_FAILED`
- `PASSWORD_CHANGED`, `ACCOUNT_LOCKED`
- `BULK_USER_OPERATION`, `DATA_EXPORT`
- `SYSTEM_ACCESS`

#### Key Methods:
- `AuditLog.logAction(logData)`: Static method to log admin actions
- `AuditLog.getFilteredLogs(filters, options)`: Get paginated audit logs
- `AuditLog.getStatistics(filters)`: Get audit statistics and breakdowns
- `AuditLog.exportToCSV(filters)`: Export audit logs as CSV data

### 3. RemovedUser Model (`RemovedUser.js`)

Soft deletion system preserving user data for potential recovery with automatic cleanup.

#### Key Fields:
- `originalId`: Original user ID from source collection
- `userType`: Type of user (patient, doctor, hospital, admin)
- `userData`: Complete user data preserved as Mixed type
- `removedBy`: Admin who performed the removal
- `removedAt`: Timestamp of removal
- `reason`: Optional reason for removal
- `isRestored`: Flag indicating if user was restored
- `scheduledDeletion`: Auto-deletion date (90 days default)
- `removalContext`: Additional context about removal
- `dataIntegrityHash`: SHA256 hash for data integrity verification

#### Key Methods:
- `verifyDataIntegrity()`: Verify preserved data hasn't been corrupted
- `markAsRestored(adminId, adminEmail, notes)`: Mark user as restored
- `RemovedUser.createRemovedUser(userData, userType, adminId, adminEmail, reason, context)`: Create removal record
- `RemovedUser.getFilteredRemovedUsers(filters, options)`: Get paginated removed users
- `RemovedUser.getUsersScheduledForDeletion(daysFromNow)`: Get users scheduled for deletion
- `RemovedUser.cleanupExpiredRecords()`: Permanently delete expired records
- `RemovedUser.getRemovalStatistics(filters)`: Get removal statistics

## Database Indexes

All models include performance-optimized indexes:

### Admin Model Indexes:
- `{ email: 1 }` (unique)
- `{ isRootAdmin: 1 }`
- `{ isActive: 1 }`
- `{ createdBy: 1 }`
- `{ lastLogin: -1 }`

### AuditLog Model Indexes:
- `{ adminId: 1, timestamp: -1 }`
- `{ action: 1, timestamp: -1 }`
- `{ targetUserType: 1, timestamp: -1 }`
- `{ targetUserId: 1, timestamp: -1 }`
- `{ timestamp: -1 }`
- `{ 'details.ipAddress': 1, timestamp: -1 }`
- `{ status: 1, timestamp: -1 }`
- Compound indexes for common query patterns

### RemovedUser Model Indexes:
- `{ originalId: 1, userType: 1 }` (unique)
- `{ userType: 1, removedAt: -1 }`
- `{ removedBy: 1, removedAt: -1 }`
- `{ isRestored: 1, removedAt: -1 }`
- `{ scheduledDeletion: 1 }`
- `{ 'userData.email': 1 }`
- Compound indexes for filtered queries

## Usage Examples

### Creating Root Admin
```javascript
const admin = new Admin({
  name: 'System Administrator',
  email: 'admin@gmail.com',
  password: 'securepassword'
});
// isRootAdmin will be automatically set to true
await admin.save();
```

### Creating Regular Admin
```javascript
const admin = new Admin({
  name: 'Regular Admin',
  email: 'admin@example.com',
  password: 'securepassword',
  createdBy: rootAdminId
});
// Default permissions will be automatically set
await admin.save();
```

### Logging Admin Action
```javascript
await AuditLog.logAction({
  adminId: adminId,
  adminEmail: 'admin@example.com',
  action: 'USER_REMOVED',
  targetUserId: userId,
  targetUserType: 'patient',
  targetUserEmail: 'patient@example.com',
  details: {
    reason: 'Account violation',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session123'
  }
});
```

### Soft Deleting User
```javascript
const removedUser = await RemovedUser.createRemovedUser(
  userData,
  'patient',
  adminId,
  'admin@example.com',
  'Policy violation',
  {
    hasActiveCases: true,
    relatedRecordsCount: 5
  }
);
```

### Checking Permissions
```javascript
const admin = await Admin.findById(adminId);
if (admin.hasPermission('patients', 'delete')) {
  // Admin can delete patients
}
```

## Initialization

Use the initialization script to set up the system:

```bash
node backend/scripts/initializeAdminUserManagement.js
```

This script will:
1. Ensure root admin exists and is properly configured
2. Create all necessary database indexes
3. Update existing admins with new schema fields
4. Display system statistics

## Validation

Run the validation script to test model definitions:

```bash
node backend/scripts/validateModels.js
```

This validates:
- Model schema definitions
- Required fields and indexes
- Instance and static methods
- Enum values
- Method functionality

## Security Features

1. **Root Admin Protection**: admin@gmail.com is automatically identified as root admin
2. **Account Locking**: Failed login attempts trigger temporary account locks
3. **Audit Trail**: All admin actions are logged with IP and user agent
4. **Data Integrity**: Removed user data includes integrity hashes
5. **Permission System**: Granular permissions for different resources
6. **Automatic Cleanup**: Removed users are automatically deleted after 90 days

## Performance Considerations

- Comprehensive indexing for fast queries
- Efficient compound indexes for common filter combinations
- Pagination support for large datasets
- Optimized aggregation pipelines for statistics
- Lean queries where appropriate to reduce memory usage

## Migration Notes

When upgrading existing systems:
1. Run the initialization script to update existing admin records
2. Existing admins will be assigned default permissions
3. admin@gmail.com will be automatically flagged as root admin
4. All indexes will be created automatically
5. No data loss occurs during migration