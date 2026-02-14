const request = require('supertest');
const express = require('express');
const adminSecurityController = require('../controllers/adminSecurityController');
const adminSecurityService = require('../services/adminSecurityService');
const auditLoggerService = require('../services/auditLoggerService');
const Admin = require('../models/Admin');

// Mock dependencies
jest.mock('../services/adminSecurityService');
jest.mock('../services/auditLoggerService');
jest.mock('../models/Admin');

describe('AdminSecurityController', () => {
  let app;
  let mockAdmin;

  beforeAll(() => {
    // Setup express app for testing
    app = express();
    app.use(express.json());
    
    // Mock middleware
    app.use((req, res, next) => {
      req.admin = mockAdmin;
      req.ip = '127.0.0.1';
      req.get = jest.fn().mockReturnValue('test-user-agent');
      next();
    });

    // Setup routes
    app.post('/2fa/generate', adminSecurityController.generate2FASecret);
    app.post('/2fa/verify', adminSecurityController.verify2FAToken);
    app.post('/2fa/disable', adminSecurityController.disable2FA);
    app.get('/status', adminSecurityController.getSecurityStatus);
    app.put('/session-timeout', adminSecurityController.updateSessionTimeout);
    app.get('/audit-logs', adminSecurityController.getSecurityAuditLogs);
    app.get('/statistics', adminSecurityController.getSecurityStatistics);
    app.post('/unlock/:adminId', adminSecurityController.unlockAdminAccount);
  });

  beforeEach(() => {
    mockAdmin = {
      _id: 'admin123',
      name: 'Test Admin',
      email: 'test@admin.com',
      twoFactorEnabled: false,
      isRoot: jest.fn().mockReturnValue(true)
    };

    // Reset mocks
    jest.clearAllMocks();
    auditLoggerService.logAdminAction.mockResolvedValue(true);
  });

  describe('generate2FASecret', () => {
    it('should generate 2FA secret successfully', async () => {
      const mockSecretData = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,mockqrcode',
        manualEntryKey: 'JBSWY3DPEHPK3PXP'
      };

      adminSecurityService.generate2FASecret.mockResolvedValue(mockSecretData);

      const response = await request(app)
        .post('/2fa/generate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('2FA secret generated successfully');
      expect(response.body.data).toEqual({
        ...mockSecretData,
        instructions: expect.any(Object)
      });
      expect(adminSecurityService.generate2FASecret).toHaveBeenCalledWith(mockAdmin);
    });

    it('should reject when 2FA is already enabled', async () => {
      mockAdmin.twoFactorEnabled = true;

      const response = await request(app)
        .post('/2fa/generate')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('2FA_ALREADY_ENABLED');
    });

    it('should handle service errors', async () => {
      adminSecurityService.generate2FASecret.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/2fa/generate')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('2FA_SECRET_GENERATION_ERROR');
    });
  });

  describe('verify2FAToken', () => {
    it('should verify token and enable 2FA successfully', async () => {
      adminSecurityService.verify2FAToken.mockResolvedValue(true);

      const response = await request(app)
        .post('/2fa/verify')
        .send({ token: '123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('2FA enabled successfully');
      expect(response.body.data.twoFactorEnabled).toBe(true);
      expect(adminSecurityService.verify2FAToken).toHaveBeenCalledWith(mockAdmin, '123456');
    });

    it('should reject invalid token', async () => {
      adminSecurityService.verify2FAToken.mockResolvedValue(false);

      const response = await request(app)
        .post('/2fa/verify')
        .send({ token: '000000' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_2FA_TOKEN');
    });

    it('should validate token format', async () => {
      const response = await request(app)
        .post('/2fa/verify')
        .send({ token: '12345' }) // Too short
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_2FA_TOKEN_FORMAT');
    });

    it('should require token parameter', async () => {
      const response = await request(app)
        .post('/2fa/verify')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_2FA_TOKEN');
    });
  });

  describe('disable2FA', () => {
    beforeEach(() => {
      mockAdmin.twoFactorEnabled = true;
    });

    it('should disable 2FA successfully', async () => {
      adminSecurityService.disable2FA.mockResolvedValue(true);

      const response = await request(app)
        .post('/2fa/disable')
        .send({ currentPassword: 'correctpassword' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('2FA disabled successfully');
      expect(response.body.data.twoFactorEnabled).toBe(false);
      expect(adminSecurityService.disable2FA).toHaveBeenCalledWith(mockAdmin, 'correctpassword');
    });

    it('should reject invalid password', async () => {
      adminSecurityService.disable2FA.mockRejectedValue(new Error('Invalid current password'));

      const response = await request(app)
        .post('/2fa/disable')
        .send({ currentPassword: 'wrongpassword' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('should reject when 2FA is not enabled', async () => {
      mockAdmin.twoFactorEnabled = false;

      const response = await request(app)
        .post('/2fa/disable')
        .send({ currentPassword: 'password' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('2FA_NOT_ENABLED');
    });

    it('should require current password', async () => {
      const response = await request(app)
        .post('/2fa/disable')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_CURRENT_PASSWORD');
    });
  });

  describe('getSecurityStatus', () => {
    it('should return security status successfully', async () => {
      const mockStatus = {
        twoFactorEnabled: false,
        accountLocked: false,
        failedLoginAttempts: 0,
        maxFailedAttempts: 5,
        lastLogin: new Date(),
        lastLoginIP: '127.0.0.1',
        sessionTimeoutMinutes: 30,
        lockoutDurationMinutes: 30
      };

      adminSecurityService.getSecurityStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStatus);
      expect(adminSecurityService.getSecurityStatus).toHaveBeenCalledWith(mockAdmin);
    });
  });

  describe('updateSessionTimeout', () => {
    it('should update session timeout successfully', async () => {
      adminSecurityService.updateSessionTimeout.mockImplementation(() => {});

      const response = await request(app)
        .put('/session-timeout')
        .send({ timeoutMinutes: 60 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Session timeout updated successfully');
      expect(response.body.data.sessionTimeoutMinutes).toBe(60);
      expect(adminSecurityService.updateSessionTimeout).toHaveBeenCalledWith(60);
      expect(auditLoggerService.logAdminAction).toHaveBeenCalled();
    });

    it('should validate timeout value', async () => {
      const response = await request(app)
        .put('/session-timeout')
        .send({ timeoutMinutes: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TIMEOUT_VALUE');
    });

    it('should handle service errors', async () => {
      adminSecurityService.updateSessionTimeout.mockImplementation(() => {
        throw new Error('Invalid timeout range');
      });

      const response = await request(app)
        .put('/session-timeout')
        .send({ timeoutMinutes: 1000 })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid timeout range');
    });
  });

  describe('getSecurityAuditLogs', () => {
    it('should return security audit logs successfully', async () => {
      const mockLogs = {
        logs: [
          {
            _id: 'log1',
            action: '2FA_ENABLED',
            adminEmail: 'test@admin.com',
            timestamp: new Date()
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        }
      };

      auditLoggerService.getAuditLogs.mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/audit-logs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.logs).toEqual(mockLogs.logs);
      expect(response.body.pagination).toEqual(mockLogs.pagination);
      expect(auditLoggerService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: expect.arrayContaining(['2FA_ENABLED', '2FA_DISABLED'])
        }),
        expect.any(Object),
        mockAdmin._id
      );
    });
  });

  describe('getSecurityStatistics', () => {
    it('should return security statistics successfully', async () => {
      const mockAuditLogs = {
        logs: [
          { action: '2FA_ENABLED' },
          { action: 'SUSPICIOUS_ACTIVITY_DETECTED' },
          { action: 'SESSION_EXPIRED' }
        ],
        pagination: { total: 3 }
      };

      auditLoggerService.getAuditLogs.mockResolvedValue(mockAuditLogs);
      Admin.countDocuments.mockResolvedValueOnce(10); // Total admins
      Admin.countDocuments.mockResolvedValueOnce(3);  // Admins with 2FA

      const response = await request(app)
        .get('/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toEqual({
        totalSecurityEvents: 3,
        twoFactorEnabled: 1,
        twoFactorDisabled: 0,
        suspiciousActivities: 1,
        sessionExpiries: 1,
        accountLockouts: 0,
        rateLimitExceeded: 0,
        adminsWith2FA: 3,
        totalAdmins: 10,
        twoFactorAdoptionRate: '30.0'
      });
    });
  });

  describe('unlockAdminAccount', () => {
    it('should unlock admin account successfully', async () => {
      const mockTargetAdmin = {
        _id: 'target123',
        email: 'target@admin.com',
        name: 'Target Admin',
        failedLoginAttempts: 5,
        accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000),
        isAccountLocked: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      Admin.findById.mockResolvedValue(mockTargetAdmin);

      const response = await request(app)
        .post('/unlock/target123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin account unlocked successfully');
      expect(mockTargetAdmin.failedLoginAttempts).toBe(0);
      expect(mockTargetAdmin.accountLockedUntil).toBeUndefined();
      expect(mockTargetAdmin.save).toHaveBeenCalled();
      expect(auditLoggerService.logAdminAction).toHaveBeenCalledWith({
        adminId: mockAdmin._id,
        adminEmail: mockAdmin.email,
        action: 'ADMIN_ACCOUNT_UNLOCKED',
        targetUserId: mockTargetAdmin._id,
        targetUserType: 'admin',
        targetUserEmail: mockTargetAdmin.email,
        details: expect.any(Object),
        status: 'success'
      });
    });

    it('should reject when admin not found', async () => {
      Admin.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/unlock/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ADMIN_NOT_FOUND');
    });

    it('should reject when account is not locked', async () => {
      const mockTargetAdmin = {
        _id: 'target123',
        email: 'target@admin.com',
        isAccountLocked: jest.fn().mockReturnValue(false)
      };

      Admin.findById.mockResolvedValue(mockTargetAdmin);

      const response = await request(app)
        .post('/unlock/target123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ACCOUNT_NOT_LOCKED');
    });

    it('should require admin ID parameter', async () => {
      const response = await request(app)
        .post('/unlock/')
        .expect(404); // Express will return 404 for missing route parameter
    });
  });
});