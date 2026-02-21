const mongoose = require('mongoose');
const User = require('./models/User');

async function testPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'patient@test.com' });
    if (!user) {
      console.log('User not found');
      await mongoose.disconnect();
      return;
    }

    console.log('User found:', user.email);
    console.log('Stored password hash:', user.password);

    const testPassword = 'Test@123';
    const isValid = await user.comparePassword(testPassword);
    
    console.log('Testing password:', testPassword);
    console.log('Password valid:', isValid);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPassword();
