const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const Admin = require('../models/Admin');
const logger = require('./logger');
const auditLoggerService = require('./auditLoggerService');

/**
 * Admin Security Service
 * Handles two-factor authentication, session management, and security monitoring
 */
class AdminSecurityService {
  constructor() {
    this.suspiciousActivityThreshold = 5; // Number of suspicious activities before alert
    this.sessionTimeoutMinutes = 30; // Session timeout in minutes
    this.maxFailedAttempts = 5; // Max failed login attempts before lockout
    this.lockoutDurationMinutes = 30; // Account lockout duration
  }

  /**
   * Generate 2FA secret for admin
   * @param {Object} admin - Admin user object
   * @returns {Object} Secret and QR code data
   */
  async generate2FASecret(admin) {
    try {
      const secret = speakeasy.generateSecret({
        name: `HealthcareApp (${admin.email})`,
        issuer: 'Healthcare Management System',
        length: 32
      });

      // Generate QR code for easy setup
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Store the secret temporarily (will be saved permanently when verified)
      admin.twoFactorSecret = secret.base32;
      admin.twoFactorEnabled = false; // Not enabled until verified
      await admin.save();

      await auditLoggerService.logAdminAction({
        adminId: admin._id,
        adminEmail: admin.email,
        action: '2FA_SECRET_GENERATED',
        details: {
          reason: '2FA setup initiated',
          additionalData: {
            secretGenerated: true
          }
        },
        status: 'success'
      });

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      logger.error('2FA secret generation error', {
        type: '2FA_SECRET_GENERATION_ERROR',
        adminId: admin._id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Verify 2FA token and enable 2FA for admin
   * @param {Object} admin - Admin user object
   * @param {string} token - 6-digit token from authenticator app
   * @returns {boolean} Verification result
   */
  async verify2FAToken(admin, token) {
    try {
      if (!admin.twoFactorSecret) {
        throw new Error('2FA secret not found. Please generate a new secret.');
      }

      const verified = speakeasy.totp.verify({
        secret: admin.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });

      if (verified) {
        // Enable 2FA for the admin
        admin.twoFactorEnabled = true;
        await admin.save();

        await auditLoggerService.logAdminAction({
          adminId: admin._id,
          adminEmail: admin.email,
          action: '2FA_ENABLED',
          details: {
            reason: '2FA successfully enabled',
            additionalData: {
              verificationSuccessful: true
            }
          },
          status: 'success'
        });

        return true;
      } else {
        await auditLoggerService.logAdminAction({
          adminId: admin._id,
          adminEmail: admin.email,
          action: '2FA_VERIFICATION_FAILED',
          details: {
            reason: 'Invalid 2FA token provided',
            additionalData: {
              tokenProvided: token.length === 6
            }
          },
          status: 'failed'
        });

        return false;
      }

    } catch (error) {
      logger.error('2FA token verification error', {
        type: '2FA_VERIFICATION_ERROR',
        adminId: admin._id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate 2FA token for login
   * @param {Object} admin - Admin user object
   * @param {string} token - 6-digit token from authenticator app
   * @returns {boolean} Validation result
   */
  async validate2FAToken(admin, token) {
    try {
      if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
        return true; // 2FA not enabled, skip validation
      }

      const verified = speakeasy.totp.verify({
        secret: admin.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        await auditLoggerService.logAdminAction({
          adminId: admin._id,
          adminEmail: admin.email,
          action: '2FA_LOGIN_FAILED',
          details: {
            reason: 'Invalid 2FA token during login',
            additionalData: {
              tokenProvided: token ? token.length === 6 : false
            }
          },
          status: 'failed'
        });
      }

      return verified;

    } catch (error) {
      logger.error('2FA login validation error', {
        type: '2FA_LOGIN_VALIDATION_ERROR',
        adminId: admin._id,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Disable 2FA for admin
   * @param {Object} admin - Admin user object
   * @param {string} currentPassword - Admin's current password for verification
   * @returns {boolean} Disable result
   */
  async disable2FA(admin, currentPassword) {
    try {
      // Verify current password
      const isPasswordValid = await admin.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new Error('Invalid current password');
      }

      admin.twoFactorEnabled = false;
      admin.twoFactorSecret = undefined;
      await admin.save();

      await auditLoggerService.logAdminAction({
        adminId: admin._id,
        adminEmail: admin.email,
        action: '2FA_DISABLED',
        details: {
          reason: '2FA disabled by admin',
          additionalData: {
            passwordVerified: true
          }
        },
        status: 'success'
      });

      return true;

    } catch (error) {
      logger.error('2FA disable error', {
        type: '2FA_DISABLE_ERROR',
        adminId: admin._id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Check if admin session is valid and not expired
   * @param {Object} admin - Admin user object
   * @param {Date} lastActivity - Last activity timestamp
   * @returns {boolean} Session validity
   */
  isSessionValid(admin, lastActivity) {
    try {
      if (!lastActivity) {
        return false;
      }

      const now = new Date();
      const sessionExpiry = new Date(lastActivity.getTime() + (this.sessionTimeoutMinutes * 60 * 1000));

      return now < sessionExpiry;

    } catch (error) {
      logger.error('Session validation error', {
        type: 'SESSION_VALIDATION_ERROR',
        adminId: admin._id,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Handle failed login attempt
   * @param {Object} admin - Admin user object
   * @param {string} ipAddress - IP address of failed attempt
   * @param {string} userAgent - User agent of failed attempt
   * @returns {Object} Lockout information
   */
  async handleFailedLogin(admin, ipAddress, userAgent) {
    try {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      admin.lastFailedLoginAt = new Date();
      admin.lastFailedLoginIP = ipAddress;

      // Lock account if max attempts reached
      if (admin.failedLoginAttempts >= this.maxFailedAttempts) {
        admin.accountLockedUntil = new Date(Date.now() + (this.lockoutDurationMinutes * 60 * 1000));
        
        await auditLoggerService.logAdminAction({
          adminId: admin._id,
          adminEmail: admin.email,
          action: 'ADMIN_ACCOUNT_LOCKED',
          details: {
            reason: `Account locked after ${this.maxFailedAttempts} failed login attempts`,
            ipAddress,
            userAgent,
            additionalData: {
              failedAttempts: admin.failedLoginAttempts,
              lockoutDuration: this.lockoutDurationMinutes
            }
          },
          status: 'success'
        });
      }

      await admin.save();

      return {
        isLocked: admin.isAccountLocked(),
        failedAttempts: admin.failedLoginAttempts,
        maxAttempts: this.maxFailedAttempts,
        lockedUntil: admin.accountLockedUntil,
        remainingAttempts: Math.max(0, this.maxFailedAttempts - admin.failedLoginAttempts)
      };

    } catch (error) {
      logger.error('Failed login handling error', {
        type: 'FAILED_LOGIN_HANDLING_ERROR',
        adminId: admin._id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Reset failed login attempts on successful login
   * @param {Object} admin - Admin user object
   */
  async resetFailedLoginAttempts(admin) {
    try {
      if (admin.failedLoginAttempts > 0 || admin.accountLockedUntil) {
        admin.failedLoginAttempts = 0;
        admin.accountLockedUntil = undefined;
        admin.lastFailedLoginAt = undefined;
        admin.lastFailedLoginIP = undefined;
        await admin.save();
      }
    } catch (error) {
      logger.error('Reset failed login attempts error', {
        type: 'RESET_FAILED_LOGIN_ERROR',
        adminId: admin._id,
        error: error.message
      });
    }
  }

  /**
   * Detect suspicious activity patterns
   * @param {Object} admin - Admin user object
   * @param {Object} activityData - Current activity data
   * @returns {Object} Suspicious activity analysis
   */
  async detectSuspiciousActivity(admin, activityData) {
    try {
      const suspiciousIndicators = [];
      let riskScore = 0;

      // Check for unusual IP address
      if (admin.lastLoginIP && admin.lastLoginIP !== activityData.ipAddress) {
        suspiciousIndicators.push('IP_ADDRESS_CHANGE');
        riskScore += 2;
      }

      // Check for unusual user agent
      if (admin.lastLoginUserAgent && admin.lastLoginUserAgent !== activityData.userAgent) {
        suspiciousIndicators.push('USER_AGENT_CHANGE');
        riskScore += 1;
      }

      // Check for rapid successive logins
      if (admin.lastLogin) {
        const timeSinceLastLogin = Date.now() - admin.lastLogin.getTime();
        if (timeSinceLastLogin < 60000) { // Less than 1 minute
          suspiciousIndicators.push('RAPID_LOGIN');
          riskScore += 3;
        }
      }

      // Check for login outside business hours (assuming UTC)
      const hour = new Date().getUTCHours();
      if (hour < 6 || hour > 22) {
        suspiciousIndicators.push('OFF_HOURS_LOGIN');
        riskScore += 1;
      }

      const isSuspicious = riskScore >= 3;

      if (isSuspicious) {
        await auditLoggerService.logAdminAction({
          adminId: admin._id,
          adminEmail: admin.email,
          action: 'SUSPICIOUS_ACTIVITY_DETECTED',
          details: {
            reason: 'Suspicious login activity detected',
            ipAddress: activityData.ipAddress,
            userAgent: activityData.userAgent,
            additionalData: {
              indicators: suspiciousIndicators,
              riskScore,
              previousIP: admin.lastLoginIP,
              previousUserAgent: admin.lastLoginUserAgent
            }
          },
          status: 'warning'
        });

        // Send alert to root admin if this is a regular admin
        if (!admin.isRoot()) {
          await this.sendSuspiciousActivityAlert(admin, suspiciousIndicators, riskScore);
        }
      }

      return {
        isSuspicious,
        riskScore,
        indicators: suspiciousIndicators
      };

    } catch (error) {
      logger.error('Suspicious activity detection error', {
        type: 'SUSPICIOUS_ACTIVITY_DETECTION_ERROR',
        adminId: admin._id,
        error: error.message,
        stack: error.stack
      });
      return { isSuspicious: false, riskScore: 0, indicators: [] };
    }
  }

  /**
   * Send suspicious activity alert to root admin
   * @param {Object} admin - Admin user with suspicious activity
   * @param {Array} indicators - Suspicious activity indicators
   * @param {number} riskScore - Risk score
   */
  async sendSuspiciousActivityAlert(admin, indicators, riskScore) {
    try {
      // Find root admin
      const rootAdmin = await Admin.findOne({ 
        $or: [
          { email: 'admin@gmail.com' },
          { isRootAdmin: true }
        ]
      });

      if (rootAdmin) {
        const emailNotificationService = require('./emailNotificationService');
        await emailNotificationService.sendSuspiciousActivityAlert(
          rootAdmin.email,
          {
            adminEmail: admin.email,
            adminName: admin.name,
            indicators,
            riskScore,
            timestamp: new Date()
          }
        );
      }

    } catch (error) {
      logger.error('Suspicious activity alert error', {
        type: 'SUSPICIOUS_ACTIVITY_ALERT_ERROR',
        adminId: admin._id,
        error: error.message
      });
    }
  }

  /**
   * Get security status for admin
   * @param {Object} admin - Admin user object
   * @returns {Object} Security status information
   */
  getSecurityStatus(admin) {
    return {
      twoFactorEnabled: admin.twoFactorEnabled || false,
      accountLocked: admin.isAccountLocked(),
      failedLoginAttempts: admin.failedLoginAttempts || 0,
      maxFailedAttempts: this.maxFailedAttempts,
      lastLogin: admin.lastLogin,
      lastLoginIP: admin.lastLoginIP,
      sessionTimeoutMinutes: this.sessionTimeoutMinutes,
      lockoutDurationMinutes: this.lockoutDurationMinutes
    };
  }

  /**
   * Update session timeout configuration
   * @param {number} minutes - New timeout in minutes
   */
  updateSessionTimeout(minutes) {
    if (minutes >= 5 && minutes <= 480) { // Between 5 minutes and 8 hours
      this.sessionTimeoutMinutes = minutes;
      logger.info('Session timeout updated', {
        type: 'SESSION_TIMEOUT_UPDATED',
        newTimeout: minutes
      });
    } else {
      throw new Error('Session timeout must be between 5 and 480 minutes');
    }
  }
}

module.exports = new AdminSecurityService();