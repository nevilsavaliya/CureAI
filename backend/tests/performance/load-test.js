/**
 * Load Testing Script
 * Tests system performance with multiple concurrent users
 */

const mongoose = require('mongoose');
const Case = require('../../models/Case');
const Message = require('../../models/Message');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');

// Test configuration
const NUM_PATIENTS = 10;
const NUM_DOCTORS = 5;
const CASES_PER_PATIENT = 3;
const MESSAGES_PER_CASE = 10;

async function createTestData() {
  console.log('Creating test data...');
  
  const patients = [];
  const doctors = [];

  // Create patients
  for (let i = 0; i < NUM_PATIENTS; i++) {
    const patient = await Patient.create({
      name: `Load Test Patient ${i}`,
      email: `load-patient-${i}@test.com`,
      password: 'TestPass123!',
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+'
    });
    patients.push(patient);
  }
  console.log(`✓ Created ${NUM_PATIENTS} patients`);

  // Create doctors
  for (let i = 0; i < NUM_DOCTORS; i++) {
    const doctor = await Doctor.create({
      name: `Load Test Doctor ${i}`,
      email: `load-doctor-${i}@test.com`,
      password: 'TestPass123!',
      dateOfBirth: '1985-01-01',
      degree: 'MBBS',
      specializations: ['General Medicine'],
      experienceYears: 5,
      subscriptionStatus: 'active'
    });
    doctors.push(doctor);
  }
  console.log(`✓ Created ${NUM_DOCTORS} doctors`);

  return { patients, doctors };
}

async function createCases(patients, doctors) {
  console.log('\nCreating cases...');
  const cases = [];
  
  for (const patient of patients) {
    for (let i = 0; i < CASES_PER_PATIENT; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const caseData = await Case.create({
        patientId: patient._id,
        doctorId: doctor._id,
        symptoms: ['headache', 'fever'],
        predictedConditions: ['Common Cold'],
        status: 'ongoing',
        acceptedAt: new Date()
      });
      cases.push(caseData);
    }
  }
  
  console.log(`✓ Created ${cases.length} cases`);
  return cases;
}

async function createMessages(cases) {
  console.log('\nCreating messages...');
  let messageCount = 0;
  
  for (const caseData of cases) {
    for (let i = 0; i < MESSAGES_PER_CASE; i++) {
      const isPatientSender = i % 2 === 0;
      
      await Message.create({
        caseId: caseData._id,
        senderId: isPatientSender ? caseData.patientId : caseData.doctorId,
        senderModel: isPatientSender ? 'Patient' : 'Doctor',
        recipientId: isPatientSender ? caseData.doctorId : caseData.patientId,
        recipientModel: isPatientSender ? 'Doctor' : 'Patient',
        content: `Test message ${i + 1}`,
        messageType: 'text'
      });
      messageCount++;
    }
  }
  
  console.log(`✓ Created ${messageCount} messages`);
}

