const jwt = require('jsonwebtoken');
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testTokenDecode() {
  try {
    // Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin'
    });
    
    const token = loginResponse.data.token;
    console.log('Token received\n');
    
    // Decode token without verification to see what's in it
    const decoded = jwt.decode(token);
    console.log('Decoded token:');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('');
    
    // Check the role
    console.log('Role in token:', decoded.role);
    console.log('Is role "admin"?', decoded.role === 'admin');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTokenDecode();
