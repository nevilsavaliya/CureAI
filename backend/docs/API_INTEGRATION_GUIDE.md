# Hospital API Integration Guide

## Overview

This comprehensive guide helps hospitals integrate with the Healthcare Platform API to access patient medical data during emergency situations. The API provides secure, real-time access to critical patient information.

## Prerequisites

Before starting integration:

- ✅ Hospital registration completed and verified
- ✅ API credentials received (API Key and Secret)
- ✅ Development environment set up
- ✅ HTTPS-capable server infrastructure
- ✅ Understanding of RESTful APIs and JSON

## Quick Start

### 1. Test Your Credentials

First, verify your API credentials work:

```bash
curl -X POST https://api.healthcareplatform.com/api/hospitals/api/patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "HK_your_api_key_here",
    "apiSecret": "your_api_secret_here",
    "patientEmail": "test@example.com"
  }'
```

Expected response for invalid patient:
```json
{
  "success": false,
  "message": "Patient not found",
  "error": "No patient found with email: test@example.com"
}
```

### 2. Environment Setup

Store your credentials securely:

```bash
# Environment variables (.env file)
HEALTHCARE_API_KEY=HK_your_api_key_here
HEALTHCARE_API_SECRET=your_api_secret_here
HEALTHCARE_API_URL=https://api.healthcareplatform.com
```

### 3. Basic Integration

Here's a simple integration example:

```javascript
const axios = require('axios');

class HealthcareAPI {
  constructor(apiKey, apiSecret, baseURL) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = baseURL;
  }

  async getPatientData(patientEmail) {
    try {
      const response = await axios.post(`${this.baseURL}/api/hospitals/api/patient-data`, {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
        patientEmail: patientEmail
      });
      
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Usage
const api = new HealthcareAPI(
  process.env.HEALTHCARE_API_KEY,
  process.env.HEALTHCARE_API_SECRET,
  process.env.HEALTHCARE_API_URL
);

// Get patient data
api.getPatientData('patient@example.com')
  .then(data => console.log('Patient data:', data))
  .catch(error => console.error('Failed to get patient data:', error));
```

## API Reference

### Endpoint Details

**URL**: `POST /api/hospitals/api/patient-data`  
**Content-Type**: `application/json`  
**Rate Limit**: 100 requests per hour

### Request Format

```json
{
  "apiKey": "HK_32_character_hex_string",
  "apiSecret": "64_character_hex_string",
  "patientEmail": "patient@example.com"
}
```

### Response Format

#### Success Response (200 OK)

```json
{
  "success": true,
  "patient": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "age": 35,
    "dateOfBirth": "1989-03-15",
    "gender": "Male",
    "bloodGroup": "O+",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "country": "USA"
    },
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+1-555-0124"
    },
    "allergies": [
      "Penicillin (severe reaction)",
      "Peanuts (anaphylaxis)",
      "Shellfish (mild reaction)"
    ],
    "chronicConditions": [
      {
        "condition": "Type 2 Diabetes",
        "diagnosedDate": "2018-06-15",
        "notes": "Well controlled with medication"
      },
      {
        "condition": "Hypertension",
        "diagnosedDate": "2020-01-10",
        "notes": "Managed with ACE inhibitor"
      }
    ],
    "currentMedications": [
      {
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "Twice daily",
        "startDate": "2018-06-15",
        "prescribedBy": "Dr. Smith"
      },
      {
        "name": "Lisinopril",
        "dosage": "10mg",
        "frequency": "Once daily",
        "startDate": "2020-01-10",
        "prescribedBy": "Dr. Johnson"
      }
    ],
    "pastSurgeries": [
      {
        "surgery": "Appendectomy",
        "date": "2015-08-20",
        "hospital": "General Hospital",
        "notes": "Uncomplicated laparoscopic procedure"
      }
    ],
    "vaccinations": [
      {
        "vaccine": "COVID-19 (Pfizer)",
        "date": "2021-04-15",
        "nextDue": "2022-04-15"
      },
      {
        "vaccine": "Influenza",
        "date": "2023-10-01",
        "nextDue": "2024-10-01"
      }
    ],
    "extractedSymptoms": [
      {
        "symptom": "chest pain",
        "extractedFrom": "chat",
        "extractedAt": "2024-11-15T10:30:00Z",
        "caseId": "507f1f77bcf86cd799439012"
      },
      {
        "symptom": "shortness of breath",
        "extractedFrom": "consultation",
        "extractedAt": "2024-11-15T10:35:00Z",
        "caseId": "507f1f77bcf86cd799439012"
      }
    ],
    "vitalSigns": [
      {
        "recordedAt": "2024-11-15T09:00:00Z",
        "bloodPressure": {
          "systolic": 140,
          "diastolic": 90
        },
        "heartRate": 78,
        "temperature": 98.6,
        "weight": 180,
        "height": 70,
        "bmi": 25.8,
        "oxygenSaturation": 98
      }
    ],
    "labResults": [
      {
        "testName": "HbA1c",
        "result": "7.2",
        "unit": "%",
        "normalRange": "< 7.0",
        "date": "2024-11-01",
        "orderedBy": "Dr. Smith",
        "notes": "Slightly elevated, adjust medication"
      }
    ],
    "recentCases": [
      {
        "id": "507f1f77bcf86cd799439012",
        "createdAt": "2024-11-15T08:00:00Z",
        "status": "active",
        "chiefComplaint": "Chest pain and shortness of breath",
        "assignedDoctor": "Dr. Wilson"
      }
    ]
  },
  "accessedBy": {
    "hospital": "City General Hospital",
    "hospitalId": "507f1f77bcf86cd799439013",
    "accessTime": "2024-11-18T10:30:00Z",
    "accessReason": "Emergency patient care"
  }
}
```

