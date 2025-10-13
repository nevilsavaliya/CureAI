/**
 * Hospital Flow Integration Tests
 * Tests the complete hospital journey from registration to patient data access
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const Hospital = require('../../models/Hospital');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Admin = require('../../models/Admin');
const Case = require('../../models/Case');
const bcrypt = require('bcrypt');

describe('Hospital Flow Integration Tests', () => {
  let adminToken;
  let hospitalId;
  let hospitalToken;
  let hospitalApiKey;
  let hospitalApiSecret;
  let testPatientId;
  let testPatientEmail;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Ensure admin user exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin@123', 10);
      await Admin.create({
        name: 'System Admin',
        email: 'admin@gmail.com',
        password: hashedPassword
      });
    }

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@gmail.com',
        password: 'admin@123'
      });
    adminToken = adminLogin.body.token;

    // Create test doctor for cases
    const testDoctor = await Doctor.create({
      name: 'Hospital Test Doctor',
      email: 'hospital.test.doctor@doctor.com',
      password: 'DocPass123!',
      dateOfBirth: '1980-01-01',
      degree: 'MBBS, MD',
      speciality: 'General Medicine',
      specializations: ['General Medicine', 'Internal Medicine'],
      experienceYears: 10,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Create test patient with comprehensive medical data
    const testPatient = await Patient.create({
      name: 'Hospital Test Patient',
      email: 'hospital.test.patient@patient.com',
      password: 'TestPass123!',
      dateOfBirth: '1985-06-15',
      bloodGroup: 'A+',
      allergies: ['Penicillin', 'Peanuts'],
      emergencyContact: {
        name: 'Emergency Contact Person',
        relationship: 'Spouse',
        phone: '+1234567890'
      },
      chronicConditions: [{
        condition: 'Diabetes Type 2',
        diagnosedDate: new Date('2020-01-15'),
        notes: 'Controlled with medication'
      }],
      currentMedications: [{
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        startDate: new Date('2020-01-15'),
        prescribedBy: 'Dr. Smith'
      }],
      pastSurgeries: [{
        surgery: 'Appendectomy',
        date: new Date('2015-03-20'),
        hospital: 'General Hospital',
        notes: 'Routine procedure'
      }]
    });
    testPatientId = testPatient._id;
    testPatientEmail = testPatient.email;

    // Create a test case for the patient
    await Case.create({
      patientId: testPatientId,
      doctorId: testDoctor._id,
      symptoms: ['Fever', 'Headache'],
      status: 'pending',
      createdAt: new Date()
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Hospital.deleteMany({ email: /hospital\.test.*@hospital\.com/ });
    await Patient.deleteMany({ email: 'hospital.test.patient@patient.com' });
    await Doctor.deleteMany({ email: 'hospital.test.doctor@doctor.com' });
    await Case.deleteMany({ patientId: testPatientId });
    await mongoose.connection.close();
  });

  describe('1. Hospital Registration', () => {
    it('should register a new hospital with all required fields', async () => {
      const hospitalData = {
        name: 'Hospital Test Admin',
        email: 'hospital.test@hospital.com',
        password: 'HospitalPass123!',
        confirmPassword: 'HospitalPass123!',
        hospitalName: 'Test City Hospital',
        registrationNumber: 'REG-TEST-12345',
        address: {
          street: '123 Medical Center Drive',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contactNumber: '+1234567890',
        emergencyContact: '+1234567891',
        website: 'https://testcityhospital.com',
        specializations: ['Cardiology', 'Neurology', 'Emergency Medicine'],
        numberOfBeds: 200,
        facilities: ['ICU', 'Emergency Room', 'Operating Theater', 'Laboratory']
      };

      const response = await request(app)
        .post('/api/hospitals/register')
        .send(hospitalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital).toBeDefined();
      expect(response.body.hospital.email).toBe(hospitalData.email);
      expect(response.body.hospital.hospitalName).toBe(hospitalData.hospitalName);
      expect(response.body.hospital.verificationStatus).toBe('pending');
      expect(response.body.hospital.apiKey).toBeUndefined(); // No API key yet
      expect(response.body.hospital.apiSecret).toBeUndefined();

      hospitalId = response.body.hospital._id;
    });

    it('should reject hospital registration with duplicate email', async () => {
      const hospitalData = {
        name: 'Another Admin',
        email: 'hospital.test@hospital.com', // Duplicate
        password: 'HospitalPass123!',
        confirmPassword: 'HospitalPass123!',
        hospitalName: 'Another Hospital',
        registrationNumber: 'REG-TEST-67890',
        address: {
          street: '456 Medical Drive',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contactNumber: '+1234567892',
        emergencyContact: '+1234567893',
        specializations: ['General Medicine'],
        numberOfBeds: 100,
        facilities: ['Emergency Room']
      };

      const response = await request(app)
        .post('/api/hospitals/register')
        .send(hospitalData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject hospital registration with duplicate registration number', async () => {
      const hospitalData = {
        name: 'Third Admin',
        email: 'hospital.test3@hospital.com',
        password: 'HospitalPass123!',
        confirmPassword: 'HospitalPass123!',
        hospitalName: 'Third Hospital',
        registrationNumber: 'REG-TEST-12345', // Duplicate
        address: {
          street: '789 Medical Drive',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contactNumber: '+1234567894',
        emergencyContact: '+1234567895',
        specializations: ['Pediatrics'],
        numberOfBeds: 150,
        facilities: ['Pediatric Ward']
      };

      const response = await request(app)
        .post('/api/hospitals/register')
        .send(hospitalData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject hospital registration with mismatched passwords', async () => {
      const hospitalData = {
        name: 'Fourth Admin',
        email: 'hospital.test4@hospital.com',
        password: 'HospitalPass123!',
        confirmPassword: 'DifferentPass123!',
        hospitalName: 'Fourth Hospital',
        registrationNumber: 'REG-TEST-11111',
        address: {
          street: '101 Medical Drive',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contactNumber: '+1234567896',
        emergencyContact: '+1234567897',
        specializations: ['Orthopedics'],
        numberOfBeds: 120,
        facilities: ['Orthopedic Ward']
      };

      const response = await request(app)
        .post('/api/hospitals/register')
        .send(hospitalData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('2. Hospital Login - Pending Status', () => {
    it('should allow login but indicate pending verification status', async () => {
      const response = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'hospital.test@hospital.com',
          password: 'HospitalPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.hospital.verificationStatus).toBe('pending');
      expect(response.body.message).toContain('pending verification');

      hospitalToken = response.body.token;
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'hospital.test@hospital.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login for non-existent hospital', async () => {
      const response = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'nonexistent@hospital.com',
          password: 'SomePassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('3. Admin Views Pending Hospitals', () => {
    it('should retrieve all hospitals including pending ones', async () => {
      const response = await request(app)
        .get('/api/admin/hospitals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospitals).toBeDefined();
      expect(Array.isArray(response.body.hospitals)).toBe(true);

      const pendingHospital = response.body.hospitals.find(
        h => h._id.toString() === hospitalId.toString()
      );
      expect(pendingHospital).toBeDefined();
      expect(pendingHospital.verificationStatus).toBe('pending');
    });

    it('should filter hospitals by pending status', async () => {
      const response = await request(app)
        .get('/api/admin/hospitals')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.hospitals)).toBe(true);

      // All hospitals should have pending status
      response.body.hospitals.forEach(hospital => {
        expect(hospital.verificationStatus).toBe('pending');
      });
    });

    it('should retrieve specific hospital details', async () => {
      const response = await request(app)
        .get(`/api/admin/hospitals/${hospitalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital).toBeDefined();
      expect(response.body.hospital._id.toString()).toBe(hospitalId.toString());
      expect(response.body.hospital.hospitalName).toBe('Test City Hospital');
      expect(response.body.hospital.registrationNumber).toBe('REG-TEST-12345');
    });

    it('should reject hospital list access without admin token', async () => {
      const response = await request(app)
        .get('/api/admin/hospitals')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('4. Admin Verifies Hospital', () => {
    it('should verify hospital and generate API credentials', async () => {
      const response = await request(app)
        .put(`/api/admin/hospitals/${hospitalId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital).toBeDefined();
      expect(response.body.hospital.verificationStatus).toBe('verified');
      expect(response.body.hospital.apiKey).toBeDefined();
      expect(response.body.hospital.apiKey).toMatch(/^HK_[a-f0-9]{32}$/);
      expect(response.body.hospital.verifiedAt).toBeDefined();
      expect(response.body.hospital.verifiedBy).toBeDefined();

      // Store credentials for later tests
      hospitalApiKey = response.body.hospital.apiKey;
      // Note: apiSecret is not returned in response for security
    });

    it('should retrieve API secret after verification', async () => {
      // Get the hospital from database to retrieve the hashed secret
      const hospital = await Hospital.findById(hospitalId);
      expect(hospital.apiSecret).toBeDefined();
      hospitalApiSecret = hospital.apiSecret; // This is hashed, but we'll use the plain one from email
    });

    it('should not verify already verified hospital', async () => {
      const response = await request(app)
        .put(`/api/admin/hospitals/${hospitalId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already verified');
    });
  });

  describe('5. Hospital Login - Verified Status', () => {
    it('should login verified hospital successfully', async () => {
      const response = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'hospital.test@hospital.com',
          password: 'HospitalPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.hospital.verificationStatus).toBe('verified');
      expect(response.body.hospital.apiKey).toBeDefined();

      hospitalToken = response.body.token;
    });

    it('should access hospital profile', async () => {
      const response = await request(app)
        .get('/api/hospitals/profile')
        .set('Authorization', `Bearer ${hospitalToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital).toBeDefined();
      expect(response.body.hospital.verificationStatus).toBe('verified');
      expect(response.body.hospital.apiKey).toBeDefined();
    });
  });

  describe('6. Hospital API Access - Patient Data Retrieval', () => {
    it('should access patient data with valid API credentials', async () => {
      // For testing, we need to use the plain API secret
      // In real scenario, this would be sent from the email
      const hospital = await Hospital.findById(hospitalId);
      
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: hospitalApiKey,
          apiSecret: hospital.apiSecret, // Using the stored secret for testing
          patientEmail: testPatientEmail
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.patient).toBeDefined();
      expect(response.body.patient.name).toBe('Hospital Test Patient');
      expect(response.body.patient.bloodGroup).toBe('A+');
      expect(response.body.patient.allergies).toEqual(['Penicillin', 'Peanuts']);
      expect(response.body.patient.emergencyContact).toBeDefined();
      expect(response.body.patient.emergencyContact.name).toBe('Emergency Contact Person');
      expect(response.body.patient.chronicConditions).toBeDefined();
      expect(response.body.patient.currentMedications).toBeDefined();
      expect(response.body.patient.pastSurgeries).toBeDefined();
      expect(response.body.accessedBy).toBeDefined();
      expect(response.body.accessedBy.hospital).toBe('Test City Hospital');
    });

    it('should reject API access with invalid API key', async () => {
      const hospital = await Hospital.findById(hospitalId);
      
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: 'HK_invalidkey123456789012345678901234',
          apiSecret: hospital.apiSecret,
          patientEmail: testPatientEmail
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid API credentials');
    });

    it('should reject API access with invalid API secret', async () => {
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: hospitalApiKey,
          apiSecret: 'invalid_secret_123456789012345678901234567890',
          patientEmail: testPatientEmail
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid API credentials');
    });

    it('should reject API access for non-existent patient', async () => {
      const hospital = await Hospital.findById(hospitalId);
      
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: hospitalApiKey,
          apiSecret: hospital.apiSecret,
          patientEmail: 'nonexistent@patient.com'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Patient not found');
    });

    it('should log API access for audit trail', async () => {
      const hospital = await Hospital.findById(hospitalId);
      
      await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: hospitalApiKey,
          apiSecret: hospital.apiSecret,
          patientEmail: testPatientEmail
        })
        .expect(200);

      // Verify that lastApiAccess was updated
      const updatedHospital = await Hospital.findById(hospitalId);
      expect(updatedHospital.lastApiAccess).toBeDefined();
      expect(updatedHospital.apiAccessCount).toBeGreaterThan(0);
    });
  });

  describe('7. Admin Rejects Hospital', () => {
    let rejectedHospitalId;

    beforeAll(async () => {
      // Create another hospital for rejection test
      const hospitalData = {
        name: 'Rejected Hospital Admin',
        email: 'hospital.test.rejected@hospital.com',
        password: 'HospitalPass123!',
        confirmPassword: 'HospitalPass123!',
        hospitalName: 'Rejected Hospital',
        registrationNumber: 'REG-TEST-99999',
        address: {
          street: '999 Medical Drive',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contactNumber: '+1234567899',
        emergencyContact: '+1234567898',
        specializations: ['General Medicine'],
        numberOfBeds: 50,
        facilities: ['Emergency Room']
      };

      const response = await request(app)
        .post('/api/hospitals/register')
        .send(hospitalData);

      rejectedHospitalId = response.body.hospital._id;
    });

    it('should reject hospital with reason', async () => {
      const response = await request(app)
        .put(`/api/admin/hospitals/${rejectedHospitalId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Invalid registration documents'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital.verificationStatus).toBe('rejected');
      expect(response.body.hospital.rejectionReason).toBe('Invalid registration documents');
    });

    it('should show rejection reason on login attempt', async () => {
      const response = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'hospital.test.rejected@hospital.com',
          password: 'HospitalPass123!'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('rejected');
      expect(response.body.rejectionReason).toBe('Invalid registration documents');
    });
  });

  describe('8. Admin Revokes Hospital Access', () => {
    it('should revoke access for verified hospital', async () => {
      const response = await request(app)
        .put(`/api/admin/hospitals/${hospitalId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital.isActive).toBe(false);
    });

    it('should reject API access for revoked hospital', async () => {
      const hospital = await Hospital.findById(hospitalId);
      
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: hospitalApiKey,
          apiSecret: hospital.apiSecret,
          patientEmail: testPatientEmail
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('revoked');
    });

    it('should still allow hospital login but show revoked status', async () => {
      const response = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'hospital.test@hospital.com',
          password: 'HospitalPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital.isActive).toBe(false);
      expect(response.body.message).toContain('revoked');
    });
  });

  describe('9. Hospital Profile Management', () => {
    beforeAll(async () => {
      // Reactivate hospital for profile tests
      await Hospital.findByIdAndUpdate(hospitalId, { isActive: true });
      
      // Re-login to get fresh token
      const loginResponse = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'hospital.test@hospital.com',
          password: 'HospitalPass123!'
        });
      hospitalToken = loginResponse.body.token;
    });

    it('should update hospital profile', async () => {
      const updateData = {
        contactNumber: '+9876543210',
        website: 'https://newtestcityhospital.com',
        numberOfBeds: 250
      };

      const response = await request(app)
        .put('/api/hospitals/profile')
        .set('Authorization', `Bearer ${hospitalToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital.contactNumber).toBe(updateData.contactNumber);
      expect(response.body.hospital.website).toBe(updateData.website);
      expect(response.body.hospital.numberOfBeds).toBe(updateData.numberOfBeds);
    });

    it('should not allow updating email', async () => {
      const response = await request(app)
        .put('/api/hospitals/profile')
        .set('Authorization', `Bearer ${hospitalToken}`)
        .send({
          email: 'newemail@hospital.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not allow updating API credentials', async () => {
      const response = await request(app)
        .put('/api/hospitals/profile')
        .set('Authorization', `Bearer ${hospitalToken}`)
        .send({
          apiKey: 'HK_hackedkey12345678901234567890123',
          apiSecret: 'hacked_secret'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('10. Complete Hospital Flow - End to End', () => {
    it('should complete full hospital lifecycle', async () => {
      // 1. Register new hospital
      const registrationResponse = await request(app)
        .post('/api/hospitals/register')
        .send({
          name: 'E2E Test Hospital Admin',
          email: 'hospital.test.e2e@hospital.com',
          password: 'HospitalPass123!',
          confirmPassword: 'HospitalPass123!',
          hospitalName: 'E2E Test Hospital',
          registrationNumber: 'REG-TEST-E2E-001',
          address: {
            street: '111 E2E Medical Drive',
            city: 'E2E City',
            state: 'E2E State',
            zipCode: '11111',
            country: 'E2E Country'
          },
          contactNumber: '+1111111111',
          emergencyContact: '+1111111112',
          specializations: ['Emergency Medicine'],
          numberOfBeds: 100,
          facilities: ['Emergency Room', 'ICU']
        })
        .expect(201);

      const e2eHospitalId = registrationResponse.body.hospital._id;
      expect(registrationResponse.body.hospital.verificationStatus).toBe('pending');

      // 2. Admin verifies hospital
      const verificationResponse = await request(app)
        .put(`/api/admin/hospitals/${e2eHospitalId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(verificationResponse.body.hospital.verificationStatus).toBe('verified');
      const e2eApiKey = verificationResponse.body.hospital.apiKey;

      // 3. Hospital logs in
      const loginResponse = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'hospital.test.e2e@hospital.com',
          password: 'HospitalPass123!'
        })
        .expect(200);

      expect(loginResponse.body.hospital.verificationStatus).toBe('verified');
      expect(loginResponse.body.hospital.apiKey).toBe(e2eApiKey);

      // 4. Hospital accesses patient data
      const e2eHospital = await Hospital.findById(e2eHospitalId);
      const dataAccessResponse = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: e2eApiKey,
          apiSecret: e2eHospital.apiSecret,
          patientEmail: testPatientEmail
        })
        .expect(200);

      expect(dataAccessResponse.body.patient).toBeDefined();
      expect(dataAccessResponse.body.patient.name).toBe('Hospital Test Patient');

      // 5. Verify access was logged
      const updatedE2EHospital = await Hospital.findById(e2eHospitalId);
      expect(updatedE2EHospital.apiAccessCount).toBeGreaterThan(0);
      expect(updatedE2EHospital.lastApiAccess).toBeDefined();

      // Clean up
      await Hospital.findByIdAndDelete(e2eHospitalId);
    });
  });
});
