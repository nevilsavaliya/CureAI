/**
 * Admin Flow Integration Tests
 * Tests admin functionality including login and user management
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Admin = require('../../models/Admin');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const bcrypt = require('bcrypt');

describe('Admin Flow Integration Tests', () => {
  let adminToken;
  let testPatientId;
  let testDoctorId;

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

    // Create test patient
    const testPatient = await Patient.create({
      name: 'Admin Test Patient',
      email: 'admin.test.patient@patient.com',
      password: 'TestPass123!',
      dateOfBirth: '1992-05-15',
      bloodGroup: 'AB+'
    });
    testPatientId = testPatient._id;

    // Create test doctor
    const testDoctor = await Doctor.create({
      name: 'Admin Test Doctor',
      email: 'admin.test.doctor@doctor.com',
      password: 'DocPass123!',
      dateOfBirth: '1978-03-20',
      degree: 'MBBS, MS',
      speciality: 'Orthopedics',
      experienceYears: 12,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    testDoctorId = testDoctor._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /admin\.test.*@patient\.com/ });
    await Doctor.deleteMany({ email: /admin\.test.*@doctor\.com/ });
    await mongoose.connection.close();
  });

  describe('1. Admin Login', () => {
    it('should login admin with hardcoded credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@gmail.com',
          password: 'admin@123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.email).toBe('admin@gmail.com');

      adminToken = response.body.token;
    });

    it('should reject admin login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@gmail.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login for non-existent admin', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'fake.admin@gmail.com',
          password: 'admin@123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('2. Viewing Metrics from All Collections', () => {
    it('should retrieve platform metrics', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      
      // Verify all required metrics are present
      expect(response.body.metrics.totalPatients).toBeDefined();
      expect(response.body.metrics.totalDoctors).toBeDefined();
      expect(response.body.metrics.totalAdmins).toBeDefined();
      expect(response.body.metrics.totalUsers).toBeDefined();
      
      // Verify metrics are numbers
      expect(typeof response.body.metrics.totalPatients).toBe('number');
      expect(typeof response.body.metrics.totalDoctors).toBe('number');
      expect(typeof response.body.metrics.totalAdmins).toBe('number');
      
      // Verify total users calculation
      const expectedTotal = response.body.metrics.totalPatients + 
                           response.body.metrics.totalDoctors + 
                           response.body.metrics.totalAdmins;
      expect(response.body.metrics.totalUsers).toBe(expectedTotal);
    });

    it('should retrieve active users count', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.metrics.activeUsers).toBeDefined();
      expect(typeof response.body.metrics.activeUsers).toBe('number');
    });

    it('should retrieve symptom and prediction counts', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.metrics.totalSymptoms).toBeDefined();
      expect(response.body.metrics.totalPredictions).toBeDefined();
      expect(typeof response.body.metrics.totalSymptoms).toBe('number');
      expect(typeof response.body.metrics.totalPredictions).toBe('number');
    });

    it('should reject metrics access without admin token', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('3. User Management Across All Collections', () => {
    it('should retrieve all users from all collections', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      
      // Verify users have collection type
      response.body.users.forEach(user => {
        expect(user.collection).toBeDefined();
        expect(['patients', 'doctors', 'admins']).toContain(user.collection);
      });
    });

    it('should filter users by collection type - patients', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ collection: 'patients' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
      
      // All users should be from patients collection
      response.body.users.forEach(user => {
        expect(user.collection).toBe('patients');
        expect(user.bloodGroup).toBeDefined(); // Patient-specific field
      });
    });

    it('should filter users by collection type - doctors', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ collection: 'doctors' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
      
      // All users should be from doctors collection
      response.body.users.forEach(user => {
        expect(user.collection).toBe('doctors');
        expect(user.speciality).toBeDefined(); // Doctor-specific field
        expect(user.subscriptionStatus).toBeDefined();
      });
    });

    it('should filter users by collection type - admins', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ collection: 'admins' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
      
      // All users should be from admins collection
      response.body.users.forEach(user => {
        expect(user.collection).toBe('admins');
      });
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Admin Test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
      
      // Results should contain the search term
      response.body.users.forEach(user => {
        expect(user.name.toLowerCase()).toContain('admin test');
      });
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'admin.test.patient@patient.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
      
      const foundUser = response.body.users.find(
        u => u.email === 'admin.test.patient@patient.com'
      );
      expect(foundUser).toBeDefined();
    });
  });

  describe('4. View Detailed User Information', () => {
    it('should retrieve detailed patient information', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testPatientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ collection: 'patients' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user._id.toString()).toBe(testPatientId.toString());
      expect(response.body.user.bloodGroup).toBeDefined();
      expect(response.body.user.dateOfBirth).toBeDefined();
    });

    it('should retrieve detailed doctor information', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testDoctorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ collection: 'doctors' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user._id.toString()).toBe(testDoctorId.toString());
      expect(response.body.user.speciality).toBeDefined();
      expect(response.body.user.degree).toBeDefined();
      expect(response.body.user.experienceYears).toBeDefined();
      expect(response.body.user.subscriptionStatus).toBeDefined();
    });

    it('should reject user detail access without admin token', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testPatientId}`)
        .query({ collection: 'patients' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('5. Admin Role-Based Access Control', () => {
    it('should allow admin to access all admin endpoints', async () => {
      const endpoints = [
        '/api/admin/metrics',
        '/api/admin/users'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should reject non-admin access to admin endpoints', async () => {
      // Create and login as patient
      const patientLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin.test.patient@patient.com',
          password: 'TestPass123!'
        });

      const patientToken = patientLogin.body.token;

      // Try to access admin endpoint
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
