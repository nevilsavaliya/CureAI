const errorTracker = require('../services/errorTracker');
const logger = require('../services/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get error statistics
 * GET /api/admin/errors/stats
 */
exports.getErrorStats = async (req, res) => {
  try {
    const stats = errorTracker.getErrorStats();
    
    // Add time-based statistics
    const timeStats = await this.getTimeBasedStats();
    
    res.status(200).json({
      success: true,
      stats: {
        ...stats,
        ...timeStats,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Get error stats failed', {
      type: 'ERROR_STATS_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error statistics',
      error: error.message
    });
  }
};

/**
 * Get error trends over time
 * GET /api/admin/errors/trends
 */
exports.getErrorTrends = async (req, res) => {
  try {
    const { period = '24h', category } = req.query;
    
    const trends = await this.calculateErrorTrends(period, category);
    
    res.status(200).json({
      success: true,
      trends,
      period,
      category: category || 'all',
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get error trends failed', {
      type: 'ERROR_TRENDS_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error trends',
      error: error.message
    });
  }
};

/**
 * Get error details by category
 * GET /api/admin/errors/category/:category
 */
exports.getErrorsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const errors = await this.getErrorsByCategory(category, parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      success: true,
      category,
      errors,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: errors.length
      }
    });
    
  } catch (error) {
    logger.error('Get errors by category failed', {
      type: 'ERROR_CATEGORY_ERROR',
      error: error.message,
      stack: error.stack,
      category: req.params.category,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve errors by category',
      error: error.message
    });
  }
};

/**
 * Get hospital-specific error statistics
 * GET /api/admin/errors/hospital/:hospitalId
 */
exports.getHospitalErrors = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { period = '7d' } = req.query;
    
    const hospitalErrors = await this.getHospitalSpecificErrors(hospitalId, period);
    
    res.status(200).json({
      success: true,
      hospitalId,
      period,
      errors: hospitalErrors,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get hospital errors failed', {
      type: 'HOSPITAL_ERROR_STATS_ERROR',
      error: error.message,
      stack: error.stack,
      hospitalId: req.params.hospitalId,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hospital error statistics',
      error: error.message
    });
  }
};

/**
 * Clear error statistics (admin only)
 * DELETE /api/admin/errors/stats
 */
exports.clearErrorStats = async (req, res) => {
  try {
    errorTracker.clearStats();
    
    logger.info('Error statistics cleared', {
      type: 'ERROR_STATS_CLEARED',
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Error statistics cleared successfully'
    });
    
  } catch (error) {
    logger.error('Clear error stats failed', {
      type: 'CLEAR_ERROR_STATS_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to clear error statistics',
      error: error.message
    });
  }
};

/**
 * Get error health check
 * GET /api/admin/errors/health
 */
exports.getErrorHealth = async (req, res) => {
  try {
    const stats = errorTracker.getErrorStats();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Calculate health metrics
    const health = {
      status: 'healthy',
      criticalErrors: stats.errorsBySeverity.critical || 0,
      highSeverityErrors: stats.errorsBySeverity.high || 0,
      totalErrors: stats.totalErrors,
      errorRate: this.calculateErrorRate(stats),
      alerts: []
    };
    
    // Check for critical conditions
    if (health.criticalErrors > 0) {
      health.status = 'critical';
      health.alerts.push({
        level: 'critical',
        message: `${health.criticalErrors} critical errors detected`,
        action: 'Immediate attention required'
      });
    } else if (health.highSeverityErrors > 10) {
      health.status = 'warning';
      health.alerts.push({
        level: 'warning',
        message: `${health.highSeverityErrors} high severity errors detected`,
        action: 'Review and investigate'
      });
    } else if (health.errorRate > 0.1) { // More than 10% error rate
      health.status = 'warning';
      health.alerts.push({
        level: 'warning',
        message: `High error rate: ${(health.errorRate * 100).toFixed(2)}%`,
        action: 'Monitor system performance'
      });
    }
    
    res.status(200).json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get error health failed', {
      type: 'ERROR_HEALTH_ERROR',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error health status',
      error: error.message
    });
  }
};

/**
 * Helper method to get time-based statistics
 */
exports.getTimeBasedStats = async () => {
  try {
    const logsDir = path.join(__dirname, '../logs');
    const errorLogPattern = /error-\d{4}-\d{2}-\d{2}\.log$/;
    
    const files = await fs.readdir(logsDir);
    const errorFiles = files.filter(file => errorLogPattern.test(file));
    
    // Get today's and yesterday's error counts
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const todayFile = `error-${today}.log`;
    const yesterdayFile = `error-${yesterday}.log`;
    
    const todayErrors = errorFiles.includes(todayFile) ? 
      await this.countErrorsInFile(path.join(logsDir, todayFile)) : 0;
    const yesterdayErrors = errorFiles.includes(yesterdayFile) ? 
      await this.countErrorsInFile(path.join(logsDir, yesterdayFile)) : 0;
    
    return {
      todayErrors,
      yesterdayErrors,
      errorTrend: todayErrors - yesterdayErrors,
      availableLogFiles: errorFiles.length
    };
    
  } catch (error) {
    logger.error('Get time-based stats failed', {
      type: 'TIME_STATS_ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return {
      todayErrors: 0,
      yesterdayErrors: 0,
      errorTrend: 0,
      availableLogFiles: 0
    };
  }
};

/**
 * Helper method to count errors in a log file
 */
exports.countErrorsInFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    return lines.filter(line => line.includes('"level":"error"')).length;
  } catch (error) {
    return 0;
  }
};

/**
 * Helper method to calculate error trends
 */
exports.calculateErrorTrends = async (period, category) => {
  // This is a simplified implementation
  // In a production system, you might want to use a time-series database
  const stats = errorTracker.getErrorStats();
  
  const trends = {
    period,
    category: category || 'all',
    dataPoints: [],
    summary: {
      totalErrors: category ? (stats.errorsByCategory[category] || 0) : stats.totalErrors,
      trend: 'stable', // 'increasing', 'decreasing', 'stable'
      changePercent: 0
    }
  };
  
  // Generate mock trend data (in production, this would come from historical data)
  const hours = period === '24h' ? 24 : period === '7d' ? 168 : 24;
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    trends.dataPoints.push({
      timestamp: timestamp.toISOString(),
      errorCount: Math.floor(Math.random() * 10), // Mock data
      category: category || 'all'
    });
  }
  
  return trends;
};

/**
 * Helper method to get errors by category
 */
exports.getErrorsByCategory = async (category, limit, offset) => {
  const stats = errorTracker.getErrorStats();
  
  // Filter errors by category
  const categoryErrors = stats.topErrors.filter(error => 
    error.category === category
  );
  
  // Apply pagination
  return categoryErrors.slice(offset, offset + limit);
};

/**
 * Helper method to get hospital-specific errors
 */
exports.getHospitalSpecificErrors = async (hospitalId, period) => {
  // This would typically query a database or log aggregation system
  // For now, return mock data structure
  return {
    hospitalId,
    period,
    totalErrors: 0,
    errorsByCategory: {},
    recentErrors: [],
    trends: []
  };
};

/**
 * Helper method to calculate error rate
 */
exports.calculateErrorRate = (stats) => {
  // Simple error rate calculation
  // In production, this would be errors/total_requests
  const totalRequests = stats.totalErrors * 10; // Mock total requests
  return totalRequests > 0 ? stats.totalErrors / totalRequests : 0;
};

module.exports = exports;