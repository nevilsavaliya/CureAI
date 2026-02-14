const logger = require('./logger');
const fs = require('fs');
const path = require('path');

/**
 * Error Tracking Service for Hospital Feature
 * Provides structured error tracking, categorization, and reporting
 */
class ErrorTracker {
  constructor() {
    this.errorCategories = {
      HOSPITAL_REGISTRATION: 'Hospital Registration Errors',
      HOSPITAL_LOGIN: 'Hospital Login Errors',
      HOSPITAL_API: 'Hospital API Errors',
      HOSPITAL_VERIFICATION: 'Hospital Verification Errors',
      PATIENT_DATA: 'Patient Data Access Errors',
      AUTHENTICATION: 'Authentication Errors',
      AUTHORIZATION: 'Authorization Errors',
      VALIDATION: 'Validation Errors',
      DATABASE: 'Database Errors',
      EMAIL: 'Email Service Errors',
      RATE_LIMITING: 'Rate Limiting Errors',
      SYSTEM: 'System Errors'
    };

    this.errorSeverity = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.errorCounts = new Map();
    this.errorPatterns = new Map();
    this.lastErrorReset = Date.now();
  }

  /**
   * Track an error with structured data
   * @param {Object} errorData - Error information
   */
  trackError(errorData) {
    const {
      category,
      severity = this.errorSeverity.MEDIUM,
      error,
      context = {},
      userId,
      hospitalId,
      req
    } = errorData;

    // Generate unique error ID
    const errorId = this.generateErrorId();

    // Extract request information if available
    const requestInfo = req ? {
      method: req.method,
      url: req.originalUrl,
      ip: logger.getClientIP(req),
      userAgent: logger.getUserAgent(req),
      headers: this.sanitizeHeaders(req.headers)
    } : {};

    // Create structured error object
    const structuredError = {
      id: errorId,
      timestamp: new Date().toISOString(),
      category: category || this.errorCategories.SYSTEM,
      severity,
      message: error.message || error,
      stack: error.stack,
      code: error.code,
      name: error.name,
      context: {
        ...context,
        userId,
        hospitalId,
        ...requestInfo
      },
      fingerprint: this.generateFingerprint(error, category, context),
      environment: process.env.NODE_ENV || 'development'
    };

    // Log the error
    this.logError(structuredError);

    // Update error statistics
    this.updateErrorStats(structuredError);

    // Check for error patterns
    this.checkErrorPatterns(structuredError);

    // Send alerts for critical errors
    if (severity === this.errorSeverity.CRITICAL) {
      this.sendCriticalErrorAlert(structuredError);
    }

    return errorId;
  }

