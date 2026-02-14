const alertService = require('../services/alertService');
const logger = require('../services/logger');

/**
 * Alert Controller
 * Provides REST API endpoints for managing and monitoring the alert system
 */

/**
 * Get alert configuration
 * GET /api/admin/alerts/config
 */
const getAlertConfig = async (req, res) => {
  try {
    const config = alertService.getAlertConfig();
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting alert configuration', {
      type: 'ALERT_CONFIG_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get alert configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update alert configuration
 * PUT /api/admin/alerts/config
 */
const updateAlertConfig = async (req, res) => {
  try {
    const { alertTypes, thresholds, emailConfig } = req.body;

    // Validate configuration
    if (alertTypes && typeof alertTypes !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid alertTypes configuration'
      });
    }

    if (thresholds && typeof thresholds !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid thresholds configuration'
      });
    }

    if (emailConfig && typeof emailConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid emailConfig configuration'
      });
    }

    // Update configuration
    alertService.updateAlertConfig({
      alertTypes,
      thresholds,
      emailConfig
    });

    // Log configuration update
    logger.info('Alert configuration updated by admin', {
      type: 'ALERT_CONFIG_UPDATED',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      changes: {
        alertTypes: !!alertTypes,
        thresholds: !!thresholds,
        emailConfig: !!emailConfig
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Alert configuration updated successfully',
      data: alertService.getAlertConfig(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error updating alert configuration', {
      type: 'ALERT_CONFIG_UPDATE_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update alert configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get alert statistics
 * GET /api/admin/alerts/stats
 */
const getAlertStats = async (req, res) => {
  try {
    const stats = alertService.getAlertStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting alert statistics', {
      type: 'ALERT_STATS_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get alert statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get alert health status
 * GET /api/admin/alerts/health
 */
const getAlertHealth = async (req, res) => {
  try {
    const stats = alertService.getAlertStats();
    const config = alertService.getAlertConfig();
    
    // Calculate health metrics
    const recentAlerts = stats.recentAlerts.filter(
      alert => Date.now() - new Date(alert.timestamp).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    const highSeverityAlerts = recentAlerts.filter(alert => alert.severity === 'high');
    
    const health = {
      status: criticalAlerts.length > 0 ? 'critical' : 
              highSeverityAlerts.length > 5 ? 'warning' : 'healthy',
      monitoringEnabled: config.monitoringEnabled,
      criticalAlerts: criticalAlerts.length,
      highSeverityAlerts: highSeverityAlerts.length,
      totalRecentAlerts: recentAlerts.length,
      alertSystemOperational: true,
      lastAlertTime: stats.recentAlerts.length > 0 ? stats.recentAlerts[0].timestamp : null,
      enabledAlertTypes: Object.keys(config.alertTypes).filter(
        type => config.alertTypes[type].enabled
      ).length,
      totalAlertTypes: Object.keys(config.alertTypes).length
    };

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting alert health status', {
      type: 'ALERT_HEALTH_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get alert health status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Send test alert
 * POST /api/admin/alerts/test
 */
const sendTestAlert = async (req, res) => {
  try {
    await alertService.sendTestAlert();
    
    logger.info('Test alert sent by admin', {
      type: 'TEST_ALERT_SENT',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Test alert sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error sending test alert', {
      type: 'TEST_ALERT_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send test alert',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Clear alert data
 * DELETE /api/admin/alerts/data
 */
const clearAlertData = async (req, res) => {
  try {
    alertService.clearAlertData();
    
    logger.info('Alert data cleared by admin', {
      type: 'ALERT_DATA_CLEARED',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Alert data cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error clearing alert data', {
      type: 'ALERT_DATA_CLEAR_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to clear alert data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Start alert monitoring
 * POST /api/admin/alerts/start
 */
const startMonitoring = async (req, res) => {
  try {
    alertService.startMonitoring();
    
    logger.info('Alert monitoring started by admin', {
      type: 'ALERT_MONITORING_STARTED',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Alert monitoring started successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error starting alert monitoring', {
      type: 'ALERT_MONITORING_START_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to start alert monitoring',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Stop alert monitoring
 * POST /api/admin/alerts/stop
 */
const stopMonitoring = async (req, res) => {
  try {
    alertService.stopMonitoring();
    
    logger.info('Alert monitoring stopped by admin', {
      type: 'ALERT_MONITORING_STOPPED',
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Alert monitoring stopped successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error stopping alert monitoring', {
      type: 'ALERT_MONITORING_STOP_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to stop alert monitoring',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get alert history
 * GET /api/admin/alerts/history
 */
const getAlertHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, severity, type } = req.query;
    const stats = alertService.getAlertStats();
    
    let alerts = stats.recentAlerts || [];
    
    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // Filter by type if specified
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedAlerts = alerts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        pagination: {
          total: alerts.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: endIndex < alerts.length
        },
        filters: {
          severity,
          type
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting alert history', {
      type: 'ALERT_HISTORY_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get alert history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAlertConfig,
  updateAlertConfig,
  getAlertStats,
  getAlertHealth,
  sendTestAlert,
  clearAlertData,
  startMonitoring,
  stopMonitoring,
  getAlertHistory
};