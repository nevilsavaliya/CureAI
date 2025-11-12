# Quick Test Guide - Healthcare Platform MVP

## Quick Start

### 1. Setup (One-time)

```bash
# Navigate to backend
cd backend

# Install dependencies (if not already done)
npm install

# Ensure MongoDB is running
sudo systemctl start mongod
sudo systemctl status mongod
```

### 2. Run All Tests

```bash
npm test
```

### 3. Run Individual Test Suites

```bash
# Patient flow (signup, login, symptoms, doctors, messaging)
npm run test:patient

# Doctor flow (signup, subscription, dashboard, consultations)
npm run test:doctor

# Admin flow (login, metrics, user management)
npm run test:admin

# Email & Video (OTP, consultation emails, video links)
npm run test:email
```

## Expected Output

### Successful Test Run

```
PASS tests/integration/patient-flow.test.js
  Patient Flow Integration Tests
    ✓ should register a new patient (229 ms)
    ✓ should login patient (63 ms)
    ✓ should submit symptoms (10 ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

### Failed Test

```
FAIL tests/integration/patient-flow.test.js
  Patient Flow Integration Tests
    ✕ should register a new patient (229 ms)
    
  ● Patient Flow Integration Tests › should register a new patient
    expected 201 "Created", got 400 "Bad Request"
```

## Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
sudo systemctl start mongod
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Authentication Failures

```
Error: Invalid or expired token
```

**Solution:**
- Check JWT_SECRET in .env file
- Verify token generation in auth service
- Clear test database and retry

### Test Timeout

```
Error: Timeout - Async callback was not invoked within the 30000 ms timeout
```

**Solution:**
- Check MongoDB connection
- Verify API endpoints are responding
- Increase timeout in jest.config.js

## Test Data Cleanup

If tests leave orphaned data:

```bash
# Connect to MongoDB
mongo healthcare-test

# Remove test data
db.patients.deleteMany({ email: /test.*@patient\.com/ })
db.doctors.deleteMany({ email: /test.*@doctor\.com/ })
db.messages.deleteMany({})
db.consultations.deleteMany({})
db.otps.deleteMany({})
```

## Environment Variables

Create `.env` file in backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/healthcare-test

# Authentication
JWT_SECRET=your_test_jwt_secret_here

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret

# Email Service
EMAIL_USER=your_test_email@gmail.com
EMAIL_PASS=your_test_email_password

# Frontend URL
FRONTEND_URL=http://localhost:4200
```

## Test Coverage

To generate coverage report:

```bash
npm test -- --coverage
```

Output:
```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.23 |    78.45 |   82.67 |   85.89 |
 controllers/       |   88.12 |    81.23 |   85.45 |   88.67 |
 services/          |   82.34 |    75.67 |   79.89 |   83.12 |
--------------------|---------|----------|---------|---------|
```

## Manual Testing Checklist

After automated tests pass:

### Patient Flow
- [ ] Sign up as new patient
- [ ] Login with credentials
- [ ] Submit symptoms
- [ ] View disease prediction
- [ ] See registered doctors
- [ ] Send message to doctor
- [ ] Receive consultation email

### Doctor Flow
- [ ] Sign up as new doctor
- [ ] Complete subscription payment
- [ ] Access doctor dashboard
- [ ] View patient messages
- [ ] Book consultation
- [ ] Verify email sent

### Admin Flow
- [ ] Login as admin
- [ ] View platform metrics
- [ ] Browse all users
- [ ] Filter by collection
- [ ] Search for users

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run tests
        run: |
          cd backend
          npm test
        env:
          MONGODB_URI: mongodb://localhost:27017/healthcare-test
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## Performance Benchmarks

Expected test execution times:

- Patient Flow: ~5-10 seconds
- Doctor Flow: ~5-10 seconds
- Admin Flow: ~3-5 seconds
- Email & Video: ~5-10 seconds
- **Total**: ~20-35 seconds

## Support

For issues:
1. Check test output for error messages
2. Review INTEGRATION_TESTING_GUIDE.md
3. Verify environment configuration
4. Check database connection
5. Review API endpoint responses

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suite
npm run test:patient
npm run test:doctor
npm run test:admin
npm run test:email

# Generate coverage
npm test -- --coverage

# Run tests in watch mode (for development)
npm test -- --watch

# Run tests with verbose output
npm test -- --verbose

# Run single test file
npm test -- patient-flow.test.js
```

## Success Criteria

All tests should pass with:
- ✅ 0 failed tests
- ✅ All assertions passing
- ✅ No timeout errors
- ✅ Clean database state after tests
- ✅ Proper error handling verified

## Next Steps After Tests Pass

1. Review test coverage report
2. Run manual testing checklist
3. Deploy to staging environment
4. Run tests against staging
5. Perform user acceptance testing
6. Deploy to production
