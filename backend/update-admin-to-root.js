const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function updateAdminToRoot() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    const admin = await Admin.findOne({ email: 'admin@test.com' });
    
    if (!admin) {
      console.log('❌ Admin not found');
      await mongoose.disconnect();
      process.exit(1);
      return;
    }

    admin.isRootAdmin = true;
    await admin.save();
    
    console.log('✅ Admin updated to root admin');
    console.log('Email: admin@test.com');
    console.log('isRootAdmin:', admin.isRootAdmin);
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    process.exit(1);
  }
}

updateAdminToRoot();
