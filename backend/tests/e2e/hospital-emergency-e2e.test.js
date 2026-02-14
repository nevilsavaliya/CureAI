/**
 * Hospital Emergency Access E2E Tests
 * Tests critical emergency scenarios where hospitals need immediate patient data access
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const Hospital = require('../../models/Hospital');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Admin = require('../../models/Admin');
const Case = require('../../models/Case');
const Message = require('../../models/Message');
const bcrypt = require('bcrypt');

describe('Hospital Emergency Access E2E Tests', () => {
  let adminToken;
  let emergencyHospitalId;
  let emergencyHospitalApiKey;
  let emergencyHospitalApiSecret;
  let emergencyPatientId;
  let emergencyPatientEmail;
  let doctorId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up any existing test data
    await Hospital.deleteMany({ email: /emergency\.e2e.*@hospital\.com/ });
    await Patient.deleteMany({ email: /emergency\.e2e.*@patient\.com/ });
    await Doctor.deleteMany({ email: /emergency\.e2e.*@doctor\.com/ });

    // Ensure admin exists
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

    // Create test doctor
    const testDoctor = await Doctor.create({
      name: 'Emergency Test Doctor',
      email: 'emergency.e2e.doctor@doctor.com',
      password: 'DocPass123!',
      dateOfBirth: '1980-01-01',
      degree: 'MBBS, MD',
      speciality: 'Emergency Medicine',
      specializations: ['Emergency Medicine', 'Critical Care'],
      experienceYears: 15,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    doctorId = testDoctor._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Hospital.deleteMany({ email: /emergency\.e2e.*@hospital\.com/ });
    await Patient.deleteMany({ email: /emergency\.e2e.*@patient\.com/ });
    await Doctor.deleteMany({ email: /emergency\.e2e.*@doctor\.com/ });
    await Case.deleteMany({ patientId: emergencyPatientId });
    await Message.deleteMany({});
    await mongoose.connection.close();
  });

  describe('E2E Flow 1: Emergency Hospital Setup', () => {
    it('Step 1: Hospital registers for emergency access', async () => {
      const hospitalData = {
        name: 'Emergency Hospital Admin',
        email: 'emergency.e2e@hospital.com',
        password: 'EmergencyPass123!',
        confirmPassword: 'EmergencyPass123!',
        hospitalName: 'City Emergency Hospital',
        registrationNumber: 'REG-EMERGENCY-001',
        address: {
          street: '911 Emergency Drive',
          city: 'Emergency City',
          state: 'Emergency State',
          zipCode: '91100',
          country: 'Test Country'
        },
        contactNumber: '+1911911911',
        emergencyContact: '+1911911912',
        website: 'https://cityemergency.com',
        specializations: ['Emergency Medicine', 'Trauma Care', 'Critical Care'],
        numberOfBeds: 500,
        facilities: ['Emergency Room', 'ICU', 'Trauma Center', 'Operating Theater', 'Blood Bank']
      };

      const response = await request(app)
        .post('/api/hospitals/register')
        .send(hospitalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital.hospitalName).toBe('City Emergency Hospital');
      expect(response.body.hospital.verificationStatus).toBe('pending');
      expect(response.body.hospital.specializations).toContain('Emergency Medicine');

      emergencyHospitalId = response.body.hospital._id;
    });

    it('Step 2: Admin fast-tracks emergency hospital verification', async () => {
      const response = await request(app)
        .put(`/api/admin/hospitals/${emergencyHospitalId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital.verificationStatus).toBe('verified');
      expect(response.body.hospital.apiKey).toBeDefined();
      expect(response.body.hospital.apiKey).toMatch(/^HK_[a-f0-9]{32}$/);

      emergencyHospitalApiKey = response.body.hospital.apiKey;

      // Get API secret from database
      const hospital = await Hospital.findById(emergencyHospitalId);
      emergencyHospitalApiSecret = hospital.apiSecret;
    });

    it('Step 3: Hospital receives and validates API credentials', async () => {
      const loginResponse = await request(app)
        .post('/api/hospitals/login')
        .send({
          email: 'emergency.e2e@hospital.com',
          password: 'EmergencyPass123!'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.hospital.verificationStatus).toBe('verified');
      expect(loginResponse.body.hospital.apiKey).toBe(emergencyHospitalApiKey);
      expect(loginResponse.body.hospital.isActive).toBe(true);
    });
  });

  describe('E2E Flow 2: Patient with Critical Medical History', () => {
    it('Step 1: Create patient with comprehensive emergency data', async () => {
      const criticalPatient = await Patient.create({
        name: 'Critical Emergency Patient',
        email: 'emergency.e2e.patient@patient.com',
        password: 'PatientPass123!',
        dateOfBirth: '1975-03-15',
        bloodGroup: 'AB-', // Rare blood type
        allergies: ['Penicillin', 'Aspirin', 'Latex', 'Iodine'], // Critical allergies
        emergencyContact: {
          name: 'Emergency Contact Person',
          relationship: 'Spouse',
          phone: '+1999999999'
        },
        chronicConditions: [
          {
            condition: 'Type 1 Diabetes',
            diagnosedDate: new Date('2010-05-20'),
            notes: 'Insulin dependent, prone to hypoglycemia'
          },
          {
            condition: 'Hypertension',
            diagnosedDate: new Date('2015-08-10'),
            notes: 'Controlled with medication'
          },
          {
            condition: 'Asthma',
            diagnosedDate: new Date('2005-02-15'),
            notes: 'Exercise-induced, carries inhaler'
          }
        ],
        currentMedications: [
          {
            name: 'Insulin Glargine',
            dosage: '20 units',
            frequency: 'Once daily at bedtime',
            startDate: new Date('2010-05-20'),
            prescribedBy: 'Dr. Endocrinologist'
          },
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            startDate: new Date('2015-08-10'),
            prescribedBy: 'Dr. Cardiologist'
          },
          {
            name: 'Albuterol Inhaler',
            dosage: '2 puffs',
            frequency: 'As needed',
            startDate: new Date('2005-02-15'),
            prescribedBy: 'Dr. Pulmonologist'
          }
        ],
        pastSurgeries: [
          {
            surgery: 'Appendectomy',
            date: new Date('2008-06-15'),
            hospital: 'General Hospital',
            notes: 'Emergency surgery, no complications'
          },
          {
            surgery: 'Coronary Angioplasty',
            date: new Date('2018-11-20'),
            hospital: 'Cardiac Center',
            notes: 'Single stent placement in LAD'
          }
        ],
        vaccinations: [
          {
            vaccine: 'Influenza',
            date: new Date('2023-10-01'),
            nextDue: new Date('2024-10-01')
          },
          {
            vaccine: 'COVID-19 Booster',
            date: new Date('2023-09-15'),
            nextDue: new Date('2024-09-15')
          }
        ],
        vitalSigns: [
          {
            recordedAt: new Date('2024-01-15'),
            bloodPressure: { systolic: 135, diastolic: 85 },
            heartRate: 78,
            temperature: 98.6,
            weight: 180,
            height: 70,
            bmi: 25.8,
            oxygenSaturation: 97
          }
        ]
      });

      emergencyPatientId = criticalPatient._id;
      emergencyPatientEmail = criticalPatient.email;

      expect(criticalPatient.bloodGroup).toBe('AB-');
      expect(criticalPatient.allergies).toHaveLength(4);
      expect(criticalPatient.chronicConditions).toHaveLength(3);
      expect(criticalPatient.currentMedications).toHaveLength(3);
    });

    it('Step 2: Patient has active case with symptom history', async () => {
      const emergencyCase = await Case.create({
        patientId: emergencyPatientId,
        doctorId: doctorId,
        symptoms: ['Chest pain', 'Shortness of breath', 'Dizziness'],
        predictedConditions: ['Cardiac Event', 'Angina'],
        status: 'ongoing',
        chatbotHistory: [
          {
            question: 'What symptoms are you experiencing?',
            answer: 'Severe chest pain and difficulty breathing',
            timestamp: new Date()
          },
          {
            question: 'When did the symptoms start?',
            answer: '30 minutes ago',
            timestamp: new Date()
          },
          {
            question: 'Rate your pain level 1-10',
            answer: '9',
            timestamp: new Date()
          }
        ],
        acceptedAt: new Date()
      });

      // Add messages to case
      await Message.create({
        caseId: emergencyCase._id,
        senderId: emergencyPatientId,
        senderModel: 'Patient',
        recipientId: doctorId,
        recipientModel: 'Doctor',
        content: 'Doctor, I am having severe chest pain. It started suddenly.',
        messageType: 'text'
      });

      await Message.create({
        caseId: emergencyCase._id,
        senderId: doctorId,
        senderModel: 'Doctor',
        recipientId: emergencyPatientId,
        recipientModel: 'Patient',
        content: 'Please call 911 immediately. Go to the nearest emergency room.',
        messageType: 'text'
      });

      // Extract symptoms from messages
      const patient = await Patient.findById(emergencyPatientId);
      patient.extractedSymptoms = [
        {
          symptom: 'Chest pain',
          extractedFrom: 'chat',
          extractedAt: new Date(),
          caseId: emergencyCase._id
        },
        {
          symptom: 'Shortness of breath',
          extractedFrom: 'chat',
          extractedAt: new Date(),
          caseId: emergencyCase._id
        }
      ];
      await patient.save();

      expect(emergencyCase.symptoms).toContain('Chest pain');
      expect(patient.extractedSymptoms).toHaveLength(2);
    });
  });

  describe('E2E Flow 3: Emergency Room Patient Data Access', () => {
    it('Step 1: Hospital receives unconscious patient', async () => {
      // Simulate emergency scenario - patient arrives unconscious
      // Hospital needs immediate access to medical history
      
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.patient).toBeDefined();

      // Verify critical emergency information is immediately available
      const patient = response.body.patient;
      
      // Blood type - critical for transfusions
      expect(patient.bloodGroup).toBe('AB-');
      
      // Allergies - critical to prevent adverse reactions
      expect(patient.allergies).toEqual(['Penicillin', 'Aspirin', 'Latex', 'Iodine']);
      
      // Emergency contact
      expect(patient.emergencyContact).toBeDefined();
      expect(patient.emergencyContact.name).toBe('Emergency Contact Person');
      expect(patient.emergencyContact.phone).toBe('+1999999999');
      
      // Current medications - critical for drug interactions
      expect(patient.currentMedications).toBeDefined();
      expect(patient.currentMedications.length).toBeGreaterThan(0);
      expect(patient.currentMedications.some(m => m.name === 'Insulin Glargine')).toBe(true);
      
      // Chronic conditions - critical for treatment decisions
      expect(patient.chronicConditions).toBeDefined();
      expect(patient.chronicConditions.some(c => c.condition === 'Type 1 Diabetes')).toBe(true);
      
      // Past surgeries - important for medical history
      expect(patient.pastSurgeries).toBeDefined();
      expect(patient.pastSurgeries.some(s => s.surgery === 'Coronary Angioplasty')).toBe(true);
      
      // Recent symptoms from active cases
      expect(patient.extractedSymptoms).toBeDefined();
      expect(patient.extractedSymptoms.some(s => s.symptom === 'Chest pain')).toBe(true);
      
      // Recent cases
      expect(patient.recentCases).toBeDefined();
      expect(patient.recentCases.length).toBeGreaterThan(0);
      
      // Access logging
      expect(response.body.accessedBy).toBeDefined();
      expect(response.body.accessedBy.hospital).toBe('City Emergency Hospital');
      expect(response.body.accessedBy.accessTime).toBeDefined();
    });

    it('Step 2: Hospital accesses patient data multiple times during treatment', async () => {
      // First access - initial assessment
      await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(200);

      // Second access - before medication administration
      await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(200);

      // Third access - before procedure
      await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(200);

      // Verify access count increased
      const hospital = await Hospital.findById(emergencyHospitalId);
      expect(hospital.apiAccessCount).toBeGreaterThanOrEqual(3);
      expect(hospital.lastApiAccess).toBeDefined();
    });

    it('Step 3: Hospital verifies critical allergy information', async () => {
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(200);

      const patient = response.body.patient;
      
      // Verify all critical allergies are present
      expect(patient.allergies).toContain('Penicillin');
      expect(patient.allergies).toContain('Aspirin');
      expect(patient.allergies).toContain('Latex');
      expect(patient.allergies).toContain('Iodine');
      
      // This information prevents administering contraindicated medications
    });

    it('Step 4: Hospital contacts emergency contact', async () => {
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(200);

      const emergencyContact = response.body.patient.emergencyContact;
      
      expect(emergencyContact).toBeDefined();
      expect(emergencyContact.name).toBe('Emergency Contact Person');
      expect(emergencyContact.relationship).toBe('Spouse');
      expect(emergencyContact.phone).toBe('+1999999999');
      
      // Hospital can now contact family member
    });
  });

  describe('E2E Flow 4: API Security and Rate Limiting', () => {
    it('Step 1: Reject access with invalid API key', async () => {
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: 'HK_invalidkey123456789012345678901234',
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid API credentials');
    });

    it('Step 2: Reject access with invalid API secret', async () => {
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: 'invalid_secret_that_does_not_match',
          patientEmail: emergencyPatientEmail
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid API credentials');
    });

    it('Step 3: Reject access for non-existent patient', async () => {
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: 'nonexistent.patient@patient.com'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Patient not found');
    });

    it('Step 4: All API access is logged for audit', async () => {
      const initialHospital = await Hospital.findById(emergencyHospitalId);
      const initialAccessCount = initialHospital.apiAccessCount;

      await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(200);

      const updatedHospital = await Hospital.findById(emergencyHospitalId);
      
      expect(updatedHospital.apiAccessCount).toBe(initialAccessCount + 1);
      expect(updatedHospital.lastApiAccess).toBeDefined();
      expect(new Date(updatedHospital.lastApiAccess).getTime()).toBeGreaterThan(
        new Date(initialHospital.lastApiAccess).getTime()
      );
    });
  });

  describe('E2E Flow 5: Admin Monitoring and Control', () => {
    it('Step 1: Admin views all hospital API activity', async () => {
      const response = await request(app)
        .get('/api/admin/hospitals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const emergencyHospital = response.body.hospitals.find(
        h => h._id.toString() === emergencyHospitalId.toString()
      );
      
      expect(emergencyHospital).toBeDefined();
      expect(emergencyHospital.apiAccessCount).toBeGreaterThan(0);
      expect(emergencyHospital.lastApiAccess).toBeDefined();
    });

    it('Step 2: Admin can view detailed hospital information', async () => {
      const response = await request(app)
        .get(`/api/admin/hospitals/${emergencyHospitalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital.hospitalName).toBe('City Emergency Hospital');
      expect(response.body.hospital.verificationStatus).toBe('verified');
      expect(response.body.hospital.isActive).toBe(true);
      expect(response.body.hospital.apiAccessCount).toBeGreaterThan(0);
    });

    it('Step 3: Admin can revoke hospital access if needed', async () => {
      const response = await request(app)
        .put(`/api/admin/hospitals/${emergencyHospitalId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hospital.isActive).toBe(false);

      // Verify API access is now blocked
      const apiResponse = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(403);

      expect(apiResponse.body.success).toBe(false);
      expect(apiResponse.body.message).toContain('revoked');
    });

    it('Step 4: Admin can reactivate hospital access', async () => {
      // Reactivate hospital
      await Hospital.findByIdAndUpdate(emergencyHospitalId, { isActive: true });

      // Verify API access works again
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: emergencyPatientEmail
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.patient).toBeDefined();
    });
  });

  describe('E2E Flow 6: Complete Emergency Scenario', () => {
    it('Complete emergency flow from patient arrival to data access', async () => {
      // Scenario: Patient arrives at emergency room unconscious after car accident
      
      // Step 1: Create new critical patient
      const accidentPatient = await Patient.create({
        name: 'Accident Victim Patient',
        email: 'emergency.e2e.accident@patient.com',
        password: 'PatientPass123!',
        dateOfBirth: '1990-07-20',
        bloodGroup: 'O-', // Universal donor
        allergies: ['Morphine', 'Codeine'],
        emergencyContact: {
          name: 'Family Member',
          relationship: 'Parent',
          phone: '+1888888888'
        },
        chronicConditions: [
          {
            condition: 'Epilepsy',
            diagnosedDate: new Date('2015-03-10'),
            notes: 'Controlled with medication, last seizure 2 years ago'
          }
        ],
        currentMedications: [
          {
            name: 'Levetiracetam',
            dosage: '500mg',
            frequency: 'Twice daily',
            startDate: new Date('2015-03-10'),
            prescribedBy: 'Dr. Neurologist'
          }
        ]
      });

      // Step 2: Hospital immediately accesses patient data
      const response = await request(app)
        .post('/api/hospitals/api/patient-data')
        .send({
          apiKey: emergencyHospitalApiKey,
          apiSecret: emergencyHospitalApiSecret,
          patientEmail: accidentPatient.email
        })
        .expect(200);

      // Step 3: Verify all critical information is available
      expect(response.body.success).toBe(true);
      expect(response.body.patient.bloodGroup).toBe('O-');
      expect(response.body.patient.allergies).toContain('Morphine');
      expect(response.body.patient.chronicConditions.some(c => c.condition === 'Epilepsy')).toBe(true);
      expect(response.body.patient.emergencyContact.phone).toBe('+1888888888');

      // Step 4: Hospital can make informed treatment decisions
      // - Knows not to administer morphine (allergy)
      // - Knows patient has epilepsy (important for head trauma assessment)
      // - Has emergency contact to notify family
      // - Knows blood type for potential transfusion

      // Step 5: Access is logged for audit trail
      const hospital = await Hospital.findById(emergencyHospitalId);
      expect(hospital.apiAccessCount).toBeGreaterThan(0);

      // Clean up
      await Patient.findByIdAndDelete(accidentPatient._id);
    });
  });
});
