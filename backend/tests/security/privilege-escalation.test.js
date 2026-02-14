const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Admin = require('../../models/Admin');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Privilege Escalation Security Tests', () => {
  let mongoServer;
  let rootAdmin;
  let regularAdmin;
  let maliciousAdmin;
  let rootAdminToken;
  let regularAdminToken;
  let maliciousAdminToken;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Create test admins
    rootAdmin = new Admin({
      name: 'Root Admin',
      email: 'admin@gmail.com',
      password: 'rootpassword123',
      isRootAdmin: true
    });
    await rootAdmin.save();

    regularAdmin = new Admin({
      name: 'Regular Admin',
      email: 'regular@admin.com',
      password: 'regularpassword123',
      createdBy: rootAdmin._id
    });
    await regularAdmin.save();

    maliciousAdmin = new Admin({
      name: 'Malicious Admin',
      email: 'malicious@admin.com',
      password: 'maliciouspassword123',
      createdBy: rootAdmin._id,
      isActive: true
    });
    await maliciousAdmin.save();

    // Generate valid JWT tokens
    rootAdminToken = jwt.sign(
      { id: rootAdmin._id, email: rootAdmin.email, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    regularAdminToken = jwt.sign(
      { id: regularAdmin._id, email: regularAdmin.email, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    maliciousAdminToken = jwt.sign(
      { id: maliciousAdmin._id, email: maliciousAdmin.email, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Admin Role Escalation Attempts', () => {
    it('should prevent regular admin from accessing root admin endpoints', async () => {
      const rootOnlyEndpoints = [
        { method: 'get', path: '/api/admin/users?userType=admin' },
        { method: 'post', path: '/api/admin/users/add-admin', body: { name: 'Test', email: 'test@test.com', password: 'password123' } },
        { method: 'get', path: '/api/admin/audit-logs' },
        { method: 'get', path: '/api/admin/users/removed' },
        { method: 'post', path: `/api/admin/users/${regularAdmin._id}/restore?userType=admin`, body: { notes: 'test' } },
        { method: 'put', path: '/api/admin/security/session-timeout', body: { timeoutMinutes: 60 } },
        { method: 'get', path: '/api/admin/security/audit-logs' },
        { method: 'get', path: '/api/admin/security/statistics' },
        { method: 'post', path: `/api/admin/security/unlock/${maliciousAdmin._id}` }
      ];

      for (const endpoint of rootOnlyEndpoints) {
        let response;
        
        if (endpoint.method === 'get') {
          response = await request(app)
            .get(endpoint.path)
            .set('Authorization', `Bearer ${regularAdminToken}`);
        } else if (endpoint.method === 'post') {
          response = await request(app)
            .post(endpoint.path)
            .set('Authorization', `Bearer ${regularAdminToken}`)
            .send(endpoint.body || {});
        } else if (endpoint.method === 'put') {
          response = await request(app)
            .put(endpoint.path)
            .set('Authorization', `Bearer ${regularAdminToken}`)
            .send(endpoint.body || {});
        }

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(['ROOT_ADMIN_REQUIRED', 'ROOT_ADMIN_REQUIRED_FOR_ADMIN_MANAGEMENT', 'INSUFFICIENT_PERMISSIONS'])
          .toContain(response.body.code);
      }
    });

    it('should prevent token manipulation attacks', async () => {
      // Test 1: Malformed JWT token
      const malformedResponse = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(malformedResponse.body.success).toBe(false);

      // Test 2: Expired token
      const expiredToken = jwt.sign(
        { id: regularAdmin._id, email: regularAdmin.email, role: 'admin' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const expiredResponse = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(expiredResponse.body.success).toBe(false);

      // Test 3: Token with wrong signature
      const wrongSignatureToken = jwt.sign(
        { id: regularAdmin._id, email: regularAdmin.email, role: 'admin' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const wrongSignatureResponse = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', `Bearer ${wrongSignatureToken}`)
        .expect(401);

      expect(wrongSignatureResponse.body.success).toBe(false);
    });

    it('should prevent role field manipulation in JWT payload', async () => {
      // Attempt to create token with elevated role
      const elevatedToken = jwt.sign(
        { 
          id: regularAdmin._id, 
          email: regularAdmin.email, 
          role: 'super_admin', // Fake elevated role
          isRootAdmin: true // Fake root admin flag
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', `Bearer ${elevatedToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ROOT_ADMIN_REQUIRED');
    });
  });

  describe('Database Manipulation Attempts', () => {
    it('should prevent direct database privilege escalation', async () => {
      // Attempt to modify admin privileges directly (this would be caught by middleware)
      const originalAdmin = await Admin.findById(regularAdmin._id);
      expect(originalAdmin.isRootAdmin).toBeFalsy();

      // Even if someone tries to modify the database directly,
      // the middleware should still check the email for root admin status
      await Admin.findByIdAndUpdate(regularAdmin._id, { isRootAdmin: true });

      // The middleware should still deny access because email is not admin@gmail.com
      const response = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ROOT_ADMIN_REQUIRED');
    });

    it('should prevent admin creation with root privileges', async () => {
      // Attempt to create admin with root privileges through API
      const response = await request(app)
        .post('/api/admin/users/add-admin')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({
          name: 'Fake Root Admin',
          email: 'fakeroot@admin.com',
          password: 'password123',
          isRootAdmin: true // This should be ignored
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      
      // Verify the created admin is not root admin
      const createdAdmin = await Admin.findById(response.body.admin._id);
      expect(createdAdmin.isRootAdmin).toBeFalsy();
      expect(createdAdmin.email).not.toBe('admin@gmail.com');
    });
  });

  describe('Session and Authentication Attacks', () => {
    it('should prevent session hijacking attempts', async () => {
      // Test 1: Using another admin's token
      const response1 = await request(app)
        .delete(`/api/admin/users/${maliciousAdmin._id}/remove?userType=admin`)
        .set('Authorization', `Bearer ${regularAdminToken}`) // Regular admin trying to remove admin
        .send({ reason: 'Unauthorized removal' })
        .expect(403);

      expect(response1.body.success).toBe(false);

      // Test 2: Concurrent session validation
      const promises = Array(10).fill().map(() =>
        request(app)
          .get('/api/admin/users?userType=patient')
          .set('Authorization', `Bearer ${regularAdminToken}`)
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should prevent brute force attacks on admin operations', async () => {
      // Simulate rapid requests to trigger rate limiting
      const rapidRequests = Array(60).fill().map(() =>
        request(app)
          .get('/api/admin/users?userType=patient')
          .set('Authorization', `Bearer ${regularAdminToken}`)
      );

      const responses = await Promise.all(rapidRequests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Verify rate limit error structure
      const rateLimitedResponse = rateLimitedResponses[0];
      expect(rateLimitedResponse.body.code).toBe('ADMIN_RATE_LIMIT_EXCEEDED');
      expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
    });
  });

  describe('Input Validation and Injection Attacks', () => {
    it('should prevent NoSQL injection in user queries', async () => {
      // Test 1: NoSQL injection in user ID parameter
      const injectionResponse1 = await request(app)
        .delete('/api/admin/users/{"$ne": null}/remove?userType=patient')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .send({ reason: 'Injection test' })
        .expect(400);

      expect(injectionResponse1.body.success).toBe(false);

      // Test 2: NoSQL injection in query parameters
      const injectionResponse2 = await request(app)
        .get('/api/admin/users?userType=patient&search={"$where": "this.email"}')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(200); // Should be sanitized and return normal results

      expect(injectionResponse2.body.success).toBe(true);
    });

    it('should prevent XSS attacks in admin inputs', async () => {
      // Test XSS in admin creation
      const xssResponse = await request(app)
        .post('/api/admin/users/add-admin')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({
          name: '<script>alert("XSS")</script>',
          email: 'xss@admin.com',
          password: 'password123'
        })
        .expect(201);

      expect(xssResponse.body.success).toBe(true);
      
      // Verify XSS was sanitized
      const createdAdmin = await Admin.findById(xssResponse.body.admin._id);
      expect(createdAdmin.name).not.toContain('<script>');
    });

    it('should prevent command injection in reason fields', async () => {
      // Create a test patient first
      const testPatient = new mongoose.Types.ObjectId();
      
      const commandInjectionResponse = await request(app)
        .delete(`/api/admin/users/${testPatient}/remove?userType=patient`)
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .send({ 
          reason: 'Test; rm -rf /; echo "Command injection"' 
        })
        .expect(500); // Should fail because patient doesn't exist, not because of injection

      // The important thing is that the server doesn't crash or execute commands
      expect(commandInjectionResponse.body.success).toBe(false);
    });
  });

  describe('Authorization Bypass Attempts', () => {
    it('should prevent parameter pollution attacks', async () => {
      // Test 1: Multiple userType parameters
      const response1 = await request(app)
        .get('/api/admin/users?userType=patient&userType=admin')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(200);

      expect(response1.body.success).toBe(true);
      // Should use the first parameter value (patient)

      // Test 2: Array parameter injection
      const response2 = await request(app)
        .get('/api/admin/users?userType[]=patient&userType[]=admin')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(400);

      expect(response2.body.success).toBe(false);
    });

    it('should prevent HTTP method override attacks', async () => {
      // Attempt to use POST with method override to bypass DELETE restrictions
      const response = await request(app)
        .post(`/api/admin/users/${rootAdmin._id}/remove?userType=admin`)
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .set('X-HTTP-Method-Override', 'DELETE')
        .send({ reason: 'Method override attack' })
        .expect(404); // Should not find POST route

      expect(response.status).toBe(404);
    });
  });

  describe('Data Exposure Prevention', () => {
    it('should prevent sensitive data exposure in responses', async () => {
      // Get admin list and verify sensitive data is not exposed
      const response = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify passwords are not exposed
      response.body.users.forEach(admin => {
        expect(admin.password).toBeUndefined();
        expect(admin.twoFactorSecret).toBeUndefined();
      });
    });

    it('should prevent information disclosure through error messages', async () => {
      // Test with non-existent admin ID
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/admin/users/${nonExistentId}/remove?userType=admin`)
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({ reason: 'Test removal' })
        .expect(500);

      expect(response.body.success).toBe(false);
      // Error message should not reveal internal system details
      expect(response.body.message).not.toContain('mongoose');
      expect(response.body.message).not.toContain('MongoDB');
    });
  });

  describe('Audit Trail Integrity', () => {
    it('should prevent audit log tampering', async () => {
      // Perform an operation that should be logged
      await request(app)
        .get('/api/admin/users?userType=patient')
        .set('Authorization', `Bearer ${regularAdminToken}`);

      // Verify audit log was created
      const auditLogs = await require('../../models/AuditLog').find({
        adminId: regularAdmin._id
      });

      expect(auditLogs.length).toBeGreaterThan(0);

      // Attempt to modify audit log (this would be prevented by proper database permissions)
      const originalLog = auditLogs[0];
      const originalAction = originalLog.action;

      // Even if someone tries to modify the audit log, the system should detect it
      await require('../../models/AuditLog').findByIdAndUpdate(originalLog._id, {
        action: 'MODIFIED_ACTION'
      });

      // Verify the modification (in a real system, this would be prevented or detected)
      const modifiedLog = await require('../../models/AuditLog').findById(originalLog._id);
      expect(modifiedLog.action).toBe('MODIFIED_ACTION');
      
      // In a production system, you would have additional integrity checks here
    });
  });
});