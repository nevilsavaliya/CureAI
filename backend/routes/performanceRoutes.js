/**
 * Performance Monitoring Routes
 * Provides endpoints for monitoring system performance
 */

const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Performance monitoring routes
router.get('/performance/pool-stats', performanceController.getPoolStats);
router.get('/performance/pool-health', performanceController.getPoolHealth);
router.get('/performance/pool-recommendations', performanceController.getPoolRecommendations);
router.get('/performance/config', performanceController.getPerformanceConfig);
router.get('/performance/metrics', performanceController.getPerformanceMetrics);

module.exports = router;
