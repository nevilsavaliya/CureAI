const adminSecurityService = require('../services/adminSecurityService');
const auditLoggerService = require('../services/auditLoggerService');
const Admin = require('../models/Admin');

/**
 * Admin Security Controller
 * Handles 2FA setup, security settings, and security monitoring
 */

/**
 * Generate 2FA secret and QR code
 */
exports.generate2FASecret = async (req, res) => {
  try {
    const admin = req.admin;

    // Check if 2FA is already enabled
    if (admin.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled for this account',
        code: '2FA_ALREADY_ENABLED'
      });
    }

    const secretData = await adminSecurityService.generate2FASecret(admin);

    res.status(200).json({
      success: true,
      message: '2FA secret generated successfully',
      data: {
        secret: secretData.secret,
        qrCode: secretData.qrCode,
        manualEntryKey: secretData.manualEntryKey,
        instructions: {
          step1: 'Install an authenticator app (Google Authenticator, Authy, etc.)',
          step2: 'Scan the QR code or manually enter the secret key',
          step3: 'Enter the 6-digit code from your app to verify and enable 2FA'
        }
      }
    });

  } catch (error) {
    console.error('Generate 2FA secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating 2FA secret',
      code: '2FA_SECRET_GENERATION_ERROR'
    });
  }
};

/**
 * Verify 2FA token and enable 2FA
 */
exports.verify2FAToken = async (req, res) => {
  try {
    const { token } = req.body;
    const admin = req.admin;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: '2FA token is required',
        code: 'MISSING_2FA_TOKEN'
      });
    }

    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      return res.status(400).json({
        success: false,
        message: '2FA token must be a 6-digit number',
        code: 'INVALID_2FA_TOKEN_FORMAT'
      });
    }

    const isValid = await adminSecurityService.verify2FAToken(admin, token);

    if (isValid) {
      res.status(200).json({
        success: true,
        message: '2FA enabled successfully',
        data: {
          twoFactorEnabled: true,
          backupCodes: [] // TODO: Generate backup codes
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid 2FA token. Please try again.',
        code: 'INVALID_2FA_TOKEN'
      });
    }

  } catch (error) {
    console.error('Verify 2FA token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying 2FA token',
      code: '2FA_VERIFICATION_ERROR'
    });
  }
};

/**
 * Disable 2FA
 */
exports.disable2FA = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const admin = req.admin;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to disable 2FA',
        code: 'MISSING_CURRENT_PASSWORD'
      });
    }

    if (!admin.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this account',
        code: '2FA_NOT_ENABLED'
      });
    }

    const success = await adminSecurityService.disable2FA(admin, currentPassword);

    if (success) {
      res.status(200).json({
        success: true,
        message: '2FA disabled successfully',
        data: {
          twoFactorEnabled: false
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to disable 2FA',
        code: '2FA_DISABLE_FAILED'
      });
    }

  } catch (error) {
    if (error.message === 'Invalid current password') {
      return res.status(400).json({
        success: false,
        message: 'Invalid current password',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while disabling 2FA',
      code: '2FA_DISABLE_ERROR'
    });
  }
};

/**
 * Get security status for current admin
 */
exports.getSecurityStatus = async (req, res) => {
  try {
    const admin = req.admin;
    const securityStatus = adminSecurityService.getSecurityStatus(admin);

    res.status(200).json({
      success: true,
      data: securityStatus
    });

  } catch (error) {
    console.error('Get security status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching security status',
      code: 'SECURITY_STATUS_ERROR'
    });
  }
};

/**
 * Update session timeout (root admin only)
 */
exports.updateSessionTimeout = async (req, res) => {
  try {
    const { timeoutMinutes } = req.body;
    const admin = req.admin;

    if (!timeoutMinutes || typeof timeoutMinutes !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Timeout minutes must be a valid number',
        code: 'INVALID_TIMEOUT_VALUE'
      });
    }

    adminSecurityService.updateSessionTimeout(timeoutMinutes);

    await auditLoggerService.logAdminAction({
      adminId: admin._id,
      adminEmail: admin.email,
      action: 'SESSION_TIMEOUT_UPDATED',
      details: {
        reason: 'Session timeout configuration updated',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        additionalData: {
          newTimeoutMinutes: timeoutMinutes
        }
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Session timeout updated successfully',
      data: {
        sessionTimeoutMinutes: timeoutMinutes
      }
    });

  } catch (error) {
    console.error('Update session timeout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while updating session timeout',
      code: 'SESSION_TIMEOUT_UPDATE_ERROR'
    });
  }
};

/**
 * Get security audit logs (root admin only)
 */
