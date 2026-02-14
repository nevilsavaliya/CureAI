# Hospital Alert System Guide

## Overview

The Hospital Alert System provides comprehensive monitoring and alerting capabilities for the Hospital Management System. It automatically detects various system issues, performance problems, security threats, and operational anomalies, then sends notifications through multiple channels.

## Features

### 🚨 Alert Types

1. **Critical Error Alerts**
   - Triggered by: 5xx HTTP errors, unhandled exceptions
   - Severity: Critical
   - Channels: Email, Log
   - Cooldown: 5 minutes

2. **Error Spike Alerts**
   - Triggered by: More than 10 errors in 5 minutes
   - Severity: High
   - Channels: Email, Log
   - Cooldown: 15 minutes

3. **High Error Rate Alerts**
   - Triggered by: Error rate > 5% (high) or > 10% (critical)
   - Severity: High/Critical
   - Channels: Email, Log
   - Cooldown: 10 minutes

4. **Slow Performance Alerts**
   - Triggered by: Response time > 1s (medium) or > 5s (critical)
   - Severity: Medium/Critical
   - Channels: Log (medium), Email + Log (critical)
   - Cooldown: 30 minutes

5. **Rate Limit Spike Alerts**
   - Triggered by: More than 5 rate limit violations in 5 minutes
   - Severity: Medium
   - Channels: Log
   - Cooldown: 15 minutes

6. **Authentication Failure Alerts**
   - Triggered by: More than 20 auth failures in 10 minutes
   - Severity: High
   - Channels: Email, Log
   - Cooldown: 10 minutes

7. **System Health Alerts**
   - Triggered by: No API requests during business hours, critical metrics
   - Severity: High
   - Channels: Email, Log
   - Cooldown: 20 minutes

8. **Database Issue Alerts**
   - Triggered by: MongoDB errors, connection issues
   - Severity: Critical
   - Channels: Email, Log
   - Cooldown: 5 minutes

9. **Email Service Failure Alerts**
   - Triggered by: Email sending failures
   - Severity: Medium
   - Channels: Log
   - Cooldown: 20 minutes

10. **Hospital Verification Backlog Alerts**
    - Triggered by: More than 10 hospitals pending > 24 hours
    - Severity: Medium
    - Channels: Email, Log
    - Cooldown: 1 hour

### 📊 Monitoring Capabilities

- **Real-time Monitoring**: Continuous monitoring every 2 minutes
- **Automatic Detection**: Intelligent threshold-based detection
- **Cooldown Management**: Prevents alert spam with configurable cooldowns
- **Multi-channel Delivery**: Email, logging, and webhook support
- **Historical Tracking**: Complete alert history with statistics
- **Configuration Management**: Dynamic threshold and configuration updates

### 📧 Notification Channels

1. **Email Notifications**
   - HTML and text formats
   - Severity-based subject lines
   - Detailed alert information
   - Recommended actions

2. **Log Notifications**
   - Structured logging with Winston
   - Severity-based log levels
   - Searchable and filterable

3. **Webhook Support** (Future)
   - Slack integration
   - PagerDuty integration
   - Custom webhook endpoints

## Configuration

### Environment Variables

