const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const logger = require('./logger');

/**
 * API Monitoring Service for Hospital Feature
 * Tracks API usage, performance metrics, and provides monitoring capabilities
 */
class ApiMonitoring {
  constructor() {
    // In-memory metrics cache
    this.metricsCache = {
      lastUpdated: null,
      data: null
    };
    
    // Cache duration: 5 minutes
    this.cacheDuration = 5 * 60 * 1000;
    
    // Real-time counters (reset daily)
    this.dailyCounters = {
      date: new Date().toISOString().split('T')[0],
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      authenticationErrors: 0,
      rateLimitExceeded: 0,
      patientDataRequests: 0,
      uniqueHospitals: new Set(),
      uniquePatients: new Set(),
      totalResponseTime: 0,
      slowRequests: 0 // requests > 1000ms
    };

    // Performance thresholds
    this.performanceThresholds = {
      slowRequestMs: 1000,
      criticalResponseTimeMs: 5000,
      highErrorRatePercent: 5,
      criticalErrorRatePercent: 10
    };

    // Alert thresholds
    this.alertThresholds = {
      errorSpike: 10, // errors per 5 minutes
      slowRequestSpike: 20, // slow requests per 5 minutes
      rateLimitSpike: 5 // rate limit hits per 5 minutes
    };

    // Recent activity tracking (last 5 minutes)
    this.recentActivity = {
      errors: [],
      slowRequests: [],
      rateLimitHits: [],
      lastCleanup: Date.now()
    };
  }

  /**
   * Track API request start
   * @param {Object} requestData - Request information
   * @returns {string} - Request tracking ID
   */
  trackRequestStart(requestData) {
    const trackingId = this.generateTrackingId();
    const timestamp = Date.now();

    // Update daily counters
    this.updateDailyCounters('totalRequests');
    
    if (requestData.hospitalId) {
      this.dailyCounters.uniqueHospitals.add(requestData.hospitalId);
    }

    // Log request start
    logger.api.request({
      trackingId,
      method: requestData.method,
      url: requestData.url,
      hospitalId: requestData.hospitalId,
      ip: requestData.ip,
      userAgent: requestData.userAgent
    });

    return trackingId;
  }

  /**
   * Track API request completion
   * @param {string} trackingId - Request tracking ID
   * @param {Object} responseData - Response information
   */
  trackRequestEnd(trackingId, responseData) {
    const responseTime = responseData.responseTime;
    const statusCode = responseData.statusCode;
    const success = statusCode >= 200 && statusCode < 400;

    // Update daily counters
    if (success) {
      this.updateDailyCounters('successfulRequests');
    } else {
      this.updateDailyCounters('failedRequests');
    }

    // Track response time
    this.dailyCounters.totalResponseTime += responseTime;

    // Track slow requests
    if (responseTime > this.performanceThresholds.slowRequestMs) {
      this.updateDailyCounters('slowRequests');
      this.trackSlowRequest({
        trackingId,
        responseTime,
        endpoint: responseData.endpoint,
        hospitalId: responseData.hospitalId
      });
    }

    // Log response
    logger.api.response({
      trackingId,
      method: responseData.method,
      url: responseData.url,
      statusCode: statusCode,
      responseTime: responseTime,
      hospitalId: responseData.hospitalId
    });

    // Log performance warning for very slow requests
    if (responseTime > this.performanceThresholds.criticalResponseTimeMs) {
      logger.performance.slowApi({
        trackingId,
        endpoint: responseData.endpoint,
        method: responseData.method,
        responseTime: responseTime,
        hospitalId: responseData.hospitalId
      });
    }
  }

  /**
   * Track patient data access
   * @param {Object} accessData - Patient access information
   */
  trackPatientDataAccess(accessData) {
    this.updateDailyCounters('patientDataRequests');
    
    if (accessData.patientId) {
      this.dailyCounters.uniquePatients.add(accessData.patientId);
    }

    // Log patient data access
    logger.hospital.apiAccess({
      hospitalId: accessData.hospitalId,
      hospitalName: accessData.hospitalName,
      patientId: accessData.patientId,
      patientEmail: accessData.patientEmail,
      endpoint: accessData.endpoint,
      method: accessData.method,
      success: accessData.success,
      responseTime: accessData.responseTime,
      ip: accessData.ip,
      userAgent: accessData.userAgent
    });
  }