  /**
   * Track hospital registration errors
   */
  trackHospitalRegistrationError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.HOSPITAL_REGISTRATION,
      severity: this.errorSeverity.HIGH,
      error,
      context: {
        ...context,
        hospitalName: context.hospitalName,
        email: context.email,
        registrationNumber: context.registrationNumber
      },
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track hospital login errors
   */
  trackHospitalLoginError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.HOSPITAL_LOGIN,
      severity: this.errorSeverity.MEDIUM,
      error,
      context: {
        ...context,
        email: context.email,
        loginAttempt: true
      },
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track hospital API errors
   */
  trackHospitalApiError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.HOSPITAL_API,
      severity: this.errorSeverity.HIGH,
      error,
      context: {
        ...context,
        endpoint: context.endpoint,
        method: context.method,
        patientId: context.patientId,
        apiKey: context.apiKey ? context.apiKey.substring(0, 10) + '...' : undefined
      },
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track patient data access errors
   */
  trackPatientDataError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.PATIENT_DATA,
      severity: this.errorSeverity.HIGH,
      error,
      context: {
        ...context,
        patientId: context.patientId,
        patientEmail: context.patientEmail,
        dataType: context.dataType
      },
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track authentication errors
   */
  trackAuthenticationError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.AUTHENTICATION,
      severity: this.errorSeverity.MEDIUM,
      error,
      context: {
        ...context,
        authType: context.authType, // 'jwt', 'api_key', etc.
        credentials: context.credentials ? 'provided' : 'missing'
      },
      userId: context.userId,
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track authorization errors
   */
  trackAuthorizationError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.AUTHORIZATION,
      severity: this.errorSeverity.MEDIUM,
      error,
      context: {
        ...context,
        requiredRole: context.requiredRole,
        userRole: context.userRole,
        resource: context.resource
      },
      userId: context.userId,
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track validation errors
   */
  trackValidationError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.VALIDATION,
      severity: this.errorSeverity.LOW,
      error,
      context: {
        ...context,
        validationField: context.field,
        validationRule: context.rule,
        providedValue: context.value
      },
      userId: context.userId,
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track database errors
   */
  trackDatabaseError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.DATABASE,
      severity: this.errorSeverity.HIGH,
      error,
      context: {
        ...context,
        collection: context.collection,
        operation: context.operation,
        query: context.query ? JSON.stringify(context.query) : undefined
      },
      userId: context.userId,
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track email service errors
   */
  trackEmailError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.EMAIL,
      severity: this.errorSeverity.MEDIUM,
      error,
      context: {
        ...context,
        recipient: context.recipient,
        emailType: context.emailType,
        template: context.template
      },
      userId: context.userId,
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Track rate limiting errors
   */
  trackRateLimitError(error, context, req) {
    return this.trackError({
      category: this.errorCategories.RATE_LIMITING,
      severity: this.errorSeverity.MEDIUM,
      error,
      context: {
        ...context,
        limit: context.limit,
        current: context.current,
        resetTime: context.resetTime
      },
      hospitalId: context.hospitalId,
      req
    });
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR_${timestamp}_${random}`;
  }

  /**
   * Generate error fingerprint for grouping similar errors
   */
  generateFingerprint(error, category, context) {
    const message = error.message || error;
    const stack = error.stack ? error.stack.split('\n')[0] : '';
    const contextKey = context.endpoint || context.operation || '';
    
    const fingerprint = `${category}_${message}_${stack}_${contextKey}`;
    return Buffer.from(fingerprint).toString('base64').substring(0, 16);
  }

  /**
   * Log structured error
   */
  logError(structuredError) {
    logger.error('Tracked Error', {
      type: 'TRACKED_ERROR',
      errorId: structuredError.id,
      category: structuredError.category,
      severity: structuredError.severity,
      message: structuredError.message,
      fingerprint: structuredError.fingerprint,
      context: structuredError.context,
      stack: structuredError.stack,
      timestamp: structuredError.timestamp
    });
  }

  /**
   * Update error statistics
   */
  updateErrorStats(structuredError) {
    const key = `${structuredError.category}_${structuredError.fingerprint}`;
    
    if (!this.errorCounts.has(key)) {
      this.errorCounts.set(key, {
        count: 0,
        firstSeen: structuredError.timestamp,
        lastSeen: structuredError.timestamp,
        category: structuredError.category,
        severity: structuredError.severity,
        fingerprint: structuredError.fingerprint,
        message: structuredError.message
      });
    }

    const stats = this.errorCounts.get(key);
    stats.count++;
    stats.lastSeen = structuredError.timestamp;
    
    // Update severity if current error is more severe
    const severityLevels = {
      [this.errorSeverity.LOW]: 1,
      [this.errorSeverity.MEDIUM]: 2,
      [this.errorSeverity.HIGH]: 3,
      [this.errorSeverity.CRITICAL]: 4
    };
    
    if (severityLevels[structuredError.severity] > severityLevels[stats.severity]) {
      stats.severity = structuredError.severity;
    }
  }

  /**
   * Check for error patterns and anomalies
   */
  checkErrorPatterns(structuredError) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Reset counters every hour
    if (now - this.lastErrorReset > oneHour) {
      this.errorPatterns.clear();
      this.lastErrorReset = now;
    }

    const patternKey = structuredError.fingerprint;
    
    if (!this.errorPatterns.has(patternKey)) {
      this.errorPatterns.set(patternKey, {
        count: 0,
        firstSeen: now,
        category: structuredError.category
      });
    }

    const pattern = this.errorPatterns.get(patternKey);
    pattern.count++;

    // Alert on error spikes (more than 10 similar errors in an hour)
    if (pattern.count > 10) {
      this.sendErrorSpikeAlert(structuredError, pattern.count);
    }
  }

  /**
   * Send critical error alert
   */
  sendCriticalErrorAlert(structuredError) {
    logger.error('CRITICAL ERROR ALERT', {
      type: 'CRITICAL_ERROR_ALERT',
      errorId: structuredError.id,
      category: structuredError.category,
      message: structuredError.message,
      context: structuredError.context,
      timestamp: structuredError.timestamp,
      alertLevel: 'CRITICAL'
    });

    // In production, this could send to external alerting systems
    // like PagerDuty, Slack, email notifications, etc.
  }

  /**
   * Send error spike alert
   */
  sendErrorSpikeAlert(structuredError, count) {
    logger.warn('ERROR SPIKE DETECTED', {
      type: 'ERROR_SPIKE_ALERT',
      category: structuredError.category,
      fingerprint: structuredError.fingerprint,
      message: structuredError.message,
      count: count,
      timeWindow: '1 hour',
      timestamp: new Date().toISOString(),
      alertLevel: 'WARNING'
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      topErrors: [],
      recentErrors: []
    };

    // Calculate statistics from error counts
    for (const [key, errorData] of this.errorCounts.entries()) {
      stats.totalErrors += errorData.count;
      
      // By category
      if (!stats.errorsByCategory[errorData.category]) {
        stats.errorsByCategory[errorData.category] = 0;
      }
      stats.errorsByCategory[errorData.category] += errorData.count;
      
      // By severity
      if (!stats.errorsBySeverity[errorData.severity]) {
        stats.errorsBySeverity[errorData.severity] = 0;
      }
      stats.errorsBySeverity[errorData.severity] += errorData.count;
      
      // Top errors
      stats.topErrors.push({
        fingerprint: errorData.fingerprint,
        category: errorData.category,
        message: errorData.message,
        count: errorData.count,
        severity: errorData.severity,
        firstSeen: errorData.firstSeen,
        lastSeen: errorData.lastSeen
      });
    }

    // Sort top errors by count
    stats.topErrors.sort((a, b) => b.count - a.count);
    stats.topErrors = stats.topErrors.slice(0, 10);

    return stats;
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    delete sanitized['x-api-secret'];
    
    return sanitized;
  }

  /**
   * Clear error statistics (for testing or maintenance)
   */
  clearStats() {
    this.errorCounts.clear();
    this.errorPatterns.clear();
    this.lastErrorReset = Date.now();
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

module.exports = errorTracker;