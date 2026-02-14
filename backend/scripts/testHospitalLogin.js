#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const bcrypt = require('bcrypt');

async function testHospitalLogin() {
  try {
    console.log('🔍 Testing Hospital Login Process');
    console.log('================================');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Test with the existing hospital
    const testEmail = 'savaliyanevil9@gmail.com';
    console.log(`\n🧪 Testing login for: ${testEmail}`);
    
    // Step 1: Find hospital
    console.log('\n📋 Step 1: Finding hospital...');
    const hospital = await Hospital.findOne({ email: testEmail.toLowerCase() });
    
    if (!hospital) {
      console.log('❌ Hospital not found');
      return;
    }
    
    console.log('✅ Hospital found:');
    console.log(`   Name: ${hospital.hospitalName}`);
    console.log(`   Email: ${hospital.email}`);
    console.log(`   Status: ${hospital.verificationStatus}`);
    console.log(`   Password hash: ${hospital.password.substring(0, 20)}...`);
    
    // Step 2: Test password comparison with a known password
    console.log('\n📋 Step 2: Testing password comparison...');
    
    // Let's try some common passwords that might have been used
    const testPasswords = [
      'password123',
      'admin123',
      'hospital123',
      'nevil123',
      '12345678',
      'Password123',
      'Nevil@123'
    ];
    
    console.log('Testing common passwords...');
    let passwordFound = false;
    
    for (const testPassword of testPasswords) {
      try {
        const isMatch = await hospital.comparePassword(testPassword);
        if (isMatch) {
          console.log(`✅ Password match found: "${testPassword}"`);
          passwordFound = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Error testing password "${testPassword}": ${error.message}`);
      }
    }
    
    if (!passwordFound) {
      console.log('❌ None of the test passwords matched');
      console.log('💡 The hospital might have a different password');
      
      // Let's check if the password hash is valid
      console.log('\n📋 Step 3: Checking password hash validity...');
      const isValidHash = hospital.password.startsWith('$2b$') || hospital.password.startsWith('$2a$');
      console.log(`   Hash format valid: ${isValidHash ? '✅' : '❌'}`);
      console.log(`   Hash length: ${hospital.password.length} characters`);
      
      if (!isValidHash) {
        console.log('⚠️  Password might not be properly hashed!');
      }
    }
    
    // Step 3: Check verification status
    console.log('\n📋 Step 4: Checking verification status...');
    if (hospital.verificationStatus !== 'verified') {
      console.log(`❌ Hospital not verified. Status: ${hospital.verificationStatus}`);
    } else {
      console.log('✅ Hospital is verified');
    }
    
    // Step 4: Test JWT token generation
    console.log('\n📋 Step 5: Testing JWT token generation...');
    const jwt = require('jsonwebtoken');
    
    try {
      const token = jwt.sign(
        {
          id: hospital._id,
          role: 'hospital',
          email: hospital.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      console.log('✅ JWT token generated successfully');
      console.log(`   Token preview: ${token.substring(0, 50)}...`);
    } catch (error) {
      console.log(`❌ JWT token generation failed: ${error.message}`);
    }
    
    // Step 5: Create a test hospital with known password for testing
    console.log('\n📋 Step 6: Creating test hospital with known password...');
    
    const testHospitalEmail = 'test-hospital@example.com';
    const testPassword = 'TestPassword123!';
    
    // Check if test hospital already exists
    const existingTestHospital = await Hospital.findOne({ email: testHospitalEmail });
    
    if (existingTestHospital) {
      console.log('Test hospital already exists, deleting...');
      await Hospital.deleteOne({ email: testHospitalEmail });
    }
    
    // Create new test hospital
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const testHospital = new Hospital({
      name: 'Test Admin',
      email: testHospitalEmail,
      password: hashedPassword,
      hospitalName: 'Test Hospital',
      registrationNumber: 'TEST123456',
      contactNumber: '+1234567890',
      verificationStatus: 'verified'
    });
    
    await testHospital.save();
    console.log('✅ Test hospital created');
    console.log(`   Email: ${testHospitalEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('   Status: verified');
    
    // Test login with the test hospital
    console.log('\n📋 Step 7: Testing login with test hospital...');
    const isTestMatch = await testHospital.comparePassword(testPassword);
    console.log(`   Password comparison: ${isTestMatch ? '✅ Success' : '❌ Failed'}`);
    
    if (isTestMatch) {
      console.log('\n🎉 Login process should work!');
      console.log('💡 Try logging in with:');
      console.log(`   Email: ${testHospitalEmail}`);
      console.log(`   Password: ${testPassword}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

testHospitalLogin();