  /**
   * Track authentication error
   * @param {Object} errorData - Authentication error information
   */
  trackAuthenticationError(errorData) {
    this.updateDailyCounters('authenticationErrors');
    
    // Add to recent activity
    this.recentActivity.errors.push({
      type: 'authentication',
      timestamp: Date.now(),
      hospitalId: errorData.hospitalId,
      endpoint: errorData.endpoint,
      reason: errorData.reason
    });

    // Check for error spikes
    this.checkErrorSpike();

    // Log authentication error
    logger.security.invalidApiCredentials({
      apiKey: errorData.apiKey,
      endpoint: errorData.endpoint,
      hospitalId: errorData.hospitalId,
      ip: errorData.ip,
      userAgent: errorData.userAgent
    });
  }

  /**
   * Track rate limit exceeded
   * @param {Object} rateLimitData - Rate limit information
   */
  trackRateLimitExceeded(rateLimitData) {
    this.updateDailyCounters('rateLimitExceeded');
    
    // Add to recent activity
    this.recentActivity.rateLimitHits.push({
      timestamp: Date.now(),
      hospitalId: rateLimitData.hospitalId,
      endpoint: rateLimitData.endpoint,
      requestCount: rateLimitData.requestCount
    });

    // Check for rate limit spikes
    this.checkRateLimitSpike();

    // Log rate limit exceeded
    logger.security.rateLimitExceeded({
      hospitalId: rateLimitData.hospitalId,
      hospitalName: rateLimitData.hospitalName,
      endpoint: rateLimitData.endpoint,
      requestCount: rateLimitData.requestCount,
      limit: rateLimitData.limit,
      ip: rateLimitData.ip
    });
  }

  /**
   * Track slow request
   * @param {Object} slowRequestData - Slow request information
   */
  trackSlowRequest(slowRequestData) {
    // Add to recent activity
    this.recentActivity.slowRequests.push({
      timestamp: Date.now(),
      trackingId: slowRequestData.trackingId,
      responseTime: slowRequestData.responseTime,
      endpoint: slowRequestData.endpoint,
      hospitalId: slowRequestData.hospitalId
    });

    // Check for slow request spikes
    this.checkSlowRequestSpike();
  }

  /**
   * Get real-time API metrics
   * @returns {Object} - Current API metrics
   */
  getRealTimeMetrics() {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset counters if it's a new day
    if (this.dailyCounters.date !== today) {
      this.resetDailyCounters();
    }

    const totalRequests = this.dailyCounters.totalRequests;
    const successRate = totalRequests > 0 ? 
      (this.dailyCounters.successfulRequests / totalRequests) * 100 : 0;
    const errorRate = totalRequests > 0 ? 
      (this.dailyCounters.failedRequests / totalRequests) * 100 : 0;
    const avgResponseTime = totalRequests > 0 ? 
      this.dailyCounters.totalResponseTime / totalRequests : 0;

    return {
      timestamp: new Date().toISOString(),
      date: today,
      requests: {
        total: totalRequests,
        successful: this.dailyCounters.successfulRequests,
        failed: this.dailyCounters.failedRequests,
        successRate: parseFloat(successRate.toFixed(2)),
        errorRate: parseFloat(errorRate.toFixed(2))
      },
      performance: {
        averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        slowRequests: this.dailyCounters.slowRequests,
        slowRequestRate: totalRequests > 0 ? 
          parseFloat(((this.dailyCounters.slowRequests / totalRequests) * 100).toFixed(2)) : 0
      },
      security: {
        authenticationErrors: this.dailyCounters.authenticationErrors,
        rateLimitExceeded: this.dailyCounters.rateLimitExceeded
      },
      usage: {
        patientDataRequests: this.dailyCounters.patientDataRequests,
        uniqueHospitals: this.dailyCounters.uniqueHospitals.size,
        uniquePatients: this.dailyCounters.uniquePatients.size
      },
      alerts: {
        highErrorRate: errorRate > this.performanceThresholds.highErrorRatePercent,
        criticalErrorRate: errorRate > this.performanceThresholds.criticalErrorRatePercent,
        slowPerformance: avgResponseTime > this.performanceThresholds.slowRequestMs
      }
    };
  }

