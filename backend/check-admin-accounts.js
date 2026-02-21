const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function checkAdminAccounts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    const admins = await Admin.find({});
    
    console.log(`Found ${admins.length} admin account(s):\n`);
    
    for (const admin of admins) {
      console.log('-----------------------------------');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Is Root Admin:', admin.isRoot());
      console.log('Is Active:', admin.isActive);
      console.log('Created At:', admin.createdAt);
      console.log('');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdminAccounts();
