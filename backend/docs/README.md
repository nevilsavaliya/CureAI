# Healthcare Platform API Documentation

## Quick Links

- **Interactive API Documentation (Swagger UI):** http://localhost:3000/api-docs
- **API JSON Spec:** http://localhost:3000/api-docs.json
- **Detailed Guide:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Documentation Overview

This directory contains comprehensive documentation for the Healthcare Platform API and user guides for all stakeholders.

📚 **[Complete User Guides Index](./USER_GUIDES_INDEX.md)** - Start here for role-based documentation

### Available Documentation

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
   - Complete API reference
   - Authentication guide
   - Code examples in multiple languages
   - Rate limiting information
   - Security best practices
   - Error handling

2. **Interactive Swagger UI** (http://localhost:3000/api-docs)
   - Try API endpoints directly from browser
   - View request/response schemas
   - Test authentication
   - Explore all available endpoints

### User Guides

3. **[HOSPITAL_REGISTRATION_GUIDE.md](./HOSPITAL_REGISTRATION_GUIDE.md)**
   - Step-by-step hospital registration process
   - Document requirements and validation
   - Verification workflow and timeline
   - Login and dashboard access
   - Troubleshooting common issues

4. **[ADMIN_HOSPITAL_VERIFICATION_GUIDE.md](./ADMIN_HOSPITAL_VERIFICATION_GUIDE.md)**
   - Admin verification procedures
   - Document review criteria
   - Approval and rejection workflows
   - Hospital management and monitoring
   - Communication templates

5. **[PATIENT_MEDICAL_RECORDS_GUIDE.md](./PATIENT_MEDICAL_RECORDS_GUIDE.md)**
   - Understanding your medical profile
   - How data is stored and accessed
   - Hospital emergency access procedures
   - Privacy and security measures
   - Managing and updating records

6. **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)**
   - Complete integration tutorial
   - Code examples in multiple languages
   - Rate limiting and error handling
   - Security best practices
   - Testing and monitoring

## Getting Started

### For Hospital Integration

If you're a hospital looking to integrate with our API:

1. **Register Your Hospital**
   ```bash
   POST /api/hospitals/register
   ```

2. **Wait for Admin Verification**
   - Typical turnaround: 24-48 hours
   - You'll receive API credentials via email

3. **Access Patient Data**
   ```bash
   POST /api/hospitals/api/patient-data
   ```

**Quick Start Guides:**
- **Registration**: [HOSPITAL_REGISTRATION_GUIDE.md](./HOSPITAL_REGISTRATION_GUIDE.md)
- **API Integration**: [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)
- **Complete API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### For Developers

If you're developing features for the platform:

1. **Start the Server**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Access Swagger UI**
   - Open http://localhost:3000/api-docs in your browser

3. **Test Endpoints**
   - Use the "Try it out" feature in Swagger UI
   - Or use tools like Postman, curl, or HTTPie

## API Endpoints Overview

### Authentication
- `POST /api/auth/signup/patient` - Patient registration
- `POST /api/auth/signup/doctor` - Doctor registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Hospital Management
- `POST /api/hospitals/register` - Hospital registration
- `POST /api/hospitals/login` - Hospital login
- `GET /api/hospitals/profile` - Get hospital profile
- `PUT /api/hospitals/profile` - Update hospital profile

### Hospital API (Emergency Access)
- `POST /api/hospitals/api/patient-data` - Get patient medical data

### Hospital Admin (Admin Only)
- `GET /api/admin/hospitals` - List all hospitals
- `GET /api/admin/hospitals/statistics` - Hospital statistics
- `GET /api/admin/hospitals/:id` - Get hospital details
- `PUT /api/admin/hospitals/:id/verify` - Verify hospital
- `PUT /api/admin/hospitals/:id/reject` - Reject hospital
- `PUT /api/admin/hospitals/:id/revoke` - Revoke hospital access

### Cases
- `POST /api/cases` - Create new case
- `GET /api/cases` - Get user's cases
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id/accept` - Accept case (doctor)
- `PUT /api/cases/:id/mark-treated` - Mark as treated (doctor)

### Messages
- `POST /api/cases/:caseId/messages` - Send message
- `GET /api/cases/:caseId/messages` - Get case messages
- `PUT /api/messages/:id/read` - Mark message as read

## Authentication Methods

### 1. JWT Bearer Token
Used by web/mobile applications for patients, doctors, and admins.

**Header:**
```
Authorization: Bearer <jwt-token>
```

### 2. API Key + Secret
Used by hospitals for emergency patient data access.

**Body:**
```json
{
  "apiKey": "HK_...",
  "apiSecret": "..."
}
```

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Hospital API | 100 requests | 1 hour |
| General API | No limit | - |

## Response Format

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
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

## Code Examples

### JavaScript (Node.js)
```javascript
const axios = require('axios');

// Login
const response = await axios.post('http://localhost:3000/api/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

const token = response.data.token;

// Authenticated request
const profile = await axios.get('http://localhost:3000/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Python
```python
import requests

# Login
response = requests.post('http://localhost:3000/api/auth/login', json={
    'email': 'user@example.com',
    'password': 'password123'
})

token = response.json()['token']

# Authenticated request
profile = requests.get('http://localhost:3000/api/profile', headers={
    'Authorization': f'Bearer {token}'
})
```

### cURL
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Authenticated request
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer <your-token>"
```

## Testing

### Using Swagger UI
1. Navigate to http://localhost:3000/api-docs
2. Click "Authorize" button
3. Enter your JWT token
4. Try out endpoints directly

### Using Postman
1. Import the OpenAPI spec from http://localhost:3000/api-docs.json
2. Set up environment variables for tokens
3. Test endpoints

### Using curl
See examples in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Support

### Issues
Report issues on GitHub: [Link to issues]

### Questions
- Email: support@healthcareplatform.com
- Documentation: http://localhost:3000/api-docs

### Contributing
See CONTRIBUTING.md for guidelines on contributing to the API.

## Version History

### v1.0.0 (Current)
- Initial release
- Hospital registration and verification
- Patient data API
- Complete medical records
- Symptom extraction
- Rate limiting

## License

MIT License - See LICENSE file for details
