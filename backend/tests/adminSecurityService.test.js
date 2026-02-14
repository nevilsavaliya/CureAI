const adminSecurityService = require('../services/adminSecurityService');
const Admin = require('../models/Admin');
const auditLoggerService = require('../services/auditLoggerService');
const emailNotificationService = require('../services/emailNotificationService');

// Mock dependencies
jest.mock('../models/Admin');
jest.mock('../services/auditLoggerService');
jest.mock('../services/emailNotificationService');
jest.mock('speakeasy');
jest.mock('qrcode');

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

describe('AdminSecurityService', () => {
  let mockAdmin;

  beforeEach(() => {
    mockAdmin = {
      _id: 'admin123',
      email: 'test@admin.com',
      name: 'Test Admin',
      twoFactorSecret: null,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLogin: new Date(),
      lastLoginIP: '127.0.0.1',
      lastLoginUserAgent: 'test-agent',
      isRoot: jest.fn().mockReturnValue(false),
      save: jest.fn().mockResolvedValue(true)
    };

    // Reset mocks
    jest.clearAllMocks();
    auditLoggerService.logAdminAction.mockResolvedValue(true);
  });

  describe('generate2FASecret', () => {
    it('should generate 2FA secret and QR code', async () => {
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/HealthcareApp%20(test@admin.com)?secret=JBSWY3DPEHPK3PXP&issuer=Healthcare%20Management%20System'
      };

      speakeasy.generateSecret.mockReturnValue(mockSecret);
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mockqrcode');

      const result = await adminSecurityService.generate2FASecret(mockAdmin);

      expect(result).toEqual({
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,mockqrcode',
        manualEntryKey: 'JBSWY3DPEHPK3PXP'
      });

      expect(mockAdmin.twoFactorSecret).toBe('JBSWY3DPEHPK3PXP');
      expect(mockAdmin.twoFactorEnabled).toBe(false);
      expect(mockAdmin.save).toHaveBeenCalled();
      expect(auditLoggerService.logAdminAction).toHaveBeenCalledWith({
        adminId: 'admin123',
        adminEmail: 'test@admin.com',
        action: '2FA_SECRET_GENERATED',
        details: expect.any(Object),
        status: 'success'
      });
    });

    it('should handle errors during secret generation', async () => {
      speakeasy.generateSecret.mockImplementation(() => {
        throw new Error('Secret generation failed');
      });

      await expect(adminSecurityService.generate2FASecret(mockAdmin))
        .rejects.toThrow('Secret generation failed');
    });
  });

  describe('verify2FAToken', () => {
    beforeEach(() => {
      mockAdmin.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
    });

    it('should verify valid 2FA token and enable 2FA', async () => {
      speakeasy.totp.verify.mockReturnValue(true);

      const result = await adminSecurityService.verify2FAToken(mockAdmin, '123456');

      expect(result).toBe(true);
      expect(mockAdmin.twoFactorEnabled).toBe(true);
      expect(mockAdmin.save).toHaveBeenCalled();
      expect(auditLoggerService.logAdminAction).toHaveBeenCalledWith({
        adminId: 'admin123',
        adminEmail: 'test@admin.com',
        action: '2FA_ENABLED',
        details: expect.any(Object),
        status: 'success'
      });
    });

    it('should reject invalid 2FA token', async () => {
      speakeasy.totp.verify.mockReturnValue(false);

      const result = await adminSecurityService.verify2FAToken(mockAdmin, '000000');

      expect(result).toBe(false);
      expect(mockAdmin.twoFactorEnabled).toBe(false);
      expect(auditLoggerService.logAdminAction).toHaveBeenCalledWith({
        adminId: 'admin123',
        adminEmail: 'test@admin.com',
        action: '2FA_VERIFICATION_FAILED',
        details: expect.any(Object),
        status: 'failed'
      });
    });

    it('should throw error when no secret exists', async () => {
      mockAdmin.twoFactorSecret = null;

      await expect(adminSecurityService.verify2FAToken(mockAdmin, '123456'))
        .rejects.toThrow('2FA secret not found. Please generate a new secret.');
    });
  });

  describe('validate2FAToken', () => {
    it('should return true when 2FA is not enabled', async () => {
      mockAdmin.twoFactorEnabled = false;

      const result = await adminSecurityService.validate2FAToken(mockAdmin, '123456');

      expect(result).toBe(true);
    });

    it('should validate token when 2FA is enabled', async () => {
      mockAdmin.twoFactorEnabled = true;
      mockAdmin.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      speakeasy.totp.verify.mockReturnValue(true);

      const result = await adminSecurityService.validate2FAToken(mockAdmin, '123456');

      expect(result).toBe(true);
    });

    it('should log failed validation attempts', async () => {
      mockAdmin.twoFactorEnabled = true;
      mockAdmin.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      speakeasy.totp.verify.mockReturnValue(false);

      const result = await adminSecurityService.validate2FAToken(mockAdmin, '000000');

      expect(result).toBe(false);
      expect(auditLoggerService.logAdminAction).toHaveBeenCalledWith({
        adminId: 'admin123',
        adminEmail: 'test@admin.com',
        action: '2FA_LOGIN_FAILED',
        details: expect.any(Object),
        status: 'failed'
      });
    });
  });

  describe('disable2FA', () => {
    beforeEach(() => {
      mockAdmin.twoFactorEnabled = true;
      mockAdmin.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
      mockAdmin.comparePassword = jest.fn();
    });

    it('should disable 2FA with valid password', async () => {
      mockAdmin.comparePassword.mockResolvedValue(true);

      const result = await adminSecurityService.disable2FA(mockAdmin, 'correctpassword');

      expect(result).toBe(true);
      expect(mockAdmin.twoFactorEnabled).toBe(false);
      expect(mockAdmin.twoFactorSecret).toBeUndefined();
      expect(mockAdmin.save).toHaveBeenCalled();
      expect(auditLoggerService.logAdminAction).toHaveBeenCalledWith({
        adminId: 'admin123',
        adminEmail: 'test@admin.com',
        action: '2FA_DISABLED',
        details: expect.any(Object),
        status: 'success'
      });
    });

    it('should reject invalid password', async () => {
      mockAdmin.comparePassword.mockResolvedValue(false);

      await expect(adminSecurityService.disable2FA(mockAdmin, 'wrongpassword'))
        .rejects.toThrow('Invalid current password');
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const lastActivity = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      
      const result = adminSecurityService.isSessionValid(mockAdmin, lastActivity);

      expect(result).toBe(true);
    });

    it('should return false for expired session', () => {
      const lastActivity = new Date(Date.now() - 40 * 60 * 1000); // 40 minutes ago
      
      const result = adminSecurityService.isSessionValid(mockAdmin, lastActivity);

      expect(result).toBe(false);
    });

    it('should return false for null lastActivity', () => {
      const result = adminSecurityService.isSessionValid(mockAdmin, null);

      expect(result).toBe(false);
    });
  });

  describe('handleFailedLogin', () => {
    it('should increment failed login attempts', async () => {
      const result = await adminSecurityService.handleFailedLogin(
        mockAdmin, 
        '192.168.1.1', 
        'Mozilla/5.0'
      );

      expect(mockAdmin.failedLoginAttempts).toBe(1);
      expect(mockAdmin.lastFailedLoginAt).toBeInstanceOf(Date);
      expect(mockAdmin.lastFailedLoginIP).toBe('192.168.1.1');
      expect(mockAdmin.save).toHaveBeenCalled();
      expect(result.failedAttempts).toBe(1);
      expect(result.remainingAttempts).toBe(4);
      expect(result.isLocked).toBe(false);
    });

    it('should lock account after max failed attempts', async () => {
      mockAdmin.failedLoginAttempts = 4; // One less than max

      const result = await adminSecurityService.handleFailedLogin(
        mockAdmin, 
        '192.168.1.1', 
        'Mozilla/5.0'
      );

      expect(mockAdmin.failedLoginAttempts).toBe(5);
      expect(mockAdmin.accountLockedUntil).toBeInstanceOf(Date);
      expect(result.isLocked).toBe(true);
      expect(auditLoggerService.logAdminAction).toHaveBeenCalledWith({
        adminId: 'admin123',
        adminEmail: 'test@admin.com',
        action: 'ADMIN_ACCOUNT_LOCKED',
        details: expect.any(Object),
        status: 'success'
      });
    });
  });

  describe('detectSuspiciousActivity', () => {
    const activityData = {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Different Browser)',
      timestamp: new Date()
    };

    it('should detect IP address change', async () => {
      mockAdmin.lastLoginIP = '127.0.0.1'; // Different IP

      const result = await adminSecurityService.detectSuspiciousActivity(mockAdmin, activityData);

      expect(result.isSuspicious).toBe(false); // Risk score 2, threshold is 3
      expect(result.riskScore).toBe(2);
      expect(result.indicators).toContain('IP_ADDRESS_CHANGE');
    });

    it('should detect user agent change', async () => {
      mockAdmin.lastLoginUserAgent = 'Chrome/90.0'; // Different user agent

      const result = await adminSecurityService.detectSuspiciousActivity(mockAdmin, activityData);

      expect(result.indicators).toContain('USER_AGENT_CHANGE');
      expect(result.riskScore).toBe(1);
    });

    it('should detect rapid login attempts', async () => {
      mockAdmin.lastLogin = new Date(Date.now() - 30000); // 30 seconds ago

      const result = await adminSecurityService.detectSuspiciousActivity(mockAdmin, activityData);

      expect(result.indicators).toContain('RAPID_LOGIN');
      expect(result.riskScore).toBe(3);
      expect(result.isSuspicious).toBe(true);
    });

    it('should send alert for suspicious activity', async () => {
      mockAdmin.lastLoginIP = '127.0.0.1';
      mockAdmin.lastLoginUserAgent = 'Chrome/90.0';
      mockAdmin.lastLogin = new Date(Date.now() - 30000);

      Admin.findOne.mockResolvedValue({
        email: 'admin@gmail.com'
      });

      const result = await adminSecurityService.detectSuspiciousActivity(mockAdmin, activityData);

      expect(result.isSuspicious).toBe(true);
      expect(result.riskScore).toBe(6); // IP change (2) + User agent change (1) + Rapid login (3)
      expect(auditLoggerService.logAdminAction).toHaveBeenCalledWith({
        adminId: 'admin123',
        adminEmail: 'test@admin.com',
        action: 'SUSPICIOUS_ACTIVITY_DETECTED',
        details: expect.any(Object),
        status: 'warning'
      });
    });
  });

  describe('getSecurityStatus', () => {
    it('should return comprehensive security status', () => {
      mockAdmin.twoFactorEnabled = true;
      mockAdmin.failedLoginAttempts = 2;
      mockAdmin.lastLogin = new Date();
      mockAdmin.lastLoginIP = '127.0.0.1';
      mockAdmin.isAccountLocked = jest.fn().mockReturnValue(false);

      const status = adminSecurityService.getSecurityStatus(mockAdmin);

      expect(status).toEqual({
        twoFactorEnabled: true,
        accountLocked: false,
        failedLoginAttempts: 2,
        maxFailedAttempts: 5,
        lastLogin: mockAdmin.lastLogin,
        lastLoginIP: '127.0.0.1',
        sessionTimeoutMinutes: 30,
        lockoutDurationMinutes: 30
      });
    });
  });

  describe('updateSessionTimeout', () => {
    it('should update session timeout within valid range', () => {
      adminSecurityService.updateSessionTimeout(60);

      const status = adminSecurityService.getSecurityStatus(mockAdmin);
      expect(status.sessionTimeoutMinutes).toBe(60);
    });

    it('should reject invalid timeout values', () => {
      expect(() => adminSecurityService.updateSessionTimeout(2))
        .toThrow('Session timeout must be between 5 and 480 minutes');

      expect(() => adminSecurityService.updateSessionTimeout(500))
        .toThrow('Session timeout must be between 5 and 480 minutes');
    });
  });
});