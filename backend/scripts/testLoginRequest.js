#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function testLoginRequest() {
  try {
    console.log('🔍 Testing Hospital Login HTTP Request');
    console.log('=====================================');
    
    const baseURL = 'http://localhost:3000';
    
    // Test with the test hospital we created
    const loginData = {
      email: 'test-hospital@example.com',
      password: 'TestPassword123!'
    };
    
    console.log('📋 Testing login request...');
    console.log(`URL: ${baseURL}/api/hospitals/login`);
    console.log(`Email: ${loginData.email}`);
    console.log(`Password: ${loginData.password}`);
    
    try {
      const response = await axios.post(`${baseURL}/api/hospitals/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('\n✅ Login successful!');
      console.log('Response:', {
        status: response.status,
        success: response.data.success,
        message: response.data.message,
        hasToken: !!response.data.token,
        hospital: response.data.hospital
      });
      
    } catch (error) {
      if (error.response) {
        console.log('\n❌ Login failed with response:');
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      } else if (error.request) {
        console.log('\n❌ No response received:');
        console.log('Error:', error.message);
        console.log('💡 Make sure the server is running on port 3000');
      } else {
        console.log('\n❌ Request error:');
        console.log('Error:', error.message);
      }
    }
    
    // Also test with an existing hospital (if we know the password)
    console.log('\n📋 Testing with existing hospital...');
    
    // Let's try to reset the password for the existing hospital to a known value
    const mongoose = require('mongoose');
    const Hospital = require('../models/Hospital');
    const bcrypt = require('bcrypt');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const existingHospital = await Hospital.findOne({ email: 'savaliyanevil9@gmail.com' });
    if (existingHospital) {
      console.log('Found existing hospital, updating password to known value...');
      
      const newPassword = 'KnownPassword123!';
      existingHospital.password = newPassword; // This will trigger the pre-save hook
      await existingHospital.save();
      
      console.log('✅ Password updated');
      
      // Now test login with the known password
      try {
        const response2 = await axios.post(`${baseURL}/api/hospitals/login`, {
          email: 'savaliyanevil9@gmail.com',
          password: newPassword
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('\n✅ Existing hospital login successful!');
        console.log('Response:', {
          status: response2.status,
          success: response2.data.success,
          message: response2.data.message,
          hasToken: !!response2.data.token
        });
        
      } catch (error2) {
        if (error2.response) {
          console.log('\n❌ Existing hospital login failed:');
          console.log('Status:', error2.response.status);
          console.log('Data:', error2.response.data);
        } else {
          console.log('\n❌ Request error:', error2.message);
        }
      }
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testLoginRequest();