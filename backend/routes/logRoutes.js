const express = require('express');
const router = express.Router();
const LogAnalyzer = require('../utils/logAnalyzer');
const { authenticate } = require('../middleware/auth');
const logger = require('../services/logger');

// Initialize log analyzer
const logAnalyzer = new LogAnalyzer();

/**
 * @swagger
 * /api/admin/logs/report:
 *   get:
 *     summary: Get comprehensive log report (Admin only)
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to include in report
 *     responses:
 *       200:
 *         description: Log report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 report:
 *                   type: object
 *                   properties:
 *                     reportDate:
 *                       type: string
 *                     periodDays:
 *                       type: integer
 *                     hospitalActivity:
 *                       type: object
 *                     securityEvents:
 *                       type: object
 *                     apiPerformance:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/report', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const days = parseInt(req.query.days) || 7;
    const report = await logAnalyzer.generateReport(days);

    // Log admin access to logs
    logger.info('Admin accessed log report', {
      type: 'ADMIN_LOG_ACCESS',
      adminId: req.user.id,
      adminEmail: req.user.email,
      reportDays: days,
      ip: logger.getClientIP(req),
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('Log report generation error', {
      type: 'LOG_REPORT_ERROR',
      adminId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate log report',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/logs/search:
 *   get:
 *     summary: Search logs for specific patterns (Admin only)
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pattern
 *         required: true
 *         schema:
 *           type: string
 *         description: Search pattern
 *       - in: query
 *         name: logType
 *         schema:
 *           type: string
 *           enum: [all, hospital, security, api-access, error]
 *           default: all
 *         description: Type of logs to search
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { pattern, logType = 'all', limit = 100 } = req.query;

    if (!pattern) {
      return res.status(400).json({
        success: false,
        message: 'Search pattern is required'
      });
    }

    const results = await logAnalyzer.searchLogs(pattern, logType, parseInt(limit));

    // Log admin search
    logger.info('Admin searched logs', {
      type: 'ADMIN_LOG_SEARCH',
      adminId: req.user.id,
      adminEmail: req.user.email,
      searchPattern: pattern,
      logType: logType,
      resultsCount: results.length,
      ip: logger.getClientIP(req),
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      results,
      searchInfo: {
        pattern,
        logType,
        limit: parseInt(limit),
        resultsCount: results.length
      }
    });

  } catch (error) {
    logger.error('Log search error', {
      type: 'LOG_SEARCH_ERROR',
      adminId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to search logs',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/logs/hospital-activity:
 *   get:
 *     summary: Get hospital activity summary (Admin only)
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Hospital activity summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 activity:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/hospital-activity', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const days = parseInt(req.query.days) || 7;
    const activity = await logAnalyzer.getHospitalActivitySummary(days);

    res.status(200).json({
      success: true,
      activity,
      periodDays: days
    });

  } catch (error) {
    logger.error('Hospital activity summary error', {
      type: 'HOSPITAL_ACTIVITY_ERROR',
      adminId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get hospital activity summary',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/logs/security-events:
 *   get:
 *     summary: Get security events summary (Admin only)
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Security events summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 events:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/security-events', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const days = parseInt(req.query.days) || 7;
    const events = await logAnalyzer.getSecurityEventsSummary(days);

    res.status(200).json({
      success: true,
      events,
      periodDays: days
    });

  } catch (error) {
    logger.error('Security events summary error', {
      type: 'SECURITY_EVENTS_ERROR',
      adminId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get security events summary',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/logs/api-performance:
 *   get:
 *     summary: Get API performance metrics (Admin only)
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: API performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 performance:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/api-performance', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const days = parseInt(req.query.days) || 7;
    const performance = await logAnalyzer.getApiPerformanceMetrics(days);

    res.status(200).json({
      success: true,
      performance,
      periodDays: days
    });

  } catch (error) {
    logger.error('API performance metrics error', {
      type: 'API_PERFORMANCE_ERROR',
      adminId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get API performance metrics',
      error: error.message
    });
  }
});

module.exports = router;