exports.getSecurityAuditLogs = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      adminId,
      action,
      page = '1',
      limit = '50'
    } = req.query;

    const filters = {
      action: action ? (action.includes(',') ? action.split(',') : action) : [
        '2FA_ENABLED',
        '2FA_DISABLED',
        '2FA_VERIFICATION_FAILED',
        'SUSPICIOUS_ACTIVITY_DETECTED',
        'SESSION_EXPIRED',
        'ADMIN_ACCOUNT_LOCKED',
        'ADMIN_RATE_LIMIT_EXCEEDED'
      ],
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      adminId
    };

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy: 'timestamp',
      sortOrder: -1,
      includeDetails: true
    };

    const result = await auditLoggerService.getAuditLogs(
      filters,
      options,
      req.admin._id
    );

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get security audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching security audit logs',
      code: 'SECURITY_AUDIT_LOGS_ERROR'
    });
  }
};

/**
 * Get security statistics (root admin only)
 */
exports.getSecurityStatistics = async (req, res) => {
  try {
    const {
      startDate,
      endDate
    } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
      endDate: endDate ? new Date(endDate) : new Date()
    };

    // Get security-related audit logs
    const securityLogs = await auditLoggerService.getAuditLogs({
      action: [
        '2FA_ENABLED',
        '2FA_DISABLED',
        'SUSPICIOUS_ACTIVITY_DETECTED',
        'SESSION_EXPIRED',
        'ADMIN_ACCOUNT_LOCKED',
        'ADMIN_RATE_LIMIT_EXCEEDED'
      ],
      startDate: filters.startDate,
      endDate: filters.endDate
    }, {
      page: 1,
      limit: 10000,
      includeDetails: true
    }, req.admin._id);

    // Calculate statistics
    const stats = {
      totalSecurityEvents: securityLogs.pagination?.total || 0,
      twoFactorEnabled: 0,
      twoFactorDisabled: 0,
      suspiciousActivities: 0,
      sessionExpiries: 0,
      accountLockouts: 0,
      rateLimitExceeded: 0,
      adminsWith2FA: 0,
      totalAdmins: 0
    };

    // Process logs for statistics
    if (securityLogs.logs) {
      securityLogs.logs.forEach(log => {
        switch (log.action) {
          case '2FA_ENABLED':
            stats.twoFactorEnabled++;
            break;
          case '2FA_DISABLED':
            stats.twoFactorDisabled++;
            break;
          case 'SUSPICIOUS_ACTIVITY_DETECTED':
            stats.suspiciousActivities++;
            break;
          case 'SESSION_EXPIRED':
            stats.sessionExpiries++;
            break;
          case 'ADMIN_ACCOUNT_LOCKED':
            stats.accountLockouts++;
            break;
          case 'ADMIN_RATE_LIMIT_EXCEEDED':
            stats.rateLimitExceeded++;
            break;
        }
      });
    }

    // Get admin statistics
    const totalAdmins = await Admin.countDocuments({ isActive: true });
    const adminsWith2FA = await Admin.countDocuments({ 
      isActive: true, 
      twoFactorEnabled: true 
    });

    stats.totalAdmins = totalAdmins;
    stats.adminsWith2FA = adminsWith2FA;
    stats.twoFactorAdoptionRate = totalAdmins > 0 ? (adminsWith2FA / totalAdmins * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        statistics: stats,
        dateRange: {
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      }
    });

  } catch (error) {
    console.error('Get security statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching security statistics',
      code: 'SECURITY_STATISTICS_ERROR'
    });
  }
};

/**
 * Unlock admin account (root admin only)
 */
exports.unlockAdminAccount = async (req, res) => {
  try {
    const { adminId } = req.params;
    const requestingAdmin = req.admin;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required',
        code: 'MISSING_ADMIN_ID'
      });
    }

    const targetAdmin = await Admin.findById(adminId);
    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    if (!targetAdmin.isAccountLocked()) {
      return res.status(400).json({
        success: false,
        message: 'Admin account is not locked',
        code: 'ACCOUNT_NOT_LOCKED'
      });
    }

    // Unlock the account
    targetAdmin.failedLoginAttempts = 0;
    targetAdmin.accountLockedUntil = undefined;
    targetAdmin.lastFailedLoginAt = undefined;
    targetAdmin.lastFailedLoginIP = undefined;
    await targetAdmin.save();

    await auditLoggerService.logAdminAction({
      adminId: requestingAdmin._id,
      adminEmail: requestingAdmin.email,
      action: 'ADMIN_ACCOUNT_UNLOCKED',
      targetUserId: targetAdmin._id,
      targetUserType: 'admin',
      targetUserEmail: targetAdmin.email,
      details: {
        reason: 'Admin account unlocked by root admin',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        additionalData: {
          unlockedAdminEmail: targetAdmin.email
        }
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Admin account unlocked successfully',
      data: {
        adminEmail: targetAdmin.email,
        unlockedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Unlock admin account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while unlocking admin account',
      code: 'ADMIN_UNLOCK_ERROR'
    });
  }
};