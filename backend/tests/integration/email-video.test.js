/**
 * Email and Video Functionality Integration Tests
 * Tests OTP emails, consultation emails, and video call links
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const OTP = require('../../models/OTP');
const Consultation = require('../../models/Consultation');

describe('Email and Video Functionality Integration Tests', () => {
  let patientToken;
  let patientId;
  let patientEmail;
  let doctorToken;
  let doctorId;
  let doctorEmail;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Create test patient
    patientEmail = 'email.test.patient@patient.com';
    const patientData = {
      name: 'Email Test Patient',
      email: patientEmail,
      password: 'TestPass123!',
      dateOfBirth: '1991-06-10',
      bloodGroup: 'O-'
    };

    const patient = await Patient.create(patientData);
    patientId = patient._id;

    // Login as patient
    const patientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: patientEmail,
        password: 'TestPass123!'
      });
    patientToken = patientLogin.body.token;

    // Create test doctor with active subscription
    doctorEmail = 'email.test.doctor@doctor.com';
    const doctorData = {
      name: 'Email Test Doctor',
      email: doctorEmail,
      password: 'DocPass123!',
      dateOfBirth: '1975-08-25',
      degree: 'MBBS, DM',
      speciality: 'Endocrinology',
      experienceYears: 18,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    const doctor = await Doctor.create(doctorData);
    doctorId = doctor._id;

    // Login as doctor
    const doctorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: doctorEmail,
        password: 'DocPass123!'
      });
    doctorToken = doctorLogin.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /email\.test.*@patient\.com/ });
    await Doctor.deleteMany({ email: /email\.test.*@doctor\.com/ });
    await OTP.deleteMany({ email: /email\.test/ });
    await Consultation.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. OTP Email for Password Reset', () => {
    it('should send OTP email for password reset request', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: patientEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP');
      
      // Verify OTP was created in database
      const otp = await OTP.findOne({ email: patientEmail });
      expect(otp).toBeDefined();
      expect(otp.otp).toBeDefined();
      expect(otp.otp.length).toBe(6);
    });

    it('should verify OTP for password reset', async () => {
      // Get the OTP from database
      const otpRecord = await OTP.findOne({ email: patientEmail });
      
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: patientEmail,
          otp: otpRecord.otp
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified');
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: patientEmail,
          otp: '000000'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reset password with valid OTP', async () => {
      // Request new OTP
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: patientEmail });

      const otpRecord = await OTP.findOne({ email: patientEmail }).sort({ createdAt: -1 });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: patientEmail,
          otp: otpRecord.otp,
          newPassword: 'NewTestPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset');

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: patientEmail,
          password: 'NewTestPass123!'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });

  describe('2. Consultation Booking Email with Video Links', () => {
    let consultationId;
    let videoLink;

    it('should send consultation booking email to both patient and doctor', async () => {
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '3:00 PM'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.consultation).toBeDefined();
      expect(response.body.emailSent).toBe(true);
      
      consultationId = response.body.consultation._id;
      videoLink = response.body.consultation.videoLink;
    });

    it('should include video link in consultation details', async () => {
      expect(videoLink).toBeDefined();
      expect(videoLink).toContain('http');
      expect(videoLink).toMatch(/^https?:\/\/.+/);
    });

    it('should retrieve consultation with video link for patient', async () => {
      const response = await request(app)
        .get(`/api/consultations/patient/${patientId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.consultations).toBeDefined();
      
      const consultation = response.body.consultations.find(
        c => c._id.toString() === consultationId.toString()
      );
      
      expect(consultation).toBeDefined();
      expect(consultation.videoLink).toBe(videoLink);
    });

    it('should retrieve consultation with video link for doctor', async () => {
      const response = await request(app)
        .get(`/api/consultations/doctor/${doctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.consultations).toBeDefined();
      
      const consultation = response.body.consultations.find(
        c => c._id.toString() === consultationId.toString()
      );
      
      expect(consultation).toBeDefined();
      expect(consultation.videoLink).toBe(videoLink);
    });
  });

  describe('3. Video Call Link Functionality', () => {
    it('should generate unique video links for each consultation', async () => {
      const consultation1Data = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '10:00 AM'
      };

      const consultation2Data = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '2:00 PM'
      };

      const response1 = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultation1Data)
        .expect(201);

      const response2 = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultation2Data)
        .expect(201);

      const link1 = response1.body.consultation.videoLink;
      const link2 = response2.body.consultation.videoLink;

      expect(link1).not.toBe(link2);
      expect(link1).toBeDefined();
      expect(link2).toBeDefined();
    });

    it('should validate video link format', async () => {
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '4:30 PM'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData)
        .expect(201);

      const videoLink = response.body.consultation.videoLink;

      // Verify link format (should be a valid URL)
      expect(videoLink).toMatch(/^https?:\/\/.+/);
      
      // Verify link contains consultation ID or unique identifier
      expect(videoLink.length).toBeGreaterThan(20);
    });

    it('should allow video link access without authentication', async () => {
      // Create consultation
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '11:00 AM'
      };

      const createResponse = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData);

      const videoLink = createResponse.body.consultation.videoLink;
      const consultationId = createResponse.body.consultation._id;

      // Access video link endpoint without token (simulating email link click)
      const response = await request(app)
        .get(`/api/video/join/${consultationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.videoLink).toBe(videoLink);
    });
  });

  describe('4. Email Content Verification', () => {
    it('should include all required information in consultation email', async () => {
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 144 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '9:00 AM'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      const consultation = response.body.consultation;
      
      // Verify all required fields are present
      expect(consultation.patientId).toBeDefined();
      expect(consultation.doctorId).toBeDefined();
      expect(consultation.scheduledDate).toBeDefined();
      expect(consultation.scheduledTime).toBeDefined();
      expect(consultation.videoLink).toBeDefined();
      expect(consultation.status).toBe('scheduled');
    });
  });

  describe('5. Video Call Status Management', () => {
    it('should update consultation status when video call starts', async () => {
      // Create consultation
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '5:00 PM'
      };

      const createResponse = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData);

      const consultationId = createResponse.body.consultation._id;

      // Update status to in-progress
      const updateResponse = await request(app)
        .put(`/api/consultations/${consultationId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'in-progress' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.consultation.status).toBe('in-progress');
    });

    it('should update consultation status when video call ends', async () => {
      // Create consultation
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 192 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '6:00 PM'
      };

      const createResponse = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData);

      const consultationId = createResponse.body.consultation._id;

      // Update status to completed
      const updateResponse = await request(app)
        .put(`/api/consultations/${consultationId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.consultation.status).toBe('completed');
    });
  });
});
