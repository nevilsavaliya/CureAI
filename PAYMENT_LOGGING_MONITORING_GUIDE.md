# Payment Logging and Monitoring Guide

## Overview

This guide explains the comprehensive logging and monitoring system implemented for the Kotak UPI payment integration. The system provides detailed activity logs, real-time metrics tracking, and API monitoring capabilities.

## Components

### 1. Payment Logger Service (`backend/services/paymentLogger.js`)

The Payment Logger Service provides structured logging for all payment-related activities.

#### Features

- **Structured JSON Logging**: All logs are stored in JSON format with timestamps
- **Multiple Log Files**: Separate files for different log types
- **Automatic Log Rotation**: Built-in cleanup for old logs
- **Sensitive Data Sanitization**: Automatically redacts sensitive information

#### Log Files

All log files are stored in `backend/logs/`:

1. **payment-activity.log**: General payment activities
   - Payment initiations
   - Status changes
   - Subscription activations
   - Verification polling

2. **kotak-api.log**: Kotak API interactions
   - API requests and responses
   - Request/response duration
   - Success/failure status

3. **payment-errors.log**: Error tracking
   - Payment errors with full context
   - Stack traces
   - Error codes and messages

#### Log Entry Format

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "INFO",
  "category": "PAYMENT",
  "message": "Payment initiated: KMB1234567890",
  "paymentId": "507f1f77bcf86cd799439011",
  "txnId": "KMB1234567890",
  "doctorId": "507f1f77bcf86cd799439012",
  "amount": 999,
  "currency": "INR",
  "action": "PAYMENT_INITIATED"
}
```

#### Usage Examples

```javascript
const paymentLogger = require('./services/paymentLogger');

// Log payment initiation
paymentLogger.logPaymentInitiation({
  paymentId: payment._id.toString(),
  txnId: payment.txnId,
  doctorId: doctor._id,
  amount: 999,
  planName: 'Monthly Plan',
  duration: 30
});

// Log Kotak API call
paymentLogger.logKotakAPICall({
  endpoint: '/checkTransactionStatus',
  method: 'POST',
  txnId: 'KMB1234567890',
  requestData: { /* request body */ },
  responseData: { /* response body */ },
  duration: 1250,
  success: true
});

// Log status change
paymentLogger.logStatusChange({
  paymentId: payment._id.toString(),
  txnId: payment.txnId,
  oldStatus: 'pending',
  newStatus: 'completed',
  reason: 'Payment verified successfully',
  verificationAttempts: 5
});

// Log error
paymentLogger.logPaymentError({
  paymentId: payment._id.toString(),
  txnId: payment.txnId,
  doctorId: doctor._id,
  operation: 'initiatePayment',
  error: error,
  context: { amount: 999 }
});
```

#### Reading Logs

```javascript
// Read recent payment logs (last 100 entries)
const logs = paymentLogger.readRecentLogs('payment', 100);

// Read API logs
const apiLogs = paymentLogger.readRecentLogs('api', 50);

// Read error logs
const errorLogs = paymentLogger.readRecentLogs('error', 25);
```

#### Log Cleanup

```javascript
// Clean logs older than 30 days
paymentLogger.cleanOldLogs(30);
```

### 2. Payment Metrics Service (`backend/services/paymentMetrics.js`)

The Payment Metrics Service tracks and calculates payment-related metrics for monitoring and analytics.

#### Features

- **Real-time Counters**: Track today's payment activities
- **Success Rate Calculation**: Monitor payment success/failure rates
- **Verification Time Tracking**: Measure average payment verification duration
- **API Error Rate Monitoring**: Track Kotak API error rates
- **Revenue Metrics**: Calculate revenue by payment status
- **Payment Trends**: Daily breakdown of payment activities
- **Metrics Caching**: 5-minute cache for performance

#### Daily Counters

Real-time counters that reset daily:

```javascript
{
  date: '2025-01-15',
  initiated: 45,
  completed: 38,
  failed: 5,
  timeout: 2,
  apiErrors: 3,
  totalAmount: 44955,
  completedAmount: 37962
}
```

#### Usage Examples

```javascript
const paymentMetrics = require('./services/paymentMetrics');

