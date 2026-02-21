const mongoose = require('mongoose');
const Patient = require('./models/Patient');

async function seedTestPatient() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    // Delete existing test patient if exists
    await Patient.deleteOne({ email: 'testpatient@example.com' });
    console.log('🗑️  Deleted existing test patient if any\n');

    const patientData = {
      name: 'Test Patient',
      email: 'testpatient@example.com',
      password: 'patient123',  // Will be hashed by pre-save hook
      phone: '+1234567899',
      bloodGroup: 'O+',
      gender: 'male',
      dateOfBirth: new Date('1996-01-15'),
      contactNumber: '+1234567899',
      isEmailVerified: true,
      isActive: true
    };

    const patient = new Patient(patientData);
    await patient.save();

    console.log('✅ Test patient created successfully!\n');
    console.log('Patient credentials:');
    console.log('  Email: testpatient@example.com');
    console.log('  Password: patient123');
    console.log('  Name:', patient.name);
    console.log('  ID:', patient._id);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test patient:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedTestPatient();
