/**
 * Test script to verify Swagger documentation is working
 */

const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: SUCCESS (${res.statusCode})`);
          resolve({ success: true, data });
        } else {
          console.log(`❌ ${description}: FAILED (${res.statusCode})`);
          resolve({ success: false, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: ERROR - ${error.message}`);
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏱️  ${description}: TIMEOUT`);
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Testing Swagger Documentation Endpoints\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health check
    await testEndpoint('/api/health', 'Health Check');

    // Test 2: Swagger UI HTML
    await testEndpoint('/api-docs/', 'Swagger UI HTML');

    // Test 3: OpenAPI JSON spec
    const jsonResult = await testEndpoint('/api-docs.json', 'OpenAPI JSON Spec');
    
    if (jsonResult.success) {
      try {
        const spec = JSON.parse(jsonResult.data);
        console.log('\n📊 OpenAPI Specification Details:');
        console.log(`   Title: ${spec.info.title}`);
        console.log(`   Version: ${spec.info.version}`);
        console.log(`   Servers: ${spec.servers.length}`);
        console.log(`   Tags: ${spec.tags.length}`);
        console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`);
        
        // List documented endpoints
        if (spec.paths) {
          console.log('\n📝 Documented Endpoints:');
          Object.keys(spec.paths).forEach(path => {
            const methods = Object.keys(spec.paths[path]).filter(m => m !== 'parameters');
            console.log(`   ${methods.map(m => m.toUpperCase()).join(', ')} ${path}`);
          });
        }
      } catch (e) {
        console.log('   ⚠️  Could not parse OpenAPI spec');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All tests completed!');
    console.log('\n📚 Access Swagger UI at: http://localhost:3000/api-docs');
    console.log('📄 Access OpenAPI JSON at: http://localhost:3000/api-docs.json\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
console.log('🔍 Checking if server is running on port 3000...\n');

const checkServer = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 2000
}, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Server is running!\n');
    runTests();
  } else {
    console.log('⚠️  Server responded but health check failed');
    runTests();
  }
});

checkServer.on('error', (error) => {
  console.error('❌ Server is not running!');
  console.error('   Please start the server first: npm run dev\n');
  process.exit(1);
});

checkServer.on('timeout', () => {
  console.error('⏱️  Server connection timeout');
  console.error('   Please start the server first: npm run dev\n');
  process.exit(1);
});

checkServer.end();
