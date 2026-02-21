const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function createTestPatient() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('Connected to MongoDB');

    // Check if patient already exists
    const existing = await User.findOne({ email: 'patient@test.com' });
    if (existing) {
      console.log('Test patient already exists');
      console.log('Email:', existing.email);
      console.log('Name:', existing.name);
      await mongoose.disconnect();
      return;
    }

    // Create test patient - password will be hashed by pre-save hook
    const patient = new User({
      name: 'Test Patient',
      email: 'patient@test.com',
      password: 'Test@123',  // Will be hashed by pre-save hook
      role: 'patient',
      phone: '1234567890',
      bloodGroup: 'O+',
      age: 30,
      gender: 'male',
      isEmailVerified: true
    });

    await patient.save();
    console.log('✅ Test patient created successfully');
    console.log('Email: patient@test.com');
    console.log('Password: Test@123');
    console.log('Name:', patient.name);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestPatient();
