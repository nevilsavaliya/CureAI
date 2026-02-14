# API Monitoring Implementation Guide

## Overview

The API Monitoring system provides comprehensive tracking and monitoring of the Hospital API endpoints, including performance metrics, error tracking, security monitoring, and usage analytics.

## Features

### 1. Real-time Metrics
- **Request Tracking**: Total, successful, and failed requests
- **Performance Monitoring**: Response times, slow request detection
- **Security Monitoring**: Authentication errors, rate limit violations
- **Usage Analytics**: Unique hospitals, patient data access patterns

### 2. Alert System
- **Error Rate Alerts**: High and critical error rate thresholds
- **Performance Alerts**: Slow response time detection
- **Security Alerts**: Authentication failure spikes, rate limit violations
- **Spike Detection**: Automatic detection of unusual activity patterns

### 3. Comprehensive Statistics
- **Hospital Analytics**: Top hospitals by usage, verification status
- **Usage Patterns**: Patient data access trends, API adoption
- **Performance Analysis**: Response time distribution, bottleneck identification
- **Error Analysis**: Error categorization, failure pattern detection

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    API Monitoring System                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Middleware │  │   Service    │  │  Controller  │      │
│  │              │  │              │  │              │      │
│  │ - Request    │  │ - Metrics    │  │ - REST API   │      │
│  │   Tracking   │  │   Collection │  │ - Admin      │      │
│  │ - Response   │  │ - Statistics │  │   Interface  │      │
│  │   Monitoring │  │ - Alerting   │  │ - Prometheus │      │
│  │ - Error      │  │ - Caching    │  │   Export     │      │
│  │   Tracking   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
API Request → Monitoring Middleware → Authentication → Rate Limiting → Controller
     ↓                ↓                      ↓              ↓
Track Start    Track Auth Events    Track Rate Limits   Track Response
     ↓                ↓                      ↓              ↓
     └────────────────┴──────────────────────┴──────────────┘
                              ↓
                    API Monitoring Service
                              ↓
                    ┌─────────────────────┐
                    │   Metrics Storage   │
                    │  - Daily Counters   │
                    │  - Recent Activity  │
                    │  - Alert Tracking   │
                    └─────────────────────┘
```

## Implementation Details

### 1. API Monitoring Service (`backend/services/apiMonitoring.js`)

The core service that handles all monitoring functionality:

```javascript
const apiMonitoring = require('./services/apiMonitoring');

// Track API request
const trackingId = apiMonitoring.trackRequestStart({
  method: 'POST',
  url: '/api/hospitals/api/patient-data',
  hospitalId: 'hospital123',
  ip: '192.168.1.100',
  userAgent: 'Hospital-Client/1.0'
});

// Track request completion
apiMonitoring.trackRequestEnd(trackingId, {
  statusCode: 200,
  responseTime: 250,
  hospitalId: 'hospital123'
});
```

#### Key Methods:
- `trackRequestStart()` - Begin tracking an API request
- `trackRequestEnd()` - Complete request tracking with response data
- `trackPatientDataAccess()` - Track patient data access events
- `trackAuthenticationError()` - Track authentication failures
- `trackRateLimitExceeded()` - Track rate limit violations
- `getRealTimeMetrics()` - Get current metrics
- `getApiStatistics()` - Get comprehensive statistics

### 2. Monitoring Middleware (`backend/middleware/apiMonitoring.js`)

Middleware components that integrate with existing routes:

```javascript
const { hospitalApiMonitoring } = require('../middleware/apiMonitoring');

