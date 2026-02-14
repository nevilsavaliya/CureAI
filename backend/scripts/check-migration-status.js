require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const checkMigrationStatus = async () => {
  try {
    console.log('Checking Hospital Feature migration status...\n');

    // Check if Hospital collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hospitalCollectionExists = collections.some(col => col.name === 'hospitals');
    
    console.log('=== Migration Status ===');
    
    if (hospitalCollectionExists) {
      console.log('✅ Hospital Feature: MIGRATED');
      
      // Get hospital count
      const Hospital = require('../models/Hospital');
      const hospitalCount = await Hospital.countDocuments();
      console.log(`   - Hospital collection: ${hospitalCount} documents`);
      
      // Check indexes
      const hospitalIndexes = await Hospital.collection.listIndexes().toArray();
      console.log(`   - Hospital indexes: ${hospitalIndexes.length} created`);
      
      // Check patient enhanced fields
      const Patient = require('../models/Patient');
      const patientCount = await Patient.countDocuments();
      const enhancedPatients = await Patient.countDocuments({
        $or: [
          { emergencyContact: { $exists: true } },
          { chronicConditions: { $exists: true } },
          { extractedSymptoms: { $exists: true } }
        ]
      });
      
      console.log(`   - Patient collection: ${patientCount} documents`);
      console.log(`   - Enhanced patients: ${enhancedPatients} documents`);
      
      // Check patient indexes
      const patientIndexes = await Patient.collection.listIndexes().toArray();
      console.log(`   - Patient indexes: ${patientIndexes.length} created`);
      
    } else {
      console.log('❌ Hospital Feature: NOT MIGRATED');
      console.log('   Run: npm run migrate:hospital');
    }
    
    console.log('========================\n');
    
    // Quick health check
    console.log('=== Database Health ===');
    
    try {
      const dbStats = await mongoose.connection.db.stats();
      console.log(`✓ Database size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`✓ Collections: ${dbStats.collections}`);
      console.log(`✓ Indexes: ${dbStats.indexes}`);
    } catch (error) {
      console.log('⚠ Could not retrieve database stats');
    }
    
    console.log('========================\n');
    
    process.exit(0);

  } catch (error) {
    console.error('Error checking migration status:', error);
    process.exit(1);
  }
};

// Run check
connectDB().then(() => checkMigrationStatus());