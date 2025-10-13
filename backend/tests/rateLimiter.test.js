const { rateLimitHospitalApi, getRateLimitStatus, resetRateLimit, clearAllRateLimits, RATE_LIMIT } = require('../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();

    // Mock request object
    req = {
      hospital: {
        id: 'test-hospital-123',
        name: 'Test Hospital'
      },
      body: {}
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };

    // Mock next function
    next = jest.fn();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  test('should allow requests within rate limit', () => {
    rateLimitHospitalApi(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', RATE_LIMIT);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', RATE_LIMIT - 1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should block requests when rate limit exceeded', () => {
    // Make RATE_LIMIT + 1 requests
    for (let i = 0; i <= RATE_LIMIT; i++) {
      rateLimitHospitalApi(req, res, next);
    }

    // The last call should be blocked
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Rate limit exceeded. Too many API requests.',
        error: expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED',
          limit: RATE_LIMIT
        })
      })
    );
  });

  test('should set correct rate limit headers', () => {
    rateLimitHospitalApi(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', RATE_LIMIT);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', RATE_LIMIT - 1);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
  });

  test('should set Retry-After header when rate limit exceeded', () => {
    // Exceed rate limit
    for (let i = 0; i <= RATE_LIMIT; i++) {
      rateLimitHospitalApi(req, res, next);
    }

    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
  });

  test('should track rate limits per hospital', () => {
    const hospital1 = { ...req, hospital: { id: 'hospital-1', name: 'Hospital 1' } };
    const hospital2 = { ...req, hospital: { id: 'hospital-2', name: 'Hospital 2' } };

    // Make requests for hospital 1
    rateLimitHospitalApi(hospital1, res, next);
    rateLimitHospitalApi(hospital1, res, next);

    // Make request for hospital 2
    rateLimitHospitalApi(hospital2, res, next);

    // Check status for each hospital
    const status1 = getRateLimitStatus('hospital-1');
    const status2 = getRateLimitStatus('hospital-2');

    expect(status1.count).toBe(2);
    expect(status2.count).toBe(1);
  });

  test('should return 401 if hospital not authenticated', () => {
    req.hospital = null;

    rateLimitHospitalApi(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Authentication required for rate limiting.'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should reset rate limit for specific hospital', () => {
    const hospitalId = 'test-hospital-123';

    // Make some requests
    rateLimitHospitalApi(req, res, next);
    rateLimitHospitalApi(req, res, next);

    let status = getRateLimitStatus(hospitalId);
    expect(status.count).toBe(2);

    // Reset rate limit
    resetRateLimit(hospitalId);

    status = getRateLimitStatus(hospitalId);
    expect(status.count).toBe(0);
    expect(status.remaining).toBe(RATE_LIMIT);
  });

  test('should return 401 when hospital id is missing', () => {
    // Simulate request with null hospital id
    const invalidReq = { hospital: { id: null } };

    rateLimitHospitalApi(invalidReq, res, next);

    // Should return 401 error
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Authentication required for rate limiting.'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should decrement remaining count correctly', () => {
    // Clear previous calls
    res.setHeader.mockClear();
    
    // Make 3 requests
    rateLimitHospitalApi(req, res, next);
    res.setHeader.mockClear();
    
    rateLimitHospitalApi(req, res, next);
    res.setHeader.mockClear();
    
    rateLimitHospitalApi(req, res, next);

    // Check that remaining is decremented on the last call
    const remainingCall = res.setHeader.mock.calls.find(
      call => call[0] === 'X-RateLimit-Remaining'
    );
    expect(remainingCall[1]).toBe(RATE_LIMIT - 3);
  });
});