#### Error Responses

**Authentication Failed (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid API credentials",
  "error": "API key or secret is incorrect"
}
```

**Patient Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "Patient not found",
  "error": "No patient found with email: patient@example.com"
}
```

**Rate Limit Exceeded (429 Too Many Requests)**
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": "Maximum 100 requests per hour allowed",
  "retryAfter": 3600
}
```

**Hospital Not Verified (403 Forbidden)**
```json
{
  "success": false,
  "message": "Hospital not verified",
  "error": "Hospital verification required for API access"
}
```

**Server Error (500 Internal Server Error)**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Please try again later or contact support"
}
```

## Implementation Examples

### Node.js/Express Integration

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

class HealthcareAPIClient {
  constructor() {
    this.apiKey = process.env.HEALTHCARE_API_KEY;
    this.apiSecret = process.env.HEALTHCARE_API_SECRET;
    this.baseURL = process.env.HEALTHCARE_API_URL;
  }

  async getPatientData(patientEmail) {
    const startTime = Date.now();
    
    try {
      const response = await axios.post(
        `${this.baseURL}/api/hospitals/api/patient-data`,
        {
          apiKey: this.apiKey,
          apiSecret: this.apiSecret,
          patientEmail: patientEmail
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'HospitalEMR/1.0'
          }
        }
      );

      const responseTime = Date.now() - startTime;
      console.log(`API call completed in ${responseTime}ms`);

      return {
        success: true,
        data: response.data,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.status, error.response.data);
        return {
          success: false,
          error: error.response.data,
          statusCode: error.response.status,
          responseTime
        };
      } else if (error.request) {
        // Network error
        console.error('Network Error:', error.message);
        return {
          success: false,
          error: { message: 'Network error - please check connectivity' },
          responseTime
        };
      } else {
        // Other error
        console.error('Unexpected Error:', error.message);
        return {
          success: false,
          error: { message: 'Unexpected error occurred' },
          responseTime
        };
      }
    }
  }
}

// Emergency patient lookup endpoint
app.post('/emergency/patient-lookup', async (req, res) => {
  const { patientEmail, emergencyReason } = req.body;

  // Validate input
  if (!patientEmail || !emergencyReason) {
    return res.status(400).json({
      success: false,
      message: 'Patient email and emergency reason are required'
    });
  }

  // Log emergency access attempt
  console.log(`Emergency access requested for ${patientEmail}: ${emergencyReason}`);

  const client = new HealthcareAPIClient();
  const result = await client.getPatientData(patientEmail);

  if (result.success) {
    // Log successful access
    console.log(`Patient data retrieved successfully for ${patientEmail}`);
    
    // Return formatted data for emergency use
    res.json({
      success: true,
      patient: result.data.patient,
      accessInfo: result.data.accessedBy,
      responseTime: result.responseTime
    });
  } else {
    // Log failed access
    console.error(`Failed to retrieve patient data for ${patientEmail}:`, result.error);
    
    res.status(result.statusCode || 500).json({
      success: false,
      message: result.error.message || 'Failed to retrieve patient data',
      responseTime: result.responseTime
    });
  }
});

