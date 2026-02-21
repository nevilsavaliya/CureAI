/**
 * Health Check Routes
 * Provides various health check endpoints for monitoring
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

/**
 * @route   GET /api/health
 * @desc    Basic health check (for load balancers)
 * @access  Public
 */
router.get('/', healthController.basicHealthCheck);

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with all system information
 * @access  Public
 * @query   cache - Set to 'false' to bypass cache
 */
router.get('/detailed', healthController.detailedHealthCheck);

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check (for Kubernetes readiness probe)
 * @access  Public
 */
router.get('/ready', healthController.readinessCheck);

/**
 * @route   GET /api/health/live
 * @desc    Liveness check (for Kubernetes liveness probe)
 * @access  Public
 */
router.get('/live', healthController.livenessCheck);

module.exports = router;