// Increment counters
paymentMetrics.incrementCounter('initiated');
paymentMetrics.incrementCounter('completed');
paymentMetrics.incrementCounter('totalAmount', 999);

// Get daily counters
const counters = paymentMetrics.getDailyCounters();

// Calculate success rate (last 30 days)
const successRate = await paymentMetrics.calculateSuccessRate();
// Returns:
// {
//   period: { startDate, endDate },
//   total: 150,
//   completed: 135,
//   failed: 10,
//   timeout: 5,
//   pending: 0,
//   successRate: 90.00,
//   failureRate: 6.67,
//   timeoutRate: 3.33
// }

// Calculate average verification time
const verificationTime = await paymentMetrics.calculateAverageVerificationTime();
// Returns:
// {
//   period: { startDate, endDate },
//   count: 135,
//   averageTimeSeconds: 45.23,
//   averageAttempts: 8.5,
//   minTimeSeconds: 15.00,
//   maxTimeSeconds: 120.00
// }

// Calculate API error rate
const apiErrors = await paymentMetrics.calculateAPIErrorRate();
// Returns:
// {
//   period: { startDate, endDate },
//   totalPayments: 150,
//   paymentsWithErrors: 12,
//   errorRate: 8.00,
//   errorsByCode: {
//     '91': 5,
//     '03': 4,
//     'NETWORK_ERROR': 3
//   }
// }

// Get comprehensive metrics
const metrics = await paymentMetrics.getComprehensiveMetrics();
// Returns all metrics combined

// Get payment trends (last 30 days)
const trends = await paymentMetrics.getPaymentTrends(30);
// Returns daily breakdown
```

### 3. Payment Metrics API Routes (`backend/routes/paymentMetricsRoutes.js`)

RESTful API endpoints to access metrics and logs.

#### Endpoints

##### GET /api/payment-metrics/comprehensive

Get all metrics in one call.

**Query Parameters:**
- `startDate` (optional): Start date for metrics (ISO format)
- `endDate` (optional): End date for metrics (ISO format)
- `useCache` (optional): Use cached data (default: true)

**Response:**
```json
{
  "success": true,
  "metrics": {
    "generatedAt": "2025-01-15T10:30:45.123Z",
    "period": {
      "startDate": "2024-12-16T00:00:00.000Z",
      "endDate": "2025-01-15T23:59:59.999Z"
    },
    "successRate": { /* ... */ },
    "verificationTime": { /* ... */ },
    "apiErrorRate": { /* ... */ },
    "revenue": { /* ... */ },
    "dailyCounters": { /* ... */ }
  }
}
```

##### GET /api/payment-metrics/success-rate

Get payment success rate metrics.

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

##### GET /api/payment-metrics/verification-time

Get average verification time metrics.

##### GET /api/payment-metrics/api-errors

Get API error rate metrics.

##### GET /api/payment-metrics/revenue

Get revenue metrics.

##### GET /api/payment-metrics/trends

Get daily payment trends.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "trends": [
    {
      "date": "2025-01-15",
      "total": 45,
      "completed": 38,
      "failed": 5,
      "timeout": 2,
      "pending": 0,
      "totalAmount": 44955,
      "completedAmount": 37962
    }
  ]
}
```

##### GET /api/payment-metrics/daily-counters

Get today's real-time counters.

##### GET /api/payment-metrics/logs/:logType

Get recent log entries.

**Path Parameters:**
- `logType`: Type of log (payment, api, error)

**Query Parameters:**
- `lines` (optional): Number of lines to return (default: 100)

**Response:**
```json
{
  "success": true,
  "logType": "payment",
  "count": 100,
  "logs": [
    {
      "timestamp": "2025-01-15T10:30:45.123Z",
      "level": "INFO",
      "category": "PAYMENT",
      "message": "Payment initiated: KMB1234567890",
      "paymentId": "507f1f77bcf86cd799439011",
      "txnId": "KMB1234567890"
    }
  ]
}
```