// Apply to hospital API routes
router.post('/api/patient-data', 
  ...hospitalApiMonitoring,  // Monitoring middleware
  authenticateHospitalApi,
  rateLimitHospitalApi,
  validatePatientDataRequest, 
  hospitalController.getPatientData
);
```

#### Middleware Functions:
- `trackApiRequestStart` - Captures request initiation
- `trackApiRequestEnd` - Captures response completion
- `trackPatientDataAccess` - Tracks successful patient data access
- `apiMonitoringErrorHandler` - Handles monitoring errors

### 3. Monitoring Controller (`backend/controllers/apiMonitoringController.js`)

REST API endpoints for accessing monitoring data:

#### Endpoints:
- `GET /api/admin/monitoring/realtime` - Real-time metrics
- `GET /api/admin/monitoring/statistics` - Comprehensive statistics
- `GET /api/admin/monitoring/health` - API health status
- `GET /api/admin/monitoring/config` - Monitoring configuration
- `POST /api/admin/monitoring/clear-cache` - Clear metrics cache
- `GET /api/admin/monitoring/prometheus` - Prometheus format metrics

### 4. Integration Points

#### Hospital API Authentication
```javascript
// In hospitalApiAuth.js
const { trackAuthenticationError } = require('./apiMonitoring');

// Track authentication failures
trackAuthenticationError(error, {
  apiKey: apiKey,
  endpoint: req.originalUrl,
  reason: 'Invalid credentials'
}, req);
```

#### Rate Limiting
```javascript
// In rateLimiter.js
const { trackRateLimitExceeded } = require('./apiMonitoring');

// Track rate limit violations
trackRateLimitExceeded({
  hospitalId: hospitalId,
  requestCount: rateLimitData.count,
  limit: RATE_LIMIT
}, req);
```

## Configuration

### Performance Thresholds
```javascript
performanceThresholds: {
  slowRequestMs: 1000,           // Requests slower than 1s
  criticalResponseTimeMs: 5000,  // Critical threshold
  highErrorRatePercent: 5,       // High error rate
  criticalErrorRatePercent: 10   // Critical error rate
}
```

### Alert Thresholds
```javascript
alertThresholds: {
  errorSpike: 10,        // Errors per 5 minutes
  slowRequestSpike: 20,  // Slow requests per 5 minutes
  rateLimitSpike: 5      // Rate limit hits per 5 minutes
}
```

### Cache Configuration
- **Cache Duration**: 5 minutes for statistics
- **Daily Reset**: Counters reset at midnight
- **Cleanup Interval**: Recent activity cleaned every minute

## Metrics Collected

### Request Metrics
- Total requests (daily)
- Successful requests
- Failed requests
- Success rate percentage
- Error rate percentage

### Performance Metrics
- Average response time
- Slow request count
- Response time distribution
- Performance alerts

### Security Metrics
- Authentication errors
- Rate limit violations
- Invalid API key attempts
- Suspicious activity patterns

### Usage Metrics
- Patient data requests
- Unique hospitals accessing API
- Unique patients accessed
- Top hospitals by usage

## API Endpoints

### Get Real-time Metrics
```http
GET /api/admin/monitoring/realtime
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-12-10T10:30:00.000Z",
    "date": "2024-12-10",
    "requests": {
      "total": 1234,
      "successful": 1200,
      "failed": 34,
      "successRate": 97.24,
      "errorRate": 2.76
    },
    "performance": {
      "averageResponseTime": 245.5,
      "slowRequests": 12,
      "slowRequestRate": 0.97
    },
    "security": {
      "authenticationErrors": 8,
      "rateLimitExceeded": 3
    },
    "usage": {
      "patientDataRequests": 1150,
      "uniqueHospitals": 45,
      "uniquePatients": 892
    },
    "alerts": {
      "highErrorRate": false,
      "criticalErrorRate": false,
      "slowPerformance": false
    }
  }
}
```

### Get Comprehensive Statistics
```http
GET /api/admin/monitoring/statistics?startDate=2024-12-01&endDate=2024-12-10
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2024-12-10T10:30:00.000Z",
    "period": {
      "startDate": "2024-12-01T00:00:00.000Z",
      "endDate": "2024-12-10T23:59:59.999Z"
    },
    "realTimeMetrics": { /* ... */ },
    "hospitals": {
      "total": 156,
      "verified": 89,
      "active": 87,
      "withApiAccess": 45,
      "topByUsage": [
        {
          "name": "City General Hospital",
          "accessCount": 2341,
          "lastAccess": "2024-12-10T09:45:00.000Z"
        }
      ]
    },
    "usage": { /* ... */ },
    "performance": { /* ... */ },
    "errors": { /* ... */ }
  }
}
```

### Get API Health Status
```http
GET /api/admin/monitoring/health
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-12-10T10:30:00.000Z",
    "checks": {
      "errorRate": {
        "status": "healthy",
        "value": 2.76,
        "threshold": 5,
        "message": "Error rate is within acceptable limits"
      },
      "responseTime": {
        "status": "healthy",
        "value": 245.5,
        "threshold": 1000,
        "message": "Response time is within acceptable limits"
      },
      "availability": {
        "status": "healthy",
        "value": 100,
        "threshold": 99,
        "message": "API is available"
      }
    },
    "alerts": { /* ... */ }
  }
}
```

### Prometheus Metrics Export
```http
GET /api/admin/monitoring/prometheus
Authorization: Bearer <admin_jwt_token>
```

**Response (text/plain):**
```
# HELP hospital_api_requests_total Total number of API requests
# TYPE hospital_api_requests_total counter
hospital_api_requests_total{status="total"} 1234
hospital_api_requests_total{status="successful"} 1200
hospital_api_requests_total{status="failed"} 34

