const express = require('express');
const router = express.Router();
const adminUserManagementController = require('../controllers/adminUserManagementController');
const { authenticate } = require('../middleware/auth');
const { isAdmin, isRootAdmin, validateAdminSession, checkUserManagementPermission } = require('../middleware/adminRoleAuth');
const { 
  adminRateLimit, 
  validateAndSanitizeRequest, 
  csrfProtection, 
  ipRestriction,
  generateCSRFToken 
} = require('../middleware/adminSecurityMiddleware');

// Apply authentication and admin validation to all routes
router.use(authenticate, isAdmin, validateAdminSession);

// Apply security middleware to all routes
router.use(adminRateLimit, validateAndSanitizeRequest);

// CSRF token generation endpoint (GET request, no CSRF protection needed)
router.get('/csrf-token', generateCSRFToken);

// Admin Management Routes (Root Admin Only) - Critical operations with full security
router.post('/users/add-admin', 
  isRootAdmin,
  ipRestriction,
  csrfProtection,
  adminUserManagementController.addAdmin
);

router.get('/users/admins', 
  isRootAdmin, 
  adminUserManagementController.getAdmins
);

// User Management Routes (Role-based permissions) - Sensitive operations
router.delete('/users/:id/remove', 
  (req, res, next) => {
    const userType = req.query.userType;
    return checkUserManagementPermission(userType)(req, res, next);
  },
  csrfProtection,
  adminUserManagementController.removeUser
);

router.get('/users', 
  adminUserManagementController.getUsers
);

// User Restoration Routes (Root Admin Only) - Sensitive operations
router.post('/users/:id/restore', 
  isRootAdmin,
  ipRestriction,
  csrfProtection,
  adminUserManagementController.restoreUser
);

router.get('/users/removed', 
  isRootAdmin, 
  adminUserManagementController.getRemovedUsers
);

// Audit and Logging Routes (Root Admin Only) - Sensitive data access
router.get('/audit-logs', 
  isRootAdmin,
  ipRestriction,
  adminUserManagementController.getAuditLogs
);

router.get('/audit-logs/export', 
  isRootAdmin,
  ipRestriction,
  adminUserManagementController.exportAuditLogs
);

router.get('/audit-logs/statistics', 
  isRootAdmin,
  ipRestriction,
  adminUserManagementController.getAuditStatistics
);

// Bulk Operations Routes (Role-based permissions) - Critical operations
router.post('/users/bulk-remove', 
  (req, res, next) => {
    const userType = req.body.userType;
    return checkUserManagementPermission(userType)(req, res, next);
  },
  ipRestriction,
  csrfProtection,
  adminUserManagementController.bulkRemoveUsers
);

// Statistics Routes (Root Admin Only)
router.get('/users/removal-statistics', 
  isRootAdmin, 
  adminUserManagementController.getRemovalStatistics
);

// Data Integrity Routes (Root Admin Only)
router.get('/data-integrity/status', 
  isRootAdmin,
  adminUserManagementController.getDataIntegrityStatus
);

// Scheduled Job Management Routes (Root Admin Only) - Critical system operations
router.post('/jobs/trigger/data-cleanup', 
  isRootAdmin,
  ipRestriction,
  csrfProtection,
  adminUserManagementController.triggerDataCleanup
);

router.post('/jobs/trigger/integrity-check', 
  isRootAdmin,
  ipRestriction,
  csrfProtection,
  adminUserManagementController.triggerDataIntegrityCheck
);

router.get('/jobs/status', 
  isRootAdmin,
  adminUserManagementController.getScheduledJobStatus
);

// Email Delivery Statistics Route (Root Admin Only)
router.get('/email-delivery/statistics', 
  isRootAdmin,
  adminUserManagementController.getEmailDeliveryStatistics
);

module.exports = router;