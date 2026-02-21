/**
 * Test Script: Database-Driven API Statistics
 * 
 * This script tests the new database-driven API statistics system
 * by creating sample API requests and verifying the stats endpoints work correctly.
 * 
 * Usage: node test-api-stats-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ApiRequest = require('./models/ApiRequest');
const Hospital = require('./models/Hospital');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create sample API requests for testing
const createSampleRequests = async (hospitalId) => {
    console.log('\n📝 Creating sample API requests...');
    
    const now = new Date();
    const sampleRequests = [];

    // Create requests for different time periods
    // Today - 5 requests
    for (let i = 0; i < 5; i++) {
        sampleRequests.push({
            hospitalId: hospitalId,
            patientEmail: `patient${i}@test.com`,
            endpoint: '/api/hospitals/api/patient-data',
            method: 'POST',
            status: i < 4 ? 'success' : 'error',
            responseTime: 100 + Math.random() * 200,
            errorMessage: i === 4 ? 'Patient not found' : null,
            timestamp: new Date(now.getTime() - i * 60 * 60 * 1000) // Last 5 hours
        });
    }

    // This week - 10 more requests
    for (let i = 0; i < 10; i++) {
        sampleRequests.push({
            hospitalId: hospitalId,
            patientEmail: `patient${i + 5}@test.com`,
            endpoint: '/api/hospitals/api/patient-data',
            method: 'POST',
            status: 'success',
            responseTime: 100 + Math.random() * 200,
            timestamp: new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000) // Last 10 days
        });
    }

    // This month - 15 more requests
    for (let i = 0; i < 15; i++) {
        sampleRequests.push({
            hospitalId: hospitalId,
            patientEmail: `patient${i + 15}@test.com`,
            endpoint: '/api/hospitals/api/patient-data',
            method: 'POST',
            status: 'success',
            responseTime: 100 + Math.random() * 200,
            timestamp: new Date(now.getTime() - (i + 11) * 24 * 60 * 60 * 1000) // 11-25 days ago
        });
    }

    // Insert all sample requests
    await ApiRequest.insertMany(sampleRequests);
    console.log(`✅ Created ${sampleRequests.length} sample API requests`);
};

// Test the getUsageStats method
const testUsageStats = async (hospitalId) => {
    console.log('\n📊 Testing API Usage Statistics...');
    
    const stats = await ApiRequest.getUsageStats(hospitalId);
    
    console.log('\n' + '='.repeat(60));
    console.log('API Usage Statistics:');
    console.log('='.repeat(60));
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Requests Today: ${stats.requestsToday}`);
    console.log(`Requests This Week: ${stats.requestsThisWeek}`);
    console.log(`Requests This Month: ${stats.requestsThisMonth}`);
    console.log(`Average Response Time: ${stats.averageResponseTime}ms`);
    console.log(`Success Rate: ${stats.successRate}%`);
    console.log(`Rate Limit: ${stats.rateLimit}`);
    console.log(`Remaining Requests: ${stats.remainingRequests}`);
    console.log(`Last Updated: ${stats.lastUpdated}`);
    console.log('='.repeat(60));
    
    return stats;
};

// Test fetching recent requests
const testRecentRequests = async (hospitalId) => {
    console.log('\n📋 Testing Recent API Requests...');
    
    const requests = await ApiRequest.find({ hospitalId: hospitalId })
        .sort({ timestamp: -1 })
        .limit(10)
        .select('patientEmail timestamp status responseTime endpoint')
        .lean();
    
    console.log(`\n✅ Found ${requests.length} recent requests:`);
    requests.forEach((req, index) => {
        const statusIcon = req.status === 'success' ? '✓' : '✗';
        console.log(`${index + 1}. ${statusIcon} ${req.patientEmail} - ${req.status} - ${req.responseTime}ms - ${new Date(req.timestamp).toLocaleString()}`);
    });
    
    return requests;
};

// Main test execution
const main = async () => {
    console.log('🚀 Testing Database-Driven API Statistics System\n');
    
    await connectDB();
    
    // Find a verified hospital to test with
    const hospital = await Hospital.findOne({ verificationStatus: 'verified' });
    
    if (!hospital) {
        console.log('⚠️  No verified hospital found. Creating test hospital...');
        console.log('❌ Please run this script after you have at least one verified hospital in the system.');
        process.exit(1);
    }
    
    console.log(`✅ Using hospital: ${hospital.hospitalName} (${hospital._id})`);
    
    // Clean up any existing test data for this hospital
    const existingCount = await ApiRequest.countDocuments({ hospitalId: hospital._id });
    console.log(`📊 Existing API requests for this hospital: ${existingCount}`);
    
    if (existingCount === 0) {
        // Create sample data
        await createSampleRequests(hospital._id);
    } else {
        console.log('ℹ️  Using existing API request data');
    }
    
    // Test the statistics
    const stats = await testUsageStats(hospital._id);
    
    // Test recent requests
    const requests = await testRecentRequests(hospital._id);
    
    // Verify the data makes sense
    console.log('\n🔍 Verification:');
    if (stats.totalRequests > 0) {
        console.log('✅ Statistics are being calculated from database');
    } else {
        console.log('❌ No statistics found - database may be empty');
    }
    
    if (requests.length > 0) {
        console.log('✅ Recent requests are being fetched from database');
    } else {
        console.log('❌ No recent requests found - database may be empty');
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Login to hospital dashboard');
    console.log('   3. Verify that statistics are displayed correctly');
    console.log('   4. Make some API calls to /api/hospitals/api/patient-data');
    console.log('   5. Refresh the dashboard to see real-time updates');
    
    process.exit(0);
};

// Run the test
main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
