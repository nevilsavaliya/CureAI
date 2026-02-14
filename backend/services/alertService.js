const logger = require('./logger');
const emailService = require('./emailService');
const apiMonitoring = require('./apiMonitoring');
const errorTracker = require('./errorTracker');

/**
 * Alert Service for Hospital Feature
 * Provides comprehensive alerting capabilities for monitoring system health,
 * performance issues, security threats, and operational anomalies
 */
class AlertService {
  constructor() {
    // Alert types and their configurations
    this.alertTypes = {
      CRITICAL_ERROR: {
        name: 'Critical Error',
        severity: 'critical',
        cooldown: 5 * 60 * 1000, // 5 minutes
        channels: ['email', 'log'],
        enabled: true
      },
      ERROR_SPIKE: {
        name: 'Error Spike',
        severity: 'high',
        cooldown: 15 * 60 * 1000, // 15 minutes
        channels: ['email', 'log'],
        enabled: true
      },
      HIGH_ERROR_RATE: {
        name: 'High Error Rate',
        severity: 'high',
        cooldown: 10 * 60 * 1000, // 10 minutes
        channels: ['email', 'log'],
        enabled: true
      },
      SLOW_PERFORMANCE: {
        name: 'Slow Performance',
        severity: 'medium',
        cooldown: 30 * 60 * 1000, // 30 minutes
        channels: ['log'],
        enabled: true
      },
      RATE_LIMIT_SPIKE: {
        name: 'Rate Limit Spike',
        severity: 'medium',
        cooldown: 15 * 60 * 1000, // 15 minutes
        channels: ['log'],
        enabled: true
      },
      AUTHENTICATION_FAILURES: {
        name: 'Authentication Failures',
        severity: 'high',
        cooldown: 10 * 60 * 1000, // 10 minutes
        channels: ['email', 'log'],
        enabled: true
      },
      SYSTEM_HEALTH: {
        name: 'System Health',
        severity: 'high',
        cooldown: 20 * 60 * 1000, // 20 minutes
        channels: ['email', 'log'],
        enabled: true
      },
      DATABASE_ISSUES: {
        name: 'Database Issues',
        severity: 'critical',
        cooldown: 5 * 60 * 1000, // 5 minutes
        channels: ['email', 'log'],
        enabled: true
      },
      EMAIL_FAILURES: {
        name: 'Email Service Failures',
        severity: 'medium',
        cooldown: 20 * 60 * 1000, // 20 minutes
        channels: ['log'],
        enabled: true
      },
      HOSPITAL_VERIFICATION_BACKLOG: {
        name: 'Hospital Verification Backlog',
        severity: 'medium',
        cooldown: 60 * 60 * 1000, // 1 hour
        channels: ['email', 'log'],
        enabled: true
      }
    };

    // Alert thresholds
    this.thresholds = {
      errorRate: {
        high: 5, // 5% error rate
        critical: 10 // 10% error rate
      },
      responseTime: {
        slow: 1000, // 1 second
        critical: 5000 // 5 seconds
      },
      errorSpike: {
        count: 10, // errors in time window
        timeWindow: 5 * 60 * 1000 // 5 minutes
      },
      rateLimitSpike: {
        count: 5, // rate limit hits in time window
        timeWindow: 5 * 60 * 1000 // 5 minutes
      },
      authFailures: {
        count: 20, // auth failures in time window
        timeWindow: 10 * 60 * 1000 // 10 minutes
      },
      verificationBacklog: {
        count: 10, // pending hospitals
        age: 24 * 60 * 60 * 1000 // 24 hours
      }
    };

    // Alert state tracking
    this.alertStates = new Map();
    this.alertHistory = [];
    this.maxHistorySize = 1000;

    // Email configuration for alerts
    this.alertEmailConfig = {
      from: process.env.ALERT_EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL_TO ? process.env.ALERT_EMAIL_TO.split(',') : ['admin@hospital-system.com'],
      subject: {
        critical: '[CRITICAL] Hospital System Alert',
        high: '[HIGH] Hospital System Alert',
        medium: '[MEDIUM] Hospital System Alert',
        low: '[LOW] Hospital System Alert'
      }
    };

    // Start monitoring if enabled
    if (process.env.ALERTS_ENABLED !== 'false') {
      this.startMonitoring();
    }
  }