```bash
# Alert System Configuration
ALERTS_ENABLED=true                    # Enable/disable alert system
ALERT_EMAIL_FROM=alerts@hospital.com   # Sender email address
ALERT_EMAIL_TO=admin1@hospital.com,admin2@hospital.com  # Recipient emails

# Email Service (required for email alerts)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Default Thresholds

```javascript
{
  errorRate: {
    high: 5,        // 5% error rate
    critical: 10    // 10% error rate
  },
  responseTime: {
    slow: 1000,     // 1 second
    critical: 5000  // 5 seconds
  },
  errorSpike: {
    count: 10,      // errors in time window
    timeWindow: 5 * 60 * 1000  // 5 minutes
  },
  rateLimitSpike: {
    count: 5,       // rate limit hits in time window
    timeWindow: 5 * 60 * 1000  // 5 minutes
  },
  authFailures: {
    count: 20,      // auth failures in time window
    timeWindow: 10 * 60 * 1000  // 10 minutes
  },
  verificationBacklog: {
    count: 10,      // pending hospitals
    age: 24 * 60 * 60 * 1000  // 24 hours
  }
}
```

## API Endpoints

### Get Alert Configuration
```http
GET /api/admin/alerts/config
Authorization: Bearer <admin_token>
```

### Update Alert Configuration
```http
PUT /api/admin/alerts/config
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "thresholds": {
    "errorRate": {
      "high": 7,
      "critical": 15
    }
  },
  "alertTypes": {
    "CRITICAL_ERROR": {
      "enabled": true,
      "cooldown": 300000
    }
  },
  "emailConfig": {
    "to": ["admin@hospital.com"]
  }
}
```

### Get Alert Statistics
```http
GET /api/admin/alerts/stats
Authorization: Bearer <admin_token>
```

### Get Alert Health Status
```http
GET /api/admin/alerts/health
Authorization: Bearer <admin_token>
```

### Get Alert History
```http
GET /api/admin/alerts/history?limit=50&severity=critical&type=CRITICAL_ERROR
Authorization: Bearer <admin_token>
```

### Send Test Alert
```http
POST /api/admin/alerts/test
Authorization: Bearer <admin_token>
```

### Start/Stop Monitoring
```http
POST /api/admin/alerts/start
POST /api/admin/alerts/stop
Authorization: Bearer <admin_token>
```

### Clear Alert Data
```http
DELETE /api/admin/alerts/data
Authorization: Bearer <admin_token>
```

## Integration

### Middleware Integration

```javascript
const { 
  trackCriticalErrors,
  trackDatabaseErrors,
  trackAuthFailures,
  addAlertTracking,
  globalErrorHandler
} = require('./middleware/alertMiddleware');

// Apply to all routes
app.use(trackCriticalErrors);
app.use(trackAuthFailures);
app.use(addAlertTracking);

// Apply to specific routes
app.use('/api/hospitals', trackDatabaseErrors);

// Global error handler (should be last)
app.use(globalErrorHandler);
```

### Manual Alert Sending

```javascript
const alertService = require('./services/alertService');

// Send custom alert
await alertService.sendAlert('CRITICAL_ERROR', {
  message: 'Custom critical error detected',
  details: {
    component: 'payment_system',
    errorCode: 'PAY_001',
    affectedUsers: 150
  },
  severity: 'critical'
});

// From middleware (req.sendAlert available)
app.post('/api/hospitals/register', (req, res) => {
  try {
    // Registration logic
  } catch (error) {
    // Send alert with request context
    req.sendAlert('HOSPITAL_REGISTRATION_ERROR', {
      message: 'Hospital registration failed',
      details: {
        hospitalName: req.body.hospitalName,
        error: error.message
      },
      severity: 'high'
    });
  }
});
```

### Error Tracking Integration

```javascript
// Automatic integration with error tracker
const errorTracker = require('./services/errorTracker');

// Error tracker automatically sends alerts for:
// - Critical errors
// - Error spikes
// - Pattern detection
```

### API Monitoring Integration

```javascript
// Automatic integration with API monitoring
const apiMonitoring = require('./services/apiMonitoring');

// API monitoring automatically sends alerts for:
// - High error rates
// - Slow performance
// - Rate limit spikes
// - Authentication failures
```

## Alert Email Templates

### Critical Error Alert
```html
🚨 CRITICAL ERROR ALERT

Alert: Critical Error
Severity: CRITICAL
Time: 2024-12-10 10:30:00
Alert ID: ALERT_1733832600000_abc123

Message:
Critical error occurred: 500 Internal Server Error

Details:
{
  "statusCode": 500,
  "endpoint": "/api/hospitals/api/patient-data",
  "method": "POST",
  "error": "Database connection failed",
  "hospitalId": "hospital123",
  "timestamp": "2024-12-10T10:30:00.000Z"
}

Recommended Actions:
- Check system logs for detailed error information
- Verify database connectivity and performance
- Check server resources (CPU, memory, disk)
- Contact development team if issue persists
```

### Performance Alert
```html
⚠️ PERFORMANCE ALERT

