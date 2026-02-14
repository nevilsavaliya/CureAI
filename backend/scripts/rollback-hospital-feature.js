require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Hospital Feature Rollback');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const rollbackHospitalFeature = async () => {
  try {
    console.log('Starting Hospital Feature rollback...\n');
    console.log('⚠ WARNING: This will remove Hospital collection and enhanced Patient fields!');
    console.log('This action cannot be undone.\n');

    // 1. Drop Hospital collection indexes
    console.log('1. Dropping Hospital collection indexes...');
    
    try {
      const hospitalIndexes = await Hospital.collection.listIndexes().toArray();
      console.log(`Found ${hospitalIndexes.length} indexes in Hospital collection`);
      
      for (const index of hospitalIndexes) {
        if (index.name !== '_id_') { // Don't drop the default _id index
          try {
            await Hospital.collection.dropIndex(index.name);
            console.log(`✓ Dropped index: ${index.name}`);
          } catch (error) {
            console.log(`⚠ Could not drop index ${index.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('⚠ Error listing Hospital indexes:', error.message);
    }

    // 2. Drop Hospital collection entirely
    console.log('\n2. Dropping Hospital collection...');
    
    try {
      const hospitalCount = await Hospital.countDocuments();
      if (hospitalCount > 0) {
        console.log(`⚠ Found ${hospitalCount} hospitals in collection`);
        await Hospital.collection.drop();
        console.log('✓ Hospital collection dropped');
      } else {
        console.log('✓ Hospital collection is empty, nothing to drop');
      }
    } catch (error) {
      if (error.message.includes('ns not found')) {
        console.log('✓ Hospital collection does not exist');
      } else {
        console.error('Error dropping Hospital collection:', error.message);
      }
    }

    // 3. Remove enhanced fields from Patient collection
    console.log('\n3. Removing enhanced fields from Patient collection...');
    
    const patientsWithEnhancedFields = await Patient.find({
      $or: [
        { emergencyContact: { $exists: true } },
        { chronicConditions: { $exists: true } },
        { currentMedications: { $exists: true } },
        { pastSurgeries: { $exists: true } },
        { vaccinations: { $exists: true } },
        { extractedSymptoms: { $exists: true } },
        { vitalSigns: { $exists: true } },
        { labResults: { $exists: true } }
      ]
    });

    console.log(`Found ${patientsWithEnhancedFields.length} patients with enhanced fields`);

    let updatedCount = 0;
    for (const patient of patientsWithEnhancedFields) {
      try {
        await Patient.updateOne(
          { _id: patient._id },
          {
            $unset: {
              emergencyContact: '',
              chronicConditions: '',
              currentMedications: '',
              pastSurgeries: '',
              vaccinations: '',
              extractedSymptoms: '',
              vitalSigns: '',
              labResults: ''
            }
          }
        );
        updatedCount++;
      } catch (error) {
        console.error(`Error updating patient ${patient.email}:`, error.message);
      }
    }

    console.log(`✓ Removed enhanced fields from ${updatedCount} patients`);

    // 4. Drop Patient collection indexes related to enhanced fields
    console.log('\n4. Dropping Patient collection enhanced field indexes...');
    
    const enhancedFieldIndexes = [
      'bloodGroup_1',
      'emergencyContact.phone_1',
      'extractedSymptoms.symptom_1',
      'extractedSymptoms.extractedAt_-1',
      'chronicConditions.condition_1',
      'currentMedications.name_1',
      'vitalSigns.recordedAt_-1',
      'labResults.date_-1'
    ];

    for (const indexName of enhancedFieldIndexes) {
      try {
        await Patient.collection.dropIndex(indexName);
        console.log(`✓ Dropped Patient index: ${indexName}`);
      } catch (error) {
        if (error.message.includes('index not found')) {
          console.log(`⚠ Index ${indexName} not found, skipping`);
        } else {
          console.log(`⚠ Could not drop index ${indexName}: ${error.message}`);
        }
      }
    }

    console.log('\n=== Rollback Summary ===');
    console.log('✓ Hospital collection dropped');
    console.log('✓ Hospital indexes removed');
    console.log(`✓ Enhanced fields removed from ${updatedCount} patients`);
    console.log('✓ Enhanced field indexes removed');
    console.log('========================\n');

    console.log('Hospital Feature rollback completed successfully!');
    console.log('\nThe database has been restored to its pre-hospital-feature state.');
    console.log('You may need to restart your application to clear any cached schemas.');
    
    process.exit(0);

  } catch (error) {
    console.error('Error during Hospital Feature rollback:', error);
    process.exit(1);
  }
};

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚨 HOSPITAL FEATURE ROLLBACK 🚨');
console.log('This will permanently delete:');
console.log('- All hospital registrations');
console.log('- All hospital API credentials');
console.log('- Enhanced patient medical records');
console.log('- All related database indexes');
console.log('');

rl.question('Are you sure you want to proceed? Type "YES" to confirm: ', (answer) => {
  if (answer === 'YES') {
    rl.close();
    connectDB().then(() => rollbackHospitalFeature());
  } else {
    console.log('Rollback cancelled.');
    rl.close();
    process.exit(0);
  }
});