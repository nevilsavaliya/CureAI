const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAdminAccess() {
  try {
    // Login
    console.log('Logging in as root admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin'
    });
    
    console.log('Login successful!');
    console.log('Token:', loginResponse.data.token.substring(0, 30) + '...');
    console.log('User:', loginResponse.data.user);
    console.log('');
    
    const token = loginResponse.data.token;
    
    // Try to access users endpoint
    console.log('Trying to access /api/admin/users...');
    try {
      const usersResponse = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userType: 'patient', page: 1, limit: 10 }
      });
      
      console.log('✅ Success!');
      console.log('Response:', JSON.stringify(usersResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Failed!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      console.log('Full error:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAdminAccess();
