const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

async function createTestDoctor() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    // Delete existing test doctor if any
    await Doctor.deleteOne({ email: 'testdoctor@example.com' });
    console.log('🗑️  Deleted existing test doctor if any\n');

    // Create test doctor
    const doctor = new Doctor({
      name: 'Test Doctor',
      email: 'testdoctor@example.com',
      password: 'doctor123',
      dateOfBirth: new Date('1985-01-01'),
      contactNumber: '9876543210',
      degree: 'MBBS, MD',
      specializations: ['General Medicine', 'Internal Medicine'],
      experienceYears: 10,
      rating: 4.5,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isActive: true
    });

    await doctor.save();
    console.log('✅ Test doctor created successfully!\n');
    console.log('Doctor credentials:');
    console.log('  Email: testdoctor@example.com');
    console.log('  Password: doctor123');
    console.log('  Name:', doctor.name);
    console.log('  ID:', doctor._id);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestDoctor();