app.listen(3000, () => {
  console.log('Hospital EMR API running on port 3000');
});
```

### Python Integration

```python
import requests
import os
import time
import logging
from typing import Dict, Optional

class HealthcareAPIClient:
    def __init__(self):
        self.api_key = os.getenv('HEALTHCARE_API_KEY')
        self.api_secret = os.getenv('HEALTHCARE_API_SECRET')
        self.base_url = os.getenv('HEALTHCARE_API_URL')
        
        if not all([self.api_key, self.api_secret, self.base_url]):
            raise ValueError("Missing required environment variables")
    
    def get_patient_data(self, patient_email: str) -> Dict:
        """
        Retrieve patient medical data for emergency situations.
        
        Args:
            patient_email (str): Patient's email address
            
        Returns:
            Dict: API response with patient data or error information
        """
        start_time = time.time()
        
        payload = {
            'apiKey': self.api_key,
            'apiSecret': self.api_secret,
            'patientEmail': patient_email
        }
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'HospitalSystem/1.0'
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/hospitals/api/patient-data",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                logging.info(f"Patient data retrieved successfully for {patient_email} in {response_time:.2f}s")
                return {
                    'success': True,
                    'data': response.json(),
                    'response_time': response_time
                }
            else:
                logging.error(f"API error {response.status_code} for {patient_email}: {response.text}")
                return {
                    'success': False,
                    'error': response.json() if response.text else {'message': 'Unknown error'},
                    'status_code': response.status_code,
                    'response_time': response_time
                }
                
        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            logging.error(f"API timeout for {patient_email} after {response_time:.2f}s")
            return {
                'success': False,
                'error': {'message': 'Request timeout - please try again'},
                'response_time': response_time
            }
            
        except requests.exceptions.ConnectionError:
            response_time = time.time() - start_time
            logging.error(f"Connection error for {patient_email}")
            return {
                'success': False,
                'error': {'message': 'Connection error - please check network'},
                'response_time': response_time
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            logging.error(f"Unexpected error for {patient_email}: {str(e)}")
            return {
                'success': False,
                'error': {'message': f'Unexpected error: {str(e)}'},
                'response_time': response_time
            }

# Usage example
def emergency_patient_lookup(patient_email: str, emergency_reason: str) -> Optional[Dict]:
    """
    Emergency patient data lookup with logging and error handling.
    """
    logging.info(f"Emergency lookup requested for {patient_email}: {emergency_reason}")
    
    client = HealthcareAPIClient()
    result = client.get_patient_data(patient_email)
    
    if result['success']:
        patient_data = result['data']['patient']
        
        # Extract critical information for emergency display
        critical_info = {
            'name': patient_data['name'],
            'age': patient_data['age'],
            'blood_group': patient_data['bloodGroup'],
            'allergies': patient_data['allergies'],
            'emergency_contact': patient_data['emergencyContact'],
            'current_medications': patient_data['currentMedications'],
            'chronic_conditions': patient_data['chronicConditions']
        }
        
        logging.info(f"Critical patient data retrieved for {patient_email}")
        return critical_info
    else:
        logging.error(f"Failed to retrieve patient data: {result['error']}")
        return None

# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    patient_info = emergency_patient_lookup(
        "john.doe@example.com",
        "Cardiac arrest - unconscious patient"
    )
    
    if patient_info:
        print("EMERGENCY PATIENT INFORMATION:")
        print(f"Name: {patient_info['name']}")
        print(f"Blood Type: {patient_info['blood_group']}")
        print(f"Allergies: {', '.join(patient_info['allergies'])}")
    else:
        print("Patient information not available")
```

### PHP Integration

```php
<?php

class HealthcareAPIClient {
    private $apiKey;
    private $apiSecret;
    private $baseURL;
    
    public function __construct() {
        $this->apiKey = $_ENV['HEALTHCARE_API_KEY'] ?? null;
        $this->apiSecret = $_ENV['HEALTHCARE_API_SECRET'] ?? null;
        $this->baseURL = $_ENV['HEALTHCARE_API_URL'] ?? null;
        
        if (!$this->apiKey || !$this->apiSecret || !$this->baseURL) {
            throw new Exception('Missing required environment variables');
        }
    }
    
