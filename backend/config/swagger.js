const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Healthcare Platform API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Healthcare Platform, including patient management, doctor consultations, hospital integrations, and admin operations.',
      contact: {
        name: 'Healthcare Platform Support',
        email: 'support@healthcareplatform.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.healthcareplatform.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        },
        hospitalApiAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Hospital API Key and Secret for emergency patient data access'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        Hospital: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Dr. John Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'contact@cityhospital.com'
            },
            hospitalName: {
              type: 'string',
              example: 'City General Hospital'
            },
            registrationNumber: {
              type: 'string',
              example: 'REG123456'
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: '123 Main St' },
                city: { type: 'string', example: 'New York' },
                state: { type: 'string', example: 'NY' },
                zipCode: { type: 'string', example: '10001' },
                country: { type: 'string', example: 'USA' }
              }
            },
            contactNumber: {
              type: 'string',
              example: '+1234567890'
            },
            verificationStatus: {
              type: 'string',
              enum: ['pending', 'verified', 'rejected'],
              example: 'verified'
            },
            apiKey: {
              type: 'string',
              example: 'HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
            }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            dateOfBirth: { type: 'string', format: 'date' },
            age: { type: 'integer' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
            contactNumber: { type: 'string' },
            address: { type: 'string' },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                relationship: { type: 'string' },
                phone: { type: 'string' }
              }
            },
            allergies: {
              type: 'array',
              items: { type: 'string' }
            },
            chronicConditions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  condition: { type: 'string' },
                  diagnosedDate: { type: 'string', format: 'date' },
                  notes: { type: 'string' }
                }
              }
            },
            currentMedications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dosage: { type: 'string' },
                  frequency: { type: 'string' },
                  startDate: { type: 'string', format: 'date' },
                  prescribedBy: { type: 'string' }
                }
              }
            }
          }
        },
        Case: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'treated'] },
            symptoms: { type: 'string' },
            predictedConditions: {
              type: 'array',
              items: { type: 'string' }
            },
            diagnosis: { type: 'string' },
            treatmentNotes: { type: 'string' },
            prescription: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            treatedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Authentication required'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  {
                    field: 'email',
                    message: 'Please provide a valid email'
                  }
                ]
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Rate limit exceeded. Please try again later.'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Hospital',
        description: 'Hospital registration, login, and profile management'
      },
      {
        name: 'Hospital API',
        description: 'Hospital API for emergency patient data access (requires API Key)'
      },
      {
        name: 'Hospital Admin',
        description: 'Admin endpoints for hospital verification and management'
      },
      {
        name: 'Cases',
        description: 'Medical case management'
      },
      {
        name: 'Patients',
        description: 'Patient profile and medical records'
      },
      {
        name: 'Doctors',
        description: 'Doctor profiles and availability'
      },
      {
        name: 'Admin',
        description: 'Administrative operations'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
