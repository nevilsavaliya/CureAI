import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

interface CodeExample {
  language: string;
  code: string;
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  authentication: string;
  requestBody?: any;
  responseBody?: any;
  errorCodes?: ErrorCode[];
  codeExamples?: CodeExample[];
}

interface ErrorCode {
  code: number;
  message: string;
  description: string;
}

@Component({
  selector: 'app-hospital-api-docs',
  templateUrl: './hospital-api-docs.component.html',
  styleUrls: ['./hospital-api-docs.component.css']
})
export class HospitalApiDocsComponent implements OnInit {
  activeSection: string = 'overview';
  activeLanguage: string = 'curl';
  
  // API Endpoint
  apiEndpoint: ApiEndpoint = {
    method: 'POST',
    path: '/api/hospitals/api/patient-data',
    description: 'Retrieve comprehensive patient medical data for emergency situations',
    authentication: 'API Key + API Secret',
    requestBody: {
      apiKey: 'HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      apiSecret: 'your_64_character_api_secret_here',
      patientEmail: 'patient@example.com'
    },
    responseBody: {
      success: true,
      patient: {
        id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        age: 35,
        gender: 'male',
        bloodGroup: 'O+',
        allergies: ['Penicillin', 'Peanuts'],
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1234567890'
        },
        chronicConditions: [
          {
            condition: 'Type 2 Diabetes',
            diagnosedDate: '2020-03-15',
            notes: 'Well controlled with medication'
          }
        ],
        currentMedications: [
          {
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            startDate: '2020-03-15',
            prescribedBy: 'Dr. Smith'
          }
        ],
        pastSurgeries: [
          {
            surgery: 'Appendectomy',
            date: '2015-06-20',
            hospital: 'General Hospital',
            notes: 'No complications'
          }
        ],
        extractedSymptoms: [
          {
            symptom: 'fever',
            extractedFrom: 'chat',
            extractedAt: '2024-11-18T10:30:00Z',
            caseId: '507f1f77bcf86cd799439012'
          }
        ],
        vitalSigns: [
          {
            recordedAt: '2024-11-18T09:00:00Z',
            bloodPressure: {
              systolic: 120,
              diastolic: 80
            },
            heartRate: 72,
            temperature: 98.6,
            weight: 75,
            height: 175,
            bmi: 24.5,
            oxygenSaturation: 98
          }
        ],
        labResults: [
          {
            testName: 'HbA1c',
            result: '6.5',
            unit: '%',
            normalRange: '4.0-5.6',
            date: '2024-10-15',
            orderedBy: 'Dr. Smith',
            notes: 'Good control'
          }
        ],
        recentCases: [
          {
            id: '507f1f77bcf86cd799439012',
            symptoms: 'Fever, headache',
            status: 'completed',
            createdAt: '2024-11-15T08:00:00Z'
          }
        ]
      },
      accessedBy: {
        hospital: 'City Hospital',
        accessTime: '2024-11-18T10:30:00Z'
      }
    }
  };

  // Error codes
  errorCodes: ErrorCode[] = [
    {
      code: 400,
      message: 'Bad Request',
      description: 'Missing required fields (apiKey, apiSecret, or patientEmail)'
    },
    {
      code: 401,
      message: 'Unauthorized',
      description: 'Invalid API credentials or hospital not verified'
    },
    {
      code: 403,
      message: 'Forbidden',
      description: 'Hospital account is inactive or access has been revoked'
    },
    {
      code: 404,
      message: 'Not Found',
      description: 'Patient with the provided email does not exist'
    },
    {
      code: 429,
      message: 'Too Many Requests',
      description: 'Rate limit exceeded (100 requests per hour)'
    },
    {
      code: 500,
      message: 'Internal Server Error',
      description: 'Server error occurred while processing the request'
    }
  ];

  // Rate limiting info
  rateLimitInfo = {
    limit: 100,
    window: '1 hour',
    headers: [
      { name: 'X-RateLimit-Limit', description: 'Maximum number of requests allowed per hour', example: '100' },
      { name: 'X-RateLimit-Remaining', description: 'Number of requests remaining in current window', example: '95' },
      { name: 'X-RateLimit-Reset', description: 'Unix timestamp when the rate limit resets', example: '1637251200' }
    ]
  };

  constructor(
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  setActiveLanguage(language: string): void {
    this.activeLanguage = language;
  }

  getCodeExample(language: string): string {
    const apiUrl = 'https://your-api-domain.com/api/hospitals/api/patient-data';
    const apiKey = 'HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
    const apiSecret = 'your_64_character_api_secret_here';
    const patientEmail = 'patient@example.com';

    switch (language) {
      case 'curl':
        return `curl -X POST ${apiUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${apiKey}",
    "apiSecret": "${apiSecret}",
    "patientEmail": "${patientEmail}"
  }'`;

      case 'javascript':
        return `// Using fetch API
const response = await fetch('${apiUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    apiKey: '${apiKey}',
    apiSecret: '${apiSecret}',
    patientEmail: '${patientEmail}'
  })
});

const data = await response.json();

if (data.success) {
  console.log('Patient data:', data.patient);
  console.log('Blood Group:', data.patient.bloodGroup);
  console.log('Allergies:', data.patient.allergies);
  console.log('Emergency Contact:', data.patient.emergencyContact);
} else {
  console.error('Error:', data.message);
}`;

      case 'python':
        return `import requests
import json

url = '${apiUrl}'
headers = {'Content-Type': 'application/json'}
payload = {
    'apiKey': '${apiKey}',
    'apiSecret': '${apiSecret}',
    'patientEmail': '${patientEmail}'
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()

if data['success']:
    patient = data['patient']
    print(f"Patient: {patient['name']}")
    print(f"Blood Group: {patient['bloodGroup']}")
    print(f"Allergies: {', '.join(patient['allergies'])}")
    print(f"Emergency Contact: {patient['emergencyContact']['name']}")
else:
    print(f"Error: {data.get('message', 'Unknown error')}")`;

      case 'nodejs':
        return `// Using axios
const axios = require('axios');

const apiUrl = '${apiUrl}';
const apiKey = '${apiKey}';
const apiSecret = '${apiSecret}';
const patientEmail = '${patientEmail}';

async function getPatientData() {
  try {
    const response = await axios.post(apiUrl, {
      apiKey,
      apiSecret,
      patientEmail
    });

    if (response.data.success) {
      const patient = response.data.patient;
      console.log('Patient Data Retrieved:');
      console.log('Name:', patient.name);
      console.log('Age:', patient.age);
      console.log('Blood Group:', patient.bloodGroup);
      console.log('Allergies:', patient.allergies);
      console.log('Emergency Contact:', patient.emergencyContact);
      
      return patient;
    } else {
      console.error('Error:', response.data.message);
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    return null;
  }
}

getPatientData();`;

      default:
        return '';
    }
  }

  copyCode(language: string): void {
    const code = this.getCodeExample(language);
    navigator.clipboard.writeText(code).then(() => {
      this.toastService.show(`${language.toUpperCase()} code copied to clipboard!`, 'success');
    }).catch(err => {
      console.error('Failed to copy code:', err);
      this.toastService.show('Failed to copy code', 'error');
    });
  }

  copyJson(json: any): void {
    const jsonString = JSON.stringify(json, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      this.toastService.show('JSON copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Failed to copy JSON:', err);
      this.toastService.show('Failed to copy JSON', 'error');
    });
  }

  scrollToSection(sectionId: string): void {
    this.activeSection = sectionId;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
