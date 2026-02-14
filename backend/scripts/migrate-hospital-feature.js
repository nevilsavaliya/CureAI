require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Hospital Feature Migration');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const migrateHospitalFeature = async () => {
  try {
    console.log('Starting Hospital Feature database migration...\n');

    // 1. Create indexes for Hospital collection
    console.log('1. Creating indexes for Hospital collection...');
    
    try {
      // Email index (unique)
      await Hospital.collection.createIndex({ email: 1 }, { unique: true });
      console.log('✓ Created unique index on Hospital.email');
      
      // Registration number index (unique)
      await Hospital.collection.createIndex({ registrationNumber: 1 }, { unique: true });
      console.log('✓ Created unique index on Hospital.registrationNumber');
      
      // API Key index (unique, sparse for null values)
      await Hospital.collection.createIndex({ apiKey: 1 }, { unique: true, sparse: true });
      console.log('✓ Created unique sparse index on Hospital.apiKey');
      
      // Verification status index for admin queries
      await Hospital.collection.createIndex({ verificationStatus: 1 });
      console.log('✓ Created index on Hospital.verificationStatus');
      
      // Compound index for verification status and creation date
      await Hospital.collection.createIndex({ verificationStatus: 1, createdAt: -1 });
      console.log('✓ Created compound index on Hospital.verificationStatus + createdAt');
      
      // Active status index
      await Hospital.collection.createIndex({ isActive: 1 });
      console.log('✓ Created index on Hospital.isActive');
      
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠ Some Hospital indexes already exist, skipping...');
      } else {
        console.error('Error creating Hospital indexes:', error.message);
      }
    }

    // 2. Create indexes for enhanced Patient collection fields
    console.log('\n2. Creating indexes for enhanced Patient collection...');
    
    try {
      // Email index (should already exist, but ensure it's there)
      await Patient.collection.createIndex({ email: 1 }, { unique: true });
      console.log('✓ Ensured unique index on Patient.email');
      
      // Blood group index for emergency queries
      await Patient.collection.createIndex({ bloodGroup: 1 });
      console.log('✓ Created index on Patient.bloodGroup');
      
      // Emergency contact phone index
      await Patient.collection.createIndex({ 'emergencyContact.phone': 1 });
      console.log('✓ Created index on Patient.emergencyContact.phone');
      
      // Extracted symptoms indexes for hospital API queries
      await Patient.collection.createIndex({ 'extractedSymptoms.symptom': 1 });
      console.log('✓ Created index on Patient.extractedSymptoms.symptom');
      
      await Patient.collection.createIndex({ 'extractedSymptoms.extractedAt': -1 });
      console.log('✓ Created index on Patient.extractedSymptoms.extractedAt');
      
      // Chronic conditions index
      await Patient.collection.createIndex({ 'chronicConditions.condition': 1 });
      console.log('✓ Created index on Patient.chronicConditions.condition');
      
      // Current medications index
      await Patient.collection.createIndex({ 'currentMedications.name': 1 });
      console.log('✓ Created index on Patient.currentMedications.name');
      
      // Vital signs date index for recent records
      await Patient.collection.createIndex({ 'vitalSigns.recordedAt': -1 });
      console.log('✓ Created index on Patient.vitalSigns.recordedAt');
      
      // Lab results date index
      await Patient.collection.createIndex({ 'labResults.date': -1 });
      console.log('✓ Created index on Patient.labResults.date');
      
      // Active status index
      await Patient.collection.createIndex({ isActive: 1 });
      console.log('✓ Created index on Patient.isActive');
      
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠ Some Patient indexes already exist, skipping...');
      } else {
        console.error('Error creating Patient indexes:', error.message);
      }
    }

    // 3. Migrate existing patient data to add new fields if they don't exist
    console.log('\n3. Migrating existing Patient records...');
    
    const patientsToUpdate = await Patient.find({
      $or: [
        { emergencyContact: { $exists: false } },
        { chronicConditions: { $exists: false } },
        { currentMedications: { $exists: false } },
        { pastSurgeries: { $exists: false } },
        { vaccinations: { $exists: false } },
        { extractedSymptoms: { $exists: false } },
        { vitalSigns: { $exists: false } },
        { labResults: { $exists: false } }
      ]
    });

    console.log(`Found ${patientsToUpdate.length} patients to update with new fields`);

    let updatedCount = 0;
    for (const patient of patientsToUpdate) {
      try {
        const updateFields = {};
        
        if (!patient.emergencyContact) {
          updateFields.emergencyContact = {
            name: '',
            relationship: '',
            phone: ''
          };
        }
        
        if (!patient.chronicConditions) {
          updateFields.chronicConditions = [];
        }
        
        if (!patient.currentMedications) {
          updateFields.currentMedications = [];
        }
        
        if (!patient.pastSurgeries) {
          updateFields.pastSurgeries = [];
        }
        
        if (!patient.vaccinations) {
          updateFields.vaccinations = [];
        }
        
        if (!patient.extractedSymptoms) {
          updateFields.extractedSymptoms = [];
        }
        
        if (!patient.vitalSigns) {
          updateFields.vitalSigns = [];
        }
        
        if (!patient.labResults) {
          updateFields.labResults = [];
        }

        if (Object.keys(updateFields).length > 0) {
          await Patient.updateOne(
            { _id: patient._id },
            { $set: updateFields }
          );
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating patient ${patient.email}:`, error.message);
      }
    }

    console.log(`✓ Updated ${updatedCount} patients with new fields`);

    // 4. Verify Hospital collection structure
    console.log('\n4. Verifying Hospital collection structure...');
    
    const hospitalCount = await Hospital.countDocuments();
    console.log(`✓ Hospital collection exists with ${hospitalCount} documents`);

    // 5. Create sample data validation
    console.log('\n5. Running data validation...');
    
    // Check for any hospitals with invalid verification status
    const invalidHospitals = await Hospital.find({
      verificationStatus: { $nin: ['pending', 'verified', 'rejected'] }
    });
    
    if (invalidHospitals.length > 0) {
      console.log(`⚠ Found ${invalidHospitals.length} hospitals with invalid verification status`);
      for (const hospital of invalidHospitals) {
        await Hospital.updateOne(
          { _id: hospital._id },
          { $set: { verificationStatus: 'pending' } }
        );
      }
      console.log('✓ Fixed invalid verification statuses');
    } else {
      console.log('✓ All hospitals have valid verification status');
    }

    // Check for patients missing required blood group
    const patientsWithoutBloodGroup = await Patient.find({
      $or: [
        { bloodGroup: { $exists: false } },
        { bloodGroup: null },
        { bloodGroup: '' }
      ]
    });

    if (patientsWithoutBloodGroup.length > 0) {
      console.log(`⚠ Found ${patientsWithoutBloodGroup.length} patients without blood group`);
      console.log('Note: These patients may need blood group data for emergency access');
    } else {
      console.log('✓ All patients have blood group information');
    }

    console.log('\n=== Migration Summary ===');
    console.log('✓ Hospital collection indexes created');
    console.log('✓ Patient collection indexes created');
    console.log(`✓ ${updatedCount} patients updated with new fields`);
    console.log('✓ Data validation completed');
    console.log('========================\n');

    console.log('Hospital Feature database migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test hospital registration and verification');
    console.log('2. Test patient data API access');
    console.log('3. Verify symptom extraction functionality');
    
    process.exit(0);

  } catch (error) {
    console.error('Error during Hospital Feature migration:', error);
    process.exit(1);
  }
};

// Run migration
connectDB().then(() => migrateHospitalFeature());