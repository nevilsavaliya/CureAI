const mongoose = require('mongoose');
const Case = require('./models/Case');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');

async function findPendingCase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('Connected to MongoDB');

    // Find pending cases
    const pendingCases = await Case.find({ status: 'pending' })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .limit(5);
    
    console.log(`\n=== Found ${pendingCases.length} Pending Cases ===`);
    pendingCases.forEach(c => {
      console.log(`\nCase ID: ${c._id}`);
      console.log(`Patient: ${c.patientId?.name} (${c.patientId?.email})`);
      console.log(`Doctor: ${c.doctorId?.name} (${c.doctorId?.email})`);
      console.log(`Status: ${c.status}`);
      console.log(`Created: ${c.createdAt}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findPendingCase();
