# Healthcare Platform API Documentation

## Overview

The Healthcare Platform API provides comprehensive endpoints for managing patient care, doctor consultations, hospital integrations, and administrative operations.

## Base URL

- **Development:** `http://localhost:3000`
- **Production:** `https://api.healthcareplatform.com`

## Interactive Documentation

Access the interactive Swagger UI documentation at:
- **Local:** http://localhost:3000/api-docs
- **Production:** https://api.healthcareplatform.com/api-docs

## Authentication

The API uses two authentication methods:

### 1. JWT Bearer Token (For Users)

Used by patients, doctors, hospitals, and admins for web/mobile access.

**How to obtain:**
1. Login via `/api/auth/login` or `/api/hospitals/login`
2. Receive JWT token in response
3. Include token in subsequent requests

**Header Format:**
```
Authorization: Bearer <your-jwt-token>
```

**Token Expiry:** 7 days

### 2. API Key + Secret (For Hospital API)

Used by hospitals for emergency patient data access.

**How to obtain:**
1. Register hospital via `/api/hospitals/register`
2. Wait for admin verification
3. Receive API credentials via email after verification

**Request Format:**
```json
{
  "apiKey": "HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "apiSecret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

**Rate Limit:** 100 requests per hour per hospital

## Hospital API Integration

### Quick Start Guide

#### Step 1: Register Your Hospital

```bash
curl -X POST http://localhost:3000/api/hospitals/register \
  -H "Content-Type: multipart/form-data" \
  -F "name=Dr. John Smith" \
  -F "email=contact@cityhospital.com" \
  -F "password=SecurePass123!" \
  -F "hospitalName=City General Hospital" \
  -F "registrationNumber=REG123456" \
  -F "contactNumber=+1234567890" \
  -F "address[city]=New York" \
  -F "address[state]=NY" \
  -F "specializations=[\"Cardiology\",\"Emergency Medicine\"]" \
  -F "numberOfBeds=250" \
  -F "documents=@registration_certificate.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "Hospital registered successfully. Your application is pending admin verification.",
  "hospital": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Dr. John Smith",
    "hospitalName": "City General Hospital",
    "email": "contact@cityhospital.com",
    "verificationStatus": "pending",
    "documentsUploaded": 1
  }
}
```

#### Step 2: Wait for Verification

- Admin will review your application
- You'll receive an email with API credentials once verified
- Typical verification time: 24-48 hours

#### Step 3: Access Patient Data

```bash
curl -X POST http://localhost:3000/api/hospitals/api/patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "apiSecret": "your-api-secret-here",
    "patientEmail": "patient@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Patient data retrieved successfully",
  "patient": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "age": 35,
    "bloodGroup": "O+",
    "allergies": ["Penicillin", "Peanuts"],
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+1234567890"
    },
    "chronicConditions": [
      {
        "condition": "Hypertension",
        "diagnosedDate": "2020-01-15",
        "notes": "Controlled with medication"
      }
    ],
    "currentMedications": [
      {
        "name": "Lisinopril",
        "dosage": "10mg",
        "frequency": "Once daily",
        "startDate": "2020-01-15",
        "prescribedBy": "Dr. Smith"
      }
    ],
    "extractedSymptoms": [
      {
        "symptom": "headache",
        "extractedFrom": "chat",
        "extractedAt": "2024-11-18T10:30:00Z"
      }
    ],
    "recentCases": [
      {
        "id": "507f1f77bcf86cd799439013",
        "status": "treated",
        "symptoms": "Severe headache, dizziness",
        "diagnosis": "Migraine",
        "treatmentNotes": "Prescribed pain medication",
        "createdAt": "2024-11-15T08:00:00Z"
      }
    ]
  },
  "accessedBy": {
    "hospital": "City General Hospital",
    "accessTime": "2024-11-18T14:30:00Z"
  }
}
```

### Code Examples

#### JavaScript/Node.js

```javascript
const axios = require('axios');

async function getPatientData(apiKey, apiSecret, patientEmail) {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/hospitals/api/patient-data',
      {
        apiKey: apiKey,
        apiSecret: apiSecret,
        patientEmail: patientEmail
      }
    );
    
    console.log('Patient Data:', response.data.patient);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
