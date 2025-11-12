/**
 * Patient Flow Integration Tests
 * Tests the complete patient journey from signup to consultation
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Symptom = require('../../models/Symptom');
const Prediction = require('../../models/Prediction');
const Message = require('../../models/Message');
const Consultation = require('../../models/Consultation');

describe('Patient Flow Integration Tests', () => {
  let patientToken;
  let patientId;
  let doctorId;
  let doctorToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /test.*@patient\.com/ });
    await Doctor.deleteMany({ email: /test.*@doctor\.com/ });
    await Symptom.deleteMany({});
    await Prediction.deleteMany({});
    await Message.deleteMany({});
    await Consultation.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Patient Signup', () => {
    it('should register a new patient with all required fields', async () => {
      const patientData = {
        name: 'Test Patient',
        email: 'test.patient@patient.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        dateOfBirth: '1990-01-01',
        bloodGroup: 'O+'
      };

      const response = await request(app)
        .post('/api/auth/signup/patient')
        .send(patientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(patientData.email);
      expect(response.body.token).toBeDefined();

      patientToken = response.body.token;
      patientId = response.body.user.id;
    });

    it('should reject patient signup with missing blood group', async () => {
      const patientData = {
        name: 'Test Patient 2',
        email: 'test.patient2@patient.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        dateOfBirth: '1990-01-01'
        // Missing bloodGroup
      };

      const response = await request(app)
        .post('/api/auth/signup/patient')
        .send(patientData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject patient signup with mismatched passwords', async () => {
      const patientData = {
        name: 'Test Patient 3',
        email: 'test.patient3@patient.com',
        password: 'TestPass123!',
        confirmPassword: 'DifferentPass123!',
        dateOfBirth: '1990-01-01',
        bloodGroup: 'A+'
      };

      const response = await request(app)
        .post('/api/auth/signup/patient')
        .send(patientData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('2. Patient Login', () => {
    it('should login patient with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.patient@patient.com',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.role).toBe('patient');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.patient@patient.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('3. Patient Dashboard Access', () => {
    it('should access patient dashboard with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user.role).toBe('patient');
    });

    it('should reject dashboard access without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body.valid).toBe(false);
    });
  });

  describe('4. Chatbot Symptom Submission', () => {
    it('should submit symptoms through chatbot', async () => {
      const symptomData = {
        symptomText: 'I have fever, headache, and body pain for 3 days'
      };

      const response = await request(app)
        .post('/api/symptoms')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(symptomData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.symptom).toBeDefined();
      expect(response.body.prediction).toBeDefined();
    });

    it('should retrieve patient symptom history', async () => {
      const response = await request(app)
        .get(`/api/symptoms/patient/${patientId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.symptoms).toBeDefined();
      expect(Array.isArray(response.body.symptoms)).toBe(true);
      expect(response.body.symptoms.length).toBeGreaterThan(0);
    });
  });

  describe('5. View Registered Doctors Only', () => {
    beforeAll(async () => {
      // Create a registered doctor with active subscription
      const doctorData = {
        name: 'Test Doctor',
        email: 'test.doctor@doctor.com',
        password: 'DocPass123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS, MD',
        speciality: 'General Medicine',
        experienceYears: 10,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const doctor = await Doctor.create(doctorData);
      doctorId = doctor._id;

      // Login as doctor to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.doctor@doctor.com',
          password: 'DocPass123!'
        });
      
      doctorToken = loginResponse.body.token;
    });

    it('should retrieve only registered doctors with active subscriptions', async () => {
      const response = await request(app)
        .get('/api/doctors/match')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.doctors).toBeDefined();
      expect(Array.isArray(response.body.doctors)).toBe(true);
      
      // All doctors should have active subscription
      response.body.doctors.forEach(doctor => {
        expect(doctor.subscriptionStatus).toBe('active');
        expect(doctor.name).toBeDefined();
        expect(doctor.speciality).toBeDefined();
        expect(doctor.degree).toBeDefined();
        expect(doctor.experienceYears).toBeDefined();
      });
    });

    it('should not show doctors with pending subscriptions', async () => {
      // Create doctor with pending subscription
      const pendingDoctor = await Doctor.create({
        name: 'Pending Doctor',
        email: 'pending.doctor@doctor.com',
        password: 'DocPass123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        speciality: 'Cardiology',
        experienceYears: 5,
        subscriptionStatus: 'pending'
      });

      const response = await request(app)
        .get('/api/doctors/match')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const pendingDoctorInList = response.body.doctors.find(
        d => d._id.toString() === pendingDoctor._id.toString()
      );

      expect(pendingDoctorInList).toBeUndefined();

      // Clean up
      await Doctor.findByIdAndDelete(pendingDoctor._id);
    });
  });

  describe('6. Messaging Doctors', () => {
    it('should send message to a registered doctor', async () => {
      const messageData = {
        recipientId: doctorId,
        content: 'Hello Doctor, I need consultation regarding my symptoms'
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.content).toBe(messageData.content);
    });

    it('should retrieve message history with doctor', async () => {
      const response = await request(app)
        .get(`/api/messages/${patientId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .query({ conversationWith: doctorId })
        .expect(200);

      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.length).toBeGreaterThan(0);
    });
  });

  describe('7. Receiving Consultation Email', () => {
    let consultationId;

    it('should receive consultation booking from doctor', async () => {
      // Doctor books consultation
      const consultationData = {
        patientId: patientId,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '10:00 AM'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(consultationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.consultation).toBeDefined();
      expect(response.body.consultation.videoLink).toBeDefined();
      
      consultationId = response.body.consultation._id;
    });

    it('should retrieve consultation details with video link', async () => {
      const response = await request(app)
        .get(`/api/consultations/patient/${patientId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.consultations).toBeDefined();
      expect(Array.isArray(response.body.consultations)).toBe(true);
      
      const consultation = response.body.consultations.find(
        c => c._id.toString() === consultationId.toString()
      );
      
      expect(consultation).toBeDefined();
      expect(consultation.videoLink).toBeDefined();
      expect(consultation.status).toBe('scheduled');
    });
  });
});