    public function getPatientData($patientEmail) {
        $startTime = microtime(true);
        
        $payload = json_encode([
            'apiKey' => $this->apiKey,
            'apiSecret' => $this->apiSecret,
            'patientEmail' => $patientEmail
        ]);
        
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/json',
                    'User-Agent: HospitalPHP/1.0'
                ],
                'content' => $payload,
                'timeout' => 10
            ]
        ]);
        
        try {
            $response = file_get_contents(
                $this->baseURL . '/api/hospitals/api/patient-data',
                false,
                $context
            );
            
            $responseTime = microtime(true) - $startTime;
            
            if ($response === false) {
                error_log("API request failed for patient: $patientEmail");
                return [
                    'success' => false,
                    'error' => ['message' => 'API request failed'],
                    'responseTime' => $responseTime
                ];
            }
            
            $data = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("Invalid JSON response for patient: $patientEmail");
                return [
                    'success' => false,
                    'error' => ['message' => 'Invalid response format'],
                    'responseTime' => $responseTime
                ];
            }
            
            error_log("Patient data retrieved successfully for: $patientEmail in {$responseTime}s");
            return [
                'success' => true,
                'data' => $data,
                'responseTime' => $responseTime
            ];
            
        } catch (Exception $e) {
            $responseTime = microtime(true) - $startTime;
            error_log("API error for patient $patientEmail: " . $e->getMessage());
            return [
                'success' => false,
                'error' => ['message' => $e->getMessage()],
                'responseTime' => $responseTime
            ];
        }
    }
}

// Emergency lookup function
function emergencyPatientLookup($patientEmail, $emergencyReason) {
    error_log("Emergency lookup requested for $patientEmail: $emergencyReason");
    
    try {
        $client = new HealthcareAPIClient();
        $result = $client->getPatientData($patientEmail);
        
        if ($result['success']) {
            $patient = $result['data']['patient'];
            
            // Format critical information for emergency display
            return [
                'success' => true,
                'patient' => [
                    'name' => $patient['name'],
                    'age' => $patient['age'],
                    'bloodGroup' => $patient['bloodGroup'],
                    'allergies' => $patient['allergies'],
                    'emergencyContact' => $patient['emergencyContact'],
                    'currentMedications' => $patient['currentMedications'],
                    'chronicConditions' => $patient['chronicConditions']
                ],
                'responseTime' => $result['responseTime']
            ];
        } else {
            return $result;
        }
    } catch (Exception $e) {
        error_log("Emergency lookup failed: " . $e->getMessage());
        return [
            'success' => false,
            'error' => ['message' => $e->getMessage()]
        ];
    }
}

// Example usage
$patientInfo = emergencyPatientLookup(
    "john.doe@example.com",
    "Severe allergic reaction - patient unconscious"
);

if ($patientInfo['success']) {
    echo "EMERGENCY PATIENT INFORMATION:\n";
    echo "Name: " . $patientInfo['patient']['name'] . "\n";
    echo "Blood Type: " . $patientInfo['patient']['bloodGroup'] . "\n";
    echo "Allergies: " . implode(', ', $patientInfo['patient']['allergies']) . "\n";
} else {
    echo "Error: " . $patientInfo['error']['message'] . "\n";
}

?>
```

## Rate Limiting and Error Handling

### Understanding Rate Limits

**Current Limits:**
- 100 requests per hour per hospital
- Rate limit resets every hour on the hour
- Limits are enforced per API key

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

### Implementing Rate Limit Handling

```javascript
class RateLimitHandler {
  constructor() {
    this.requestCount = 0;
    this.resetTime = null;
  }

  updateFromHeaders(headers) {
    this.requestCount = parseInt(headers['x-ratelimit-remaining']) || 0;
    this.resetTime = parseInt(headers['x-ratelimit-reset']) || null;
  }

  canMakeRequest() {
    if (this.resetTime && Date.now() / 1000 > this.resetTime) {
      // Rate limit has reset
      this.requestCount = 100;
      this.resetTime = null;
    }
    
    return this.requestCount > 0;
  }

  getWaitTime() {
    if (!this.resetTime) return 0;
    return Math.max(0, this.resetTime - Math.floor(Date.now() / 1000));
  }
}

