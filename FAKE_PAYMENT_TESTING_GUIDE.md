# Fake Payment Testing Guide

## Overview
Your healthcare platform already has a complete fake payment system for testing doctor subscriptions without real money transactions.

## Available Test Endpoints

### 1. Simulate Payment Completion
```bash
POST /api/test-payment/simulate
Authorization: Bearer <doctor_jwt_token>
Content-Type: application/json

{
  "amount": 999,
  "planName": "Monthly Subscription"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment simulation completed successfully! You now have access to the dashboard.",
  "subscription": {
    "id": "subscription_id",
    "planName": "Monthly Subscription",
    "startDate": "2024-01-01T00:00:00.000Z",
    "expiryDate": "2024-01-31T00:00:00.000Z",
    "isActive": true,
    "amount": 999
  }
}
```

### 2. Check Subscription Status
```bash
GET /api/test-payment/status
Authorization: Bearer <doctor_jwt_token>
```

### 3. Reset Subscription (for testing)
```bash
POST /api/test-payment/reset
Authorization: Bearer <doctor_jwt_token>
```

## Frontend Usage

### Method 1: Use the Built-in Test Button
Your subscription component already has a `simulateTestPayment()` method. You can add a test button to your subscription page:

```html
<!-- Add this to subscription.component.html -->
<div class="test-payment-section" *ngIf="environment.production === false">
  <h3>🧪 Test Mode</h3>
  <p>For development/testing purposes only</p>
  <button 
    class="btn btn-warning" 
    (click)="simulateTestPayment()" 
    [disabled]="loading">
    Simulate Payment (Test Mode)
  </button>
</div>
```

### Method 2: Use Subscription Service Directly
```typescript
// In any component
constructor(private subscriptionService: SubscriptionService) {}

testPayment() {
  this.subscriptionService.simulateTestPayment().subscribe({
    next: (response) => {
      console.log('Test payment completed:', response);
      // Handle success
    },
    error: (error) => {
      console.error('Test payment failed:', error);
      // Handle error
    }
  });
}
```

## Testing Workflow

### 1. Doctor Registration & Test Payment
```bash
# 1. Register a new doctor
POST /api/auth/signup/doctor
{
  "name": "Dr. Test",
  "email": "test.doctor@example.com",
  "password": "password123",
  "dateOfBirth": "1985-01-01",
  "degree": "MBBS",
  "speciality": "General Medicine",
  "experienceYears": 5
}

# 2. Login to get JWT token
POST /api/auth/login
{
  "email": "test.doctor@example.com",
  "password": "password123"
}

# 3. Simulate payment (use JWT token from login)
POST /api/test-payment/simulate
Authorization: Bearer <jwt_token>
{
  "amount": 999,
  "planName": "Monthly Subscription"
}

# 4. Verify subscription status
GET /api/test-payment/status
Authorization: Bearer <jwt_token>
```

### 2. Reset for Re-testing
```bash
# Reset subscription to test again
POST /api/test-payment/reset
Authorization: Bearer <jwt_token>
```

## What Happens During Fake Payment

1. **Doctor Status Update**: `subscriptionStatus` changes from 'pending' to 'active'
2. **Subscription Dates**: Sets 30-day subscription period
3. **Transaction Record**: Creates fake transaction with `TEST_` prefix
4. **Database Records**: Updates both Doctor and Subscription collections
5. **Access Granted**: Doctor can now access dashboard and features

## Integration with Real Razorpay

Your system supports both:
- **Real Razorpay**: When `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
- **Fake Payment**: Always available for testing via `/api/test-payment/*` endpoints

## Environment Configuration

```bash
# .env file
NODE_ENV=development  # Enables test payment features
RAZORPAY_KEY_ID=      # Leave empty to disable real Razorpay
RAZORPAY_KEY_SECRET=  # Leave empty to disable real Razorpay
```

## Security Notes

- ⚠️ Test payment endpoints are protected by authentication
- ⚠️ Only doctors can use test payment endpoints
- ⚠️ Test transactions are clearly marked with `TEST_` prefix
- ⚠️ Consider disabling test endpoints in production

## Troubleshooting

### Common Issues:

1. **"Doctor not found"**: Ensure you're using a valid doctor JWT token
2. **"Already has active subscription"**: Use reset endpoint first
3. **Authentication errors**: Check JWT token is valid and not expired
4. **Database errors**: Ensure MongoDB connection is working

### Debug Commands:
```bash
# Check doctor subscription status
GET /api/test-payment/status

# Reset if needed
POST /api/test-payment/reset

# Try simulation again
POST /api/test-payment/simulate
```

## Next Steps

Your fake payment system is ready to use! You can:

1. **Test the complete doctor flow** from registration to dashboard access
2. **Integrate with your frontend** using the existing methods
3. **Add test buttons** to your subscription component for easy testing
4. **Deploy with confidence** knowing payments work in test mode

The system automatically falls back to test mode when Razorpay credentials are not configured, making it perfect for development and testing.