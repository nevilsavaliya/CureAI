const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

async function testDoctorLogin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('Connected to MongoDB');

    // Find doctors
    const doctors = await Doctor.find().limit(5);
    
    console.log('\n=== Doctors in Database ===');
    doctors.forEach(d => {
      console.log(`\nEmail: ${d.email}`);
      console.log(`Name: ${d.name}`);
      console.log(`Specializations: ${d.specializations.join(', ')}`);
      console.log(`Subscription Status: ${d.subscriptionStatus}`);
    });

    // Test common passwords
    const testPasswords = ['Doctor@123', 'doctor123', 'password123', 'test123'];
    
    console.log('\n\n=== Testing Common Passwords ===');
    for (const doctor of doctors) {
      console.log(`\nTesting ${doctor.email}:`);
      for (const password of testPasswords) {
        try {
          const isMatch = await doctor.comparePassword(password);
          if (isMatch) {
            console.log(`  ✅ Password found: ${password}`);
            break;
          }
        } catch (error) {
          // Continue to next password
        }
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDoctorLogin();
