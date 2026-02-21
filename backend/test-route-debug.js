const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testRoute() {
  try {
    // Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin'
    });
    
    const token = loginResponse.data.token;
    console.log('Logged in successfully\n');
    
    // Test different endpoints
    const endpoints = [
      '/admin/users?userType=patient&page=1&limit=10',
      '/admin/users',
      '/admin/audit-logs',
      '/admin/metrics'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\nTesting: ${endpoint}`);
      console.log('='.repeat(50));
      
      try {
        const response = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Success!');
        console.log('Status:', response.status);
        console.log('Keys in response:', Object.keys(response.data));
        
      } catch (error) {
        console.log('❌ Failed!');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRoute();
