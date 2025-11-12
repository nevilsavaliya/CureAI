/**
 * Doctor Flow Integration Tests
 * Tests the complete doctor journey from signup to consultation
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const Message = require('../../models/Message');
const Consultation = require('../../models/Consultation');

describe('Doctor Flow Integration Tests', () => {
  let doctorToken;
  let doctorId;
  let patientId;
  let patientToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Create a test patient for doctor interactions
    const patientData = {
      name: 'Test Patient for Doctor',
      email: 'test.patient.doctor@patient.com',
      password: 'PatientPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'B+'
    };

    const patient = await Patient.create(patientData);
    patientId = patient._id;

    // Login as patient
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: patientData.email,
        password: patientData.password
      });
    
    patientToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await Doctor.deleteMany({ email: /test.*@doctor\.com/ });
    await Patient.deleteMany({ email: /test.*@patient\.com/ });
    await Message.deleteMany({});
    await Consultation.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Doctor Signup', () => {
    it('should register a new doctor with all required fields', async () => {
      const doctorData = {
        name: 'Test Doctor Flow',
        email: 'test.flow@doctor.com',
        password: 'DocPass123!',
        confirmPassword: 'DocPass123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS, MD',
        speciality: 'Cardiology',
        experienceYears: 15
      };

      const response = await request(app)
        .post('/api/auth/signup/doctor')
        .send(doctorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(doctorData.email);
      expect(response.body.token).toBeDefined();

      doctorToken = response.body.token;
      doctorId = response.body.user.id;

      // Verify subscription status is pending
      const doctor = await Doctor.findById(doctorId);
      expect(doctor.subscriptionStatus).toBe('pending');
    });

    it('should reject doctor signup with missing speciality', async () => {
      const doctorData = {
        name: 'Test Doctor 2',
        email: 'test.doctor2@doctor.com',
        password: 'DocPass123!',
        confirmPassword: 'DocPass123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        experienceYears: 10
        // Missing speciality
      };

      const response = await request(app)
        .post('/api/auth/signup/doctor')
        .send(doctorData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('2. Mandatory Subscription Payment Flow', () => {
    it('should create subscription payment order', async () => {
      const response = await request(app)
        .post('/api/subscriptions/create-order')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.amount).toBe(3000); // 30 Rs in paise
    });

    it('should verify and activate subscription after payment', async () => {
      // Simulate payment verification
      const paymentData = {
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'signature_test_123'
      };

      const response = await request(app)
        .post('/api/subscriptions/verify')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toBeDefined();

      // Verify subscription status is now active
      const doctor = await Doctor.findById(doctorId);
      expect(doctor.subscriptionStatus).toBe('active');
      expect(doctor.subscriptionStartDate).toBeDefined();
      expect(doctor.subscriptionExpiryDate).toBeDefined();
    });
  });

  describe('3. Subscription Guard Blocking Dashboard Access', () => {
    it('should block dashboard access for doctors with pending subscription', async () => {
      // Create doctor with pending subscription
      const pendingDoctor = await Doctor.create({
        name: 'Pending Subscription Doctor',
        email: 'pending.sub@doctor.com',
        password: 'DocPass123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        speciality: 'Neurology',
        experienceYears: 8,
        subscriptionStatus: 'pending'
      });

      // Login as pending doctor
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'pending.sub@doctor.com',
          password: 'DocPass123!'
        });

      const pendingToken = loginResponse.body.token;

      // Try to access doctor dashboard endpoints
      const response = await request(app)
        .get(`/api/patients/records/${pendingDoctor._id}`)
        .set('Authorization', `Bearer ${pendingToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('subscription');

      // Clean up
      await Doctor.findByIdAndDelete(pendingDoctor._id);
    });
  });

  describe('4. Doctor Dashboard Access After Payment', () => {
    it('should access doctor dashboard with active subscription', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user.role).toBe('doctor');
    });

    it('should retrieve doctor profile information', async () => {
      const response = await request(app)
        .get(`/api/doctors/profile/${doctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.doctor).toBeDefined();
      expect(response.body.doctor.subscriptionStatus).toBe('active');
    });
  });

  describe('5. Viewing Patient Messages', () => {
    beforeAll(async () => {
      // Patient sends message to doctor
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          recipientId: doctorId,
          content: 'Hello Doctor, I need help with my symptoms'
        });
    });

    it('should retrieve messages from patients', async () => {
      const response = await request(app)
        .get(`/api/messages/${doctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.length).toBeGreaterThan(0);

      const patientMessage = response.body.messages.find(
        m => m.senderId.toString() === patientId.toString()
      );
      expect(patientMessage).toBeDefined();
    });

    it('should retrieve patient list after messaging', async () => {
      const response = await request(app)
        .get(`/api/patients/records/${doctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.patients).toBeDefined();
      expect(Array.isArray(response.body.patients)).toBe(true);
    });
  });

  describe('6. Booking Consultations', () => {
    let consultationId;

    it('should book consultation with patient', async () => {
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '2:00 PM'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.consultation).toBeDefined();
      expect(response.body.consultation.patientId).toBe(patientId.toString());
      expect(response.body.consultation.doctorId).toBe(doctorId.toString());
      
      consultationId = response.body.consultation._id;
    });

    it('should retrieve upcoming consultations', async () => {
      const response = await request(app)
        .get(`/api/consultations/doctor/${doctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.consultations).toBeDefined();
      expect(Array.isArray(response.body.consultations)).toBe(true);
      
      const consultation = response.body.consultations.find(
        c => c._id.toString() === consultationId.toString()
      );
      
      expect(consultation).toBeDefined();
      expect(consultation.status).toBe('scheduled');
    });
  });

  describe('7. Video Call Link Generation and Email Sending', () => {
    it('should generate video call link for consultation', async () => {
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '4:00 PM'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.consultation.videoLink).toBeDefined();
      expect(response.body.consultation.videoLink).toContain('http');
      
      // Verify video link format
      const videoLink = response.body.consultation.videoLink;
      expect(videoLink).toMatch(/^https?:\/\/.+/);
    });

    it('should send consultation emails to both patient and doctor', async () => {
      // This test verifies the email service is called
      // In a real scenario, you'd mock the email service or check email logs
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '11:00 AM'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.emailSent).toBe(true);
    });
  });
});
