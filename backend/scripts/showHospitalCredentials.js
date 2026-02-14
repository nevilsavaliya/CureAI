#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');

async function showCredentials() {
  try {
    console.log('🔍 Current Hospital Login Credentials');
    console.log('===================================');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hospitals = await Hospital.find({ verificationStatus: 'verified' }, {
      name: 1,
      hospitalName: 1,
      email: 1,
      verificationStatus: 1
    });
    
    console.log('✅ Verified hospitals that can login:');
    hospitals.forEach((hospital, index) => {
      console.log(`\n${index + 1}. ${hospital.hospitalName}`);
      console.log(`   Email: ${hospital.email}`);
      console.log(`   Contact: ${hospital.name}`);
      console.log(`   Status: ${hospital.verificationStatus}`);
    });
    
    // The hospital we updated in the test
    const testHospital = await Hospital.findOne({ email: 'savaliyanevil9@gmail.com' });
    if (testHospital) {
      console.log('\n🔑 Test Credentials (updated in previous test):');
      console.log(`   Email: savaliyanevil9@gmail.com`);
      console.log(`   Password: KnownPassword123!`);
      console.log(`   Status: ${testHospital.verificationStatus}`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

showCredentials();