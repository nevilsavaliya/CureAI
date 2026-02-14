/**
 * SSL and Security Integration Tests
 * Tests the complete SSL and security configuration integration
 */

const request = require('supertest');
const express = require('express');
const { securityHeaders, httpsRedirect } = require('../../middleware/securityHeaders');

describe('SSL and Security Integration', () => {
  let app;

  beforeEach(() => {
    app = express();
    // Reset environment variables
    delete process.env.SSL_ENABLED;
    delete process.env.FRONTEND_URL;
    delete process.env.CORS_ORIGINS;
  });

  describe('Security Headers Integration', () => {
    it('should apply security headers to API endpoints', async () => {
      process.env.SSL_ENABLED = 'true';
      process.env.FRONTEND_URL = 'https://example.com';

      app.use(securityHeaders);
      app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check that security headers are applied
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['strict-transport-security']).toContain('max-age=');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should include configured origins in CSP headers', async () => {
      process.env.FRONTEND_URL = 'https://frontend.example.com';
      process.env.API_URL = 'https://api.example.com';
      process.env.SOCKET_URL = 'https://socket.example.com';

      app.use(securityHeaders);
      app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain('https://frontend.example.com');
      expect(csp).toContain('https://api.example.com');
      expect(csp).toContain('https://socket.example.com');
    });

    it('should handle HTTPS redirect integration', async () => {
      process.env.SSL_ENABLED = 'true';
      process.env.SSL_DOMAIN = 'example.com';
      process.env.SSL_PORT = '443';

      app.use(httpsRedirect);
      app.use(securityHeaders);
      app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

      const response = await request(app)
        .get('/api/health')
        .set('Host', 'example.com');

      expect(response.status).toBe(301);
      expect(response.headers.location).toBe('https://example.com/api/health');
    });
  });

  describe('SSL Configuration Integration', () => {
    it('should work with SSL disabled', async () => {
      process.env.SSL_ENABLED = 'false';

      app.use(httpsRedirect);
      app.use(securityHeaders);
      app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // HSTS should not be set when SSL is disabled
      expect(response.headers['strict-transport-security']).toBeUndefined();
      
      // Other security headers should still be present
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should configure HSTS properly when SSL is enabled', async () => {
      process.env.SSL_ENABLED = 'true';
      process.env.HSTS_MAX_AGE = '86400';
      process.env.HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.HSTS_PRELOAD = 'false';

      app.use(securityHeaders);
      app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['strict-transport-security']).toBe('max-age=86400; includeSubDomains');
    });
  });

  describe('Environment Variable Validation', () => {
    it('should handle missing environment variables gracefully', async () => {
      // Clear all SSL/security related environment variables
      delete process.env.SSL_ENABLED;
      delete process.env.FRONTEND_URL;
      delete process.env.CORS_ORIGINS;
      delete process.env.API_URL;
      delete process.env.SOCKET_URL;

      app.use(securityHeaders);
      app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Should still apply basic security headers
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should use fallback values for CSP when no URLs configured', async () => {
      app.use(securityHeaders);
      app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const csp = response.headers['content-security-policy'];
      // Should include localhost fallback
      expect(csp).toContain('http://localhost:4200');
    });
  });
});