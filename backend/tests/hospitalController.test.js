/**
 * Hospital Controller Unit Tests
 * Tests for hospital registration, login, API access, and profile management
 */

const mongoose = require('mongoose');
const hospitalController = require('../controllers/hospitalController');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Case = require('../models/Case');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

// Mock email service
const emailService = require('../services/emailService');
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn()
}));

// MongoDB Memory Server setup
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongoServer;

beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up database after each test
  await Hospital.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await Case.deleteMany({});
  await Message.deleteMany({});
  jest.clearAllMocks();
});

describe('Hospital Controller', () => {
  const validHospitalData = {
    name: 'Dr. John Smith',
    email: 'contact@cityhospital.com',
    password: 'SecurePass123',
    hospitalName: 'City Hospital',
    registrationNumber: 'REG123456',
    'address[street]': '123 Main St',
    'address[city]': 'New York',
    'address[state]': 'NY',
    'address[zipCode]': '10001',
    'address[country]': 'USA',
    contactNumber: '+1234567890',
    emergencyContact: '+1234567891',
    website: 'https://cityhospital.com',
    specializations: JSON.stringify(['Cardiology', 'Neurology']),
    numberOfBeds: 200,
    facilities: JSON.stringify(['ICU', 'Emergency', 'Surgery'])
  };

  // Mock request and response objects
  const mockRequest = (body = {}, files = [], user = null) => ({
    body,
    files,
    user,
    connection: { remoteAddress: '127.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'x-forwarded-for': '127.0.0.1' },
    ip: '127.0.0.1',
    query: {}
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.on = jest.fn(); // Add event listener support
    return res;
  };

  describe('registerHospital', () => {
    test('should register hospital successfully with valid data', async () => {
      const req = mockRequest(validHospitalData);
      const res = mockResponse();

      emailService.sendEmail.mockResolvedValue(true);

      await hospitalController.registerHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('registered successfully'),
          hospital: expect.objectContaining({
            email: validHospitalData.email,
            hospitalName: validHospitalData.hospitalName,
            verificationStatus: 'pending'
          })
        })
      );
    });

    test('should reject duplicate email', async () => {
      // Create existing hospital
      const hospital = new Hospital({
        ...validHospitalData,
        specializations: ['Cardiology'],
        facilities: ['ICU'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      });
      await hospital.save();

      const req = mockRequest({
        ...validHospitalData,
        registrationNumber: 'REG999999'
      });
      const res = mockResponse();

      await hospitalController.registerHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists')
        })
      );
    });

    test('should reject duplicate registration number', async () => {
      // Create existing hospital
      const hospital = new Hospital({
        ...validHospitalData,
        email: 'different@hospital.com',
        specializations: ['Cardiology'],
        facilities: ['ICU'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      });
      await hospital.save();

      const req = mockRequest({
        ...validHospitalData,
        email: 'another@hospital.com'
      });
      const res = mockResponse();

      await hospitalController.registerHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists')
        })
      );
    });

    test('should handle file uploads', async () => {
      const mockFiles = [
        { filename: 'doc1.pdf' },
        { filename: 'doc2.pdf' }
      ];

      const req = mockRequest(validHospitalData, mockFiles);
      const res = mockResponse();

      emailService.sendEmail.mockResolvedValue(true);

      await hospitalController.registerHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          hospital: expect.objectContaining({
            documentsUploaded: 2
          })
        })
      );
    });

    test('should send confirmation email', async () => {
      const req = mockRequest(validHospitalData);
      const res = mockResponse();

      emailService.sendEmail.mockResolvedValue(true);

      await hospitalController.registerHospital(req, res);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        validHospitalData.email,
        expect.stringContaining('Registration'),
        expect.any(String)
      );
    });

    test('should continue registration even if email fails', async () => {
      const req = mockRequest(validHospitalData);
      const res = mockResponse();

      emailService.sendEmail.mockRejectedValue(new Error('Email failed'));

      await hospitalController.registerHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('loginHospital', () => {
    let verifiedHospital;

    beforeEach(async () => {
      // Create verified hospital
      verifiedHospital = new Hospital({
        name: 'Dr. John Smith',
        email: 'verified@hospital.com',
        password: 'SecurePass123',
        hospitalName: 'Verified Hospital',
        registrationNumber: 'REG123456',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contactNumber: '+1234567890',
        verificationStatus: 'verified'
      });
      await verifiedHospital.save();
    });

    test('should login successfully with correct credentials', async () => {
      const req = mockRequest({
        email: 'verified@hospital.com',
        password: 'SecurePass123'
      });
      const res = mockResponse();

      await hospitalController.loginHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          token: expect.any(String),
          hospital: expect.objectContaining({
            email: 'verified@hospital.com',
            verificationStatus: 'verified'
          })
        })
      );
    });

    test('should reject invalid email', async () => {
      const req = mockRequest({
        email: 'nonexistent@hospital.com',
        password: 'SecurePass123'
      });
      const res = mockResponse();

      await hospitalController.loginHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid credentials'
        })
      );
    });

    test('should reject invalid password', async () => {
      const req = mockRequest({
        email: 'verified@hospital.com',
        password: 'WrongPassword'
      });
      const res = mockResponse();

      await hospitalController.loginHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid credentials'
        })
      );
    });

    test('should reject pending hospital login', async () => {
      // Create pending hospital
      const pendingHospital = new Hospital({
        name: 'Dr. Jane Doe',
        email: 'pending@hospital.com',
        password: 'SecurePass123',
        hospitalName: 'Pending Hospital',
        registrationNumber: 'REG999999',
        address: {
          street: '456 Oak St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA'
        },
        contactNumber: '+1234567891',
        verificationStatus: 'pending'
      });
      await pendingHospital.save();

      const req = mockRequest({
        email: 'pending@hospital.com',
        password: 'SecurePass123'
      });
      const res = mockResponse();

      await hospitalController.loginHospital(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('pending'),
          verificationStatus: 'pending'
        })
      );
    });

    test('should generate valid JWT token', async () => {
      const req = mockRequest({
        email: 'verified@hospital.com',
        password: 'SecurePass123'
      });
      const res = mockResponse();

      await hospitalController.loginHospital(req, res);

      const response = res.json.mock.calls[0][0];
      const token = response.token;

      expect(token).toBeDefined();

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      expect(decoded.role).toBe('hospital');
      expect(decoded.email).toBe('verified@hospital.com');
    });
  });

  describe('getPatientData', () => {
    let hospital, patient, doctor, testCase;

    beforeEach(async () => {
      // Create verified hospital with API credentials
      hospital = new Hospital({
        name: 'Dr. John Smith',
        email: 'api@hospital.com',
        password: 'SecurePass123',
        hospitalName: 'API Hospital',
        registrationNumber: 'REG123456',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contactNumber: '+1234567890',
        verificationStatus: 'verified'
      });
      hospital.generateApiCredentials();
      await hospital.save();

      // Create doctor
      doctor = new Doctor({
        name: 'Test Doctor',
        email: 'doctor@test.com',
        password: 'TestPass123',
        dateOfBirth: new Date('1980-01-01'),
        degree: 'MBBS',
        specializations: ['General Medicine'],
        experienceYears: 10,
        subscriptionStatus: 'active'
      });
      await doctor.save();

      // Create patient
      patient = new Patient({
        name: 'Test Patient',
        email: 'patient@test.com',
        password: 'TestPass123',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        bloodGroup: 'O+',
        contactNumber: '+1234567890',
        allergies: ['Penicillin'],
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Spouse',
          phone: '+1234567891'
        }
      });
      await patient.save();

      // Create case
      testCase = new Case({
        patientId: patient._id,
        doctorId: doctor._id,
        symptoms: ['fever', 'cough'],
        status: 'pending'
      });
      await testCase.save();
    });

    test('should retrieve patient data with email', async () => {
      const req = mockRequest(
        { patientEmail: 'patient@test.com' },
        [],
        null
      );
      req.hospital = hospital; // Simulating middleware attachment

      const res = mockResponse();

      await hospitalController.getPatientData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          patient: expect.objectContaining({
            name: 'Test Patient',
            email: 'patient@test.com',
            bloodGroup: 'O+',
            allergies: ['Penicillin']
          }),
          accessedBy: expect.objectContaining({
            hospital: hospital.name
          })
        })
      );
    });

    test('should retrieve patient data with ID', async () => {
      const req = mockRequest(
        { patientId: patient._id.toString() },
        [],
        null
      );
      req.hospital = hospital;

      const res = mockResponse();

      await hospitalController.getPatientData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          patient: expect.objectContaining({
            name: 'Test Patient'
          })
        })
      );
    });

    test('should return 400 if no patient identifier provided', async () => {
      const req = mockRequest({}, [], null);
      req.hospital = hospital;

      const res = mockResponse();

      await hospitalController.getPatientData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required')
        })
      );
    });

    test('should return 404 if patient not found', async () => {
      const req = mockRequest(
        { patientEmail: 'nonexistent@test.com' },
        [],
        null
      );
      req.hospital = hospital;

      const res = mockResponse();

      await hospitalController.getPatientData(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should include patient age calculation', async () => {
      const req = mockRequest(
        { patientEmail: 'patient@test.com' },
        [],
        null
      );
      req.hospital = hospital;

      const res = mockResponse();

      await hospitalController.getPatientData(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.patient.age).toBeDefined();
      expect(typeof response.patient.age).toBe('number');
      expect(response.patient.age).toBeGreaterThan(0);
    });

    test('should include recent cases', async () => {
      const req = mockRequest(
        { patientEmail: 'patient@test.com' },
        [],
        null
      );
      req.hospital = hospital;

      const res = mockResponse();

      await hospitalController.getPatientData(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.patient.recentCases).toBeDefined();
      expect(Array.isArray(response.patient.recentCases)).toBe(true);
      expect(response.patient.recentCases.length).toBeGreaterThan(0);
    });
  });

  describe('getProfile', () => {
    let hospital;

    beforeEach(async () => {
      hospital = new Hospital({
        name: 'Dr. John Smith',
        email: 'profile@hospital.com',
        password: 'SecurePass123',
        hospitalName: 'Profile Hospital',
        registrationNumber: 'REG123456',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contactNumber: '+1234567890',
        verificationStatus: 'verified'
      });
      await hospital.save();
    });

    test('should retrieve hospital profile', async () => {
      const req = mockRequest({}, [], { id: hospital._id });
      const res = mockResponse();

      await hospitalController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          hospital: expect.objectContaining({
            name: 'Dr. John Smith',
            email: 'profile@hospital.com',
            hospitalName: 'Profile Hospital'
          })
        })
      );
    });

    test('should not include password in profile', async () => {
      const req = mockRequest({}, [], { id: hospital._id });
      const res = mockResponse();

      await hospitalController.getProfile(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.hospital.password).toBeUndefined();
    });

    test('should not include apiSecret in profile after 24 hours', async () => {
      hospital.generateApiCredentials();
      // Set API key generation time to more than 24 hours ago
      hospital.apiKeyGeneratedAt = new Date(Date.now() - (25 * 60 * 60 * 1000));
      await hospital.save();

      const req = mockRequest({}, [], { id: hospital._id });
      const res = mockResponse();

      await hospitalController.getProfile(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.hospital.apiSecret).toBeUndefined();
    });

    test('should include apiSecret in profile within 24 hours of generation', async () => {
      hospital.generateApiCredentials();
      await hospital.save();

      const req = mockRequest({}, [], { id: hospital._id });
      const res = mockResponse();

      await hospitalController.getProfile(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.hospital.apiSecret).toBeDefined();
      expect(response.hospital.showApiSecret).toBe(true);
      expect(response.hospital.apiSecretExpiresAt).toBeDefined();
    });

    test('should return 404 if hospital not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = mockRequest({}, [], { id: fakeId });
      const res = mockResponse();

      await hospitalController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('updateProfile', () => {
    let hospital;

    beforeEach(async () => {
      hospital = new Hospital({
        name: 'Dr. John Smith',
        email: 'update@hospital.com',
        password: 'SecurePass123',
        hospitalName: 'Update Hospital',
        registrationNumber: 'REG123456',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contactNumber: '+1234567890',
        verificationStatus: 'verified'
      });
      await hospital.save();
    });

    test('should update hospital profile', async () => {
      const req = mockRequest(
        {
          name: 'Dr. Jane Doe',
          hospitalName: 'Updated Hospital',
          contactNumber: '+9876543210'
        },
        [],
        { id: hospital._id }
      );
      const res = mockResponse();

      await hospitalController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated'),
          hospital: expect.objectContaining({
            name: 'Dr. Jane Doe',
            hospitalName: 'Updated Hospital',
            contactNumber: '+9876543210'
          })
        })
      );
    });

    test('should update address fields', async () => {
      const req = mockRequest(
        {
          address: {
            street: '456 Oak St',
            city: 'Boston'
          }
        },
        [],
        { id: hospital._id }
      );
      const res = mockResponse();

      await hospitalController.updateProfile(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.hospital.address.street).toBe('456 Oak St');
      expect(response.hospital.address.city).toBe('Boston');
      expect(response.hospital.address.state).toBe('NY'); // Should keep existing
    });

    test('should update specializations', async () => {
      const req = mockRequest(
        {
          specializations: ['Cardiology', 'Neurology', 'Pediatrics']
        },
        [],
        { id: hospital._id }
      );
      const res = mockResponse();

      await hospitalController.updateProfile(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.hospital.specializations).toEqual([
        'Cardiology',
        'Neurology',
        'Pediatrics'
      ]);
    });

    test('should return 404 if hospital not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = mockRequest(
        { name: 'Updated Name' },
        [],
        { id: fakeId }
      );
      const res = mockResponse();

      await hospitalController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should not allow updating email', async () => {
      const req = mockRequest(
        {
          email: 'newemail@hospital.com'
        },
        [],
        { id: hospital._id }
      );
      const res = mockResponse();

      await hospitalController.updateProfile(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.hospital.email).toBe('update@hospital.com');
    });

    test('should not allow updating registrationNumber', async () => {
      const req = mockRequest(
        {
          registrationNumber: 'REG999999'
        },
        [],
        { id: hospital._id }
      );
      const res = mockResponse();

      await hospitalController.updateProfile(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.hospital.registrationNumber).toBe('REG123456');
    });
  });

  describe('getApiUsageStats', () => {
    let hospital;

    beforeEach(async () => {
      hospital = new Hospital({
        name: 'Dr. John Smith',
        email: 'stats@hospital.com',
        password: 'SecurePass123',
        hospitalName: 'Stats Hospital',
        registrationNumber: 'REG123456',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contactNumber: '+1234567890',
        verificationStatus: 'verified',
        apiAccessCount: 150
      });
      await hospital.save();
    });

    test('should retrieve API usage statistics', async () => {
      const req = mockRequest({}, [], { id: hospital._id });
      const res = mockResponse();

      await hospitalController.getApiUsageStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('statistics retrieved'),
          stats: expect.objectContaining({
            totalRequests: expect.any(Number),
            requestsToday: expect.any(Number),
            requestsThisWeek: expect.any(Number),
            requestsThisMonth: expect.any(Number),
            averageResponseTime: expect.any(Number),
            successRate: expect.any(Number),
            remainingRequests: expect.any(Number),
            rateLimit: expect.any(Number),
            lastUpdated: expect.any(Date)
          })
        })
      );
    });

    test('should return default stats when no logs available', async () => {
      const req = mockRequest({}, [], { id: hospital._id });
      const res = mockResponse();

      await hospitalController.getApiUsageStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.stats.totalRequests).toBe(150); // From hospital.apiAccessCount
      expect(response.stats.successRate).toBe(100); // Default when no logs
      expect(response.stats.rateLimit).toBe(1000); // Default rate limit
    });

    test('should return 404 if hospital not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = mockRequest({}, [], { id: fakeId });
      const res = mockResponse();

      await hospitalController.getApiUsageStats(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('getRecentApiRequests', () => {
    let hospital;

    beforeEach(async () => {
      hospital = new Hospital({
        name: 'Dr. John Smith',
        email: 'requests@hospital.com',
        password: 'SecurePass123',
        hospitalName: 'Requests Hospital',
        registrationNumber: 'REG123456',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contactNumber: '+1234567890',
        verificationStatus: 'verified'
      });
      await hospital.save();
    });

    test('should retrieve recent API requests with default pagination', async () => {
      const req = mockRequest({}, [], { id: hospital._id });
      const res = mockResponse();

      await hospitalController.getRecentApiRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('retrieved successfully'),
          requests: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalRequests: expect.any(Number),
            requestsPerPage: 10,
            totalPages: expect.any(Number),
            hasNextPage: expect.any(Boolean),
            hasPreviousPage: false
          })
        })
      );
    });

    test('should handle pagination parameters', async () => {
      const req = mockRequest({}, [], { id: hospital._id });
      req.query = { page: '2', limit: '5' };
      const res = mockResponse();

      await hospitalController.getRecentApiRequests(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.pagination.currentPage).toBe(2);
      expect(response.pagination.requestsPerPage).toBe(5);
    });

    test('should limit maximum requests per page', async () => {
      const req = mockRequest({}, [], { id: hospital._id });
      req.query = { limit: '100' }; // Exceeds max limit of 50
      const res = mockResponse();

      await hospitalController.getRecentApiRequests(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.pagination.requestsPerPage).toBe(50); // Should be capped at 50
    });

    test('should return 404 if hospital not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = mockRequest({}, [], { id: fakeId });
      const res = mockResponse();

      await hospitalController.getRecentApiRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return empty results when no logs available', async () => {
      const req = mockRequest({}, [], { id: hospital._id });
      const res = mockResponse();

      await hospitalController.getRecentApiRequests(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.requests).toEqual([]);
      expect(response.pagination.totalRequests).toBe(0);
    });
  });
});
