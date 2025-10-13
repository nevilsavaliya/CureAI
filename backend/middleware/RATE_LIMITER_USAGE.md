# Rate Limiter Middleware - Usage Guide

## Overview

The rate limiter middleware protects the Hospital API from abuse by limiting the number of requests each hospital can make within a time window.

## Configuration

- **Rate Limit:** 100 requests per hour per hospital
- **Window:** 1 hour (3600 seconds)
- **Storage:** In-memory (can be upgraded to Redis for production)

## Usage

### Basic Usage

The rate limiter must be used **after** the `hospitalApiAuth` middleware, as it depends on `req.hospital` being set.

```javascript
const { authenticateHospitalApi } = require('../middleware/hospitalApiAuth');
const { rateLimitHospitalApi } = require('../middleware/rateLimiter');

router.post('/api/patient-data', 
  authenticateHospitalApi,    // First: Authenticate
  rateLimitHospitalApi,        // Second: Check rate limit
  validatePatientDataRequest,  // Third: Validate request
  hospitalController.getPatientData  // Finally: Handle request
);
```

## Response Headers

The middleware sets the following headers on every request:

- `X-RateLimit-Limit`: Maximum number of requests allowed (100)
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

### Example Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637251200
```

## Rate Limit Exceeded Response

When a hospital exceeds the rate limit, the API returns:

**Status Code:** `429 Too Many Requests`

**Headers:**
- `Retry-After`: Seconds until the rate limit resets

**Response Body:**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Too many API requests.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "limit": 100,
    "windowMs": 3600000,
    "retryAfter": 2847,
    "resetTime": "2024-11-18T11:30:00.000Z"
  }
}
```

## Utility Functions

### Get Rate Limit Status

Check the current rate limit status for a hospital:

```javascript
const { getRateLimitStatus } = require('../middleware/rateLimiter');

const status = getRateLimitStatus(hospitalId);
console.log(status);
// {
//   count: 45,
//   remaining: 55,
//   resetTime: "2024-11-18T11:30:00.000Z"
// }
```

### Reset Rate Limit

Reset the rate limit for a specific hospital (useful for testing or admin actions):

```javascript
const { resetRateLimit } = require('../middleware/rateLimiter');

resetRateLimit(hospitalId);
```

### Clear All Rate Limits

Clear all rate limit data (useful for testing):

```javascript
const { clearAllRateLimits } = require('../middleware/rateLimiter');

clearAllRateLimits();
```

## Error Handling

The middleware is designed to "fail open" - if an error occurs during rate limiting, the request is allowed to proceed. This prevents rate limiting issues from blocking legitimate requests.

## Testing

The rate limiter includes comprehensive tests in `backend/tests/rateLimiter.test.js`:

```bash
npm test -- rateLimiter.test.js
```

## Production Considerations

### Upgrading to Redis

For production environments with multiple server instances, consider upgrading to Redis:

```javascript
const redis = require('redis');
const client = redis.createClient();

// Use Redis instead of in-memory Map
const rateLimitStore = {
  async get(key) {
    const data = await client.get(`ratelimit:${key}`);
    return data ? JSON.parse(data) : null;
  },
  async set(key, value) {
    await client.set(`ratelimit:${key}`, JSON.stringify(value), 'EX', 3600);
  },
  async delete(key) {
    await client.del(`ratelimit:${key}`);
  }
};
```

### Monitoring

Monitor rate limit violations to detect:
- Potential abuse
- Legitimate hospitals hitting limits
- Need to adjust rate limits

### Adjusting Limits

To change the rate limit, modify the constants in `rateLimiter.js`:

```javascript
const RATE_LIMIT = 200; // Increase to 200 requests per hour
const WINDOW_MS = 30 * 60 * 1000; // Change to 30 minutes
```

## Security Notes

1. Rate limits are tracked per hospital ID (from authenticated session)
2. Unauthenticated requests are rejected before rate limiting
3. Rate limit data is automatically cleaned up to prevent memory leaks
4. The middleware logs rate limit violations for security monitoring

## Example Client Implementation

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function getPatientData(apiKey, apiSecret, patientEmail) {
  try {
    const response = await axios.post('https://api.example.com/api/hospitals/api/patient-data', {
      apiKey,
      apiSecret,
      patientEmail
    });

    // Check rate limit headers
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    
    console.log(`Requests remaining: ${remaining}`);
    console.log(`Rate limit resets at: ${new Date(reset * 1000)}`);

    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return getPatientData(apiKey, apiSecret, patientEmail);
    }
    throw error;
  }
}
```

### Python

```python
import requests
import time

def get_patient_data(api_key, api_secret, patient_email):
    url = 'https://api.example.com/api/hospitals/api/patient-data'
    data = {
        'apiKey': api_key,
        'apiSecret': api_secret,
        'patientEmail': patient_email
    }
    
    response = requests.post(url, json=data)
    
    # Check rate limit headers
    remaining = response.headers.get('X-RateLimit-Remaining')
    reset = response.headers.get('X-RateLimit-Reset')
    
    print(f"Requests remaining: {remaining}")
    print(f"Rate limit resets at: {reset}")
    
    if response.status_code == 429:
        retry_after = int(response.headers.get('Retry-After', 60))
        print(f"Rate limit exceeded. Retrying after {retry_after} seconds")
        time.sleep(retry_after)
        return get_patient_data(api_key, api_secret, patient_email)
    
    response.raise_for_status()
    return response.json()
```

## Troubleshooting

### Hospital hitting rate limit frequently

1. Check if the hospital is making unnecessary duplicate requests
2. Consider implementing client-side caching
3. Review if the rate limit needs to be increased for this hospital
4. Check for potential bugs in the hospital's integration

### Rate limit not working

1. Ensure `hospitalApiAuth` middleware is applied before `rateLimitHospitalApi`
2. Check that `req.hospital.id` is being set correctly
3. Verify the middleware is imported and used in routes
4. Check server logs for rate limiting errors

### Memory concerns

1. The in-memory store automatically cleans up expired entries every 5 minutes
2. For high-traffic scenarios, consider upgrading to Redis
3. Monitor memory usage in production

## Support

For issues or questions about rate limiting:
1. Check the test file for examples: `backend/tests/rateLimiter.test.js`
2. Review the middleware code: `backend/middleware/rateLimiter.js`
3. Contact the development team
