# Hospital API Authentication Middleware Usage

## Overview
The `hospitalApiAuth.js` middleware provides secure authentication for hospital API endpoints. It validates API credentials, checks verification status, and tracks API usage.

## Features Implemented

### ✅ Validate API Key and Secret
- Validates API Key format (must start with `HK_` and be 35 characters)
- Finds hospital by API Key
- Compares provided API Secret with stored secret
- Returns 401 for invalid credentials

### ✅ Check Hospital Verification Status
- Ensures hospital has `verificationStatus: 'verified'`
- Returns 403 with current status if not verified
- Prevents pending or rejected hospitals from accessing API

### ✅ Check Hospital Active Status
- Verifies `isActive: true`
- Returns 403 if access has been revoked
- Protects against disabled hospital accounts

### ✅ Attach Hospital to Request Object
- Adds `req.hospital` object with:
  - `id`: Hospital MongoDB ID
  - `name`: Hospital name
  - `email`: Hospital email
  - `registrationNumber`: Registration number
  - `apiAccessCount`: Current access count

### ✅ Track API Usage
- Updates `lastApiAccess` timestamp
- Increments `apiAccessCount`
- Saves changes to database

## Usage Example

### In Routes File
```javascript
const { authenticateHospitalApi } = require('../middleware/hospitalApiAuth');

// Apply middleware to hospital API endpoints
router.post('/api/patient-data', 
  authenticateHospitalApi,  // Add this middleware
  hospitalController.getPatientData
);
```

### In Controller
```javascript
exports.getPatientData = async (req, res) => {
  try {
    // Hospital is already authenticated by middleware
    // Access hospital info from req.hospital
    const { id, name, email } = req.hospital;
    
    // Get patient email from request
    const { patientEmail } = req.body;
    
    // Your logic here...
    
    res.json({
      success: true,
      patient: patientData,
      accessedBy: {
        hospital: name,
        accessTime: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient data'
    });
  }
};
```

## Request Format

### Required Fields in Request Body
```json
{
  "apiKey": "HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "apiSecret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "patientEmail": "patient@example.com"
}
```

## Response Codes

### Success
- **200 OK**: Authentication successful, request proceeds to controller

### Client Errors
- **401 Unauthorized**: 
  - Missing API credentials
  - Invalid API Key format
  - Invalid API credentials (wrong key or secret)

- **403 Forbidden**:
  - Hospital not verified (pending/rejected)
  - Hospital access revoked (isActive: false)

### Server Errors
- **500 Internal Server Error**: Database or server error during authentication

## Error Response Examples

### Missing Credentials
```json
{
  "success": false,
  "message": "API credentials are required. Please provide apiKey and apiSecret."
}
```

### Invalid Format
```json
{
  "success": false,
  "message": "Invalid API Key format."
}
```

### Not Verified
```json
{
  "success": false,
  "message": "Hospital is not verified. Current status: pending",
  "verificationStatus": "pending"
}
```

### Access Revoked
```json
{
  "success": false,
  "message": "Hospital access has been revoked. Please contact support."
}
```

## Security Features

1. **Credential Validation**: Validates both API Key and Secret
2. **Format Checking**: Ensures API Key follows expected format
3. **Status Verification**: Checks both verification and active status
4. **Usage Tracking**: Logs every API access with timestamp
5. **Error Handling**: Provides clear error messages without exposing sensitive data

## Next Steps

To complete the hospital API implementation:

1. **Add Rate Limiting**: Implement rate limiting middleware (100 requests/hour)
2. **Update Routes**: Apply this middleware to hospital API routes
3. **Update Controller**: Remove duplicate authentication logic from `getPatientData`
4. **Add Logging**: Implement detailed audit logging for compliance
5. **Add Tests**: Create unit and integration tests for the middleware

## Testing

### Manual Test with cURL
```bash
curl -X POST http://localhost:5000/api/hospitals/api/patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "HK_your_api_key_here",
    "apiSecret": "your_api_secret_here",
    "patientEmail": "patient@example.com"
  }'
```

### Expected Behavior
1. Middleware validates credentials
2. Checks verification and active status
3. Updates access tracking
4. Attaches hospital info to request
5. Passes control to controller
