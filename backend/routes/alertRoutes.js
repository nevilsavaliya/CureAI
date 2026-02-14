const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Alert Management Routes
 * All routes require admin authentication
 */

// Alert management routes - authentication and authorization applied per route

/**
 * @swagger
 * components:
 *   schemas:
 *     AlertConfig:
 *       type: object
 *       properties:
 *         alertTypes:
 *           type: object
 *           description: Configuration for different alert types
 *         thresholds:
 *           type: object
 *           description: Threshold values for triggering alerts
 *         emailConfig:
 *           type: object
 *           properties:
 *             from:
 *               type: string
 *               description: Sender email address
 *             to:
 *               type: array
 *               items:
 *                 type: string
 *               description: Recipient email addresses
 *         monitoringEnabled:
 *           type: boolean
 *           description: Whether alert monitoring is active
 *     
 *     AlertStats:
 *       type: object
 *       properties:
 *         totalAlerts:
 *           type: integer
 *           description: Total number of alerts in history
 *         alertsByType:
 *           type: object
 *           description: Count of alerts by type
 *         alertsBySeverity:
 *           type: object
 *           description: Count of alerts by severity level
 *         recentAlerts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Alert'
 *           description: Most recent alerts
 *         alertStates:
 *           type: object
 *           description: Current state of alert types
 *         generatedAt:
 *           type: string
 *           format: date-time
 *           description: When statistics were generated
 *     
 *     Alert:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique alert identifier
 *         type:
 *           type: string
 *           description: Alert type
 *         name:
 *           type: string
 *           description: Human-readable alert name
 *         severity:
 *           type: string
 *           enum: [critical, high, medium, low]
 *           description: Alert severity level
 *         message:
 *           type: string
 *           description: Alert message
 *         details:
 *           type: object
 *           description: Additional alert details
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When alert was triggered
 *         channels:
 *           type: array
 *           items:
 *             type: string
 *           description: Channels through which alert was sent
 *     
 *     AlertHealth:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, warning, critical]
 *           description: Overall alert system health
 *         monitoringEnabled:
 *           type: boolean
 *           description: Whether monitoring is active
 *         criticalAlerts:
 *           type: integer
 *           description: Number of critical alerts in last 24 hours
 *         highSeverityAlerts:
 *           type: integer
 *           description: Number of high severity alerts in last 24 hours
 *         totalRecentAlerts:
 *           type: integer
 *           description: Total alerts in last 24 hours
 *         alertSystemOperational:
 *           type: boolean
 *           description: Whether alert system is functioning
 *         lastAlertTime:
 *           type: string
 *           format: date-time
 *           description: Timestamp of most recent alert
 *         enabledAlertTypes:
 *           type: integer
 *           description: Number of enabled alert types
 *         totalAlertTypes:
 *           type: integer
 *           description: Total number of alert types
 */

/**
 * @swagger
 * /api/admin/alerts/config:
 *   get:
 *     summary: Get alert system configuration
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AlertConfig'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/config', authenticate, authorize('admin'), alertController.getAlertConfig);

/**
 * @swagger
 * /api/admin/alerts/config:
 *   put:
 *     summary: Update alert system configuration
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alertTypes:
 *                 type: object
 *                 description: Alert type configurations to update
 *               thresholds:
 *                 type: object
 *                 description: Threshold values to update
 *               emailConfig:
 *                 type: object
 *                 description: Email configuration to update
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AlertConfig'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid configuration data
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.put('/config', authenticate, authorize('admin'), alertController.updateAlertConfig);

/**
 * @swagger
 * /api/admin/alerts/stats:
 *   get:
 *     summary: Get alert statistics
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AlertStats'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/stats', authenticate, authorize('admin'), alertController.getAlertStats);

/**
 * @swagger
 * /api/admin/alerts/health:
 *   get:
 *     summary: Get alert system health status
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AlertHealth'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/health', authenticate, authorize('admin'), alertController.getAlertHealth);

/**
 * @swagger
 * /api/admin/alerts/history:
 *   get:
 *     summary: Get alert history with pagination and filtering
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of alerts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of alerts to skip
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low]
 *         description: Filter by severity level
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by alert type
 *     responses:
 *       200:
 *         description: Alert history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     alerts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Alert'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *                       properties:
 *                         severity:
 *                           type: string
 *                         type:
 *                           type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/history', authenticate, authorize('admin'), alertController.getAlertHistory);

/**
 * @swagger
 * /api/admin/alerts/test:
 *   post:
 *     summary: Send a test alert
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test alert sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/test', authenticate, authorize('admin'), alertController.sendTestAlert);

/**
 * @swagger
 * /api/admin/alerts/start:
 *   post:
 *     summary: Start alert monitoring
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert monitoring started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/start', authenticate, authorize('admin'), alertController.startMonitoring);

/**
 * @swagger
 * /api/admin/alerts/stop:
 *   post:
 *     summary: Stop alert monitoring
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert monitoring stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/stop', authenticate, authorize('admin'), alertController.stopMonitoring);

/**
 * @swagger
 * /api/admin/alerts/data:
 *   delete:
 *     summary: Clear alert history and statistics
 *     tags: [Alert Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert data cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.delete('/data', authenticate, authorize('admin'), alertController.clearAlertData);

module.exports = router;