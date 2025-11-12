const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentMetrics = require('../services/paymentMetrics');
const paymentLogger = require('../services/paymentLogger');

/**
 * @route   GET /api/payment-metrics/comprehensive
 * @desc    Get comprehensive payment metrics
 * @access  Private (Admin only - should add admin check)
 */
router.get('/comprehensive', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, useCache } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const cache = useCache !== 'false';

    const metrics = await paymentMetrics.getComprehensiveMetrics(start, end, cache);

    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching comprehensive metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payment-metrics/success-rate
 * @desc    Get payment success rate
 * @access  Private (Admin only)
 */
router.get('/success-rate', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const metrics = await paymentMetrics.calculateSuccessRate(start, end);

    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching success rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch success rate',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payment-metrics/verification-time
 * @desc    Get average verification time
 * @access  Private (Admin only)
 */
router.get('/verification-time', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const metrics = await paymentMetrics.calculateAverageVerificationTime(start, end);

    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching verification time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification time',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payment-metrics/api-errors
 * @desc    Get API error rate
 * @access  Private (Admin only)
 */
router.get('/api-errors', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const metrics = await paymentMetrics.calculateAPIErrorRate(start, end);

    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching API error rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API error rate',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payment-metrics/revenue
 * @desc    Get revenue metrics
 * @access  Private (Admin only)
 */
router.get('/revenue', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const metrics = await paymentMetrics.calculateRevenueMetrics(start, end);

    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue metrics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payment-metrics/trends
 * @desc    Get payment trends (daily breakdown)
 * @access  Private (Admin only)
 */
router.get('/trends', authenticate, async (req, res) => {
  try {
    const { days } = req.query;
    const daysCount = days ? parseInt(days) : 30;

    const trends = await paymentMetrics.getPaymentTrends(daysCount);

    res.status(200).json({
      success: true,
      trends
    });
  } catch (error) {
    console.error('Error fetching payment trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment trends',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payment-metrics/daily-counters
 * @desc    Get today's real-time counters
 * @access  Private (Admin only)
 */
router.get('/daily-counters', authenticate, async (req, res) => {
  try {
    const counters = paymentMetrics.getDailyCounters();

    res.status(200).json({
      success: true,
      counters
    });
  } catch (error) {
    console.error('Error fetching daily counters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily counters',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payment-metrics/logs/:logType
 * @desc    Get recent log entries
 * @access  Private (Admin only)
 */
router.get('/logs/:logType', authenticate, async (req, res) => {
  try {
    const { logType } = req.params;
    const { lines } = req.query;
    const lineCount = lines ? parseInt(lines) : 100;

    const logs = paymentLogger.readRecentLogs(logType, lineCount);

    res.status(200).json({
      success: true,
      logType,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payment-metrics/clear-cache
 * @desc    Clear metrics cache
 * @access  Private (Admin only)
 */
router.post('/clear-cache', authenticate, async (req, res) => {
  try {
    paymentMetrics.clearCache();

    res.status(200).json({
      success: true,
      message: 'Metrics cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

module.exports = router;