# HELP hospital_api_response_time_seconds Average API response time in seconds
# TYPE hospital_api_response_time_seconds gauge
hospital_api_response_time_seconds 0.2455

# HELP hospital_api_error_rate_percent API error rate percentage
# TYPE hospital_api_error_rate_percent gauge
hospital_api_error_rate_percent 2.76
```

## Testing

### Manual Testing
```bash
# Test the monitoring service
node backend/test-api-monitoring.js
```

### Integration Testing
```javascript
// Test monitoring middleware integration
const request = require('supertest');
const app = require('../server');

describe('API Monitoring', () => {
  it('should track API requests', async () => {
    const response = await request(app)
      .post('/api/hospitals/api/patient-data')
      .send({
        apiKey: 'HK_test123',
        apiSecret: 'test_secret',
        patientEmail: 'test@example.com'
      });
    
    // Verify monitoring data was recorded
    const metrics = apiMonitoring.getRealTimeMetrics();
    expect(metrics.requests.total).toBeGreaterThan(0);
  });
});
```

## Deployment Considerations

### Production Setup
1. **External Monitoring**: Export metrics to Prometheus/Grafana
2. **Alerting**: Configure alerts for critical thresholds
3. **Log Aggregation**: Integrate with centralized logging
4. **Performance**: Monitor memory usage of metrics storage

### Scaling Considerations
- **Redis Integration**: Use Redis for distributed metrics storage
- **Database Persistence**: Store historical metrics in database
- **Microservices**: Extract monitoring to separate service

### Security
- **Admin Only**: All monitoring endpoints require admin authentication
- **Rate Limiting**: Apply rate limits to monitoring endpoints
- **Data Sanitization**: Remove sensitive data from metrics

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Clear cache regularly: `POST /api/admin/monitoring/clear-cache`
   - Reduce cache duration in production
   - Implement Redis for distributed caching

2. **Missing Metrics**
   - Verify middleware is properly applied to routes
   - Check for errors in monitoring service logs
   - Ensure authentication middleware runs before monitoring

3. **Performance Impact**
   - Monitor overhead of tracking operations
   - Use async operations where possible
   - Implement sampling for high-traffic scenarios

### Debug Mode
```javascript
// Enable debug logging
process.env.DEBUG_MONITORING = 'true';

// Check monitoring service status
const status = apiMonitoring.getRealTimeMetrics();
console.log('Monitoring Status:', status);
```

## Future Enhancements

1. **Machine Learning**: Anomaly detection for unusual patterns
2. **Predictive Analytics**: Forecast API usage and capacity needs
3. **Custom Dashboards**: Build admin dashboard with charts and graphs
4. **Mobile Alerts**: Push notifications for critical issues
5. **API Analytics**: Detailed usage patterns and optimization recommendations

## Support

For issues or questions about API monitoring:
1. Check the logs in `backend/logs/`
2. Run the test script: `node backend/test-api-monitoring.js`
3. Review monitoring configuration in the service
4. Contact the development team with specific error details