  /**
   * Start continuous monitoring for alerts
   */
  startMonitoring() {
    // Monitor every 2 minutes
    this.monitoringInterval = setInterval(() => {
      this.checkAllAlerts();
    }, 2 * 60 * 1000);

    logger.info('Alert monitoring started', {
      type: 'ALERT_SYSTEM_STARTED',
      interval: '2 minutes',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('Alert monitoring stopped', {
      type: 'ALERT_SYSTEM_STOPPED',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check all alert conditions
   */
  async checkAllAlerts() {
    try {
      // Get current metrics
      const metrics = apiMonitoring.getRealTimeMetrics();
      const errorStats = errorTracker.getErrorStats();

      // Check each alert type
      await Promise.all([
        this.checkErrorRateAlerts(metrics),
        this.checkPerformanceAlerts(metrics),
        this.checkErrorSpikeAlerts(errorStats),
        this.checkAuthenticationAlerts(),
        this.checkSystemHealthAlerts(metrics),
        this.checkVerificationBacklogAlerts()
      ]);

    } catch (error) {
      logger.error('Error checking alerts', {
        type: 'ALERT_CHECK_ERROR',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check error rate alerts
   */
  async checkErrorRateAlerts(metrics) {
    const errorRate = metrics.requests.errorRate;

    if (errorRate >= this.thresholds.errorRate.critical) {
      await this.sendAlert('HIGH_ERROR_RATE', {
        message: `Critical error rate detected: ${errorRate}%`,
        details: {
          errorRate: errorRate,
          threshold: this.thresholds.errorRate.critical,
          totalRequests: metrics.requests.total,
          failedRequests: metrics.requests.failed,
          timeWindow: 'current day'
        },
        severity: 'critical'
      });
    } else if (errorRate >= this.thresholds.errorRate.high) {
      await this.sendAlert('HIGH_ERROR_RATE', {
        message: `High error rate detected: ${errorRate}%`,
        details: {
          errorRate: errorRate,
          threshold: this.thresholds.errorRate.high,
          totalRequests: metrics.requests.total,
          failedRequests: metrics.requests.failed,
          timeWindow: 'current day'
        },
        severity: 'high'
      });
    }
  }

  /**
   * Check performance alerts
   */
  async checkPerformanceAlerts(metrics) {
    const avgResponseTime = metrics.performance.averageResponseTime;

    if (avgResponseTime >= this.thresholds.responseTime.critical) {
      await this.sendAlert('SLOW_PERFORMANCE', {
        message: `Critical response time detected: ${avgResponseTime}ms`,
        details: {
          averageResponseTime: avgResponseTime,
          threshold: this.thresholds.responseTime.critical,
          slowRequests: metrics.performance.slowRequests,
          slowRequestRate: metrics.performance.slowRequestRate
        },
        severity: 'critical'
      });
    } else if (avgResponseTime >= this.thresholds.responseTime.slow) {
      await this.sendAlert('SLOW_PERFORMANCE', {
        message: `Slow response time detected: ${avgResponseTime}ms`,
        details: {
          averageResponseTime: avgResponseTime,
          threshold: this.thresholds.responseTime.slow,
          slowRequests: metrics.performance.slowRequests,
          slowRequestRate: metrics.performance.slowRequestRate
        },
        severity: 'medium'
      });
    }
  }

  /**
   * Check error spike alerts
   */
  async checkErrorSpikeAlerts(errorStats) {
    const recentErrors = this.getRecentErrors();
    
    if (recentErrors.length >= this.thresholds.errorSpike.count) {
      await this.sendAlert('ERROR_SPIKE', {
        message: `Error spike detected: ${recentErrors.length} errors in ${this.thresholds.errorSpike.timeWindow / 60000} minutes`,
        details: {
          errorCount: recentErrors.length,
          threshold: this.thresholds.errorSpike.count,
          timeWindow: `${this.thresholds.errorSpike.timeWindow / 60000} minutes`,
          topErrors: errorStats.topErrors.slice(0, 5)
        },
        severity: 'high'
      });
    }
  }

  /**
   * Check authentication failure alerts
   */
  async checkAuthenticationAlerts() {
    const recentAuthFailures = this.getRecentAuthFailures();
    
    if (recentAuthFailures.length >= this.thresholds.authFailures.count) {
      await this.sendAlert('AUTHENTICATION_FAILURES', {
        message: `High authentication failure rate: ${recentAuthFailures.length} failures in ${this.thresholds.authFailures.timeWindow / 60000} minutes`,
        details: {
          failureCount: recentAuthFailures.length,
          threshold: this.thresholds.authFailures.count,
          timeWindow: `${this.thresholds.authFailures.timeWindow / 60000} minutes`,
          recentFailures: recentAuthFailures.slice(0, 10)
        },
        severity: 'high'
      });
    }
  }

  /**
   * Check system health alerts
   */
  async checkSystemHealthAlerts(metrics) {
    const issues = [];

    // Check if API is responding
    if (metrics.requests.total === 0 && this.isBusinessHours()) {
      issues.push('No API requests received during business hours');
    }

    // Check for critical alerts in metrics
    if (metrics.alerts.criticalErrorRate) {
      issues.push('Critical error rate threshold exceeded');
    }

    if (issues.length > 0) {
      await this.sendAlert('SYSTEM_HEALTH', {
        message: `System health issues detected`,
        details: {
          issues: issues,
          metrics: metrics,
          timestamp: new Date().toISOString()
        },
        severity: 'high'
      });
    }
  }

  /**
   * Check hospital verification backlog alerts
   */
  async checkVerificationBacklogAlerts() {
    try {
      const Hospital = require('../models/Hospital');
      
      const pendingHospitals = await Hospital.countDocuments({
        verificationStatus: 'pending',
        createdAt: {
          $lt: new Date(Date.now() - this.thresholds.verificationBacklog.age)
        }
      });

      if (pendingHospitals >= this.thresholds.verificationBacklog.count) {
        await this.sendAlert('HOSPITAL_VERIFICATION_BACKLOG', {
          message: `Hospital verification backlog detected: ${pendingHospitals} hospitals pending for over 24 hours`,
          details: {
            pendingCount: pendingHospitals,
            threshold: this.thresholds.verificationBacklog.count,
            ageThreshold: '24 hours'
          },
          severity: 'medium'
        });
      }
    } catch (error) {
      logger.error('Error checking verification backlog', {
        type: 'ALERT_CHECK_ERROR',
        alertType: 'HOSPITAL_VERIFICATION_BACKLOG',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send an alert
   */
  async sendAlert(alertType, alertData) {
    const alertConfig = this.alertTypes[alertType];
    
    if (!alertConfig || !alertConfig.enabled) {
      return;
    }

    // Check cooldown period
    if (this.isInCooldown(alertType)) {
      return;
    }

    // Create alert object
    const alert = {
      id: this.generateAlertId(),
      type: alertType,
      name: alertConfig.name,
      severity: alertData.severity || alertConfig.severity,
      message: alertData.message,
      details: alertData.details,
      timestamp: new Date().toISOString(),
      channels: alertConfig.channels
    };

    // Update alert state
    this.updateAlertState(alertType, alert);

    // Send through configured channels
    await this.sendThroughChannels(alert);

    // Add to history
    this.addToHistory(alert);

    logger.info('Alert sent', {
      type: 'ALERT_SENT',
      alertId: alert.id,
      alertType: alertType,
      severity: alert.severity,
      message: alert.message,
      channels: alert.channels,
      timestamp: alert.timestamp
    });
  }

  /**
   * Send alert through configured channels
   */
  async sendThroughChannels(alert) {
    const promises = [];

    for (const channel of alert.channels) {
      switch (channel) {
        case 'email':
          promises.push(this.sendEmailAlert(alert));
          break;
        case 'log':
          promises.push(this.sendLogAlert(alert));
          break;
        case 'webhook':
          promises.push(this.sendWebhookAlert(alert));
          break;
        default:
          logger.warn('Unknown alert channel', {
            type: 'ALERT_UNKNOWN_CHANNEL',
            channel: channel,
            alertId: alert.id
          });
      }
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert) {
    try {
      const subject = `${this.alertEmailConfig.subject[alert.severity]} - ${alert.name}`;
      
      const htmlContent = this.generateAlertEmailHTML(alert);
      const textContent = this.generateAlertEmailText(alert);

      await emailService.sendEmail({
        from: this.alertEmailConfig.from,
        to: this.alertEmailConfig.to,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      logger.info('Email alert sent', {
        type: 'ALERT_EMAIL_SENT',
        alertId: alert.id,
        recipients: this.alertEmailConfig.to,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send email alert', {
        type: 'ALERT_EMAIL_ERROR',
        alertId: alert.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send log alert
   */
  async sendLogAlert(alert) {
    const logLevel = this.getLogLevel(alert.severity);
    
    logger[logLevel](`ALERT: ${alert.message}`, {
      type: 'SYSTEM_ALERT',
      alertId: alert.id,
      alertType: alert.type,
      alertName: alert.name,
      severity: alert.severity,
      message: alert.message,
      details: alert.details,
      timestamp: alert.timestamp
    });
  }

  /**
   * Send webhook alert (placeholder for future implementation)
   */
  async sendWebhookAlert(alert) {
    // Placeholder for webhook integration
    // Could integrate with Slack, PagerDuty, Discord, etc.
    logger.info('Webhook alert (not implemented)', {
      type: 'ALERT_WEBHOOK_PLACEHOLDER',
      alertId: alert.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate alert email HTML content
   */
  generateAlertEmailHTML(alert) {
    const severityColor = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#65a30d'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Hospital System Alert</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: ${severityColor[alert.severity]}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .alert-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .details { background-color: #f1f3f4; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .severity-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white; background-color: ${severityColor[alert.severity]}; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 Hospital System Alert</h1>
                <p>${alert.name}</p>
            </div>
            <div class="content">
                <div class="alert-info">
                    <h3>Alert Details</h3>
                    <p><strong>Severity:</strong> <span class="severity-badge">${alert.severity.toUpperCase()}</span></p>
                    <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
                    <p><strong>Alert ID:</strong> ${alert.id}</p>
                </div>
                
                <h3>Message</h3>
                <p>${alert.message}</p>
                
                ${alert.details ? `
                <div class="details">
                    <h3>Additional Details</h3>
                    <pre>${JSON.stringify(alert.details, null, 2)}</pre>
                </div>
                ` : ''}
                
                <h3>Recommended Actions</h3>
                <ul>
                    ${this.getRecommendedActions(alert.type).map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
            <div class="footer">
                <p>This is an automated alert from the Hospital Management System.</p>
                <p>Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate alert email text content
   */
  generateAlertEmailText(alert) {
    return `
HOSPITAL SYSTEM ALERT

Alert: ${alert.name}
Severity: ${alert.severity.toUpperCase()}
Time: ${new Date(alert.timestamp).toLocaleString()}
Alert ID: ${alert.id}

Message:
${alert.message}

${alert.details ? `
Details:
${JSON.stringify(alert.details, null, 2)}
` : ''}

Recommended Actions:
${this.getRecommendedActions(alert.type).map(action => `- ${action}`).join('\n')}

---
This is an automated alert from the Hospital Management System.
Please do not reply to this email.
    `.trim();
  }

  /**
   * Get recommended actions for alert type
   */
  getRecommendedActions(alertType) {
    const actions = {
      CRITICAL_ERROR: [
        'Check system logs for detailed error information',
        'Verify database connectivity and performance',
        'Check server resources (CPU, memory, disk)',
        'Contact development team if issue persists'
      ],
      ERROR_SPIKE: [
        'Review recent deployments or configuration changes',
        'Check error logs for patterns or common causes',
        'Monitor system resources and performance',
        'Consider rolling back recent changes if necessary'
      ],
      HIGH_ERROR_RATE: [
        'Investigate root cause of errors',
        'Check database performance and connectivity',
        'Review recent code changes',
        'Monitor user impact and consider maintenance mode'
      ],
      SLOW_PERFORMANCE: [
        'Check database query performance',
        'Monitor server resources (CPU, memory)',
        'Review recent code changes for performance issues',
        'Consider scaling resources if needed'
      ],
      RATE_LIMIT_SPIKE: [
        'Review rate limiting configuration',
        'Check for potential abuse or bot traffic',
        'Monitor specific hospitals causing high traffic',
        'Consider adjusting rate limits if legitimate traffic'
      ],
      AUTHENTICATION_FAILURES: [
        'Check for brute force attacks',
        'Review authentication logs for patterns',
        'Consider implementing additional security measures',
        'Monitor specific IP addresses or hospitals'
      ],
      SYSTEM_HEALTH: [
        'Check overall system status',
        'Verify all services are running properly',
        'Review system metrics and logs',
        'Perform health checks on critical components'
      ],
      DATABASE_ISSUES: [
        'Check database connectivity',
        'Monitor database performance metrics',
        'Review database logs for errors',
        'Contact database administrator if needed'
      ],
      EMAIL_FAILURES: [
        'Check email service configuration',
        'Verify SMTP settings and credentials',
        'Review email service logs',
        'Test email connectivity manually'
      ],
      HOSPITAL_VERIFICATION_BACKLOG: [
        'Review pending hospital applications',
        'Prioritize verification of older applications',
        'Check admin notification system',
        'Consider adding more admin reviewers'
      ]
    };

    return actions[alertType] || ['Review system logs and contact support team'];
  }

  /**
   * Check if alert is in cooldown period
   */
  isInCooldown(alertType) {
    const alertState = this.alertStates.get(alertType);
    if (!alertState) {
      return false;
    }

    const cooldownPeriod = this.alertTypes[alertType].cooldown;
    const timeSinceLastAlert = Date.now() - alertState.lastSent;
    
    return timeSinceLastAlert < cooldownPeriod;
  }

  /**
   * Update alert state
   */
  updateAlertState(alertType, alert) {
    this.alertStates.set(alertType, {
      lastSent: Date.now(),
      lastAlert: alert,
      count: (this.alertStates.get(alertType)?.count || 0) + 1
    });
  }

  /**
   * Add alert to history
   */
  addToHistory(alert) {
    this.alertHistory.unshift(alert);
    
    // Keep only the most recent alerts
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get recent errors from logs (simplified implementation)
   */
  getRecentErrors() {
    // This would typically read from log files or database
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get recent authentication failures from logs
   */
  getRecentAuthFailures() {
    // This would typically read from security logs
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check if current time is during business hours
   */
  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Business hours: Monday-Friday, 8 AM - 6 PM
    return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
  }

  /**
   * Get log level for alert severity
   */
  getLogLevel(severity) {
    const levels = {
      critical: 'error',
      high: 'error',
      medium: 'warn',
      low: 'info'
    };
    return levels[severity] || 'info';
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ALERT_${timestamp}_${random}`;
  }

  /**
   * Get alert configuration
   */
  getAlertConfig() {
    return {
      alertTypes: this.alertTypes,
      thresholds: this.thresholds,
      emailConfig: {
        from: this.alertEmailConfig.from,
        to: this.alertEmailConfig.to
      },
      monitoringEnabled: !!this.monitoringInterval
    };
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config) {
    if (config.alertTypes) {
      Object.assign(this.alertTypes, config.alertTypes);
    }
    
    if (config.thresholds) {
      Object.assign(this.thresholds, config.thresholds);
    }
    
    if (config.emailConfig) {
      Object.assign(this.alertEmailConfig, config.emailConfig);
    }

    logger.info('Alert configuration updated', {
      type: 'ALERT_CONFIG_UPDATED',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    const stats = {
      totalAlerts: this.alertHistory.length,
      alertsByType: {},
      alertsBySeverity: {},
      recentAlerts: this.alertHistory.slice(0, 10),
      alertStates: Object.fromEntries(this.alertStates),
      generatedAt: new Date().toISOString()
    };

    // Count alerts by type and severity
    for (const alert of this.alertHistory) {
      stats.alertsByType[alert.type] = (stats.alertsByType[alert.type] || 0) + 1;
      stats.alertsBySeverity[alert.severity] = (stats.alertsBySeverity[alert.severity] || 0) + 1;
    }

    return stats;
  }

  /**
   * Clear alert history and states
   */
  clearAlertData() {
    this.alertHistory = [];
    this.alertStates.clear();
    
    logger.info('Alert data cleared', {
      type: 'ALERT_DATA_CLEARED',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Test alert system by sending a test alert
   */
  async sendTestAlert() {
    await this.sendAlert('SYSTEM_HEALTH', {
      message: 'This is a test alert to verify the alerting system is working properly',
      details: {
        testAlert: true,
        timestamp: new Date().toISOString(),
        systemStatus: 'operational'
      },
      severity: 'low'
    });
  }
}

// Create singleton instance
const alertService = new AlertService();

module.exports = alertService;