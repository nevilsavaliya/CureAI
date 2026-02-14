const express = require('express');
const router = express.Router();
const adminSecurityController = require('../controllers/adminSecurityController');
const { isAdmin, isRootAdmin } = require('../middleware/adminRoleAuth');
const { validateSessionTimeout, detectSuspiciousActivity, require2FA, rateLimitAdminOperations, logAdminOperation } = require('../middleware/adminSecurityMiddleware');

// Apply common middleware to all routes
router.use(isAdmin);
router.use(validateSessionTimeout);
router.use(detectSuspiciousActivity);
router.use(rateLimitAdminOperations);
router.use(logAdminOperation);

/**
 * 2FA Management Routes
 */

// Generate 2FA secret and QR code
router.post('/2fa/generate', adminSecurityController.generate2FASecret);

// Verify 2FA token and enable 2FA
router.post('/2fa/verify', adminSecurityController.verify2FAToken);

// Disable 2FA (requires current password)
router.post('/2fa/disable', adminSecurityController.disable2FA);

/**
 * Security Status and Settings Routes
 */

// Get security status for current admin
router.get('/status', adminSecurityController.getSecurityStatus);

// Update session timeout (root admin only)
router.put('/session-timeout', isRootAdmin, adminSecurityController.updateSessionTimeout);

/**
 * Security Monitoring Routes (Root Admin Only)
 */

// Get security audit logs
router.get('/audit-logs', isRootAdmin, adminSecurityController.getSecurityAuditLogs);

// Get security statistics
router.get('/statistics', isRootAdmin, adminSecurityController.getSecurityStatistics);

// Unlock admin account
router.post('/unlock/:adminId', isRootAdmin, require2FA, adminSecurityController.unlockAdminAccount);

module.exports = router;