  /**
   * Get comprehensive API statistics
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} - Comprehensive API statistics
   */
  async getApiStatistics(startDate = null, endDate = null, useCache = true) {
    try {
      // Check cache
      if (useCache && this.metricsCache.lastUpdated) {
        const cacheAge = Date.now() - this.metricsCache.lastUpdated;
        if (cacheAge < this.cacheDuration) {
          return this.metricsCache.data;
        }
      }

      // Default to last 30 days if no dates provided
      if (!endDate) {
        endDate = new Date();
      }
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      // Calculate statistics in parallel
      const [
        hospitalStats,
        usageStats,
        performanceStats,
        errorStats
      ] = await Promise.all([
        this.calculateHospitalStatistics(startDate, endDate),
        this.calculateUsageStatistics(startDate, endDate),
        this.calculatePerformanceStatistics(startDate, endDate),
        this.calculateErrorStatistics(startDate, endDate)
      ]);

      const statistics = {
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        realTimeMetrics: this.getRealTimeMetrics(),
        hospitals: hospitalStats,
        usage: usageStats,
        performance: performanceStats,
        errors: errorStats
      };

      // Update cache
      this.metricsCache.lastUpdated = Date.now();
      this.metricsCache.data = statistics;

      return statistics;
    } catch (error) {
      logger.error('Error getting API statistics', {
        type: 'API_MONITORING_ERROR',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Calculate hospital statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Hospital statistics
   */
  async calculateHospitalStatistics(startDate, endDate) {
    try {
      const totalHospitals = await Hospital.countDocuments();
      const verifiedHospitals = await Hospital.countDocuments({ 
        verificationStatus: 'verified' 
      });
      const activeHospitals = await Hospital.countDocuments({ 
        verificationStatus: 'verified',
        isActive: true 
      });
      const hospitalsWithApiAccess = await Hospital.countDocuments({
        verificationStatus: 'verified',
        isActive: true,
        lastApiAccess: { $gte: startDate, $lte: endDate }
      });

      // Get top hospitals by API usage
      const topHospitalsByUsage = await Hospital.find({
        verificationStatus: 'verified',
        lastApiAccess: { $gte: startDate, $lte: endDate }
      })
      .select('hospitalName apiAccessCount lastApiAccess')
      .sort({ apiAccessCount: -1 })
      .limit(10);

      return {
        total: totalHospitals,
        verified: verifiedHospitals,
        active: activeHospitals,
        withApiAccess: hospitalsWithApiAccess,
        topByUsage: topHospitalsByUsage.map(h => ({
          name: h.hospitalName,
          accessCount: h.apiAccessCount,
          lastAccess: h.lastApiAccess
        }))
      };
    } catch (error) {
      logger.error('Error calculating hospital statistics', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate usage statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Usage statistics
   */
  async calculateUsageStatistics(startDate, endDate) {
    try {
      // Get patient access statistics
      const totalPatients = await Patient.countDocuments();
      const patientsAccessedViaApi = await Patient.countDocuments({
        updatedAt: { $gte: startDate, $lte: endDate }
      });

      return {
        patients: {
          total: totalPatients,
          accessedViaApi: patientsAccessedViaApi
        },
        realTime: {
          todayRequests: this.dailyCounters.totalRequests,
          todayPatientAccess: this.dailyCounters.patientDataRequests,
          uniqueHospitalsToday: this.dailyCounters.uniqueHospitals.size,
          uniquePatientsToday: this.dailyCounters.uniquePatients.size
        }
      };
    } catch (error) {
      logger.error('Error calculating usage statistics', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate performance statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Performance statistics
   */
  async calculatePerformanceStatistics(startDate, endDate) {
    try {
      const totalRequests = this.dailyCounters.totalRequests;
      const avgResponseTime = totalRequests > 0 ? 
        this.dailyCounters.totalResponseTime / totalRequests : 0;

      return {
        averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        slowRequests: this.dailyCounters.slowRequests,
        slowRequestRate: totalRequests > 0 ? 
          parseFloat(((this.dailyCounters.slowRequests / totalRequests) * 100).toFixed(2)) : 0,
        thresholds: this.performanceThresholds,
        recentSlowRequests: this.getRecentSlowRequests()
      };
    } catch (error) {
      logger.error('Error calculating performance statistics', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate error statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Error statistics
   */
  async calculateErrorStatistics(startDate, endDate) {
    try {
      const totalRequests = this.dailyCounters.totalRequests;
      const errorRate = totalRequests > 0 ? 
        (this.dailyCounters.failedRequests / totalRequests) * 100 : 0;

      return {
        totalErrors: this.dailyCounters.failedRequests,
        errorRate: parseFloat(errorRate.toFixed(2)),
        authenticationErrors: this.dailyCounters.authenticationErrors,
        rateLimitExceeded: this.dailyCounters.rateLimitExceeded,
        recentErrors: this.getRecentErrors(),
        recentRateLimitHits: this.getRecentRateLimitHits()
      };
    } catch (error) {
      logger.error('Error calculating error statistics', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Generate unique tracking ID
   * @returns {string} - Tracking ID
   */
  generateTrackingId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `API_${timestamp}_${random}`;
  }

  /**
   * Update daily counters
   * @param {string} counter - Counter name
   * @param {number} value - Value to add
   */
  updateDailyCounters(counter, value = 1) {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset counters if it's a new day
    if (this.dailyCounters.date !== today) {
      this.resetDailyCounters();
    }
    
    if (this.dailyCounters.hasOwnProperty(counter)) {
      this.dailyCounters[counter] += value;
    }
  }

  /**
   * Reset daily counters
   */
  resetDailyCounters() {
    const today = new Date().toISOString().split('T')[0];
    this.dailyCounters = {
      date: today,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      authenticationErrors: 0,
      rateLimitExceeded: 0,
      patientDataRequests: 0,
      uniqueHospitals: new Set(),
      uniquePatients: new Set(),
      totalResponseTime: 0,
      slowRequests: 0
    };
  }

  /**
   * Check for error spikes
   */
  checkErrorSpike() {
    this.cleanupRecentActivity();
    
    const recentErrors = this.recentActivity.errors.filter(
      error => Date.now() - error.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentErrors.length > this.alertThresholds.errorSpike) {
      logger.warn('API Error Spike Detected', {
        type: 'API_ERROR_SPIKE_ALERT',
        errorCount: recentErrors.length,
        timeWindow: '5 minutes',
        threshold: this.alertThresholds.errorSpike,
        timestamp: new Date().toISOString(),
        alertLevel: 'WARNING'
      });
    }
  }

  /**
   * Check for slow request spikes
   */
  checkSlowRequestSpike() {
    this.cleanupRecentActivity();
    
    const recentSlowRequests = this.recentActivity.slowRequests.filter(
      request => Date.now() - request.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentSlowRequests.length > this.alertThresholds.slowRequestSpike) {
      logger.warn('API Slow Request Spike Detected', {
        type: 'API_SLOW_REQUEST_SPIKE_ALERT',
        slowRequestCount: recentSlowRequests.length,
        timeWindow: '5 minutes',
        threshold: this.alertThresholds.slowRequestSpike,
        timestamp: new Date().toISOString(),
        alertLevel: 'WARNING'
      });
    }
  }

  /**
   * Check for rate limit spikes
   */
  checkRateLimitSpike() {
    this.cleanupRecentActivity();
    
    const recentRateLimitHits = this.recentActivity.rateLimitHits.filter(
      hit => Date.now() - hit.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentRateLimitHits.length > this.alertThresholds.rateLimitSpike) {
      logger.warn('API Rate Limit Spike Detected', {
        type: 'API_RATE_LIMIT_SPIKE_ALERT',
        rateLimitHitCount: recentRateLimitHits.length,
        timeWindow: '5 minutes',
        threshold: this.alertThresholds.rateLimitSpike,
        timestamp: new Date().toISOString(),
        alertLevel: 'WARNING'
      });
    }
  }

  /**
   * Clean up old recent activity data
   */
  cleanupRecentActivity() {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    // Only cleanup every minute to avoid excessive processing
    if (now - this.recentActivity.lastCleanup < 60 * 1000) {
      return;
    }

    this.recentActivity.errors = this.recentActivity.errors.filter(
      error => error.timestamp > fiveMinutesAgo
    );
    this.recentActivity.slowRequests = this.recentActivity.slowRequests.filter(
      request => request.timestamp > fiveMinutesAgo
    );
    this.recentActivity.rateLimitHits = this.recentActivity.rateLimitHits.filter(
      hit => hit.timestamp > fiveMinutesAgo
    );

    this.recentActivity.lastCleanup = now;
  }

  /**
   * Get recent errors (last 5 minutes)
   * @returns {Array} - Recent errors
   */
  getRecentErrors() {
    this.cleanupRecentActivity();
    return this.recentActivity.errors.slice(-10); // Last 10 errors
  }

  /**
   * Get recent slow requests (last 5 minutes)
   * @returns {Array} - Recent slow requests
   */
  getRecentSlowRequests() {
    this.cleanupRecentActivity();
    return this.recentActivity.slowRequests.slice(-10); // Last 10 slow requests
  }

  /**
   * Get recent rate limit hits (last 5 minutes)
   * @returns {Array} - Recent rate limit hits
   */
  getRecentRateLimitHits() {
    this.cleanupRecentActivity();
    return this.recentActivity.rateLimitHits.slice(-10); // Last 10 rate limit hits
  }

  /**
   * Clear metrics cache
   */
  clearCache() {
    this.metricsCache.lastUpdated = null;
    this.metricsCache.data = null;
  }

  /**
   * Clear all monitoring data (for testing)
   */
  clearAllData() {
    this.resetDailyCounters();
    this.clearCache();
    this.recentActivity = {
      errors: [],
      slowRequests: [],
      rateLimitHits: [],
      lastCleanup: Date.now()
    };
  }
}

// Export singleton instance
module.exports = new ApiMonitoring();