async function runPerformanceTests(patients, doctors, cases) {
  console.log('\n=== Running Performance Tests ===\n');
  
  // Test 1: Query all cases for a patient
  console.log('Test 1: Query cases for patient');
  const patient = patients[0];
  const start1 = Date.now();
  const patientCases = await Case.find({ patientId: patient._id })
    .populate('doctorId', 'name specializations')
    .sort({ createdAt: -1 });
  const time1 = Date.now() - start1;
  console.log(`  ✓ Retrieved ${patientCases.length} cases in ${time1}ms`);

  // Test 2: Query all cases for a doctor
  console.log('\nTest 2: Query cases for doctor');
  const doctor = doctors[0];
  const start2 = Date.now();
  const doctorCases = await Case.find({ doctorId: doctor._id })
    .populate('patientId', 'name bloodGroup')
    .sort({ createdAt: -1 });
  const time2 = Date.now() - start2;
  console.log(`  ✓ Retrieved ${doctorCases.length} cases in ${time2}ms`);

  // Test 3: Query messages for a case
  console.log('\nTest 3: Query messages for case');
  const testCase = cases[0];
  const start3 = Date.now();
  const messages = await Message.find({ caseId: testCase._id })
    .sort({ createdAt: 1 });
  const time3 = Date.now() - start3;
  console.log(`  ✓ Retrieved ${messages.length} messages in ${time3}ms`);

  // Test 4: Filter cases by status
  console.log('\nTest 4: Filter cases by status');
  const start4 = Date.now();
  const ongoingCases = await Case.find({ status: 'ongoing' })
    .populate('patientId doctorId')
    .sort({ createdAt: -1 });
  const time4 = Date.now() - start4;
  console.log(`  ✓ Retrieved ${ongoingCases.length} ongoing cases in ${time4}ms`);

  // Test 5: Concurrent case queries
  console.log('\nTest 5: Concurrent case queries (simulating multiple users)');
  const start5 = Date.now();
  const promises = patients.map(p => 
    Case.find({ patientId: p._id }).populate('doctorId')
  );
  await Promise.all(promises);
  const time5 = Date.now() - start5;
  console.log(`  ✓ Completed ${promises.length} concurrent queries in ${time5}ms`);
  console.log(`  ✓ Average time per query: ${(time5 / promises.length).toFixed(2)}ms`);

  // Test 6: Concurrent message queries
  console.log('\nTest 6: Concurrent message queries');
  const start6 = Date.now();
  const messagePromises = cases.slice(0, 20).map(c => 
    Message.find({ caseId: c._id }).sort({ createdAt: 1 })
  );
  await Promise.all(messagePromises);
  const time6 = Date.now() - start6;
  console.log(`  ✓ Completed ${messagePromises.length} concurrent queries in ${time6}ms`);
  console.log(`  ✓ Average time per query: ${(time6 / messagePromises.length).toFixed(2)}ms`);

  // Test 7: Complex aggregation query
  console.log('\nTest 7: Complex aggregation (cases per doctor)');
  const start7 = Date.now();
  const aggregation = await Case.aggregate([
    {
      $group: {
        _id: '$doctorId',
        totalCases: { $sum: 1 },
        ongoingCases: {
          $sum: { $cond: [{ $eq: ['$status', 'ongoing'] }, 1, 0] }
        },
        treatedCases: {
          $sum: { $cond: [{ $eq: ['$status', 'treated'] }, 1, 0] }
        }
      }
    }
  ]);
  const time7 = Date.now() - start7;
  console.log(`  ✓ Aggregated data for ${aggregation.length} doctors in ${time7}ms`);

  // Performance summary
  console.log('\n=== Performance Summary ===');
  console.log(`Total test data:`);
  console.log(`  - Patients: ${NUM_PATIENTS}`);
  console.log(`  - Doctors: ${NUM_DOCTORS}`);
  console.log(`  - Cases: ${cases.length}`);
  console.log(`  - Messages: ${cases.length * MESSAGES_PER_CASE}`);
  console.log(`\nQuery performance:`);
  console.log(`  - Single patient cases: ${time1}ms`);
  console.log(`  - Single doctor cases: ${time2}ms`);
  console.log(`  - Case messages: ${time3}ms`);
  console.log(`  - Status filter: ${time4}ms`);
  console.log(`  - Concurrent queries (${promises.length}): ${time5}ms (avg: ${(time5 / promises.length).toFixed(2)}ms)`);
  console.log(`  - Concurrent messages (${messagePromises.length}): ${time6}ms (avg: ${(time6 / messagePromises.length).toFixed(2)}ms)`);
  console.log(`  - Aggregation: ${time7}ms`);
}

async function cleanup() {
  console.log('\nCleaning up test data...');
  await Patient.deleteMany({ email: /load-.*@test\.com/ });
  await Doctor.deleteMany({ email: /load-.*@test\.com/ });
  await Case.deleteMany({});
  await Message.deleteMany({});
  console.log('✓ Cleanup complete');
}

async function runLoadTest() {
  try {
    console.log('=== Case Management Load Test ===\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    console.log('✓ Connected to database\n');

    // Create test data
    const { patients, doctors } = await createTestData();
    const cases = await createCases(patients, doctors);
    await createMessages(cases);

    // Run performance tests
    await runPerformanceTests(patients, doctors, cases);

    // Cleanup
    await cleanup();

    console.log('\n✓ Load test complete!');
    
  } catch (error) {
    console.error('Error running load test:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run load test
if (require.main === module) {
  runLoadTest();
}

module.exports = runLoadTest;
