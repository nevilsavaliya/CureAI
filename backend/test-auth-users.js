const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Admin = require('./models/Admin');

mongoose.connect('mongodb://localhost:27017/healthcare-platform')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find test users
    const patients = await User.find({ role: 'patient' }).limit(2);
    const doctors = await Doctor.find().limit(2);
    const admins = await Admin.find().limit(2);
    
    console.log('\n=== Test Users ===');
    console.log('\nPatients:');
    patients.forEach(p => console.log(`  Email: ${p.email}, Name: ${p.name}`));
    
    console.log('\nDoctors:');
    doctors.forEach(d => console.log(`  Email: ${d.email}, Name: ${d.name}`));
    
    console.log('\nAdmins:');
    admins.forEach(a => console.log(`  Email: ${a.email}, Name: ${a.name}`));
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
