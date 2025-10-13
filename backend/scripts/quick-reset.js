/**
 * Quick Reset Script
 * Immediately deletes all data without confirmation delay
 * IMPORTANT: Preserves admin@gmail.com account
 */

const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function quickReset() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform';
    await mongoose.connect(dbUri);
    
    console.log('Resetting database...');
    
    // Save admin account before dropping database
    const adminAccount = await Admin.findOne({ email: 'admin@gmail.com' });
    
    // Drop entire database (fastest method)
    await mongoose.connection.db.dropDatabase();
    
    console.log('✓ Database dropped');
    
    // Restore admin account
    if (adminAccount) {
      const admin = new Admin({
        name: adminAccount.name,
        email: adminAccount.email,
        password: 'Admin@123', // Reset to default password
        role: 'admin'
      });
      await admin.save();
      console.log('✓ Admin account restored (admin@gmail.com / Admin@123)');
    } else {
      // Create new admin if it didn't exist
      const admin = new Admin({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: 'Admin@123',
        role: 'admin'
      });
      await admin.save();
      console.log('✓ Admin account created (admin@gmail.com / Admin@123)');
    }
    
    console.log('✓ Database reset complete!');
    console.log('⚠️  IMPORTANT: Admin account preserved');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

quickReset();
