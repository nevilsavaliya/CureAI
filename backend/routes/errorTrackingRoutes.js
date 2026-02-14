const express = require('express');
const router = express.Router();
const errorTrackingController = require('../controllers/errorTrackingController');
const { authenticate } = require('../middleware/auth');
const { hospitalErrorTracking } = require('../middleware/errorTracking');

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorStats:
 *       type: object
 *       properties:
 *         totalErrors:
 *           type: number
 *           description: Total number of errors tracked
 *         errorsByCategory:
 *           type: object
 *           description: Errors grouped by category
 *         errorsBySeverity:
 *           type: object
 *           description: Errors grouped by severity level
 *         topErrors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fingerprint:
 *                 type: string
 *               category:
 *                 type: string
 *               message:
 *                 type: string
 *               count:
 *                 type: number
 *               severity:
 *                 type: string
 *         generatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ErrorHealth:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, warning, critical]
 *         criticalErrors:
 *           type: number
 *         highSeverityErrors:
 *           type: number
 *         totalErrors:
 *           type: number
 *         errorRate:
 *           type: number
 *         alerts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *               message:
 *                 type: string
 *               action:
 *                 type: string
 */

/**
 * @swagger
 * /api/admin/errors/stats:
 *   get:
 *     summary: Get error statistics
 *     description: Retrieve comprehensive error statistics for admin monitoring
 *     tags: [Error Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   $ref: '#/components/schemas/ErrorStats'
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/stats', authenticate, hospitalErrorTracking, errorTrackingController.getErrorStats);

/**
 * @swagger
 * /api/admin/errors/health:
 *   get:
 *     summary: Get error health status
 *     description: Get overall system health based on error patterns
 *     tags: [Error Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 health:
 *                   $ref: '#/components/schemas/ErrorHealth'
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/health', authenticate, hospitalErrorTracking, errorTrackingController.getErrorHealth);

/**
 * @swagger
 * /api/admin/errors/trends:
 *   get:
 *     summary: Get error trends over time
 *     description: Retrieve error trends and patterns over specified time period
 *     tags: [Error Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time period for trend analysis
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by specific error category
 *     responses:
 *       200:
 *         description: Error trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 trends:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                     category:
 *                       type: string
 *                     dataPoints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           errorCount:
 *                             type: number
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/trends', authenticate, hospitalErrorTracking, errorTrackingController.getErrorTrends);

/**
 * @swagger
 * /api/admin/errors/category/{category}:
 *   get:
 *     summary: Get errors by category
 *     description: Retrieve errors filtered by specific category
 *     tags: [Error Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Error category to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of errors to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of errors to skip
 *     responses:
 *       200:
 *         description: Errors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 category:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/category/:category', authenticate, hospitalErrorTracking, errorTrackingController.getErrorsByCategory);

/**
 * @swagger
 * /api/admin/errors/hospital/{hospitalId}:
 *   get:
 *     summary: Get hospital-specific errors
 *     description: Retrieve error statistics for a specific hospital
 *     tags: [Error Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID to get errors for
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d]
 *           default: 7d
 *         description: Time period for error analysis
 *     responses:
 *       200:
 *         description: Hospital errors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 hospitalId:
 *                   type: string
 *                 period:
 *                   type: string
 *                 errors:
 *                   type: object
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/hospital/:hospitalId', authenticate, hospitalErrorTracking, errorTrackingController.getHospitalErrors);

/**
 * @swagger
 * /api/admin/errors/stats:
 *   delete:
 *     summary: Clear error statistics
 *     description: Clear all error statistics (admin only)
 *     tags: [Error Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error statistics cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.delete('/stats', authenticate, hospitalErrorTracking, errorTrackingController.clearErrorStats);

module.exports = router;