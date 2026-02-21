const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function createTestAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@test.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Test admin already exists');
      console.log('Email: admin@test.com');
      console.log('Password: admin123');
      await mongoose.disconnect();
      process.exit(0);
      return;
    }

    // Create test admin with full permissions
    const admin = new Admin({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'admin123',
      isActive: true,
      isRootAdmin: true,
      permissions: [
        { resource: 'patients', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'doctors', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'hospitals', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'admins', actions: ['read', 'create', 'update', 'delete'] }
      ]
    });

    await admin.save();
    console.log('✅ Test admin created successfully!');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createTestAdmin();