Alert: Slow Performance
Severity: MEDIUM
Time: 2024-12-10 10:30:00
Alert ID: ALERT_1733832600000_def456

Message:
Slow response time detected: 2500ms

Details:
{
  "averageResponseTime": 2500,
  "threshold": 1000,
  "slowRequests": 25,
  "slowRequestRate": 15.5
}

Recommended Actions:
- Check database query performance
- Monitor server resources (CPU, memory)
- Review recent code changes for performance issues
- Consider scaling resources if needed
```

## Monitoring Dashboard

### Health Status Indicators
- 🟢 **Healthy**: No critical alerts, low error rate
- 🟡 **Warning**: High severity alerts present
- 🔴 **Critical**: Critical alerts active

### Key Metrics
- Total alerts in last 24 hours
- Critical alerts count
- High severity alerts count
- Alert system operational status
- Enabled alert types count
- Last alert timestamp

### Alert Statistics
- Alerts by type
- Alerts by severity
- Alert trends over time
- Top error patterns
- Response time trends

## Testing

### Manual Testing
```bash
# Test the alert system
node backend/test-alert-system.js
```

### Integration Testing
```javascript
const request = require('supertest');
const app = require('../server');

describe('Alert System', () => {
  it('should send critical error alerts', async () => {
    // Trigger a 500 error
    const response = await request(app)
      .post('/api/test/error')
      .expect(500);
    
    // Verify alert was sent
    const stats = alertService.getAlertStats();
    expect(stats.alertsBySeverity.critical).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

1. **Alerts Not Sending**
   - Check `ALERTS_ENABLED` environment variable
   - Verify email configuration
   - Check alert service logs
   - Ensure monitoring is started

2. **Too Many Alerts**
   - Review cooldown settings
   - Adjust thresholds
   - Check for system issues causing alerts
   - Consider disabling specific alert types

3. **Email Delivery Issues**
   - Verify SMTP configuration
   - Check email service logs
   - Test email connectivity
   - Verify recipient addresses

4. **Performance Impact**
   - Monitor alert service overhead
   - Adjust monitoring frequency
   - Optimize alert processing
   - Consider external alerting services

### Debug Commands

```bash
# Check alert service status
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/admin/alerts/health

# Send test alert
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/admin/alerts/test

# Get alert statistics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/admin/alerts/stats
```

### Log Analysis

```bash
# Check alert logs
grep "SYSTEM_ALERT" backend/logs/application-*.log

# Check email alerts
grep "ALERT_EMAIL_SENT" backend/logs/application-*.log

# Check alert errors
grep "ALERT_.*_ERROR" backend/logs/error-*.log
```

## Best Practices

### Configuration
- Set appropriate thresholds for your environment
- Configure multiple email recipients
- Use different cooldowns for different alert types
- Regularly review and update thresholds

### Monitoring
- Monitor alert system health regularly
- Review alert statistics weekly
- Investigate recurring alerts
- Adjust thresholds based on patterns

### Response
- Establish alert response procedures
- Document escalation paths
- Train team on alert meanings
- Create runbooks for common alerts

### Maintenance
- Clear old alert data periodically
- Update email recipients as needed
- Review and optimize thresholds
- Test alert system regularly

## Future Enhancements

### Planned Features
- **Slack Integration**: Real-time Slack notifications
- **PagerDuty Integration**: Incident management integration
- **Mobile Push Notifications**: Mobile app alerts
- **Custom Webhooks**: Integration with external systems
- **Alert Correlation**: Intelligent alert grouping
- **Machine Learning**: Anomaly detection and predictive alerts

### Advanced Configuration
- **Dynamic Thresholds**: Time-based threshold adjustments
- **Alert Routing**: Route alerts based on conditions
- **Escalation Policies**: Multi-level alert escalation
- **Alert Suppression**: Intelligent alert suppression during maintenance

This alert system provides comprehensive monitoring and notification capabilities to ensure the Hospital Management System operates reliably and securely.