# Hospital Feature Logging Guide

## Overview

The hospital feature includes comprehensive logging to track all activities, security events, and performance metrics. This guide explains how to use and monitor the logging system.

## Log Types

### 1. Application Logs (`application-YYYY-MM-DD.log`)
General application events and information.

### 2. Hospital Logs (`hospital-YYYY-MM-DD.log`)
Hospital-specific activities:
- Registration attempts
- Login attempts (success/failure)
- API access events
- Verification actions

### 3. Security Logs (`security-YYYY-MM-DD.log`)
Security-related events:
- Invalid API credentials
- Rate limit violations
- Suspicious activities
- Unauthorized access attempts

### 4. API Access Logs (`api-access-YYYY-MM-DD.log`)
HTTP request/response tracking:
- Request details
- Response times
- Status codes
- Performance metrics

### 5. Error Logs (`error-YYYY-MM-DD.log`)
Application errors and exceptions.

## Log Structure

All logs use structured JSON format:

```json
{
  "timestamp": "2025-12-10T08:50:23.502Z",
  "level": "info",
  "message": "Hospital registration attempt",
  "type": "HOSPITAL_REGISTRATION",
  "hospitalName": "City Hospital",
  "email": "contact@cityhospital.com",
  "registrationNumber": "REG123456",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

## Hospital-Specific Events

### Registration
```javascript
logger.hospital.registration({
  hospitalName: "City Hospital",
  email: "contact@cityhospital.com",
  registrationNumber: "REG123456",
  documentsCount: 3,
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
});
```

### Login Attempts
```javascript
logger.hospital.login({
  hospitalId: "hospital_id",
  hospitalName: "City Hospital",
  email: "contact@cityhospital.com",
  success: true,
  reason: "Login successful",
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
});
```

### API Access
```javascript
logger.hospital.apiAccess({
  hospitalId: "hospital_id",
  hospitalName: "City Hospital",
  patientId: "patient_id",
  patientEmail: "patient@example.com",
  endpoint: "/api/hospitals/api/patient-data",
  method: "POST",
  success: true,
  responseTime: 250,
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
});
```

### Verification Actions
```javascript
logger.hospital.verification({
  hospitalId: "hospital_id",
  hospitalName: "City Hospital",
  action: "verified", // 'verified' | 'rejected' | 'revoked'
  adminId: "admin_id",
  adminEmail: "admin@example.com",
  reason: "Application approved",
  ip: "192.168.1.100"
});
```

## Security Events

### Invalid API Credentials
```javascript
logger.security.invalidApiCredentials({
  apiKey: "HK_invalid_key",
  endpoint: "/api/hospitals/api/patient-data",
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
});
```

### Rate Limit Exceeded
```javascript
logger.security.rateLimitExceeded({
  hospitalId: "hospital_id",
  hospitalName: "City Hospital",
  endpoint: "/api/hospitals/api/patient-data",
  requestCount: 101,
  limit: 100,
  ip: "192.168.1.100"
});
```

### Suspicious Activity
```javascript
logger.security.suspiciousActivity({
  activity: "MULTIPLE_FAILED_LOGINS",
  details: { attempts: 5, timeWindow: "5 minutes" },
  hospitalId: "hospital_id",
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
});
```

## Log Monitoring

### CLI Tool

Use the log monitor CLI for quick analysis:

```bash
# Generate comprehensive report
npm run log-monitor report [days]

# Show hospital activity
npm run log-monitor hospital-activity [days]

# Show security events
npm run log-monitor security-events [days]

# Show API performance
npm run log-monitor api-performance [days]

# Search logs
npm run log-monitor search <pattern> [logType] [limit]

# Show recent entries
npm run log-monitor tail [logType] [lines]

# List log files
npm run log-monitor files
```

### Examples

```bash
# Generate 30-day report
npm run log-monitor report 30

# Search for specific hospital
npm run log-monitor search "City Hospital"

# Show recent security events
npm run log-monitor tail security 50

# Show API performance for last 7 days
npm run log-monitor api-performance 7
```

### Admin API Endpoints

Access log data via REST API (admin only):

```bash
# Get comprehensive report
GET /api/admin/logs/report?days=7

# Search logs
GET /api/admin/logs/search?pattern=hospital&logType=security&limit=100

# Get hospital activity
GET /api/admin/logs/hospital-activity?days=30

# Get security events
GET /api/admin/logs/security-events?days=7

# Get API performance
GET /api/admin/logs/api-performance?days=14
```

## Log Rotation

Logs are automatically rotated daily:
- Files are compressed after rotation
- Application logs kept for 14 days
- Error logs kept for 30 days
- Hospital and security logs kept for 30 days
- API access logs kept for 30 days
- Security logs kept for 90 days

## Performance Monitoring

### Slow Query Detection
Automatically logs database queries taking > 1 second:

```json
{
  "type": "PERFORMANCE_SLOW_QUERY",
  "query": "Hospital.findOne({ apiKey: '...' })",
  "executionTime": 1500,
  "collection": "hospitals"
}
```

### Slow API Detection
Automatically logs API responses taking > 1 second:

```json
{
  "type": "PERFORMANCE_SLOW_API",
  "endpoint": "/api/hospitals/api/patient-data",
  "method": "POST",
  "responseTime": 2000,
  "hospitalId": "hospital_id"
}
```

## Security Monitoring

### Failed Login Tracking
All failed login attempts are logged with:
- Hospital ID (if found)
- Email used
- Failure reason
- IP address
- User agent

### API Abuse Detection
Rate limiting violations are logged with:
- Hospital information
- Request count vs limit
- Time window
- IP address

### Suspicious Activity Patterns
- Multiple failed logins from same IP
- Duplicate registration attempts
- Invalid API key usage patterns
- Unusual access patterns

## Alerting (Future Enhancement)

Consider implementing alerts for:
- High error rates (>5%)
- Multiple security events from same IP
- Slow API responses (>2 seconds)
- Failed login attempts (>10 per hour)
- Rate limit violations

## Log Analysis Queries

### Find hospitals with most API usage
```bash
npm run log-monitor search "HOSPITAL_API_ACCESS" | grep -o '"hospitalId":"[^"]*"' | sort | uniq -c | sort -nr
```

### Find most common security events
```bash
npm run log-monitor search "SECURITY_" security | grep -o '"type":"[^"]*"' | sort | uniq -c | sort -nr
```

### Find slowest API endpoints
```bash
npm run log-monitor search "responseTime" api-access | grep -o '"responseTime":[0-9]*' | sort -nr
```

## Troubleshooting

### Log Files Not Created
1. Check logs directory exists: `backend/logs/`
2. Verify write permissions
3. Check disk space

### Missing Log Entries
1. Verify logger is imported in controllers
2. Check log level configuration
3. Ensure middleware is properly configured

### Performance Issues
1. Monitor log file sizes
2. Adjust retention periods if needed
3. Consider log aggregation for high-volume systems

## Best Practices

1. **Structured Logging**: Always use structured JSON format
2. **Sensitive Data**: Never log passwords, API secrets, or PII
3. **Context**: Include relevant context (hospital ID, IP, user agent)
4. **Performance**: Log performance metrics for optimization
5. **Security**: Log all security-relevant events
6. **Retention**: Follow data retention policies
7. **Monitoring**: Regularly review logs for patterns and issues

## Integration with External Systems

### Log Aggregation
Consider integrating with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- New Relic

### Alerting Systems
- PagerDuty
- Slack notifications
- Email alerts
- SMS alerts

### Metrics Export
- Prometheus
- Grafana
- CloudWatch
- Custom dashboards