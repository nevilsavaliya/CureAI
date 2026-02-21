const mongoose = require('mongoose');
const User = require('./models/User');

async function deleteTestPatient() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('Connected to MongoDB');

    const result = await User.deleteOne({ email: 'patient@test.com' });
    console.log('Deleted:', result.deletedCount, 'patient(s)');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTestPatient();
