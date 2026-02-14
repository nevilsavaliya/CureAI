#!/usr/bin/env node
/**
 * Healthcare Platform Frontend - Deployment Validation Script
 * Validates that the deployed frontend is working correctly
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class DeploymentValidator {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    const icon = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Healthcare-Platform-Validator/1.0',
          ...options.headers
        },
        timeout: options.timeout || 10000
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTest(test) {
    try {
      this.log(`Running: ${test.name}`, 'info');
      await test.testFn();
      this.log(`✓ ${test.name}`, 'success');
      this.results.passed++;
    } catch (error) {
      this.log(`✗ ${test.name}: ${error.message}`, 'error');
      this.results.failed++;
    }
    this.results.total++;
  }

  async validate(frontendUrl, backendUrl) {
    this.log('🧪 Starting deployment validation...', 'info');
    this.log(`Frontend URL: ${frontendUrl}`, 'info');
    this.log(`Backend URL: ${backendUrl}`, 'info');

    // Test 1: Frontend accessibility
    this.addTest('Frontend site loads', async () => {
      const response = await this.makeRequest(frontendUrl);
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      if (!response.body.includes('<title>')) {
        throw new Error('Response does not contain HTML title tag');
      }
    });

    // Test 2: Angular app loads
    this.addTest('Angular application loads', async () => {
      const response = await this.makeRequest(frontendUrl);
      if (!response.body.includes('ng-version') && !response.body.includes('app-root')) {
        throw new Error('Angular application markers not found');
      }
    });

    // Test 3: Security headers
    this.addTest('Security headers present', async () => {
      const response = await this.makeRequest(frontendUrl);
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options'
      ];
      
      for (const header of requiredHeaders) {
        if (!response.headers[header]) {
          throw new Error(`Missing security header: ${header}`);
        }
      }
    });

    // Test 4: SPA routing works
    this.addTest('SPA routing works', async () => {
      const testRoutes = ['/login', '/signup', '/hospital/register'];
      
      for (const route of testRoutes) {
        const response = await this.makeRequest(frontendUrl + route);
        if (response.statusCode !== 200) {
          throw new Error(`Route ${route} returned ${response.statusCode}`);
        }
      }
    });

    // Test 5: Static assets load
    this.addTest('Static assets accessible', async () => {
      const response = await this.makeRequest(frontendUrl);
      const cssMatch = response.body.match(/href="([^"]*\.css)"/);
      const jsMatch = response.body.match(/src="([^"]*\.js)"/);
      
      if (cssMatch) {
        const cssUrl = cssMatch[1].startsWith('http') ? cssMatch[1] : frontendUrl + cssMatch[1];
        const cssResponse = await this.makeRequest(cssUrl);
        if (cssResponse.statusCode !== 200) {
          throw new Error(`CSS file not accessible: ${cssResponse.statusCode}`);
        }
      }
      
      if (jsMatch) {
        const jsUrl = jsMatch[1].startsWith('http') ? jsMatch[1] : frontendUrl + jsMatch[1];
        const jsResponse = await this.makeRequest(jsUrl);
        if (jsResponse.statusCode !== 200) {
          throw new Error(`JS file not accessible: ${jsResponse.statusCode}`);
        }
      }
    });

    // Test 6: API proxy works (if configured)
    this.addTest('API proxy configuration', async () => {
      try {
        const apiUrl = frontendUrl + '/api/health';
        const response = await this.makeRequest(apiUrl);
        
        // If we get a response, the proxy is working
        if (response.statusCode === 200 || response.statusCode === 404) {
          // 404 is OK if health endpoint doesn't exist
          return;
        }
        
        throw new Error(`API proxy returned unexpected status: ${response.statusCode}`);
      } catch (error) {
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          // This might be expected if API proxy is not configured
          this.log('API proxy not configured (this may be intentional)', 'warning');
          return;
        }
        throw error;
      }
    });

    // Test 7: Backend connectivity (direct)
    if (backendUrl) {
      this.addTest('Backend connectivity', async () => {
        const healthUrl = backendUrl + '/api/health';
        const response = await this.makeRequest(healthUrl);
        
        if (response.statusCode !== 200) {
          throw new Error(`Backend health check failed: ${response.statusCode}`);
        }
        
        const healthData = JSON.parse(response.body);
        if (healthData.status !== 'OK') {
          throw new Error(`Backend health status: ${healthData.status}`);
        }
      });

      // Test 8: CORS configuration
      this.addTest('CORS configuration', async () => {
        const testUrl = backendUrl + '/api/hospitals/register';
        const response = await this.makeRequest(testUrl, {
          method: 'OPTIONS',
          headers: {
            'Origin': frontendUrl,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        });
        
        if (response.statusCode !== 200 && response.statusCode !== 204) {
          throw new Error(`CORS preflight failed: ${response.statusCode}`);
        }
        
        const corsHeader = response.headers['access-control-allow-origin'];
        if (!corsHeader || (corsHeader !== '*' && corsHeader !== frontendUrl)) {
          throw new Error(`CORS not configured for frontend origin: ${corsHeader}`);
        }
      });
    }

    // Test 9: Performance check
    this.addTest('Performance check', async () => {
      const startTime = Date.now();
      await this.makeRequest(frontendUrl);
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 5000) {
        throw new Error(`Site load time too slow: ${loadTime}ms`);
      }
      
      this.log(`Load time: ${loadTime}ms`, 'info');
    });

    // Test 10: Mobile viewport
    this.addTest('Mobile viewport configured', async () => {
      const response = await this.makeRequest(frontendUrl);
      if (!response.body.includes('viewport')) {
        throw new Error('Mobile viewport meta tag not found');
      }
    });

    // Run all tests
    for (const test of this.tests) {
      await this.runTest(test);
    }

    // Generate report
    this.generateReport(frontendUrl, backendUrl);
  }

  generateReport(frontendUrl, backendUrl) {
    console.log('\n' + '='.repeat(60));
    this.log('🧪 DEPLOYMENT VALIDATION REPORT', 'info');
    console.log('='.repeat(60));
    
    console.log(`Frontend URL: ${frontendUrl}`);
    if (backendUrl) {
      console.log(`Backend URL: ${backendUrl}`);
    }
    console.log('');
    
    console.log(`Tests Passed: ${this.results.passed}/${this.results.total}`);
    console.log(`Tests Failed: ${this.results.failed}/${this.results.total}`);
    
    const successRate = (this.results.passed / this.results.total * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);
    
    console.log('');
    
    if (this.results.failed === 0) {
      this.log('🎉 All tests passed! Your deployment is working correctly.', 'success');
    } else if (this.results.failed <= 2) {
      this.log('⚠️ Most tests passed with minor issues. Check the failures above.', 'warning');
    } else {
      this.log('❌ Multiple tests failed. Please review and fix the issues.', 'error');
    }
    
    console.log('\n📋 Next Steps:');
    if (this.results.failed === 0) {
      console.log('- ✅ Your frontend is ready for production use');
      console.log('- 🔧 Configure custom domain if needed');
      console.log('- 📊 Set up monitoring and analytics');
      console.log('- 🧪 Run end-to-end tests');
    } else {
      console.log('- 🔍 Review failed tests above');
      console.log('- 🛠️ Fix configuration issues');
      console.log('- 🔄 Re-run validation after fixes');
      console.log('- 📞 Check deployment platform documentation');
    }
    
    console.log('\n🔗 Useful Links:');
    console.log(`- Frontend: ${frontendUrl}`);
    if (backendUrl) {
      console.log(`- Backend Health: ${backendUrl}/api/health`);
      console.log(`- API Docs: ${backendUrl}/api-docs`);
    }
    
    console.log('='.repeat(60));
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node validate-deployment.js <frontend-url> [backend-url]');
    console.log('');
    console.log('Examples:');
    console.log('  node validate-deployment.js https://my-app.netlify.app');
    console.log('  node validate-deployment.js https://my-app.vercel.app https://api.example.com');
    console.log('  node validate-deployment.js http://localhost:8080 http://localhost:3000');
    process.exit(1);
  }
  
  const frontendUrl = args[0].replace(/\/$/, ''); // Remove trailing slash
  const backendUrl = args[1] ? args[1].replace(/\/$/, '') : null;
  
  const validator = new DeploymentValidator();
  validator.validate(frontendUrl, backendUrl).catch(error => {
    console.error('Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = DeploymentValidator;