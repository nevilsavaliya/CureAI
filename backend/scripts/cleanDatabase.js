/**
 * Database Cleanup Script
 * Removes all user data from the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Symptom = require('../models/Symptom');
const Prediction = require('../models/Prediction');
const Message = require('../models/Message');
const Consultation = require('../models/Consultation');
const Feedback = require('../models/Feedback');

async function cleanDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform');
    console.log('Connected to MongoDB');

    console.log('\n🗑️  Starting database cleanup...\n');

    // Delete all patients
    const patientsDeleted = await Patient.deleteMany({});
    console.log(`✅ Deleted ${patientsDeleted.deletedCount} patients`);

    // Delete all doctors
    const doctorsDeleted = await Doctor.deleteMany({});
    console.log(`✅ Deleted ${doctorsDeleted.deletedCount} doctors`);

    // Keep admin but you can uncomment to delete
    // const adminsDeleted = await Admin.deleteMany({});
    // console.log(`✅ Deleted ${adminsDeleted.deletedCount} admins`);
    console.log(`ℹ️  Admins preserved (delete manually if needed)`);

    // Delete all symptoms
    const symptomsDeleted = await Symptom.deleteMany({});
    console.log(`✅ Deleted ${symptomsDeleted.deletedCount} symptoms`);

    // Delete all predictions
    const predictionsDeleted = await Prediction.deleteMany({});
    console.log(`✅ Deleted ${predictionsDeleted.deletedCount} predictions`);

    // Delete all messages
    const messagesDeleted = await Message.deleteMany({});
    console.log(`✅ Deleted ${messagesDeleted.deletedCount} messages`);

    // Delete all consultations
    const consultationsDeleted = await Consultation.deleteMany({});
    console.log(`✅ Deleted ${consultationsDeleted.deletedCount} consultations`);

    // Delete all feedback
    const feedbackDeleted = await Feedback.deleteMany({});
    console.log(`✅ Deleted ${feedbackDeleted.deletedCount} feedback entries`);

    console.log('\n✨ Database cleanup completed successfully!\n');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanDatabase();
