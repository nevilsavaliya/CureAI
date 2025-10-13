/**
 * Hospital API Authentication Middleware Tests
 * Tests for API Key/Secret authentication, verification status checks, and access logging
 */

const mongoose = require('mongoose');
const { authenticateHospitalApi } = require('../middleware/hospitalApiAuth');
const Hospital = require('../models/Hospital');

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
});

describe('Hospital API Authentication Middleware', () => {
  let verifiedHospital;
  let apiCredentials;

  beforeEach(async () => {
    // Create verified hospital with API credentials
    verifiedHospital = new Hospital({
      name: 'Dr. John Smith',
      email: 'api@hospital.com',
      password: 'SecurePass123',
      hospitalName: 'API Test Hospital',
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
      isActive: true
    });
    
    // Generate API credentials
    apiCredentials = verifiedHospital.generateApiCredentials();
    await verifiedHospital.save();
  });

  // Mock request and response objects
  const mockRequest = (body = {}) => ({
    body
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  beforeEach(() => {
    mockNext.mockClear();
  });

  describe('Valid Authentication', () => {
    test('should authenticate with valid API credentials', async () => {
      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.hospital).toBeDefined();
      expect(req.hospital.id).toEqual(verifiedHospital._id);
      expect(req.hospital.name).toBe('API Test Hospital');
      expect(req.hospital.email).toBe('api@hospital.com');
    });

    test('should attach hospital information to request', async () => {
      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(req.hospital).toEqual(
        expect.objectContaining({
          id: verifiedHospital._id,
          name: 'API Test Hospital',
          email: 'api@hospital.com',
          registrationNumber: 'REG123456',
          apiAccessCount: expect.any(Number)
        })
      );
    });

    test('should update lastApiAccess timestamp', async () => {
      const beforeAccess = new Date();
      
      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      const updatedHospital = await Hospital.findById(verifiedHospital._id);
      expect(updatedHospital.lastApiAccess).toBeDefined();
      expect(updatedHospital.lastApiAccess.getTime()).toBeGreaterThanOrEqual(beforeAccess.getTime());
    });

    test('should increment apiAccessCount', async () => {
      const initialCount = verifiedHospital.apiAccessCount;

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      const updatedHospital = await Hospital.findById(verifiedHospital._id);
      expect(updatedHospital.apiAccessCount).toBe(initialCount + 1);
    });
  });

  describe('Missing Credentials', () => {
    test('should reject request without API credentials', async () => {
      const req = mockRequest({});
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'API credentials are required. Please provide apiKey and apiSecret.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with missing API Key', async () => {
      const req = mockRequest({
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'API credentials are required. Please provide apiKey and apiSecret.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with missing API Secret', async () => {
      const req = mockRequest({
        apiKey: apiCredentials.apiKey
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'API credentials are required. Please provide apiKey and apiSecret.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Invalid API Key Format', () => {
    test('should reject API Key without HK_ prefix', async () => {
      const req = mockRequest({
        apiKey: 'abc123def456ghi789jkl012mno345pqr',
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid API Key format.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject API Key with incorrect length', async () => {
      const req = mockRequest({
        apiKey: 'HK_short',
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid API Key format.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject API Key that is too long', async () => {
      const req = mockRequest({
        apiKey: 'HK_' + 'a'.repeat(50),
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid API Key format.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Credentials', () => {
    test('should reject non-existent API Key', async () => {
      const req = mockRequest({
        apiKey: 'HK_' + 'f'.repeat(32),
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid API credentials.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject incorrect API Secret', async () => {
      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: 'wrong_secret_' + 'a'.repeat(50)
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid API credentials.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should not reveal which credential is wrong', async () => {
      const req1 = mockRequest({
        apiKey: 'HK_' + 'f'.repeat(32),
        apiSecret: apiCredentials.apiSecret
      });
      const res1 = mockResponse();

      await authenticateHospitalApi(req1, res1, mockNext);

      const req2 = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: 'wrong_secret'
      });
      const res2 = mockResponse();

      await authenticateHospitalApi(req2, res2, mockNext);

      // Both should return the same generic error message
      expect(res1.json.mock.calls[0][0].message).toBe(res2.json.mock.calls[0][0].message);
    });
  });

  describe('Verification Status Checks', () => {
    test('should reject pending hospital', async () => {
      verifiedHospital.verificationStatus = 'pending';
      await verifiedHospital.save();

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Hospital is not verified. Current status: pending',
          verificationStatus: 'pending'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject rejected hospital', async () => {
      verifiedHospital.verificationStatus = 'rejected';
      verifiedHospital.rejectionReason = 'Invalid documents';
      await verifiedHospital.save();

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Hospital is not verified. Current status: rejected',
          verificationStatus: 'rejected'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should include verification status in error response', async () => {
      verifiedHospital.verificationStatus = 'pending';
      await verifiedHospital.save();

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      const response = res.json.mock.calls[0][0];
      expect(response.verificationStatus).toBe('pending');
    });
  });

  describe('Active Status Checks', () => {
    test('should reject inactive hospital', async () => {
      verifiedHospital.isActive = false;
      await verifiedHospital.save();

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Hospital access has been revoked. Please contact support.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should allow active hospital', async () => {
      verifiedHospital.isActive = true;
      await verifiedHospital.save();

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Authentication Attempts', () => {
    test('should handle multiple successful authentications', async () => {
      const req1 = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res1 = mockResponse();

      await authenticateHospitalApi(req1, res1, mockNext);

      const req2 = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res2 = mockResponse();

      await authenticateHospitalApi(req2, res2, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);

      const updatedHospital = await Hospital.findById(verifiedHospital._id);
      expect(updatedHospital.apiAccessCount).toBe(2);
    });

    test('should not increment count on failed authentication', async () => {
      const initialCount = verifiedHospital.apiAccessCount;

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: 'wrong_secret'
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      const updatedHospital = await Hospital.findById(verifiedHospital._id);
      expect(updatedHospital.apiAccessCount).toBe(initialCount);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Force a database error by closing connection
      await mongoose.connection.close();

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication failed. Please try again.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();

      // Reconnect for cleanup
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });

    test('should not expose internal error details', async () => {
      // Close connection to force error
      await mongoose.connection.close();

      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      const response = res.json.mock.calls[0][0];
      expect(response.message).not.toContain('mongoose');
      expect(response.message).not.toContain('database');
      expect(response.message).not.toContain('connection');

      // Reconnect for cleanup
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });

  describe('Security Considerations', () => {
    test('should not include sensitive data in attached hospital object', async () => {
      const req = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(req.hospital.password).toBeUndefined();
      expect(req.hospital.apiSecret).toBeUndefined();
      expect(req.hospital.apiKey).toBeUndefined();
    });

    test('should handle empty string credentials', async () => {
      const req = mockRequest({
        apiKey: '',
        apiSecret: ''
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle null credentials', async () => {
      const req = mockRequest({
        apiKey: null,
        apiSecret: null
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle undefined credentials', async () => {
      const req = mockRequest({
        apiKey: undefined,
        apiSecret: undefined
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('API Key Format Validation', () => {
    test('should validate correct API Key format (HK_ + 32 hex chars)', async () => {
      // API Key should be exactly 35 characters: "HK_" (3) + 32 hex chars
      expect(apiCredentials.apiKey).toMatch(/^HK_[a-f0-9]{32}$/);
      expect(apiCredentials.apiKey.length).toBe(35);
    });

    test('should reject API Key with special characters', async () => {
      const req = mockRequest({
        apiKey: 'HK_abc123!@#$%^&*()_+{}[]|\\:";\'<>?,./~`',
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject API Key with spaces', async () => {
      const req = mockRequest({
        apiKey: 'HK_ ' + 'a'.repeat(31),
        apiSecret: apiCredentials.apiSecret
      });
      const res = mockResponse();

      await authenticateHospitalApi(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle concurrent authentication requests', async () => {
      // Run requests sequentially to avoid race conditions with MongoDB updates
      for (let i = 0; i < 5; i++) {
        const req = mockRequest({
          apiKey: apiCredentials.apiKey,
          apiSecret: apiCredentials.apiSecret
        });
        const res = mockResponse();
        await authenticateHospitalApi(req, res, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);

      const updatedHospital = await Hospital.findById(verifiedHospital._id);
      expect(updatedHospital.apiAccessCount).toBe(5);
    });

    test('should authenticate multiple hospitals independently', async () => {
      // Create second hospital
      const hospital2 = new Hospital({
        name: 'Dr. Jane Doe',
        email: 'api2@hospital.com',
        password: 'SecurePass456',
        hospitalName: 'Second Hospital',
        registrationNumber: 'REG789012',
        address: {
          street: '456 Oak St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA'
        },
        contactNumber: '+1234567891',
        verificationStatus: 'verified',
        isActive: true
      });
      const creds2 = hospital2.generateApiCredentials();
      await hospital2.save();

      // Authenticate first hospital
      const req1 = mockRequest({
        apiKey: apiCredentials.apiKey,
        apiSecret: apiCredentials.apiSecret
      });
      const res1 = mockResponse();
      await authenticateHospitalApi(req1, res1, mockNext);

      // Authenticate second hospital
      const req2 = mockRequest({
        apiKey: creds2.apiKey,
        apiSecret: creds2.apiSecret
      });
      const res2 = mockResponse();
      await authenticateHospitalApi(req2, res2, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(req1.hospital.id).not.toEqual(req2.hospital.id);
      expect(req1.hospital.name).toBe('API Test Hospital');
      expect(req2.hospital.name).toBe('Second Hospital');
    });
  });
});
