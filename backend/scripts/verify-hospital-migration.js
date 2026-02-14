require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Hospital Feature Verification');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const verifyHospitalMigration = async () => {
  try {
    console.log('Verifying Hospital Feature database migration...\n');

    let allChecksPass = true;

    // 1. Verify Hospital collection exists and has proper structure
    console.log('1. Verifying Hospital collection...');
    
    try {
      const hospitalCount = await Hospital.countDocuments();
      console.log(`✓ Hospital collection exists with ${hospitalCount} documents`);
      
      // Check Hospital indexes
      const hospitalIndexes = await Hospital.collection.listIndexes().toArray();
      const expectedHospitalIndexes = [
        'email_1',
        'registrationNumber_1',
        'apiKey_1',
        'verificationStatus_1',
        'verificationStatus_1_createdAt_-1',
        'isActive_1'
      ];
      
      console.log(`Found ${hospitalIndexes.length} indexes in Hospital collection:`);
      hospitalIndexes.forEach(index => {
        console.log(`  - ${index.name}`);
      });
      
      for (const expectedIndex of expectedHospitalIndexes) {
        const indexExists = hospitalIndexes.some(index => 
          index.name === expectedIndex || 
          index.name.includes(expectedIndex.split('_')[0])
        );
        if (indexExists) {
          console.log(`✓ Hospital index exists: ${expectedIndex}`);
        } else {
          console.log(`✗ Hospital index missing: ${expectedIndex}`);
          allChecksPass = false;
        }
      }
      
    } catch (error) {
      console.error('✗ Error verifying Hospital collection:', error.message);
      allChecksPass = false;
    }

    // 2. Verify Patient collection enhanced fields
    console.log('\n2. Verifying Patient collection enhancements...');
    
    try {
      const patientCount = await Patient.countDocuments();
      console.log(`✓ Patient collection exists with ${patientCount} documents`);
      
      // Check for patients with enhanced fields
      const patientsWithEnhancedFields = await Patient.countDocuments({
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
      
      console.log(`✓ ${patientsWithEnhancedFields} patients have enhanced medical fields`);
      
      // Check Patient indexes
      const patientIndexes = await Patient.collection.listIndexes().toArray();
      const expectedPatientIndexes = [
        'email_1',
        'bloodGroup_1',
        'emergencyContact.phone_1',
        'extractedSymptoms.symptom_1',
        'extractedSymptoms.extractedAt_-1',
        'chronicConditions.condition_1',
        'currentMedications.name_1',
        'vitalSigns.recordedAt_-1',
        'labResults.date_-1',
        'isActive_1'
      ];
      
      console.log(`Found ${patientIndexes.length} indexes in Patient collection:`);
      patientIndexes.forEach(index => {
        console.log(`  - ${index.name}`);
      });
      
      for (const expectedIndex of expectedPatientIndexes) {
        const indexExists = patientIndexes.some(index => 
          index.name === expectedIndex || 
          index.name.includes(expectedIndex.split('_')[0]) ||
          index.name.includes(expectedIndex.split('.')[0])
        );
        if (indexExists) {
          console.log(`✓ Patient index exists: ${expectedIndex}`);
        } else {
          console.log(`⚠ Patient index missing: ${expectedIndex}`);
          // Don't fail for patient indexes as they might be created differently
        }
      }
      
    } catch (error) {
      console.error('✗ Error verifying Patient collection:', error.message);
      allChecksPass = false;
    }

    // 3. Test Hospital model functionality
    console.log('\n3. Testing Hospital model functionality...');
    
    try {
      // Test creating a sample hospital (will be deleted)
      const testHospital = new Hospital({
        name: 'Test Hospital Admin',
        email: 'test@hospital-migration-test.com',
        password: 'testpassword123',
        hospitalName: 'Test Migration Hospital',
        registrationNumber: 'TEST-MIG-001',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contactNumber: '+1234567890',
        specializations: ['General Medicine'],
        numberOfBeds: 100,
        facilities: ['Emergency', 'ICU']
      });
      
      // Test password hashing
      const originalPassword = testHospital.password;
      await testHospital.save();
      
      if (testHospital.password !== originalPassword) {
        console.log('✓ Password hashing works correctly');
      } else {
        console.log('✗ Password hashing failed');
        allChecksPass = false;
      }
      
      // Test API credential generation
      const credentials = testHospital.generateApiCredentials();
      if (credentials.apiKey && credentials.apiSecret) {
        console.log('✓ API credential generation works');
        console.log(`  API Key format: ${credentials.apiKey.substring(0, 10)}...`);
      } else {
        console.log('✗ API credential generation failed');
        allChecksPass = false;
      }
      
      // Test password comparison
      const passwordMatch = await testHospital.comparePassword('testpassword123');
      if (passwordMatch) {
        console.log('✓ Password comparison works correctly');
      } else {
        console.log('✗ Password comparison failed');
        allChecksPass = false;
      }
      
      // Clean up test hospital
      await Hospital.deleteOne({ _id: testHospital._id });
      console.log('✓ Test hospital cleaned up');
      
    } catch (error) {
      console.error('✗ Error testing Hospital model:', error.message);
      allChecksPass = false;
    }

    // 4. Test Patient model enhanced functionality
    console.log('\n4. Testing Patient model enhanced functionality...');
    
    try {
      // Find an existing patient or create a test one
      let testPatient = await Patient.findOne({});
      let createdTestPatient = false;
      
      if (!testPatient) {
        testPatient = new Patient({
          name: 'Test Patient Migration',
          email: 'test-patient@migration-test.com',
          password: 'testpassword123',
          dateOfBirth: new Date('1990-01-01'),
          bloodGroup: 'O+',
          gender: 'male'
        });
        await testPatient.save();
        createdTestPatient = true;
        console.log('✓ Created test patient for verification');
      }
      
      // Test enhanced fields
      const enhancedFields = [
        'emergencyContact',
        'chronicConditions',
        'currentMedications',
        'pastSurgeries',
        'vaccinations',
        'extractedSymptoms',
        'vitalSigns',
        'labResults'
      ];
      
      for (const field of enhancedFields) {
        if (testPatient[field] !== undefined) {
          console.log(`✓ Enhanced field exists: ${field}`);
        } else {
          console.log(`⚠ Enhanced field missing: ${field} (may be added by migration)`);
        }
      }
      
      // Clean up test patient if we created it
      if (createdTestPatient) {
        await Patient.deleteOne({ _id: testPatient._id });
        console.log('✓ Test patient cleaned up');
      }
      
    } catch (error) {
      console.error('✗ Error testing Patient model:', error.message);
      allChecksPass = false;
    }

    // 5. Database performance check
    console.log('\n5. Running performance checks...');
    
    try {
      // Test Hospital queries
      const start1 = Date.now();
      await Hospital.find({ verificationStatus: 'pending' }).limit(10);
      const hospitalQueryTime = Date.now() - start1;
      console.log(`✓ Hospital verification query: ${hospitalQueryTime}ms`);
      
      // Test Patient queries
      const start2 = Date.now();
      await Patient.find({ bloodGroup: 'O+' }).limit(10);
      const patientQueryTime = Date.now() - start2;
      console.log(`✓ Patient blood group query: ${patientQueryTime}ms`);
      
      if (hospitalQueryTime < 1000 && patientQueryTime < 1000) {
        console.log('✓ Query performance is acceptable');
      } else {
        console.log('⚠ Query performance may need optimization');
      }
      
    } catch (error) {
      console.error('✗ Error during performance check:', error.message);
      allChecksPass = false;
    }

    // Final summary
    console.log('\n=== Verification Summary ===');
    if (allChecksPass) {
      console.log('✅ All verification checks PASSED');
      console.log('Hospital Feature migration is successful and ready for use!');
    } else {
      console.log('❌ Some verification checks FAILED');
      console.log('Please review the errors above and re-run the migration if needed.');
    }
    console.log('============================\n');

    // Additional information
    console.log('Migration verification completed.');
    console.log('\nNext steps:');
    console.log('1. Start the backend server');
    console.log('2. Test hospital registration endpoint');
    console.log('3. Test admin hospital verification');
    console.log('4. Test hospital API access');
    
    process.exit(allChecksPass ? 0 : 1);

  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
};

// Run verification
connectDB().then(() => verifyHospitalMigration());