require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Admin.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user with hardcoded credentials
    await Admin.create({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'admin@123'
    });
    console.log('Created admin user');

    // Create sample patients with blood group
    await Patient.create({
      name: 'John Doe',
      email: 'john@patient.com',
      password: 'patient123',
      dateOfBirth: new Date('1988-05-15'),
      bloodGroup: 'O+',
      contactNumber: '+1234567890'
    });

    await Patient.create({
      name: 'Jane Smith',
      email: 'jane@patient.com',
      password: 'patient123',
      dateOfBirth: new Date('1995-08-22'),
      bloodGroup: 'A+',
      contactNumber: '+1234567891'
    });

    // Create test patient for API testing
    await Patient.create({
      name: 'Nevil Savaliya',
      email: 'savaliyanevil9@gmail.com',
      password: 'patient123',
      dateOfBirth: new Date('1990-01-01'),
      bloodGroup: 'B+',
      contactNumber: '+1234567892',
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '+1234567893'
      },
      allergies: ['Penicillin', 'Peanuts'],
      chronicConditions: [
        {
          condition: 'Hypertension',
          diagnosedDate: new Date('2020-01-01'),
          notes: 'Well controlled with medication'
        }
      ],
      currentMedications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          startDate: new Date('2020-01-01'),
          prescribedBy: 'Dr. Test'
        }
      ],
      extractedSymptoms: [
        {
          symptom: 'headache',
          extractedFrom: 'consultation',
          extractedAt: new Date(),
          caseId: null
        }
      ],
      vitalSigns: [
        {
          recordedAt: new Date(),
          bloodPressure: {
            systolic: 120,
            diastolic: 80
          },
          heartRate: 72,
          temperature: 98.6,
          weight: 70,
          height: 175
        }
      ]
    });

    console.log('Created sample patients');

    // Create registered doctors with active subscriptions
    const subscriptionStartDate = new Date();
    const subscriptionExpiryDate = new Date();
    subscriptionExpiryDate.setDate(subscriptionExpiryDate.getDate() + 30);

    await Doctor.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah@doctor.com',
      password: 'doctor123',
      dateOfBirth: new Date('1980-03-10'),
      degree: 'MBBS, MD',
      speciality: 'General Medicine',
      specializations: ['General Medicine', 'Internal Medicine'],
      experienceYears: 10,
      contactNumber: '+1234567892',
      rating: 4.5,
      totalReviews: 50,
      subscriptionStatus: 'active',
      subscriptionStartDate: subscriptionStartDate,
      subscriptionExpiryDate: subscriptionExpiryDate,
      paymentInfo: {
        transactionId: 'TXN001',
        amount: 30,
        paymentDate: subscriptionStartDate,
        upiId: '9909232769@superyes'
      }
    });

    await Doctor.create({
      name: 'Dr. Michael Chen',
      email: 'michael@doctor.com',
      password: 'doctor123',
      dateOfBirth: new Date('1975-07-20'),
      degree: 'MBBS, MD, DM Cardiology',
      speciality: 'Cardiology',
      specializations: ['Cardiology', 'Internal Medicine'],
      experienceYears: 15,
      contactNumber: '+1234567893',
      rating: 4.8,
      totalReviews: 120,
      subscriptionStatus: 'active',
      subscriptionStartDate: subscriptionStartDate,
      subscriptionExpiryDate: subscriptionExpiryDate,
      paymentInfo: {
        transactionId: 'TXN002',
        amount: 30,
        paymentDate: subscriptionStartDate,
        upiId: '9909232769@superyes'
      }
    });

    await Doctor.create({
      name: 'Dr. Emily Brown',
      email: 'emily@doctor.com',
      password: 'doctor123',
      dateOfBirth: new Date('1985-11-05'),
      degree: 'MBBS, MD Dermatology',
      speciality: 'Dermatology',
      specializations: ['Dermatology', 'Allergy & Immunology'],
      experienceYears: 8,
      contactNumber: '+1234567894',
      rating: 4.6,
      totalReviews: 75,
      subscriptionStatus: 'active',
      subscriptionStartDate: subscriptionStartDate,
      subscriptionExpiryDate: subscriptionExpiryDate,
      paymentInfo: {
        transactionId: 'TXN003',
        amount: 30,
        paymentDate: subscriptionStartDate,
        upiId: '9909232769@superyes'
      }
    });

    await Doctor.create({
      name: 'Dr. Robert Williams',
      email: 'robert@doctor.com',
      password: 'doctor123',
      dateOfBirth: new Date('1978-02-14'),
      degree: 'MBBS, MD Neurology',
      speciality: 'Neurology',
      specializations: ['Neurology', 'Internal Medicine'],
      experienceYears: 12,
      contactNumber: '+1234567895',
      rating: 4.7,
      totalReviews: 90,
      subscriptionStatus: 'active',
      subscriptionStartDate: subscriptionStartDate,
      subscriptionExpiryDate: subscriptionExpiryDate,
      paymentInfo: {
        transactionId: 'TXN004',
        amount: 30,
        paymentDate: subscriptionStartDate,
        upiId: '9909232769@superyes'
      }
    });

    await Doctor.create({
      name: 'Dr. Lisa Anderson',
      email: 'lisa@doctor.com',
      password: 'doctor123',
      dateOfBirth: new Date('1982-09-30'),
      degree: 'MBBS, MS Orthopedics',
      speciality: 'Orthopedics',
      specializations: ['Orthopedics', 'Sports Medicine'],
      experienceYears: 11,
      contactNumber: '+1234567896',
      rating: 4.4,
      totalReviews: 65,
      subscriptionStatus: 'active',
      subscriptionStartDate: subscriptionStartDate,
      subscriptionExpiryDate: subscriptionExpiryDate,
      paymentInfo: {
        transactionId: 'TXN005',
        amount: 30,
        paymentDate: subscriptionStartDate,
        upiId: '9909232769@superyes'
      }
    });

    console.log('Created registered doctors with active subscriptions');

    console.log('\n=== Seed Data Summary ===');
    console.log('Admin: admin@gmail.com / admin@123');
    console.log('Patient 1: john@patient.com / patient123 (Blood Group: O+)');
    console.log('Patient 2: jane@patient.com / patient123 (Blood Group: A+)');
    console.log('Doctor 1: sarah@doctor.com / doctor123 (General Medicine, 10 years)');
    console.log('Doctor 2: michael@doctor.com / doctor123 (Cardiology, 15 years)');
    console.log('Doctor 3: emily@doctor.com / doctor123 (Dermatology, 8 years)');
    console.log('Doctor 4: robert@doctor.com / doctor123 (Neurology, 12 years)');
    console.log('Doctor 5: lisa@doctor.com / doctor123 (Orthopedics, 11 years)');
    console.log('All doctors have active subscriptions');
    console.log('========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

connectDB().then(() => seedData());
