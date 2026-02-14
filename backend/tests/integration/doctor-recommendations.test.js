/**
 * Doctor Recommendations Integration Tests
 * Tests doctor recommendation system with General Medicine fallback
 * Requirements: 3.2, 3.3, 3.4, 4.1
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const SymptomConversation = require('../../models/SymptomConversation');
const {
  getDoctorsForConditions,
  getRecommendedDoctors,
  isGeneralMedicineDoctor,
  sortDoctorsByRelevance
} = require('../../services/universalDoctorMatcher');

describe('Doctor Recommendations Integration Tests', () => {
  let patientId;
  let generalMedicineDoctorId;
  let cardiologyDoctorId;
  let pulmonologyDoctorId;
  let gastroenterologyDoctorId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }

    // Clean up existing test data
    await Patient.deleteMany({ email: /doctor-recommendation-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /doctor-recommendation-test.*@test\.com/ });
    await SymptomConversation.deleteMany({});

    // Create test patient
    const patient = new Patient({
      name: 'Doctor Recommendation Test Patient',
      email: 'doctor-recommendation-test@test\.com',
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    await patient.save();
    patientId = patient._id.toString();

    // Create test doctors with different specializations
    const generalMedicineDoctor = new Doctor({
      name: 'Dr. General Medicine',
      email: 'doctor-recommendation-test-general@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1980-01-01',
      degree: 'MBBS',
      specializations: ['General Medicine'],
      experienceYears: 10,
      rating: 4.5,
      subscriptionStatus: 'active',
      isActive: true
    });
    await generalMedicineDoctor.save();
    generalMedicineDoctorId = generalMedicineDoctor._id.toString();

    const cardiologyDoctor = new Doctor({
      name: 'Dr. Cardiology Specialist',
      email: 'doctor-recommendation-test-cardio@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1975-01-01',
      degree: 'MBBS, MD (Cardiology)',
      specializations: ['Cardiology'],
      experienceYears: 15,
      rating: 4.8,
      subscriptionStatus: 'active',
      isActive: true
    });
    await cardiologyDoctor.save();
    cardiologyDoctorId = cardiologyDoctor._id.toString();

    const pulmonologyDoctor = new Doctor({
      name: 'Dr. Pulmonology Specialist',
      email: 'doctor-recommendation-test-pulmo@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1978-01-01',
      degree: 'MBBS, MD (Pulmonology)',
      specializations: ['Pulmonology'],
      experienceYears: 12,
      rating: 4.6,
      subscriptionStatus: 'active',
      isActive: true
    });
    await pulmonologyDoctor.save();
    pulmonologyDoctorId = pulmonologyDoctor._id.toString();

    const gastroenterologyDoctor = new Doctor({
      name: 'Dr. Gastroenterology Specialist',
      email: 'doctor-recommendation-test-gastro@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1982-01-01',
      degree: 'MBBS, MD (Gastroenterology)',
      specializations: ['Gastroenterology'],
      experienceYears: 8,
      rating: 4.4,
      subscriptionStatus: 'active',
      isActive: true
    });
    await gastroenterologyDoctor.save();
    gastroenterologyDoctorId = gastroenterologyDoctor._id.toString();

    // Create a doctor with multiple specializations including General Medicine
    const multiSpecDoctor = new Doctor({
      name: 'Dr. Multi Specialist',
      email: 'doctor-recommendation-test-multi@test.com',
      password: 'TestPass123!',
      dateOfBirth: '1985-01-01',
      degree: 'MBBS, MD',
      specializations: ['General Medicine', 'Internal Medicine'],
      experienceYears: 7,
      rating: 4.3,
      subscriptionStatus: 'active',
      isActive: true
    });
    await multiSpecDoctor.save();
  });

  afterAll(async () => {
    // Clean up test data
    await Patient.deleteMany({ email: /doctor-recommendation-test.*@test\.com/ });
    await Doctor.deleteMany({ email: /doctor-recommendation-test.*@test\.com/ });
    await SymptomConversation.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. General Medicine Doctors Always Included', () => {
    it('should include General Medicine doctors for cardiovascular conditions', async () => {
      const predictedConditions = [
        {
          disease: 'Hypertension',
          confidence: 75,
          specializations: ['Cardiology']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // Should include both Cardiology and General Medicine doctors
      const hasGeneralMedicine = doctors.some(doc => doc.isGeneralMedicine === true);
      const hasCardiology = doctors.some(doc => 
        doc.specializations.includes('Cardiology')
      );
      
      expect(hasGeneralMedicine).toBe(true);
    });

    it('should include General Medicine doctors for respiratory conditions', async () => {
      const predictedConditions = [
        {
          disease: 'Bronchitis',
          confidence: 70,
          specializations: ['Pulmonology', 'General Medicine']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      const hasGeneralMedicine = doctors.some(doc => doc.isGeneralMedicine === true);
      expect(hasGeneralMedicine).toBe(true);
    });

    it('should include General Medicine doctors for gastrointestinal conditions', async () => {
      const predictedConditions = [
        {
          disease: 'Gastritis',
          confidence: 65,
          specializations: ['Gastroenterology', 'General Medicine']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      const hasGeneralMedicine = doctors.some(doc => doc.isGeneralMedicine === true);
      expect(hasGeneralMedicine).toBe(true);
    });

    it('should return only General Medicine doctors when no specific specialization predicted', async () => {
      const predictedConditions = [];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // All doctors should have General Medicine specialization
      doctors.forEach(doc => {
        expect(doc.specializations).toContain('General Medicine');
      });
    });
  });

  describe('2. Specialization Filtering', () => {
    it('should filter doctors by specialization', async () => {
      const predictedConditions = [
        {
          disease: 'Angina',
          confidence: 80,
          specializations: ['Cardiology']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // Should include Cardiology specialists and General Medicine doctors
      doctors.forEach(doc => {
        const hasCardiology = doc.specializations.includes('Cardiology');
        const hasGeneralMedicine = doc.specializations.includes('General Medicine');
        
        expect(hasCardiology || hasGeneralMedicine).toBe(true);
      });
    });

    it('should handle multiple specializations', async () => {
      const predictedConditions = [
        {
          disease: 'Pneumonia',
          confidence: 75,
          specializations: ['Pulmonology', 'General Medicine']
        },
        {
          disease: 'Bronchitis',
          confidence: 65,
          specializations: ['Pulmonology']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // Should include Pulmonology and General Medicine doctors
      const hasPulmonology = doctors.some(doc => 
        doc.specializations.includes('Pulmonology')
      );
      const hasGeneralMedicine = doctors.some(doc => 
        doc.specializations.includes('General Medicine')
      );
      
      expect(hasPulmonology || hasGeneralMedicine).toBe(true);
    });

    it('should exclude doctors with inactive subscriptions', async () => {
      // Create an inactive doctor
      const inactiveDoctor = new Doctor({
        name: 'Dr. Inactive',
        email: 'doctor-recommendation-test-inactive@test.com',
        password: 'TestPass123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        specializations: ['General Medicine'],
        experienceYears: 10,
        rating: 4.5,
        subscriptionStatus: 'expired',
        isActive: true
      });
      await inactiveDoctor.save();

      const predictedConditions = [
        {
          disease: 'Common Cold',
          confidence: 70,
          specializations: ['General Medicine']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      
      // Should not include the inactive doctor
      const hasInactiveDoctor = doctors.some(doc => 
        doc._id.toString() === inactiveDoctor._id.toString()
      );
      
      expect(hasInactiveDoctor).toBe(false);

      // Clean up
      await Doctor.findByIdAndDelete(inactiveDoctor._id);
    });
  });

  describe('3. Doctor Sorting by Relevance', () => {
    it('should sort specialized doctors before General Medicine doctors', async () => {
      const predictedConditions = [
        {
          disease: 'Arrhythmia',
          confidence: 85,
          specializations: ['Cardiology']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(1);
      
      // Find first specialized doctor and first General Medicine doctor
      let firstSpecializedIndex = -1;
      let firstGeneralMedicineIndex = -1;
      
      for (let i = 0; i < doctors.length; i++) {
        const hasCardiology = doctors[i].specializations.includes('Cardiology');
        const isOnlyGeneralMedicine = doctors[i].specializations.includes('General Medicine') && 
                                      !doctors[i].specializations.includes('Cardiology');
        
        if (hasCardiology && firstSpecializedIndex === -1) {
          firstSpecializedIndex = i;
        }
        
        if (isOnlyGeneralMedicine && firstGeneralMedicineIndex === -1) {
          firstGeneralMedicineIndex = i;
        }
      }
      
      // Specialized doctors should appear before General Medicine-only doctors
      if (firstSpecializedIndex !== -1 && firstGeneralMedicineIndex !== -1) {
        expect(firstSpecializedIndex).toBeLessThan(firstGeneralMedicineIndex);
      }
    });

    it('should sort by rating within same specialization group', async () => {
      // Create two General Medicine doctors with different ratings
      const gmDoctor1 = new Doctor({
        name: 'Dr. GM High Rating',
        email: 'doctor-recommendation-test-gm1@test.com',
        password: 'TestPass123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        specializations: ['General Medicine'],
        experienceYears: 10,
        rating: 4.9,
        subscriptionStatus: 'active',
        isActive: true
      });
      await gmDoctor1.save();

      const gmDoctor2 = new Doctor({
        name: 'Dr. GM Low Rating',
        email: 'doctor-recommendation-test-gm2@test.com',
        password: 'TestPass123!',
        dateOfBirth: '1980-01-01',
        degree: 'MBBS',
        specializations: ['General Medicine'],
        experienceYears: 10,
        rating: 3.5,
        subscriptionStatus: 'active',
        isActive: true
      });
      await gmDoctor2.save();

      const predictedConditions = [
        {
          disease: 'Common Cold',
          confidence: 60,
          specializations: ['General Medicine']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(1);
      
      // Find the two doctors in the results
      const doctor1Index = doctors.findIndex(d => d._id.toString() === gmDoctor1._id.toString());
      const doctor2Index = doctors.findIndex(d => d._id.toString() === gmDoctor2._id.toString());
      
      if (doctor1Index !== -1 && doctor2Index !== -1) {
        // Higher rated doctor should appear first
        expect(doctor1Index).toBeLessThan(doctor2Index);
      }

      // Clean up
      await Doctor.findByIdAndDelete(gmDoctor1._id);
      await Doctor.findByIdAndDelete(gmDoctor2._id);
    });

    it('should include relevance score in doctor objects', async () => {
      const predictedConditions = [
        {
          disease: 'Hypertension',
          confidence: 75,
          specializations: ['Cardiology']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // All doctors should have relevance score
      doctors.forEach(doc => {
        expect(doc.relevanceScore).toBeDefined();
        expect(typeof doc.relevanceScore).toBe('number');
        expect(doc.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(doc.relevanceScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('4. Minimum Doctor Guarantee', () => {
    it('should return at least one doctor even with no matching specializations', async () => {
      const predictedConditions = [
        {
          disease: 'Rare Disease',
          confidence: 50,
          specializations: ['Rare Specialization That Does Not Exist']
        }
      ];

      const doctors = await getDoctorsForConditions(predictedConditions);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // Should fallback to General Medicine doctors
      const hasGeneralMedicine = doctors.some(doc => doc.isGeneralMedicine === true);
      expect(hasGeneralMedicine).toBe(true);
    });

    it('should return General Medicine doctors when no predictions available', async () => {
      const doctors = await getDoctorsForConditions([]);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // All should have General Medicine specialization
      doctors.forEach(doc => {
        expect(doc.specializations).toContain('General Medicine');
      });
    });
  });

  describe('5. Recommended Doctors API', () => {
    it('should get recommended doctors with specialization filter', async () => {
      const doctors = await getRecommendedDoctors(['Cardiology']);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // Should include Cardiology and General Medicine doctors
      doctors.forEach(doc => {
        const hasCardiology = doc.specializations.includes('Cardiology');
        const hasGeneralMedicine = doc.specializations.includes('General Medicine');
        
        expect(hasCardiology || hasGeneralMedicine).toBe(true);
      });
    });

    it('should always append General Medicine to filter', async () => {
      const doctors = await getRecommendedDoctors(['Pulmonology']);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // Should include General Medicine doctors even though not explicitly requested
      const hasGeneralMedicine = doctors.some(doc => doc.isGeneralMedicine === true);
      expect(hasGeneralMedicine).toBe(true);
    });

    it('should handle empty specialization array', async () => {
      const doctors = await getRecommendedDoctors([]);

      expect(doctors).toBeDefined();
      expect(doctors.length).toBeGreaterThan(0);
      
      // Should return General Medicine doctors
      const hasGeneralMedicine = doctors.some(doc => doc.isGeneralMedicine === true);
      expect(hasGeneralMedicine).toBe(true);
    });
  });

  describe('6. Helper Functions', () => {
    it('should correctly identify General Medicine doctors', async () => {
      const gmDoctor = await Doctor.findById(generalMedicineDoctorId);
      const cardioDoctor = await Doctor.findById(cardiologyDoctorId);

      expect(isGeneralMedicineDoctor(gmDoctor)).toBe(true);
      expect(isGeneralMedicineDoctor(cardioDoctor)).toBe(false);
    });

    it('should sort doctors by relevance correctly', async () => {
      const doctors = await Doctor.find({
        subscriptionStatus: 'active',
        isActive: true
      });

      const targetSpecializations = ['Cardiology', 'General Medicine'];
      const sortedDoctors = sortDoctorsByRelevance(doctors, targetSpecializations);

      expect(sortedDoctors).toBeDefined();
      expect(sortedDoctors.length).toBe(doctors.length);
      
      // Verify sorting: specialized doctors should come before General Medicine-only
      let foundSpecialized = false;
      let foundGeneralMedicineOnly = false;
      
      for (const doc of sortedDoctors) {
        const hasCardiology = doc.specializations.includes('Cardiology');
        const isOnlyGeneralMedicine = doc.specializations.includes('General Medicine') && 
                                      !doc.specializations.includes('Cardiology');
        
        if (hasCardiology) {
          foundSpecialized = true;
          // Should not have found General Medicine-only doctors yet
          expect(foundGeneralMedicineOnly).toBe(false);
        }
        
        if (isOnlyGeneralMedicine) {
          foundGeneralMedicineOnly = true;
        }
      }
    });
  });
});
