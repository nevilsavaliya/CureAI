# Hospital Controller Tests - Quick Guide

## Running the Tests

### Run Hospital Controller Tests Only
```bash
cd backend
npm test -- hospitalController.test.js
```

### Run All Tests
```bash
cd backend
npm test
```

### Run Tests in Watch Mode
```bash
cd backend
npm test -- --watch hospitalController.test.js
```

### Run Tests with Coverage
```bash
cd backend
npm test -- --coverage hospitalController.test.js
```

## Test Structure

### Test File Location
```
backend/tests/hospitalController.test.js
```

### Test Organization
```
Hospital Controller
├── registerHospital (6 tests)
│   ├── Valid registration
│   ├── Duplicate email rejection
│   ├── Duplicate registration number rejection
│   ├── File upload handling
│   ├── Email notification
│   └── Email failure handling
│
├── loginHospital (5 tests)
│   ├── Successful login
│   ├── Invalid email rejection
│   ├── Invalid password rejection
│   ├── Pending hospital rejection
│   └── JWT token generation
│
├── getPatientData (6 tests)
│   ├── Retrieve by email
│   ├── Retrieve by ID
│   ├── Missing identifier validation
│   ├── Patient not found handling
│   ├── Age calculation
│   └── Recent cases inclusion
│
├── getProfile (4 tests)
│   ├── Profile retrieval
│   ├── Password exclusion
│   ├── API secret exclusion
│   └── Not found handling
│
└── updateProfile (6 tests)
    ├── Profile update
    ├── Address update
    ├── Specializations update
    ├── Not found handling
    ├── Email protection
    └── Registration number protection
```

## Test Results

```
✓ 27 tests passing
✓ 0 tests failing
✓ ~6.5s execution time
```

## What's Tested

### ✅ Registration
- Hospital registration with valid data
- Duplicate prevention
- File upload processing
- Email notifications
- Error handling

### ✅ Authentication
- Login with valid credentials
- Invalid credential rejection
- Verification status checking
- JWT token generation

### ✅ API Access
- Patient data retrieval
- Input validation
- Error handling
- Data transformation

### ✅ Profile Management
- Profile retrieval
- Profile updates
- Sensitive data protection
- Field protection

## Dependencies

The tests use:
- **Jest** - Testing framework
- **MongoDB Memory Server** - In-memory database
- **Mongoose** - MongoDB ODM
- **Mocked Email Service** - No real emails sent

## Troubleshooting

### Tests Failing?

1. **Check MongoDB Memory Server**
   ```bash
   npm install --save-dev mongodb-memory-server
   ```

2. **Clear Jest Cache**
   ```bash
   npm test -- --clearCache
   ```

3. **Check Node Version**
   - Requires Node.js 14+ 

4. **Database Connection Issues**
   - Tests use in-memory database
   - No external MongoDB required

### Common Issues

**Issue**: Tests timeout
**Solution**: Increase Jest timeout in jest.config.js

**Issue**: Email service errors
**Solution**: Email service is mocked, check mock setup

**Issue**: Validation errors
**Solution**: Check test data matches model requirements

## Adding New Tests

### Template for New Test
```javascript
test('should do something', async () => {
  // Arrange
  const req = mockRequest({ /* data */ });
  const res = mockResponse();

  // Act
  await hospitalController.someMethod(req, res);

  // Assert
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true
    })
  );
});
```

### Best Practices
1. Use descriptive test names
2. Follow Arrange-Act-Assert pattern
3. Clean up test data in afterEach
4. Mock external dependencies
5. Test both success and failure cases

## Related Files

- Controller: `backend/controllers/hospitalController.js`
- Model: `backend/models/Hospital.js`
- Routes: `backend/routes/hospitalRoutes.js`
- Middleware: `backend/middleware/hospitalApiAuth.js`

## Next Steps

After hospital controller tests, consider testing:
1. Hospital Admin Controller
2. API Authentication Middleware
3. Rate Limiting Middleware
4. Symptom Extraction Service
5. Integration Tests