##### POST /api/payment-metrics/clear-cache

Clear metrics cache to force fresh calculation.

## Integration Points

### Payment Initiation

When a payment is initiated:
1. Log payment initiation with all details
2. Increment `initiated` counter
3. Increment `totalAmount` counter

### Payment Verification

During verification polling:
1. Log each verification poll attempt
2. Log Kotak API calls with request/response
3. Increment `apiErrors` counter on API failures

### Payment Completion

When payment completes:
1. Log status change from pending to completed
2. Log subscription activation
3. Increment `completed` counter
4. Increment `completedAmount` counter

### Payment Failure

When payment fails:
1. Log status change with failure reason
2. Log error details
3. Increment `failed` counter

### Payment Timeout

When payment times out:
1. Log verification timeout
2. Log status change
3. Increment `timeout` counter

## Monitoring Best Practices

### 1. Regular Log Review

- Review error logs daily
- Monitor API error rates
- Check for unusual patterns

### 2. Metrics Dashboard

Create a dashboard to display:
- Today's payment counters
- Success rate trends
- Average verification time
- API error rate
- Revenue metrics

### 3. Alerting

Set up alerts for:
- Success rate drops below 85%
- API error rate exceeds 10%
- Average verification time exceeds 2 minutes
- Multiple consecutive API failures

### 4. Log Retention

- Keep payment activity logs for 90 days
- Keep API logs for 30 days
- Keep error logs for 180 days
- Archive old logs for compliance

### 5. Performance Monitoring

Monitor:
- Verification polling efficiency
- API response times
- Database query performance
- Cache hit rates

## Example Monitoring Queries

### Check Today's Performance

```bash
curl -X GET "http://localhost:3000/api/payment-metrics/daily-counters" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Last 7 Days Success Rate

```bash
curl -X GET "http://localhost:3000/api/payment-metrics/success-rate?startDate=2025-01-08&endDate=2025-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Recent Errors

```bash
curl -X GET "http://localhost:3000/api/payment-metrics/logs/error?lines=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Payment Trends

```bash
curl -X GET "http://localhost:3000/api/payment-metrics/trends?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### High API Error Rate

1. Check Kotak API logs for error patterns
2. Verify API credentials are valid
3. Check network connectivity
4. Review error codes in metrics

### Low Success Rate

1. Review failed payment logs
2. Check timeout rate
3. Analyze verification time metrics
4. Review Kotak API response codes

### Slow Verification Times

1. Check average verification time metrics
2. Review verification poll logs
3. Analyze API response times
4. Check for network issues

## Security Considerations

### Sensitive Data

The logging system automatically sanitizes:
- API credentials
- Secret keys
- Access tokens
- Passwords

### Log Access

- Restrict log file access to authorized personnel
- Use authentication for metrics API endpoints
- Implement role-based access control
- Audit log access

### Data Retention

- Follow data retention policies
- Securely delete old logs
- Encrypt logs at rest
- Secure log transmission

## Maintenance

### Daily Tasks

- Review error logs
- Check daily counters
- Monitor success rate

### Weekly Tasks

- Analyze payment trends
- Review API error patterns
- Check verification time trends
- Clean old logs

### Monthly Tasks

- Generate monthly reports
- Archive old logs
- Review and update alerting thresholds
- Analyze long-term trends

## Future Enhancements

1. **Real-time Dashboards**: Web-based dashboard for live metrics
2. **Email Alerts**: Automated alerts for critical issues
3. **Log Aggregation**: Integration with ELK stack or similar
4. **Advanced Analytics**: Machine learning for anomaly detection
5. **Custom Reports**: Scheduled report generation
6. **Webhook Integration**: Real-time notifications to external systems

## Support

For issues or questions about logging and monitoring:
1. Check error logs for details
2. Review metrics for patterns
3. Consult this guide
4. Contact development team

---

**Last Updated**: January 2025
**Version**: 1.0
