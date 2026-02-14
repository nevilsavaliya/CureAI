/**
 * Environment Validation Tests
 */

const { 
  validateEnvironment, 
  validateUrlFormat, 
  validateMongoUri, 
  validateCorsOrigins,
  REQUIRED_VARS, 
  VALIDATION_RULES 
} = require('../utils/validateEnv');

describe('Environment Validation', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    test('should pass with all required variables set', () => {
      // Set all required variables
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32); // 32 characters
      process.env.FRONTEND_URL = 'http://localhost:4200';
      process.env.API_URL = 'http://localhost:3000/api';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';

      const result = validateEnvironment();
      expect(result.errors).toHaveLength(0);
    });

    test('should fail with missing required variables', () => {
      // Clear all environment variables
      REQUIRED_VARS.forEach(varName => {
        delete process.env[varName];
      });

      const result = validateEnvironment();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missing).toEqual(REQUIRED_VARS);
    });
  });

  describe('JWT Secret Validation', () => {
    beforeEach(() => {
      // Set other required variables
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.FRONTEND_URL = 'http://localhost:4200';
      process.env.API_URL = 'http://localhost:3000/api';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';
    });

    test('should pass with 32+ character JWT secret', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      const result = validateEnvironment();
      expect(result.errors.filter(e => e.includes('JWT_SECRET'))).toHaveLength(0);
    });

    test('should fail with short JWT secret', () => {
      process.env.JWT_SECRET = 'short';
      const result = validateEnvironment();
      expect(result.errors.some(e => e.includes('JWT_SECRET'))).toBe(true);
    });
  });

  describe('Email Validation', () => {
    beforeEach(() => {
      // Set other required variables
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.FRONTEND_URL = 'http://localhost:4200';
      process.env.API_URL = 'http://localhost:3000/api';
      process.env.EMAIL_PASSWORD = 'password123';
    });

    test('should pass with valid email', () => {
      process.env.EMAIL_USER = 'test@example.com';
      const result = validateEnvironment();
      expect(result.errors.filter(e => e.includes('EMAIL_USER'))).toHaveLength(0);
    });

    test('should fail with invalid email', () => {
      process.env.EMAIL_USER = 'invalid-email';
      const result = validateEnvironment();
      expect(result.errors.some(e => e.includes('EMAIL_USER'))).toBe(true);
    });
  });

  describe('API Rate Limit Validation', () => {
    beforeEach(() => {
      // Set required variables
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.FRONTEND_URL = 'http://localhost:4200';
      process.env.API_URL = 'http://localhost:3000/api';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';
    });

    test('should pass with valid rate limit', () => {
      process.env.API_RATE_LIMIT = '100';
      const result = validateEnvironment();
      expect(result.errors.filter(e => e.includes('API_RATE_LIMIT'))).toHaveLength(0);
    });

    test('should fail with invalid rate limit', () => {
      process.env.API_RATE_LIMIT = 'invalid';
      const result = validateEnvironment();
      expect(result.errors.some(e => e.includes('API_RATE_LIMIT'))).toBe(true);
    });

    test('should fail with rate limit out of range', () => {
      process.env.API_RATE_LIMIT = '99999';
      const result = validateEnvironment();
      expect(result.errors.some(e => e.includes('API_RATE_LIMIT'))).toBe(true);
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      // Set required variables
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.FRONTEND_URL = 'http://localhost:4200';
      process.env.API_URL = 'http://localhost:3000/api';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';
      process.env.NODE_ENV = 'production';
    });

    test('should fail with default JWT secret in production', () => {
      process.env.JWT_SECRET = 'your-secret-key-change-this-in-production';
      const result = validateEnvironment();
      expect(result.errors.some(e => e.includes('JWT_SECRET must be changed'))).toBe(true);
    });

    test('should fail with default email password in production', () => {
      process.env.EMAIL_PASSWORD = 'your_app_specific_password';
      const result = validateEnvironment();
      expect(result.errors.some(e => e.includes('EMAIL_PASSWORD must be set'))).toBe(true);
    });

    test('should warn about localhost MongoDB in production', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      const result = validateEnvironment();
      expect(result.warnings.some(w => w.includes('localhost MongoDB'))).toBe(true);
    });
  });

  describe('Default Values', () => {
    test('should set default values for optional variables', () => {
      // Set only required variables
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.FRONTEND_URL = 'http://localhost:4200';
      process.env.API_URL = 'http://localhost:3000/api';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';

      // Clear optional variables
      delete process.env.API_RATE_LIMIT;
      delete process.env.HOSPITAL_API_KEY_PREFIX;

      const result = validateEnvironment();
      
      // Should have warnings about using defaults
      expect(result.warnings.some(w => w.includes('API_RATE_LIMIT'))).toBe(true);
      expect(result.warnings.some(w => w.includes('HOSPITAL_API_KEY_PREFIX'))).toBe(true);
      
      // Should set default values
      expect(process.env.API_RATE_LIMIT).toBe('100');
      expect(process.env.HOSPITAL_API_KEY_PREFIX).toBe('HK_');
    });
  });

  describe('URL Format Validation', () => {
    test('should validate correct HTTP URLs', () => {
      const result = validateUrlFormat('http://localhost:3000');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate correct HTTPS URLs', () => {
      const result = validateUrlFormat('https://api.example.com');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid URL formats', () => {
      const result = validateUrlFormat('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject non-HTTP protocols', () => {
      const result = validateUrlFormat('ftp://example.com');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('HTTP or HTTPS'))).toBe(true);
    });

    test('should reject localhost in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const result = validateUrlFormat('http://localhost:3000');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Localhost URLs are not allowed'))).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('MongoDB URI Validation', () => {
    test('should validate correct MongoDB URI', () => {
      const result = validateMongoUri('mongodb://localhost:27017/testdb');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate MongoDB+srv URI', () => {
      const result = validateMongoUri('mongodb+srv://user:pass@cluster.mongodb.net/testdb');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid MongoDB URI format', () => {
      const result = validateMongoUri('invalid-uri');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must start with mongodb'))).toBe(true);
    });

    test('should reject MongoDB URI without database name', () => {
      const result = validateMongoUri('mongodb://localhost:27017/');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('database name'))).toBe(true);
    });

    test('should reject placeholder credentials', () => {
      const result = validateMongoUri('mongodb://username:password@localhost:27017/testdb');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('placeholder credentials'))).toBe(true);
    });

    test('should reject localhost in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const result = validateMongoUri('mongodb://localhost:27017/testdb');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Localhost MongoDB URIs are not allowed'))).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('CORS Origins Validation', () => {
    test('should validate single CORS origin', () => {
      const result = validateCorsOrigins('https://app.example.com');
      expect(result.valid).toBe(true);
      expect(result.origins).toEqual(['https://app.example.com']);
    });

    test('should validate multiple CORS origins', () => {
      const result = validateCorsOrigins('https://app.example.com,https://www.example.com');
      expect(result.valid).toBe(true);
      expect(result.origins).toEqual(['https://app.example.com', 'https://www.example.com']);
    });

    test('should allow wildcard in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const result = validateCorsOrigins('*');
      expect(result.valid).toBe(true);
      expect(result.origins).toEqual(['*']);
      expect(result.warnings.some(w => w.includes('wildcard'))).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should reject wildcard in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const result = validateCorsOrigins('*');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Wildcard (*) CORS origin is not allowed'))).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should fallback to FRONTEND_URL when CORS_ORIGINS is empty', () => {
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://app.example.com';
      
      const result = validateCorsOrigins('');
      expect(result.valid).toBe(true);
      expect(result.origins).toEqual(['https://app.example.com']);
      expect(result.warnings.some(w => w.includes('fallback'))).toBe(true);
      
      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    test('should reject invalid CORS origin URLs', () => {
      const result = validateCorsOrigins('not-a-url,another-bad-url');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Invalid CORS origin'))).toBe(true);
    });

    test('should handle cloud platform URLs correctly', () => {
      const cloudUrls = [
        'https://my-app.onrender.com',
        'https://my-frontend.vercel.app',
        'https://my-app.herokuapp.com',
        'https://my-domain.netlify.app'
      ];
      
      const result = validateCorsOrigins(cloudUrls.join(','));
      expect(result.valid).toBe(true);
      expect(result.origins).toEqual(cloudUrls);
    });

    test('should validate mixed localhost and production URLs in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const mixedUrls = 'http://localhost:4200,https://staging.example.com';
      const result = validateCorsOrigins(mixedUrls);
      expect(result.valid).toBe(true);
      expect(result.origins).toEqual(['http://localhost:4200', 'https://staging.example.com']);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('URL Configuration Validation', () => {
    describe('API_URL Validation', () => {
      beforeEach(() => {
        // Set other required variables
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.FRONTEND_URL = 'http://localhost:4200';
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASSWORD = 'password123';
      });

      test('should accept valid API_URL with /api path', () => {
        process.env.API_URL = 'https://api.example.com/api';
        const result = validateEnvironment();
        expect(result.errors.filter(e => e.includes('API_URL'))).toHaveLength(0);
      });

      test('should accept API_URL without /api path', () => {
        process.env.API_URL = 'https://backend.example.com';
        const result = validateEnvironment();
        expect(result.errors.filter(e => e.includes('API_URL'))).toHaveLength(0);
      });

      test('should accept cloud platform API URLs', () => {
        const cloudUrls = [
          'https://my-backend.onrender.com/api',
          'https://my-api.herokuapp.com/api',
          'https://api.my-domain.com'
        ];

        cloudUrls.forEach(url => {
          process.env.API_URL = url;
          const result = validateEnvironment();
          expect(result.errors.filter(e => e.includes('API_URL'))).toHaveLength(0);
        });
      });

      test('should reject invalid API_URL formats', () => {
        const invalidUrls = [
          'not-a-url',
          'ftp://api.example.com',
          'api.example.com',
          'http://',
          'https://'
        ];

        invalidUrls.forEach(url => {
          process.env.API_URL = url;
          const result = validateEnvironment();
          expect(result.errors.some(e => e.includes('API_URL'))).toBe(true);
        });
      });

      test('should reject localhost API_URL in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        process.env.API_URL = 'http://localhost:3000/api';
        
        const result = validateEnvironment();
        expect(result.errors.some(e => e.includes('API_URL') && e.includes('Localhost URLs are not allowed'))).toBe(true);
        
        process.env.NODE_ENV = originalEnv;
      });
    });

    describe('FRONTEND_URL Validation', () => {
      beforeEach(() => {
        // Set other required variables
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.API_URL = 'http://localhost:3000/api';
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASSWORD = 'password123';
      });

      test('should accept valid FRONTEND_URL', () => {
        process.env.FRONTEND_URL = 'https://app.example.com';
        const result = validateEnvironment();
        expect(result.errors.filter(e => e.includes('FRONTEND_URL'))).toHaveLength(0);
      });

      test('should accept cloud platform frontend URLs', () => {
        const cloudUrls = [
          'https://my-app.vercel.app',
          'https://my-frontend.netlify.app',
          'https://my-app.herokuapp.com',
          'https://my-app.onrender.com'
        ];

        cloudUrls.forEach(url => {
          process.env.FRONTEND_URL = url;
          const result = validateEnvironment();
          expect(result.errors.filter(e => e.includes('FRONTEND_URL'))).toHaveLength(0);
        });
      });

      test('should reject invalid FRONTEND_URL formats', () => {
        const invalidUrls = [
          'not-a-url',
          'ftp://app.example.com',
          'app.example.com',
          'http://',
          'https://'
        ];

        invalidUrls.forEach(url => {
          process.env.FRONTEND_URL = url;
          const result = validateEnvironment();
          expect(result.errors.some(e => e.includes('FRONTEND_URL'))).toBe(true);
        });
      });

      test('should reject localhost FRONTEND_URL in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        process.env.FRONTEND_URL = 'http://localhost:4200';
        
        const result = validateEnvironment();
        expect(result.errors.some(e => e.includes('FRONTEND_URL') && e.includes('Localhost URLs are not allowed'))).toBe(true);
        
        process.env.NODE_ENV = originalEnv;
      });
    });

    describe('Optional URL Configuration', () => {
      beforeEach(() => {
        // Set required variables
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.FRONTEND_URL = 'http://localhost:4200';
        process.env.API_URL = 'http://localhost:3000/api';
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASSWORD = 'password123';
      });

      test('should accept valid API_BASE_URL', () => {
        process.env.API_BASE_URL = 'https://api.example.com';
        const result = validateEnvironment();
        expect(result.errors.filter(e => e.includes('API_BASE_URL'))).toHaveLength(0);
      });

      test('should accept valid HEALTH_CHECK_URL', () => {
        process.env.HEALTH_CHECK_URL = 'https://api.example.com/health';
        const result = validateEnvironment();
        expect(result.errors.filter(e => e.includes('HEALTH_CHECK_URL'))).toHaveLength(0);
      });

      test('should reject invalid optional URL formats', () => {
        process.env.API_BASE_URL = 'not-a-url';
        process.env.HEALTH_CHECK_URL = 'ftp://example.com';
        
        const result = validateEnvironment();
        expect(result.errors.some(e => e.includes('API_BASE_URL'))).toBe(true);
        expect(result.errors.some(e => e.includes('HEALTH_CHECK_URL'))).toBe(true);
      });

      test('should allow empty optional URLs', () => {
        delete process.env.API_BASE_URL;
        delete process.env.HEALTH_CHECK_URL;
        
        const result = validateEnvironment();
        expect(result.errors.filter(e => e.includes('API_BASE_URL') || e.includes('HEALTH_CHECK_URL'))).toHaveLength(0);
      });
    });
  });

  describe('Deployment Environment Scenarios', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should validate Render deployment configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/healthcare';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'https://my-backend.onrender.com/api';
      process.env.FRONTEND_URL = 'https://my-frontend.vercel.app';
      process.env.CORS_ORIGINS = 'https://my-frontend.vercel.app,https://my-domain.com';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';
      process.env.HEALTH_CHECK_URL = 'https://my-backend.onrender.com/api/health';

      const result = validateEnvironment();
      expect(result.errors).toHaveLength(0);
    });

    test('should validate Vercel + Render deployment configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/healthcare';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'https://healthcare-backend.onrender.com/api';
      process.env.FRONTEND_URL = 'https://healthcare-frontend.vercel.app';
      process.env.CORS_ORIGINS = 'https://healthcare-frontend.vercel.app';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';

      const result = validateEnvironment();
      expect(result.errors).toHaveLength(0);
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

      const result = validateEnvironment();
      expect(result.errors).toHaveLength(0);
    });

    test('should reject mixed localhost and production URLs in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/healthcare';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.API_URL = 'http://localhost:3000/api'; // Invalid in production
      process.env.FRONTEND_URL = 'https://my-frontend.vercel.app';
      process.env.CORS_ORIGINS = 'https://my-frontend.vercel.app,http://localhost:4200'; // Mixed URLs
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'password123';

      const result = validateEnvironment();
      expect(result.errors.some(e => e.includes('Localhost URLs are not allowed'))).toBe(true);
    });
  });
});