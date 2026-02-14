const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { isAdmin, validateAdminSession } = require('../middleware/adminRoleAuth');

// Apply admin authentication and session validation to all admin routes
router.use('/admin', authenticate, isAdmin, validateAdminSession);

// Admin dashboard and metrics routes
router.get('/admin/metrics', adminController.getMetrics);
router.get('/admin/users', adminController.getUsers);
router.get('/admin/users/:id', adminController.getUserDetail);
router.get('/admin/performance/metrics', adminController.getPerformanceMetrics);
router.get('/admin/performance/logs', adminController.getSystemLogs);

module.exports = router;
