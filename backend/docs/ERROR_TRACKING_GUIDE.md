# Error Tracking System Guide

## Overview

The Hospital Feature Error Tracking System provides comprehensive error monitoring, categorization, and reporting capabilities. It automatically tracks errors across all hospital-related operations and provides detailed analytics for system health monitoring.

## Features

### 🎯 Error Categorization
- **Hospital Registration Errors**: Issues during hospital signup process
- **Hospital Login Errors**: Authentication failures and login issues
- **Hospital API Errors**: API endpoint failures and data access issues
- **Hospital Verification Errors**: Admin verification process errors
- **Patient Data Errors**: Patient information access and retrieval issues
- **Authentication Errors**: JWT and API key authentication failures
- **Authorization Errors**: Permission and access control issues
- **Validation Errors**: Input validation and data format errors
- **Database Errors**: MongoDB operations and connection issues
- **Email Errors**: Email service and notification failures
- **Rate Limiting Errors**: API rate limit violations
- **System Errors**: General application and infrastructure errors

### 📊 Severity Levels
- **LOW**: Minor issues that don't affect core functionality
- **MEDIUM**: Issues that may impact user experience
- **HIGH**: Significant problems affecting system operations
- **CRITICAL**: Severe errors requiring immediate attention

### 🔍 Error Tracking Features
- Automatic error detection and categorization
- Error fingerprinting for grouping similar issues
- Real-time error statistics and trends
- Error spike detection and alerting
- Hospital-specific error tracking
- Comprehensive error context capture
- Integration with existing logging system

## API Endpoints

### Get Error Statistics
```http
GET /api/admin/errors/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalErrors": 150,
    "errorsByCategory": {
      "HOSPITAL_REGISTRATION": 25,
      "HOSPITAL_LOGIN": 30,
      "HOSPITAL_API": 45,
      "AUTHENTICATION": 20,
      "DATABASE": 15,
      "EMAIL": 10,
      "SYSTEM": 5
    },
    "errorsBySeverity": {
      "low": 50,
      "medium": 70,
      "high": 25,
      "critical": 5
    },
    "topErrors": [
      {
        "fingerprint": "abc123def456",
        "category": "HOSPITAL_API",
        "message": "Patient not found",
        "count": 15,
        "severity": "medium",
        "firstSeen": "2024-01-15T10:00:00Z",
        "lastSeen": "2024-01-15T15:30:00Z"
      }
    ],
    "todayErrors": 45,
    "yesterdayErrors": 38,
    "errorTrend": 7,
    "generatedAt": "2024-01-15T16:00:00Z"
  }
}
```

### Get Error Health Status
```http
GET /api/admin/errors/health
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "criticalErrors": 0,
    "highSeverityErrors": 5,
    "totalErrors": 150,
    "errorRate": 0.05,
    "alerts": []
  },
  "timestamp": "2024-01-15T16:00:00Z"
}
```

### Get Error Trends
```http
GET /api/admin/errors/trends?period=24h&category=HOSPITAL_API
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "trends": {
    "period": "24h",
    "category": "HOSPITAL_API",
    "dataPoints": [
      {
        "timestamp": "2024-01-15T00:00:00Z",
        "errorCount": 2
      },
      {
        "timestamp": "2024-01-15T01:00:00Z",
        "errorCount": 1
      }
    ],
    "summary": {
      "totalErrors": 45,
      "trend": "stable",
      "changePercent": 0
    }
  }
}
```

### Get Errors by Category
```http
GET /api/admin/errors/category/HOSPITAL_REGISTRATION?limit=20&offset=0
Authorization: Bearer <admin_token>
```

### Get Hospital-Specific Errors
```http
GET /api/admin/errors/hospital/60f7b3b3b3b3b3b3b3b3b3b3?period=7d
Authorization: Bearer <admin_token>
```

### Clear Error Statistics
```http
DELETE /api/admin/errors/stats
Authorization: Bearer <admin_token>
```

## Usage Examples

### Manual Error Tracking in Controllers

```javascript
const errorTracker = require('../services/errorTracker');

// Track hospital registration error
try {
  // Hospital registration logic
} catch (error) {
  const errorId = errorTracker.trackHospitalRegistrationError(error, {
    hospitalName: req.body.hospitalName,
    email: req.body.email,
    registrationNumber: req.body.registrationNumber
  }, req);
  
  res.status(500).json({
    success: false,
    message: 'Registration failed',
    errorId: errorId
  });
}

// Track custom error
const errorId = errorTracker.trackError({
  category: errorTracker.errorCategories.HOSPITAL_API,
  severity: errorTracker.errorSeverity.HIGH,
  error: new Error('Custom error message'),
  context: {
    hospitalId: 'hospital123',
    operation: 'patient_data_access',
    patientId: 'patient456'
  },
  req: req
});
```

### Using Middleware Error Tracking

```javascript
// In route handlers, use req.trackError or req.trackHospitalError
app.post('/api/hospitals/register', (req, res) => {
  try {
    // Registration logic
  } catch (error) {
    // Automatically categorized based on endpoint
    const errorId = req.trackHospitalError(error, {
      hospitalName: req.body.hospitalName,
      email: req.body.email
    });
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      errorId: errorId
    });
  }
});
```

