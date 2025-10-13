# Hospital Authentication & Authorization Middleware

## Overview

The auth middleware has been enhanced to support hospital role authentication and authorization. This includes JWT-based authentication for hospital users and specialized middleware for hospital-specific access control.

## Available Middleware Functions

### 1. `authenticate`
Standard JWT authentication middleware that works for all user types including hospitals.

**Usage:**
```javascript
const { authenticate } = require('../middleware/auth');

router.get('/protected-route', authenticate, (req, res) => {
  // req.user contains { id, role }
  // role can be: 'patient', 'doctor', 'admin', or 'hospital'
});
```

### 2. `authorize(...roles)`
Role-based authorization middleware that checks if the authenticated user has one of the specified roles.

**Usage:**
```javascript
const { authenticate, authorize } = require('../middleware/auth');

// Allow only hospitals
router.get('/hospital-only', authenticate, authorize('hospital'), (req, res) => {
  // Only hospitals can access this route
});

// Allow hospitals and admins
router.get('/hospital-or-admin', authenticate, authorize('hospital', 'admin'), (req, res) => {
  // Hospitals and admins can access this route
});
```

### 3. `requireVerifiedHospital`
Hospital-specific middleware that ensures:
- User is authenticated with 'hospital' role
- Hospital exists in database
- Hospital account is active
- Hospital is verified by admin

**Usage:**
```javascript
const { authenticate, requireVerifiedHospital } = require('../middleware/auth');

router.get('/verified-hospital-only', authenticate, requireVerifiedHospital, (req, res) => {
  // Only verified hospitals can access this route
  // req.hospital contains the full hospital document
  console.log(req.hospital.hospitalName);
});
```

**Response on failure:**
- 403: If not a hospital role
- 404: If hospital not found
- 403: If hospital is not active
- 403: If hospital is not verified (includes verification status and rejection reason)

### 4. `requireActiveHospital`
Hospital-specific middleware that ensures:
- User is authenticated with 'hospital' role
- Hospital exists in database
- Hospital account is active

**Note:** This does NOT check verification status, useful for routes that hospitals need access to before verification (like profile management).

**Usage:**
```javascript
const { authenticate, requireActiveHospital } = require('../middleware/auth');

router.get('/hospital-profile', authenticate, requireActiveHospital, (req, res) => {
  // Any active hospital can access (verified or pending)
  // req.hospital contains the full hospital document
});
```

## Hospital Login Flow

1. Hospital logs in via `/api/hospitals/login`
2. Backend validates credentials and verification status
3. JWT token is generated with `{ id: hospital._id, role: 'hospital' }`
4. Token is returned to client
5. Client includes token in Authorization header: `Bearer <token>`
6. Middleware validates token and attaches `req.user = { id, role: 'hospital' }`

## AuthService Integration

The `authService` has been updated to support hospital authentication:

### Hospital Login Support
```javascript
// authService.login() now checks Hospital collection
const response = await authService.login(email, password);
// Returns: { token, user: { id, name, email, role: 'hospital', verificationStatus, hospitalName } }
```

### Hospital Email Check
```javascript
// authService.checkEmailExists() now includes hospitals
const exists = await authService.checkEmailExists(email);
// Returns hospital if email is registered as hospital
```

### Get Hospital by ID
```javascript
// authService.getUserById() now supports 'hospital' role
const hospital = await authService.getUserById(hospitalId, 'hospital');
// Returns hospital data without password and apiSecret
```

## Example Route Configurations

### Hospital Profile Routes
```javascript
const { authenticate, requireActiveHospital } = require('../middleware/auth');

// Get profile (any active hospital)
router.get('/profile', authenticate, requireActiveHospital, hospitalController.getProfile);

// Update profile (any active hospital)
router.put('/profile', authenticate, requireActiveHospital, hospitalController.updateProfile);
```

### Hospital API Routes (Verified Only)
```javascript
const { authenticate, requireVerifiedHospital } = require('../middleware/auth');

// Access patient data (verified hospitals only)
router.get('/patient-data', authenticate, requireVerifiedHospital, hospitalController.getPatientData);
```

### Admin Hospital Management Routes
```javascript
const { authenticate, authorize } = require('../middleware/auth');

// Admin only routes
router.get('/hospitals', authenticate, authorize('admin'), adminController.getAllHospitals);
router.put('/hospitals/:id/verify', authenticate, authorize('admin'), adminController.verifyHospital);
```

## Hospital Model Updates

The Hospital model now includes:
- `lastLogin` field to track login activity
- `updateLastLogin()` method called automatically on login

## Security Considerations

1. **JWT Token**: Contains hospital ID and role, signed with JWT_SECRET
2. **Password**: Hashed with bcrypt before storage
3. **API Secret**: Excluded from all responses (select('-apiSecret'))
4. **Verification Check**: Enforced at middleware level for sensitive operations
5. **Active Status**: Checked to allow admin to deactivate hospitals
6. **Role Isolation**: Hospital role is separate from patient/doctor/admin roles

## Error Responses

### 401 Unauthorized
- No token provided
- Invalid or expired token

### 403 Forbidden
- Wrong role (not a hospital)
- Hospital not verified (when verification required)
- Hospital account deactivated

### 404 Not Found
- Hospital not found in database

### 500 Internal Server Error
- Database or server errors

## Testing

To test hospital authentication:

```javascript
// 1. Register hospital
POST /api/hospitals/register
Body: { name, email, password, hospitalName, ... }

// 2. Admin verifies hospital
PUT /api/admin/hospitals/:id/verify

// 3. Hospital logs in
POST /api/hospitals/login
Body: { email, password }
Response: { token, hospital: { ... } }

// 4. Use token in subsequent requests
GET /api/hospitals/profile
Headers: { Authorization: 'Bearer <token>' }
```

## Migration Notes

- Existing routes continue to work unchanged
- Hospital routes can be added incrementally
- No breaking changes to existing authentication flow
- Hospital role is additive, doesn't affect other roles
