const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

async function seedDoctors() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    const doctors = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        password: 'doctor123',
        dateOfBirth: new Date('1985-03-15'),
        degree: 'MBBS, MD',
        speciality: 'General Medicine',
        specializations: ['General Medicine'],
        experienceYears: 12,
        contactNumber: '+1234567890',
        clinicAddress: '123 Medical Center, City Hospital',
        rating: 4.8,
        subscriptionStatus: 'active',
        isActive: true
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@hospital.com',
        password: 'doctor123',
        dateOfBirth: new Date('1980-07-22'),
        degree: 'MBBS, MD',
        speciality: 'General Medicine',
        specializations: ['General Medicine', 'Internal Medicine'],
        experienceYears: 15,
        contactNumber: '+1234567891',
        clinicAddress: '456 Health Plaza, Downtown',
        rating: 4.9,
        subscriptionStatus: 'active',
        isActive: true
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@hospital.com',
        password: 'doctor123',
        dateOfBirth: new Date('1988-11-08'),
        degree: 'MBBS, MD (Pulmonology)',
        speciality: 'Pulmonology',
        specializations: ['Pulmonology', 'Respiratory Medicine'],
        experienceYears: 10,
        contactNumber: '+1234567892',
        clinicAddress: '789 Lung Care Center',
        rating: 4.7,
        subscriptionStatus: 'active',
        isActive: true
      },
      {
        name: 'Dr. James Wilson',
        email: 'james.wilson@hospital.com',
        password: 'doctor123',
        dateOfBirth: new Date('1982-05-30'),
        degree: 'MBBS, MD (Internal Medicine)',
        speciality: 'Internal Medicine',
        specializations: ['Internal Medicine', 'General Medicine'],
        experienceYears: 14,
        contactNumber: '+1234567893',
        clinicAddress: '321 Care Hospital, Medical District',
        rating: 4.6,
        subscriptionStatus: 'active',
        isActive: true
      },
      {
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@hospital.com',
        password: 'doctor123',
        dateOfBirth: new Date('1990-09-12'),
        degree: 'MBBS, MD (General Medicine)',
        speciality: 'General Medicine',
        specializations: ['General Medicine'],
        experienceYears: 8,
        contactNumber: '+1234567894',
        clinicAddress: '555 Community Health Center',
        rating: 4.5,
        subscriptionStatus: 'active',
        isActive: true
      },
      {
        name: 'Dr. Robert Taylor',
        email: 'robert.taylor@hospital.com',
        password: 'doctor123',
        dateOfBirth: new Date('1978-12-25'),
        degree: 'MBBS, MD, DM (Cardiology)',
        speciality: 'Cardiology',
        specializations: ['Cardiology', 'Internal Medicine'],
        experienceYears: 20,
        contactNumber: '+1234567895',
        clinicAddress: '888 Heart Institute',
        rating: 4.9,
        subscriptionStatus: 'active',
        isActive: true
      },
      {
        name: 'Dr. Lisa Anderson',
        email: 'lisa.anderson@hospital.com',
        password: 'doctor123',
        dateOfBirth: new Date('1987-04-18'),
        degree: 'MBBS, MD (Dermatology)',
        speciality: 'Dermatology',
        specializations: ['Dermatology', 'Skin Care'],
        experienceYears: 11,
        contactNumber: '+1234567896',
        clinicAddress: '222 Skin Clinic, Beauty Plaza',
        rating: 4.7,
        subscriptionStatus: 'active',
        isActive: true
      },
      {
        name: 'Dr. David Kumar',
        email: 'david.kumar@hospital.com',
        password: 'doctor123',
        dateOfBirth: new Date('1983-08-05'),
        degree: 'MBBS, MS (Orthopedics)',
        speciality: 'Orthopedics',
        specializations: ['Orthopedics', 'Sports Medicine'],
        experienceYears: 13,
        contactNumber: '+1234567897',
        clinicAddress: '999 Bone & Joint Hospital',
        rating: 4.8,
        subscriptionStatus: 'active',
        isActive: true
      }
    ];

    console.log('🌱 Seeding doctors...\n');

    for (const doctorData of doctors) {
      const doctor = new Doctor(doctorData);
      await doctor.save();
      console.log(`✅ Created: ${doctor.name} (${doctor.speciality})`);
    }

    console.log(`\n✅ Successfully seeded ${doctors.length} doctors!`);
    console.log('\nDoctor credentials:');
    console.log('Email: [doctor-email]@hospital.com');
    console.log('Password: doctor123\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    process.exit(1);
  }
}

seedDoctors();
