/**
 * Hospital Model Unit Tests
 * Tests for Hospital model validation, password hashing, API credentials, and methods
 */

const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const bcrypt = require('bcrypt');

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

describe('Hospital Model', () => {
  const validHospitalData = {
    name: 'Dr. John Smith',
    email: 'contact@cityhospital.com',
    password: 'SecurePass123',
    hospitalName: 'City Hospital',
    registrationNumber: 'REG123456',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    contactNumber: '+1234567890',
    emergencyContact: '+1234567891',
    website: 'https://cityhospital.com',
    specializations: ['Cardiology', 'Neurology'],
    numberOfBeds: 200,
    facilities: ['ICU', 'Emergency', 'Surgery']
  };

  describe('Schema Validation', () => {
    test('should create hospital with valid data', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital._id).toBeDefined();
      expect(savedHospital.name).toBe(validHospitalData.name);
      expect(savedHospital.email).toBe(validHospitalData.email.toLowerCase());
      expect(savedHospital.hospitalName).toBe(validHospitalData.hospitalName);
      expect(savedHospital.registrationNumber).toBe(validHospitalData.registrationNumber);
      expect(savedHospital.verificationStatus).toBe('pending');
      expect(savedHospital.isActive).toBe(true);
      expect(savedHospital.apiAccessCount).toBe(0);
    });

    test('should fail without required name', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.name;
      
      const hospital = new Hospital(hospitalData);
      
      await expect(hospital.save()).rejects.toThrow();
    });

    test('should fail without required email', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.email;
      
      const hospital = new Hospital(hospitalData);
      
      await expect(hospital.save()).rejects.toThrow();
    });

    test('should fail without required password', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.password;
      
      const hospital = new Hospital(hospitalData);
      
      await expect(hospital.save()).rejects.toThrow();
    });

    test('should fail without required hospitalName', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.hospitalName;
      
      const hospital = new Hospital(hospitalData);
      
      await expect(hospital.save()).rejects.toThrow();
    });

    test('should fail without required registrationNumber', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.registrationNumber;
      
      const hospital = new Hospital(hospitalData);
      
      await expect(hospital.save()).rejects.toThrow();
    });

    test('should fail without required contactNumber', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.contactNumber;
      
      const hospital = new Hospital(hospitalData);
      
      await expect(hospital.save()).rejects.toThrow();
    });

    test('should convert email to lowercase', async () => {
      const hospitalData = {
        ...validHospitalData,
        email: 'UPPERCASE@HOSPITAL.COM'
      };
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.email).toBe('uppercase@hospital.com');
    });

    test('should trim whitespace from name and email', async () => {
      const hospitalData = {
        ...validHospitalData,
        name: '  Dr. John Smith  ',
        email: '  test@hospital.com  '
      };
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.name).toBe('Dr. John Smith');
      expect(savedHospital.email).toBe('test@hospital.com');
    });

    test('should enforce unique email constraint', async () => {
      const hospital1 = new Hospital(validHospitalData);
      await hospital1.save();
      
      const hospital2 = new Hospital({
        ...validHospitalData,
        registrationNumber: 'REG999999'
      });
      
      await expect(hospital2.save()).rejects.toThrow();
    });

    test('should enforce unique registrationNumber constraint', async () => {
      const hospital1 = new Hospital(validHospitalData);
      await hospital1.save();
      
      const hospital2 = new Hospital({
        ...validHospitalData,
        email: 'different@hospital.com'
      });
      
      await expect(hospital2.save()).rejects.toThrow();
    });

    test('should only accept valid verificationStatus values', async () => {
      const hospitalData = {
        ...validHospitalData,
        verificationStatus: 'invalid-status'
      };
      
      const hospital = new Hospital(hospitalData);
      
      await expect(hospital.save()).rejects.toThrow();
    });

    test('should accept pending verificationStatus', async () => {
      const hospitalData = {
        ...validHospitalData,
        verificationStatus: 'pending'
      };
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.verificationStatus).toBe('pending');
    });

    test('should accept verified verificationStatus', async () => {
      const hospitalData = {
        ...validHospitalData,
        verificationStatus: 'verified'
      };
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.verificationStatus).toBe('verified');
    });

    test('should accept rejected verificationStatus', async () => {
      const hospitalData = {
        ...validHospitalData,
        verificationStatus: 'rejected'
      };
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.verificationStatus).toBe('rejected');
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.password).not.toBe(validHospitalData.password);
      expect(savedHospital.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    test('should not rehash password if not modified', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      const firstHash = savedHospital.password;
      
      savedHospital.hospitalName = 'Updated Hospital Name';
      await savedHospital.save();
      
      expect(savedHospital.password).toBe(firstHash);
    });

    test('should rehash password when modified', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      const firstHash = savedHospital.password;
      
      savedHospital.password = 'NewPassword123';
      await savedHospital.save();
      
      expect(savedHospital.password).not.toBe(firstHash);
      expect(savedHospital.password).toMatch(/^\$2[aby]\$.{56}$/);
    });
  });

  describe('comparePassword Method', () => {
    test('should return true for correct password', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      const isMatch = await savedHospital.comparePassword(validHospitalData.password);
      
      expect(isMatch).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      const isMatch = await savedHospital.comparePassword('WrongPassword');
      
      expect(isMatch).toBe(false);
    });

    test('should be case sensitive', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      const isMatch = await savedHospital.comparePassword('securepass123');
      
      expect(isMatch).toBe(false);
    });
  });

  describe('generateApiCredentials Method', () => {
    test('should generate API key and secret', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      const credentials = savedHospital.generateApiCredentials();
      
      expect(credentials).toHaveProperty('apiKey');
      expect(credentials).toHaveProperty('apiSecret');
      expect(credentials.apiKey).toMatch(/^HK_[a-f0-9]{32}$/);
      expect(credentials.apiSecret).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should set apiKey on hospital instance', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      savedHospital.generateApiCredentials();
      
      expect(savedHospital.apiKey).toMatch(/^HK_[a-f0-9]{32}$/);
    });

    test('should set apiSecret on hospital instance', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      savedHospital.generateApiCredentials();
      
      expect(savedHospital.apiSecret).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should set apiKeyGeneratedAt timestamp', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      const beforeTime = new Date();
      savedHospital.generateApiCredentials();
      const afterTime = new Date();
      
      expect(savedHospital.apiKeyGeneratedAt).toBeDefined();
      expect(savedHospital.apiKeyGeneratedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(savedHospital.apiKeyGeneratedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test('should generate unique API keys for different hospitals', async () => {
      const hospital1 = new Hospital(validHospitalData);
      const savedHospital1 = await hospital1.save();
      
      const hospital2 = new Hospital({
        ...validHospitalData,
        email: 'different@hospital.com',
        registrationNumber: 'REG999999'
      });
      const savedHospital2 = await hospital2.save();
      
      const credentials1 = savedHospital1.generateApiCredentials();
      const credentials2 = savedHospital2.generateApiCredentials();
      
      expect(credentials1.apiKey).not.toBe(credentials2.apiKey);
      expect(credentials1.apiSecret).not.toBe(credentials2.apiSecret);
    });

    test('should persist credentials after save', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      const credentials = savedHospital.generateApiCredentials();
      await savedHospital.save();
      
      const foundHospital = await Hospital.findById(savedHospital._id);
      
      expect(foundHospital.apiKey).toBe(credentials.apiKey);
      expect(foundHospital.apiSecret).toBe(credentials.apiSecret);
    });
  });

  describe('updateLastLogin Method', () => {
    test('should update lastLogin timestamp', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.lastLogin).toBeUndefined();
      
      await savedHospital.updateLastLogin();
      
      expect(savedHospital.lastLogin).toBeDefined();
      expect(savedHospital.lastLogin).toBeInstanceOf(Date);
    });

    test('should update lastLogin to current time', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      const beforeTime = new Date();
      await savedHospital.updateLastLogin();
      const afterTime = new Date();
      
      expect(savedHospital.lastLogin.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(savedHospital.lastLogin.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test('should persist lastLogin after update', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      await savedHospital.updateLastLogin();
      const loginTime = savedHospital.lastLogin;
      
      const foundHospital = await Hospital.findById(savedHospital._id);
      
      expect(foundHospital.lastLogin).toBeDefined();
      expect(foundHospital.lastLogin.getTime()).toBe(loginTime.getTime());
    });
  });

  describe('Timestamps', () => {
    test('should automatically add createdAt timestamp', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.createdAt).toBeDefined();
      expect(savedHospital.createdAt).toBeInstanceOf(Date);
    });

    test('should automatically add updatedAt timestamp', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.updatedAt).toBeDefined();
      expect(savedHospital.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when document is modified', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      const originalUpdatedAt = savedHospital.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      savedHospital.hospitalName = 'Updated Hospital Name';
      await savedHospital.save();
      
      expect(savedHospital.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Default Values', () => {
    test('should set default verificationStatus to pending', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.verificationStatus;
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.verificationStatus).toBe('pending');
    });

    test('should set default isActive to true', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.isActive).toBe(true);
    });

    test('should set default apiAccessCount to 0', async () => {
      const hospital = new Hospital(validHospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.apiAccessCount).toBe(0);
    });
  });

  describe('Optional Fields', () => {
    test('should save without optional website', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.website;
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.website).toBeUndefined();
    });

    test('should save without optional emergencyContact', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.emergencyContact;
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.emergencyContact).toBeUndefined();
    });

    test('should save without optional specializations', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.specializations;
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.specializations).toEqual([]);
    });

    test('should save without optional facilities', async () => {
      const hospitalData = { ...validHospitalData };
      delete hospitalData.facilities;
      
      const hospital = new Hospital(hospitalData);
      const savedHospital = await hospital.save();
      
      expect(savedHospital.facilities).toEqual([]);
    });
  });
});
