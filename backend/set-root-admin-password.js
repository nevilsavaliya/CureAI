const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function setRootAdminPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    const admin = await Admin.findOne({ email: 'admin@gmail.com' });
    
    if (!admin) {
      console.log('❌ Root admin (admin@gmail.com) not found');
      await mongoose.disconnect();
      process.exit(1);
      return;
    }

    // Set password to 'admin123'
    admin.password = 'admin123';
    await admin.save();
    
    console.log('✅ Root admin password updated successfully!');
    console.log('\nRoot Admin credentials:');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    console.log('Is Root Admin:', admin.isRoot());
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    process.exit(1);
  }
}

setRootAdminPassword();