getPatientData(
  'HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  'your-api-secret-here',
  'patient@example.com'
);
```

#### Python

```python
import requests
import json

def get_patient_data(api_key, api_secret, patient_email):
    url = 'http://localhost:3000/api/hospitals/api/patient-data'
    
    payload = {
        'apiKey': api_key,
        'apiSecret': api_secret,
        'patientEmail': patient_email
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        print('Patient Data:', json.dumps(data['patient'], indent=2))
        return data
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        raise

# Usage
get_patient_data(
    'HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    'your-api-secret-here',
    'patient@example.com'
)
```

#### PHP

```php
<?php

function getPatientData($apiKey, $apiSecret, $patientEmail) {
    $url = 'http://localhost:3000/api/hospitals/api/patient-data';
    
    $data = array(
        'apiKey' => $apiKey,
        'apiSecret' => $apiSecret,
        'patientEmail' => $patientEmail
    );
    
    $options = array(
        'http' => array(
            'header'  => "Content-Type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data)
        )
    );
    
    $context  = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        throw new Exception('Error accessing API');
    }
    
    $response = json_decode($result, true);
    return $response;
}

// Usage
try {
    $data = getPatientData(
        'HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        'your-api-secret-here',
        'patient@example.com'
    );
    print_r($data['patient']);
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
?>
```

## Rate Limiting

### Hospital API Rate Limits

- **Limit:** 100 requests per hour per hospital
- **Headers Returned:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

**Example Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637251200
```

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 3600
}
```

## Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Common Error Messages

#### Authentication Errors

```json
{
  "success": false,
  "message": "Invalid API credentials"
}
```

```json
{
  "success": false,
  "message": "Hospital is not verified or has been deactivated"
}
```

#### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## Security Best Practices

### For Hospital API Integration

1. **Protect Your Credentials**
   - Never commit API keys to version control
   - Store credentials in environment variables
   - Use secure key management systems in production

2. **Use HTTPS**
   - Always use HTTPS in production
   - Never send credentials over HTTP

3. **Implement Retry Logic**
   - Handle rate limits gracefully
   - Implement exponential backoff for retries

4. **Log Access**
   - Log all API calls for audit purposes
   - Monitor for unusual access patterns

5. **Rotate Credentials**
   - Rotate API secrets periodically
   - Contact admin if credentials are compromised

### Example: Secure Configuration

```javascript
// .env file
HOSPITAL_API_KEY=HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
HOSPITAL_API_SECRET=your-api-secret-here
API_BASE_URL=https://api.healthcareplatform.com

// config.js
require('dotenv').config();

module.exports = {
  apiKey: process.env.HOSPITAL_API_KEY,
  apiSecret: process.env.HOSPITAL_API_SECRET,
  baseUrl: process.env.API_BASE_URL
};
```

## Webhooks (Coming Soon)

Future versions will support webhooks for real-time notifications:
- Patient emergency alerts
- Case status updates
- API credential changes

## Support

### Documentation
- Interactive API Docs: http://localhost:3000/api-docs
- GitHub Repository: [Link to repo]

### Contact
- Email: support@healthcareplatform.com
- Support Portal: [Link to support]

### Rate Limit Increase
Contact support if you need higher rate limits for your hospital.

## Changelog

### Version 1.0.0 (Current)
- Hospital registration and verification
- Patient data API access
- Rate limiting (100 req/hour)
- Comprehensive medical records
- Symptom extraction from chat history

### Upcoming Features
- Webhooks for real-time notifications
- Bulk patient data export
- Advanced analytics dashboard
- API versioning (v2)

## Legal

### Terms of Service
By using this API, you agree to:
- Use patient data only for emergency medical purposes
- Comply with HIPAA and local data protection regulations
- Maintain confidentiality of API credentials
- Report any security incidents immediately

### Data Privacy
- All API access is logged for audit purposes
- Patient data is encrypted in transit and at rest
- Access logs are retained for 90 days
- Hospitals must comply with applicable privacy laws

### Liability
- API provided "as is" without warranties
- Hospital responsible for proper use of patient data
- Platform not liable for medical decisions based on API data
