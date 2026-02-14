/**
 * Security Headers Middleware Tests
 * Tests for dynamic URL configuration and security headers
 */

const request = require('supertest');
const express = require('express');
const { securityHeaders, httpsRedirect, dynamicCors, getSecurityConfig } = require('../middleware/securityHeaders');

describe('Security Headers Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    // Reset environment variables
    delete process.env.SSL_ENABLED;
    delete process.env.FRONTEND_URL;
    delete process.env.CORS_ORIGINS;
    delete process.env.HSTS_MAX_AGE;
    delete process.env.HSTS_INCLUDE_SUBDOMAINS;
    delete process.env.HSTS_PRELOAD;
  });

  describe('securityHeaders middleware', () => {
    it('should set basic security headers', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should set HSTS headers when SSL is enabled', async () => {
      process.env.SSL_ENABLED = 'true';
      process.env.HSTS_MAX_AGE = '86400';
      process.env.HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.HSTS_PRELOAD = 'true';

      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');

      expect(response.headers['strict-transport-security']).toBe('max-age=86400; includeSubDomains; preload');
    });

    it('should not set HSTS headers when SSL is disabled', async () => {
      process.env.SSL_ENABLED = 'false';

      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');

      expect(response.headers['strict-transport-security']).toBeUndefined();
    });

    it('should include configured origins in CSP', async () => {
      process.env.FRONTEND_URL = 'https://example.com';
      process.env.API_URL = 'https://api.example.com';

      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain('https://example.com');
      expect(csp).toContain('https://api.example.com');
    });

    it('should remove X-Powered-By header', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('httpsRedirect middleware', () => {
    it('should redirect HTTP to HTTPS when SSL is enabled', async () => {
      process.env.SSL_ENABLED = 'true';
      process.env.SSL_DOMAIN = 'example.com';
      process.env.SSL_PORT = '443';

      app.use(httpsRedirect);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .set('Host', 'example.com');

      expect(response.status).toBe(301);
      expect(response.headers.location).toBe('https://example.com/test');
    });

    it('should not redirect when SSL is disabled', async () => {
      process.env.SSL_ENABLED = 'false';

      app.use(httpsRedirect);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers.location).toBeUndefined();
    });

    it('should not redirect HTTPS requests', async () => {
      process.env.SSL_ENABLED = 'true';

      app.use((req, res, next) => {
        req.secure = true;
        next();
      });
      app.use(httpsRedirect);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .set('x-forwarded-proto', 'https');

      expect(response.status).toBe(200);
      expect(response.headers.location).toBeUndefined();
    });
  });

  describe('dynamicCors middleware', () => {
    it('should allow configured origins', async () => {
      process.env.FRONTEND_URL = 'https://example.com';
      process.env.CORS_ORIGINS = 'https://app.example.com,https://admin.example.com';

      app.use(dynamicCors);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://example.com');

      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle preflight requests', async () => {
      process.env.FRONTEND_URL = 'https://example.com';

      app.use(dynamicCors);
      app.options('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .options('/test')
        .set('Origin', 'https://example.com');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should not set origin for disallowed origins', async () => {
      process.env.FRONTEND_URL = 'https://example.com';

      app.use(dynamicCors);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://malicious.com');

      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious.com');
    });
  });

  describe('getSecurityConfig function', () => {
    it('should return current security configuration', () => {
      process.env.SSL_ENABLED = 'true';
      process.env.FRONTEND_URL = 'https://example.com';
      process.env.HSTS_MAX_AGE = '86400';

      const config = getSecurityConfig();

      expect(config.sslEnabled).toBe(true);
      expect(config.allowedOrigins).toContain('https://example.com');
      expect(config.hstsMaxAge).toBe('86400');
      expect(config.csp).toContain("default-src 'self'");
    });

    it('should handle missing environment variables', () => {
      // Clear any existing environment variables that might affect the test
      delete process.env.API_URL;
      delete process.env.SOCKET_URL;
      
      const config = getSecurityConfig();

      expect(config.sslEnabled).toBe(false);
      expect(config.allowedOrigins).toContain('http://localhost:4200');
      expect(config.hstsMaxAge).toBe('31536000');
    });
  });
});