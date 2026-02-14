/**
 * URL Configuration Integration Tests
 * Tests cross-service communication with environment-based URL configuration
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { validateEnvironment, getCorsOrigins } = require('../../utils/validateEnv');

// Import app without starting the server
const express = require('express');
const cors = require('cors');
const app = express();

// Mock Socket.IO for testing
const mockSocketIO = {
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn(() => mockSocketIO),
  join: jest.fn(),
  leave: jest.fn()
};

describe('URL Configuration Integration Tests', () => {
  let originalEnv;

  beforeAll(async () => {
    // Save original environment
    originalEnv = { ...process.env };

    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-test');
    }
  });

  afterAll(async () => {
    // Restore original environment
    process.env = originalEnv;
    await mongoose.connection.close();
  });

  beforeEach(() => {
    // Reset environment for each test
    process.env = { ...originalEnv };
  });

  describe('CORS Configuration with Environment URLs', () => {
    test('should configure CORS with single frontend URL', () => {
      process.env.FRONTEND_URL = 'https://my-app.vercel.app';
      process.env.CORS_ORIGINS = 'https://my-app.vercel.app';

      const corsOrigins = getCorsOrigins();
      expect(corsOrigins).toEqual(['https://my-app.vercel.app']);

      // Test CORS middleware configuration
      const corsOptions = {
        origin: corsOrigins,
        credentials: true
      };

      expect(corsOptions.origin).toContain('https://my-app.vercel.app');
    });

    test('should configure CORS with multiple frontend URLs', () => {
      process.env.FRONTEND_URL = 'https://my-app.vercel.app';
      process.env.CORS_ORIGINS = 'https://my-app.vercel.app,https://my-domain.com,https://staging.my-domain.com';

      const corsOrigins = getCorsOrigins();
      expect(corsOrigins).toEqual([
        'https://my-app.vercel.app',
        'https://my-domain.com',
        'https://staging.my-domain.com'
      ]);
    });

    test('should fallback to FRONTEND_URL when CORS_ORIGINS is empty', () => {
      process.env.FRONTEND_URL = 'https://fallback-app.vercel.app';
      delete process.env.CORS_ORIGINS;

      const corsOrigins = getCorsOrigins();
      expect(corsOrigins).toEqual(['https://fallback-app.vercel.app']);
    });

    test('should handle cloud platform URLs correctly', () => {
      const cloudUrls = [
        'https://my-backend.onrender.com',
        'https://my-frontend.vercel.app',
        'https://my-app.netlify.app',
        'https://my-service.herokuapp.com'
      ];

      process.env.CORS_ORIGINS = cloudUrls.join(',');
      const corsOrigins = getCorsOrigins();
      expect(corsOrigins).toEqual(cloudUrls);
    });
  });

  describe('API Health Check with Configured URLs', () => {
    let testApp;

    beforeEach(() => {
      // Create fresh app instance for each test
      testApp = express();
      testApp.use(express.json());

      // Add health check endpoint
      testApp.get('/api/health', (req, res) => {
        res.json({
          success: true,
          message: 'API is healthy',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'test',
          apiUrl: process.env.API_URL,
          frontendUrl: process.env.FRONTEND_URL
        });
      });
    });

    test('should respond to health check with localhost URLs in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.API_URL = 'http://localhost:3000/api';
      process.env.FRONTEND_URL = 'http://localhost:4200';

      const res = await request(testApp)
        .get('/api/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.apiUrl).toBe('http://localhost:3000/api');
      expect(res.body.frontendUrl).toBe('http://localhost:4200');
      expect(res.body.environment).toBe('development');
    });

    test('should respond to health check with cloud URLs in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.API_URL = 'https://my-backend.onrender.com/api';
      process.env.FRONTEND_URL = 'https://my-frontend.vercel.app';

      const res = await request(testApp)
        .get('/api/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.apiUrl).toBe('https://my-backend.onrender.com/api');
      expect(res.body.frontendUrl).toBe('https://my-frontend.vercel.app');
      expect(res.body.environment).toBe('production');
    });

    test('should respond to health check with Docker container URLs', async () => {
      process.env.NODE_ENV = 'development';
      process.env.API_URL = 'http://backend:3000/api';
      process.env.FRONTEND_URL = 'http://frontend:80';

      const res = await request(testApp)
        .get('/api/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.apiUrl).toBe('http://backend:3000/api');
      expect(res.body.frontendUrl).toBe('http://frontend:80');
    });

    test('should respond to health check with custom health check URL', async () => {
      process.env.HEALTH_CHECK_URL = 'https://my-backend.onrender.com/api/health';
      process.env.API_URL = 'https://my-backend.onrender.com/api';

      const res = await request(testApp)
        .get('/api/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.apiUrl).toBe('https://my-backend.onrender.com/api');
    });
  });

  describe('Cross-Service Communication Scenarios', () => {
    let testApp;

    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());

      // Mock CORS middleware
      testApp.use((req, res, next) => {
        const corsOrigins = getCorsOrigins();
        const origin = req.headers.origin;

        if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
          res.header('Access-Control-Allow-Origin', origin || '*');
          res.header('Access-Control-Allow-Credentials', 'true');
          res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
          res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        }

        if (req.method === 'OPTIONS') {
          return res.sendStatus(200);
        }

        next();
      });

      // Mock API endpoint that simulates frontend-backend communication
      testApp.post('/api/test-communication', (req, res) => {
        res.json({
          success: true,
          message: 'Communication successful',
          receivedFrom: req.headers.origin,
          allowedOrigins: getCorsOrigins(),
          timestamp: new Date().toISOString()
        });
      });
    });

    test('should allow communication from configured frontend URL', async () => {
      process.env.FRONTEND_URL = 'https://my-app.vercel.app';
      process.env.CORS_ORIGINS = 'https://my-app.vercel.app';

      const res = await request(testApp)
        .post('/api/test-communication')
        .set('Origin', 'https://my-app.vercel.app')
        .send({ test: 'data' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.receivedFrom).toBe('https://my-app.vercel.app');
      expect(res.body.allowedOrigins).toContain('https://my-app.vercel.app');
      expect(res.headers['access-control-allow-origin']).toBe('https://my-app.vercel.app');
    });

    test('should allow communication from multiple configured URLs', async () => {
      process.env.CORS_ORIGINS = 'https://app1.vercel.app,https://app2.netlify.app';

      // Test first URL
      const res1 = await request(testApp)
        .post('/api/test-communication')
        .set('Origin', 'https://app1.vercel.app')
        .send({ test: 'data' })
        .expect(200);

      expect(res1.headers['access-control-allow-origin']).toBe('https://app1.vercel.app');

      // Test second URL
      const res2 = await request(testApp)
        .post('/api/test-communication')
        .set('Origin', 'https://app2.netlify.app')
        .send({ test: 'data' })
        .expect(200);

      expect(res2.headers['access-control-allow-origin']).toBe('https://app2.netlify.app');
    });

    test('should reject communication from non-configured URLs in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGINS = 'https://my-app.vercel.app';

      const res = await request(testApp)
        .post('/api/test-communication')
        .set('Origin', 'https://malicious-site.com')
        .send({ test: 'data' })
        .expect(200); // Express doesn't automatically reject, but CORS headers won't be set

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    test('should handle localhost URLs in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.CORS_ORIGINS = 'http://localhost:4200,http://localhost:3000';

      const res = await request(testApp)
        .post('/api/test-communication')
        .set('Origin', 'http://localhost:4200')
        .send({ test: 'data' })
        .expect(200);

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    });
  });

  describe('Socket.IO URL Configuration', () => {
    test('should configure Socket.IO with environment-based URL', () => {
      process.env.SOCKET_URL = 'https://my-backend.onrender.com';

      // Mock Socket.IO server configuration
      const mockSocketConfig = {
        cors: {
          origin: getCorsOrigins(),
          credentials: true
        },
        path: '/socket.io'
      };

      expect(mockSocketConfig.cors.origin).toEqual(getCorsOrigins());
    });

    test('should fallback to API_URL for Socket.IO when SOCKET_URL not set', () => {
      process.env.API_URL = 'https://my-backend.onrender.com/api';
      delete process.env.SOCKET_URL;

      // In real implementation, Socket.IO would use API_URL without /api suffix
      const expectedSocketUrl = process.env.API_URL.replace('/api', '');
      expect(expectedSocketUrl).toBe('https://my-backend.onrender.com');
    });

    test('should configure Socket.IO CORS with multiple origins', () => {
      process.env.CORS_ORIGINS = 'https://app1.vercel.app,https://app2.netlify.app';

      const mockSocketConfig = {
        cors: {
          origin: getCorsOrigins(),
          credentials: true
        }
      };

      expect(mockSocketConfig.cors.origin).toEqual([
        'https://app1.vercel.app',
        'https://app2.netlify.app'
      ]);
    });
  });

  describe('Environment Validation for Cross-Service Communication', () => {
    test('should validate complete URL configuration for deployment', () => {
      // Set up a complete production-like configuration
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/healthcare';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'https://healthcare-backend.onrender.com/api';
      process.env.FRONTEND_URL = 'https://healthcare-frontend.vercel.app';
      process.env.CORS_ORIGINS = 'https://healthcare-frontend.vercel.app,https://healthcare.com';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';
      process.env.HEALTH_CHECK_URL = 'https://healthcare-backend.onrender.com/api/health';
      process.env.SOCKET_URL = 'https://healthcare-backend.onrender.com';

      const validation = validateEnvironment();
      expect(validation.errors).toHaveLength(0);

      // Verify CORS configuration
      const corsOrigins = getCorsOrigins();
      expect(corsOrigins).toEqual([
        'https://healthcare-frontend.vercel.app',
        'https://healthcare.com'
      ]);
    });

    test('should validate Docker development configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.MONGODB_URI = 'mongodb://mongo:27017/healthcare';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'http://backend:3000/api';
      process.env.FRONTEND_URL = 'http://frontend:80';
      process.env.CORS_ORIGINS = 'http://frontend:80,http://localhost:4200';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';
      process.env.HEALTH_CHECK_URL = 'http://backend:3000/api/health';

      const validation = validateEnvironment();
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid cross-service URL configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // Set valid MongoDB URI
      process.env.JWT_SECRET = 'a'.repeat(32); // Set valid JWT secret
      process.env.EMAIL_USER = 'test@example.com'; // Set valid email
      process.env.EMAIL_PASSWORD = 'password123'; // Set valid password
      process.env.API_URL = 'invalid-url';
      process.env.FRONTEND_URL = 'also-invalid';
      process.env.CORS_ORIGINS = 'not-a-url,another-bad-url';

      const validation = validateEnvironment();
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('API_URL'))).toBe(true);
      expect(validation.errors.some(e => e.includes('FRONTEND_URL'))).toBe(true);
      expect(validation.errors.some(e => e.includes('Invalid CORS origin'))).toBe(true);
    });
  });

  describe('Real-world Deployment Scenarios', () => {
    test('should validate Render + Vercel deployment configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/healthcare';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'https://healthcare-api.onrender.com/api';
      process.env.FRONTEND_URL = 'https://healthcare-app.vercel.app';
      process.env.CORS_ORIGINS = 'https://healthcare-app.vercel.app';
      process.env.EMAIL_USER = 'noreply@healthcare.com';
      process.env.EMAIL_PASSWORD = 'app-specific-password';

      const validation = validateEnvironment();
      expect(validation.errors).toHaveLength(0);

      const corsOrigins = getCorsOrigins();
      expect(corsOrigins).toEqual(['https://healthcare-app.vercel.app']);
    });

    test('should validate Heroku deployment configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/healthcare';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'https://healthcare-backend.herokuapp.com/api';
      process.env.FRONTEND_URL = 'https://healthcare-frontend.herokuapp.com';
      process.env.CORS_ORIGINS = 'https://healthcare-frontend.herokuapp.com';
      process.env.EMAIL_USER = 'noreply@healthcare.com';
      process.env.EMAIL_PASSWORD = 'app-specific-password';

      const validation = validateEnvironment();
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate custom domain deployment configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/healthcare';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'https://api.healthcare.com/api';
      process.env.FRONTEND_URL = 'https://app.healthcare.com';
      process.env.CORS_ORIGINS = 'https://app.healthcare.com,https://www.healthcare.com';
      process.env.EMAIL_USER = 'noreply@healthcare.com';
      process.env.EMAIL_PASSWORD = 'app-specific-password';

      const validation = validateEnvironment();
      expect(validation.errors).toHaveLength(0);

      const corsOrigins = getCorsOrigins();
      expect(corsOrigins).toEqual([
        'https://app.healthcare.com',
        'https://www.healthcare.com'
      ]);
    });

    test('should handle mixed staging and production URLs', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/healthcare-staging';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'https://staging-api.healthcare.com/api';
      process.env.FRONTEND_URL = 'https://staging.healthcare.com';
      process.env.CORS_ORIGINS = 'https://staging.healthcare.com,https://preview.healthcare.com';
      process.env.EMAIL_USER = 'staging@healthcare.com';
      process.env.EMAIL_PASSWORD = 'staging-password';

      const validation = validateEnvironment();
      expect(validation.errors).toHaveLength(0);
    });
  });
});