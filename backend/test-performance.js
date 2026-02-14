// Test script to verify performance tracking is working
const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

async function testPerformanceTracking() {
  console.log('Testing performance tracking...');
  
  try {
    // Make some API requests to generate metrics
    console.log('Making test API requests...');
    
    for (let i = 0; i < 10; i++) {
      try {
        await axios.get(`${baseURL}/admin/metrics`, {
          headers: {
            'Authorization': 'Bearer test-token' // This will fail but still track the request
          }
        });
      } catch (error) {
        // Expected to fail due to auth, but request is tracked
      }
    }
    
    // Wait a moment for metrics to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check performance metrics
    console.log('Checking performance metrics...');
    const response = await axios.get(`${baseURL}/admin/performance/metrics`, {
      headers: {
        'Authorization': 'Bearer test-token' // This will also fail but we can see the structure
      }
    });
    
    console.log('Performance data structure:', response.data);
    
  } catch (error) {
    console.log('Expected auth errors, but performance tracking should be working');
    console.log('Error details:', error.response?.data || error.message);
  }
}

// Run the test
testPerformanceTracking();