### Database Error Tracking

```javascript
const { trackDatabaseError } = require('../middleware/errorTracking');

try {
  const hospital = await Hospital.findById(hospitalId);
} catch (error) {
  const errorId = trackDatabaseError('findById', 'Hospital')(error, {
    hospitalId: hospitalId,
    query: { _id: hospitalId }
  });
  
  // Handle error
}
```

### Email Error Tracking

```javascript
const { trackEmailError } = require('../middleware/errorTracking');

try {
  await emailService.sendHospitalVerificationEmail(email, data);
} catch (error) {
  const errorId = trackEmailError('hospital_verification', email)(error, {
    hospitalId: hospitalId,
    template: 'verification'
  });
  
  // Handle error
}
```

## Error Context Information

Each tracked error includes comprehensive context:

```json
{
  "id": "ERR_1642262400000_abc123",
  "timestamp": "2024-01-15T16:00:00Z",
  "category": "HOSPITAL_REGISTRATION",
  "severity": "high",
  "message": "Duplicate registration number",
  "stack": "Error: Duplicate registration number\n    at ...",
  "code": "E11000",
  "name": "MongoError",
  "context": {
    "hospitalName": "City Hospital",
    "email": "admin@cityhospital.com",
    "registrationNumber": "REG123456",
    "method": "POST",
    "url": "/api/hospitals/register",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "headers": {
      "content-type": "application/json",
      "accept": "application/json"
    }
  },
  "fingerprint": "abc123def456",
  "environment": "production"
}
```

## Error Patterns and Alerts

### Automatic Pattern Detection
- **Error Spikes**: Alerts when similar errors occur more than 10 times per hour
- **Critical Errors**: Immediate alerts for critical severity errors
- **Trend Analysis**: Identifies increasing error patterns over time

### Alert Levels
- **CRITICAL**: Immediate attention required (logged with high priority)
- **WARNING**: Monitor and investigate (logged with medium priority)
- **INFO**: Normal operational alerts (logged with low priority)

## Integration with Existing Systems

### Logging Integration
Error tracking integrates seamlessly with the existing Winston logging system:

```javascript
// Errors are automatically logged with structured data
logger.error('Tracked Error', {
  type: 'TRACKED_ERROR',
  errorId: 'ERR_1642262400000_abc123',
  category: 'HOSPITAL_REGISTRATION',
  severity: 'high',
  message: 'Duplicate registration number',
  fingerprint: 'abc123def456',
  context: { /* error context */ },
  stack: 'Error stack trace...',
  timestamp: '2024-01-15T16:00:00Z'
});
```

### Middleware Integration
Error tracking middleware automatically captures and categorizes errors:

```javascript
// Global error tracking middleware
app.use(globalErrorTracking);

// Hospital-specific error tracking
app.use(hospitalErrorTracking);

// API error tracking
app.use(apiErrorTracking);
```

## Monitoring and Maintenance

### Regular Monitoring Tasks
1. **Daily**: Review error health status and critical alerts
2. **Weekly**: Analyze error trends and patterns
3. **Monthly**: Review error statistics and optimize system performance

### Maintenance Operations
- **Clear Statistics**: Reset error counters for fresh analysis periods
- **Archive Logs**: Move old error logs to long-term storage
- **Update Categories**: Add new error categories as system evolves

### Performance Considerations
- Error tracking adds minimal overhead to request processing
- Statistics are calculated in-memory for fast access
- Log files are rotated automatically to manage disk space
- Error fingerprinting prevents duplicate processing

## Security and Privacy

### Data Protection
- Sensitive information (passwords, API secrets) is automatically sanitized
- Personal data is masked in error logs
- Access to error tracking endpoints requires admin authentication

### Audit Trail
- All error tracking operations are logged
- Admin access to error data is tracked
- Error statistics clearing is audited

## Troubleshooting

### Common Issues

**High Error Rates**
- Check system resources and database connectivity
- Review recent deployments or configuration changes
- Analyze error patterns for root cause identification

**Missing Error Data**
- Verify error tracking middleware is properly configured
- Check that controllers are using error tracking methods
- Ensure proper error handling in async operations

**Performance Impact**
- Monitor error tracking overhead in high-traffic scenarios
- Consider adjusting error retention periods
- Optimize error fingerprinting algorithms if needed

### Debug Mode
Enable detailed error tracking logging:

```javascript
// Set environment variable
process.env.ERROR_TRACKING_DEBUG = 'true';

// Or configure in application
errorTracker.setDebugMode(true);
```

## Future Enhancements

### Planned Features
- **External Integrations**: Slack, PagerDuty, email notifications
- **Machine Learning**: Anomaly detection and predictive error analysis
- **Dashboard UI**: Web interface for error monitoring and management
- **API Rate Limiting**: Enhanced rate limiting based on error patterns
- **Error Recovery**: Automatic retry mechanisms for transient errors

### Configuration Options
- **Retention Periods**: Configurable error data retention
- **Alert Thresholds**: Customizable alert triggers and conditions
- **Category Mapping**: Dynamic error category assignment
- **Severity Rules**: Configurable severity level determination

This error tracking system provides comprehensive monitoring capabilities for the hospital feature, ensuring system reliability and enabling proactive issue resolution.