// Usage in API client
const rateLimitHandler = new RateLimitHandler();

async function makeAPIRequest(patientEmail) {
  if (!rateLimitHandler.canMakeRequest()) {
    const waitTime = rateLimitHandler.getWaitTime();
    throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
  }

  try {
    const response = await axios.post(apiURL, requestData);
    rateLimitHandler.updateFromHeaders(response.headers);
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      rateLimitHandler.updateFromHeaders(error.response.headers);
      const waitTime = rateLimitHandler.getWaitTime();
      throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
    }
    throw error;
  }
}
```

### Retry Logic Implementation

```javascript
async function apiRequestWithRetry(patientEmail, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await makeAPIRequest(patientEmail);
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error; // Final attempt failed
      }
      
      // Calculate backoff delay
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
      console.log(`Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Security Best Practices

### Credential Management

**Environment Variables:**
```bash
# Production environment
HEALTHCARE_API_KEY=HK_your_production_key
HEALTHCARE_API_SECRET=your_production_secret
HEALTHCARE_API_URL=https://api.healthcareplatform.com

# Development environment
HEALTHCARE_API_KEY=HK_your_development_key
HEALTHCARE_API_SECRET=your_development_secret
HEALTHCARE_API_URL=https://dev-api.healthcareplatform.com
```

**Secure Storage:**
- Use environment variables or secure key management systems
- Never hardcode credentials in source code
- Rotate credentials regularly
- Use different credentials for different environments

### HTTPS and SSL

**Requirements:**
- All API requests must use HTTPS
- Verify SSL certificates
- Use TLS 1.2 or higher

**Implementation:**
```javascript
const https = require('https');
const axios = require('axios');

// Configure HTTPS agent with strict SSL verification
const httpsAgent = new https.Agent({
  rejectUnauthorized: true, // Verify SSL certificates
  secureProtocol: 'TLSv1_2_method' // Use TLS 1.2+
});

const apiClient = axios.create({
  httpsAgent: httpsAgent,
  timeout: 10000
});
```

### Audit Logging

**What to Log:**
- All API requests (timestamp, patient email, result)
- Authentication attempts
- Rate limit violations
- Error conditions
- Response times

**Example Logging:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'healthcare-api.log' }),
    new winston.transports.Console()
  ]
});

function logAPIAccess(patientEmail, success, responseTime, error = null) {
  logger.info({
    event: 'patient_data_access',
    patientEmail: patientEmail,
    success: success,
    responseTime: responseTime,
    error: error,
    timestamp: new Date().toISOString(),
    hospital: process.env.HOSPITAL_NAME
  });
}
```

## Testing and Validation

### Unit Testing

```javascript
const { expect } = require('chai');
const sinon = require('sinon');
const HealthcareAPIClient = require('./healthcare-api-client');

describe('HealthcareAPIClient', () => {
  let client;
  let axiosStub;

  beforeEach(() => {
    client = new HealthcareAPIClient();
    axiosStub = sinon.stub(axios, 'post');
  });

  afterEach(() => {
    axiosStub.restore();
  });

  it('should successfully retrieve patient data', async () => {
    const mockResponse = {
      data: {
        success: true,
        patient: {
          name: 'John Doe',
          bloodGroup: 'O+',
          allergies: ['Penicillin']
        }
      }
    };

    axiosStub.resolves(mockResponse);

    const result = await client.getPatientData('john@example.com');
    
    expect(result.success).to.be.true;
    expect(result.data.patient.name).to.equal('John Doe');
  });

  it('should handle authentication errors', async () => {
    const mockError = {
      response: {
        status: 401,
        data: {
          success: false,
          message: 'Invalid API credentials'
        }
      }
    };

    axiosStub.rejects(mockError);

    const result = await client.getPatientData('john@example.com');
    
    expect(result.success).to.be.false;
    expect(result.statusCode).to.equal(401);
  });

  it('should handle rate limiting', async () => {
    const mockError = {
      response: {
        status: 429,
        data: {
          success: false,
          message: 'Rate limit exceeded'
        }
      }
    };

    axiosStub.rejects(mockError);

    const result = await client.getPatientData('john@example.com');
    
    expect(result.success).to.be.false;
    expect(result.statusCode).to.equal(429);
  });
});
```

### Integration Testing

```javascript
describe('Healthcare API Integration', () => {
  it('should connect to real API with test credentials', async () => {
    const client = new HealthcareAPIClient();
    
    // Use test patient email that doesn't exist
    const result = await client.getPatientData('nonexistent@test.com');
    
    // Should get proper "not found" response, not auth error
    expect(result.success).to.be.false;
    expect(result.error.message).to.include('Patient not found');
  });

  it('should respect rate limits', async () => {
    const client = new HealthcareAPIClient();
    const requests = [];
    
    // Make multiple requests quickly
    for (let i = 0; i < 5; i++) {
      requests.push(client.getPatientData(`test${i}@example.com`));
    }
    
    const results = await Promise.all(requests);
    
    // All should succeed (within rate limit)
    results.forEach(result => {
      expect(result).to.have.property('success');
    });
  });
});
```

## Monitoring and Maintenance

### Health Checks

```javascript
async function healthCheck() {
  try {
    const response = await axios.get(`${process.env.HEALTHCARE_API_URL}/api/health`);
    return {
      status: 'healthy',
      responseTime: response.headers['x-response-time'],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Run health check every 5 minutes
setInterval(async () => {
  const health = await healthCheck();
  console.log('API Health:', health);
  
  if (health.status === 'unhealthy') {
    // Alert administrators
    console.error('Healthcare API is down!');
  }
}, 5 * 60 * 1000);
```

### Performance Monitoring

```javascript
class APIMetrics {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimeHistory: []
    };
  }

  recordRequest(success, responseTime) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    this.metrics.responseTimeHistory.push(responseTime);
    
    // Keep only last 100 response times
    if (this.metrics.responseTimeHistory.length > 100) {
      this.metrics.responseTimeHistory.shift();
    }
    
    // Calculate average response time
    const sum = this.metrics.responseTimeHistory.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.metrics.responseTimeHistory.length;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
    };
  }
}

const metrics = new APIMetrics();

// Use in API client
async function monitoredAPIRequest(patientEmail) {
  const startTime = Date.now();
  
  try {
    const result = await makeAPIRequest(patientEmail);
    const responseTime = Date.now() - startTime;
    
    metrics.recordRequest(true, responseTime);
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    metrics.recordRequest(false, responseTime);
    throw error;
  }
}
```

## Troubleshooting

### Common Issues and Solutions

**Issue: "Invalid API credentials"**
- **Cause**: Wrong API key or secret
- **Solution**: Verify credentials in hospital dashboard, check environment variables

**Issue: "Hospital not verified"**
- **Cause**: Hospital verification status changed
- **Solution**: Contact admin support, check hospital status

**Issue: "Rate limit exceeded"**
- **Cause**: Too many requests in short time
- **Solution**: Implement rate limiting, add retry logic with backoff

**Issue: "Patient not found"**
- **Cause**: Patient not registered or wrong email
- **Solution**: Verify patient email, check if patient is in system

**Issue: "Connection timeout"**
- **Cause**: Network issues or server overload
- **Solution**: Implement retry logic, check network connectivity

### Debug Mode

```javascript
class DebugHealthcareAPI extends HealthcareAPIClient {
  constructor(debug = false) {
    super();
    this.debug = debug;
  }

  log(message, data = null) {
    if (this.debug) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  async getPatientData(patientEmail) {
    this.log(`Starting API request for patient: ${patientEmail}`);
    
    const startTime = Date.now();
    const result = await super.getPatientData(patientEmail);
    const endTime = Date.now();
    
    this.log(`API request completed in ${endTime - startTime}ms`, {
      success: result.success,
      statusCode: result.statusCode,
      hasData: !!result.data
    });
    
    return result;
  }
}

// Usage
const debugClient = new DebugHealthcareAPI(true);
```

## Support and Resources

### Technical Support

- **Email**: api-support@healthcareplatform.com
- **Phone**: 1-800-API-HELP (1-800-274-4357)
- **Hours**: 24/7 for emergency API issues
- **Response Time**: Within 1 hour for critical issues

### Documentation

- **Interactive API Docs**: Available in hospital dashboard
- **Swagger/OpenAPI Spec**: `/api-docs.json`
- **Code Examples**: Multiple languages available
- **Postman Collection**: Available for download

### Community

- **Developer Forum**: [Link to forum]
- **GitHub Issues**: [Link to issues]
- **Stack Overflow**: Tag `healthcare-platform-api`

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Document ID**: APIG-001