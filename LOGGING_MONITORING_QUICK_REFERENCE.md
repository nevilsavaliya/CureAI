# Logging and Monitoring Quick Reference

## Quick Start

### View Today's Metrics
```bash
curl http://localhost:3000/api/payment-metrics/daily-counters \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Recent Errors
```bash
curl http://localhost:3000/api/payment-metrics/logs/error?lines=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Comprehensive Metrics
```bash
curl http://localhost:3000/api/payment-metrics/comprehensive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Log Files Location

```
backend/logs/
├── payment-activity.log  # Payment activities and status changes
├── kotak-api.log        # Kotak API requests and responses
└── payment-errors.log   # Error tracking with full context
```

## Key Metrics

### Daily Counters (Real-time)
- `initiated` - Payments initiated today
- `completed` - Payments completed today
- `failed` - Payments failed today
- `timeout` - Payments timed out today
- `apiErrors` - API errors today
- `totalAmount` - Total amount initiated
- `completedAmount` - Total amount completed

### Historical Metrics
- Success Rate (%)
- Average Verification Time (seconds)
- API Error Rate (%)
- Revenue by Status

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/payment-metrics/comprehensive` | All metrics |
| `GET /api/payment-metrics/success-rate` | Success rate |
| `GET /api/payment-metrics/verification-time` | Verification time |
| `GET /api/payment-metrics/api-errors` | API errors |
| `GET /api/payment-metrics/revenue` | Revenue metrics |
| `GET /api/payment-metrics/trends?days=7` | Payment trends |
| `GET /api/payment-metrics/daily-counters` | Today's counters |
| `GET /api/payment-metrics/logs/:type?lines=100` | Recent logs |
| `POST /api/payment-metrics/clear-cache` | Clear cache |

## Log Types

- `payment` - Payment activity logs
- `api` - Kotak API logs
- `error` - Error logs

## Code Usage

### Log Payment Initiation
```javascript
const paymentLogger = require('./services/paymentLogger');

paymentLogger.logPaymentInitiation({
  paymentId: payment._id.toString(),
  txnId: payment.txnId,
  doctorId: doctor._id,
  amount: 999,
  planName: 'Monthly Plan',
  duration: 30
});
```

### Increment Metrics
```javascript
const paymentMetrics = require('./services/paymentMetrics');

paymentMetrics.incrementCounter('initiated');
paymentMetrics.incrementCounter('totalAmount', 999);
```

### Get Metrics
```javascript
// Get today's counters
const counters = paymentMetrics.getDailyCounters();

// Get success rate
const successRate = await paymentMetrics.calculateSuccessRate();

// Get comprehensive metrics
const metrics = await paymentMetrics.getComprehensiveMetrics();
```

## Monitoring Alerts

Set up alerts for:
- ✅ Success rate < 85%
- ✅ API error rate > 10%
- ✅ Avg verification time > 120s
- ✅ Multiple consecutive API failures

## Troubleshooting

### High API Error Rate
1. Check `backend/logs/kotak-api.log`
2. Review error codes in metrics
3. Verify API credentials
4. Check network connectivity

### Low Success Rate
1. Check `backend/logs/payment-errors.log`
2. Review timeout rate
3. Analyze verification time
4. Check Kotak API status

### Slow Verification
1. Check average verification time
2. Review API response times
3. Check network latency
4. Analyze polling logs

## Maintenance

### Daily
- Review error logs
- Check daily counters
- Monitor success rate

### Weekly
- Analyze payment trends
- Review API error patterns
- Check verification times

### Monthly
- Generate reports
- Archive old logs
- Review thresholds

## Log Cleanup

```javascript
const paymentLogger = require('./services/paymentLogger');

// Clean logs older than 30 days
paymentLogger.cleanOldLogs(30);
```

## Testing

Run test script:
```bash
node backend/test-logging-metrics.js
```

## Documentation

Full documentation: `PAYMENT_LOGGING_MONITORING_GUIDE.md`

---

**Quick Reference v1.0** | Last Updated: November 2025
