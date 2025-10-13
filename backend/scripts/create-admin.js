const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

/**
 * Script to create/restore admin account
 * Email: admin@gmail.com
 * Password: Admin@123
 * 
 * IMPORTANT: Never delete this admin account!
 */

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin account already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      return;
    }

    // Create admin account
    const admin = new Admin({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'Admin@123', // Will be hashed by the pre-save hook
      role: 'admin'
    });

    await admin.save();

    console.log('\n✅ Admin account created successfully!');
    console.log('==========================================');
    console.log('Email: admin@gmail.com');
    console.log('Password: Admin@123');
    console.log('==========================================');
    console.log('\n⚠️  IMPORTANT: This admin account should NEVER be deleted!');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
createAdmin();
