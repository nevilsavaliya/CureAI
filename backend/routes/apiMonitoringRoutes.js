const express = require('express');
const router = express.Router();
const apiMonitoringController = require('../controllers/apiMonitoringController');
const { authenticate, authorize } = require('../middleware/auth');
const { hospitalLogger } = require('../middleware/logging');

/**
 * API Monitoring Routes
 * All routes require admin authentication
 */

// Apply hospital logging to all routes
router.use(hospitalLogger);

/**
 * @swagger
 * /api/admin/monitoring/realtime:
 *   get:
 *     summary: Get real-time API metrics
 *     description: Returns current API metrics including request counts, success rates, and performance data
 *     tags: [API Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     date:
 *                       type: string
 *                       format: date
 *                     requests:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         successful:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                         successRate:
 *                           type: number
 *                         errorRate:
 *                           type: number
 *                     performance:
 *                       type: object
 *                       properties:
 *                         averageResponseTime:
 *                           type: number
 *                         slowRequests:
 *                           type: integer
 *                         slowRequestRate:
 *                           type: number
 *                     security:
 *                       type: object
 *                       properties:
 *                         authenticationErrors:
 *                           type: integer
 *                         rateLimitExceeded:
 *                           type: integer
 *                     usage:
 *                       type: object
 *                       properties:
 *                         patientDataRequests:
 *                           type: integer
 *                         uniqueHospitals:
 *                           type: integer
 *                         uniquePatients:
 *                           type: integer
 *                     alerts:
 *                       type: object
 *                       properties:
 *                         highErrorRate:
 *                           type: boolean
 *                         criticalErrorRate:
 *                           type: boolean
 *                         slowPerformance:
 *                           type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/realtime', authenticate, authorize('admin'), apiMonitoringController.getRealTimeMetrics);

/**
 * @swagger
 * /api/admin/monitoring/statistics:
 *   get:
 *     summary: Get comprehensive API statistics
 *     description: Returns detailed API statistics for a specified time period
 *     tags: [API Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics (ISO 8601 format)
 *         example: "2024-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics (ISO 8601 format)
 *         example: "2024-01-31T23:59:59.999Z"
 *       - in: query
 *         name: useCache
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Whether to use cached data for faster response
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                     realTimeMetrics:
 *                       type: object
 *                     hospitals:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         verified:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         withApiAccess:
 *                           type: integer
 *                         topByUsage:
 *                           type: array
 *                           items:
 *                             type: object
 *                     usage:
 *                       type: object
 *                     performance:
 *                       type: object
 *                     errors:
 *                       type: object
 *       400:
 *         description: Bad request - Invalid date format or date range
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', authenticate, authorize('admin'), apiMonitoringController.getApiStatistics);

/**
 * @swagger
 * /api/admin/monitoring/health:
 *   get:
 *     summary: Get API health status
 *     description: Returns the current health status of the API with detailed checks
 *     tags: [API Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     checks:
 *                       type: object
 *                       properties:
 *                         errorRate:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [healthy, warning, critical]
 *                             value:
 *                               type: number
 *                             threshold:
 *                               type: number
 *                             message:
 *                               type: string
 *                         responseTime:
 *                           type: object
 *                         availability:
 *                           type: object
 *                     alerts:
 *                       type: object
 *       503:
 *         description: API is unhealthy
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/health', authenticate, authorize('admin'), apiMonitoringController.getApiHealth);

/**
 * @swagger
 * /api/admin/monitoring/config:
 *   get:
 *     summary: Get API monitoring configuration
 *     description: Returns the current monitoring configuration including thresholds and limits
 *     tags: [API Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     performanceThresholds:
 *                       type: object
 *                       properties:
 *                         slowRequestMs:
 *                           type: integer
 *                         criticalResponseTimeMs:
 *                           type: integer
 *                         highErrorRatePercent:
 *                           type: number
 *                         criticalErrorRatePercent:
 *                           type: number
 *                     alertThresholds:
 *                       type: object
 *                       properties:
 *                         errorSpike:
 *                           type: integer
 *                         slowRequestSpike:
 *                           type: integer
 *                         rateLimitSpike:
 *                           type: integer
 *                     cacheDuration:
 *                       type: integer
 *                     rateLimits:
 *                       type: object
 *                       properties:
 *                         requestsPerHour:
 *                           type: integer
 *                         windowMs:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/config', authenticate, authorize('admin'), apiMonitoringController.getMonitoringConfig);

/**
 * @swagger
 * /api/admin/monitoring/clear-cache:
 *   post:
 *     summary: Clear API monitoring cache
 *     description: Clears the cached monitoring data to force fresh calculations
 *     tags: [API Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "API monitoring cache cleared successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.post('/clear-cache', authenticate, authorize('admin'), apiMonitoringController.clearCache);

/**
 * @swagger
 * /api/admin/monitoring/prometheus:
 *   get:
 *     summary: Get metrics in Prometheus format
 *     description: Returns API metrics in Prometheus format for external monitoring systems
 *     tags: [API Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prometheus metrics retrieved successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP hospital_api_requests_total Total number of API requests
 *                 # TYPE hospital_api_requests_total counter
 *                 hospital_api_requests_total{status="total"} 1234
 *                 hospital_api_requests_total{status="successful"} 1200
 *                 hospital_api_requests_total{status="failed"} 34
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/prometheus', authenticate, authorize('admin'), apiMonitoringController.getPrometheusMetrics);

module.exports = router;