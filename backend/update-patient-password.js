const mongoose = require('mongoose');
const User = require('./models/User');

async function updatePassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'patient@test.com' });
    if (!user) {
      console.log('User not found');
      await mongoose.disconnect();
      return;
    }

    // Update password - will be hashed by pre-save hook
    user.password = 'password123';
    await user.save();

    console.log('✅ Password updated successfully');
    console.log('Email: patient@test.com');
    console.log('New Password: password123');

    // Test the new password
    const isValid = await user.comparePassword('password123');
    console.log('Password verification:', isValid ? '✅ Valid' : '❌ Invalid');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePassword();
