# Bypass Subscription Payment (Test Mode)

## Quick Fix for Testing

Since Razorpay credentials are not configured, you can activate doctor subscriptions without payment in development mode.

## Method 1: Use API Endpoint (Recommended)

After signing up as a doctor, use this API call to activate subscription:

```bash
# Replace YOUR_TOKEN with the JWT token you got after signup
curl -X POST http://localhost:3000/api/payment/subscription/activate-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Method 2: Use MongoDB Directly

```bash
# Connect to MongoDB
mongo healthcare-platform

# Activate subscription for your doctor account
db.doctors.updateOne(
  { email: "savaliyanevil9@gmail.com" },
  {
    $set: {
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentInfo: {
        transactionId: "TEST_" + Date.now(),
        amount: 30,
        paymentDate: new Date(),
        upiId: "test@upi"
      }
    }
  }
)
```

## Method 3: Use Browser Console

1. After doctor signup, open browser console (F12)
2. Get your token from localStorage:
   ```javascript
   const token = localStorage.getItem('token');
   console.log(token);
   ```
3. Make the API call:
   ```javascript
   fetch('http://localhost:3000/api/payment/subscription/activate-test', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     }
   })
   .then(r => r.json())
   .then(data => console.log(data));
   ```

## After Activation

1. Logout and login again
2. You should now be able to access the doctor dashboard
3. No subscription page will block you

## To Setup Real Razorpay (Optional)

1. Go to https://razorpay.com/
2. Sign up for a test account
3. Get your test API keys
4. Update `.env` file:
   ```
   RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY
   RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET
   ```
5. Restart backend server

## Current Seeded Doctors (Already Active)

These doctors already have active subscriptions:
- `michael@doctor.com` / `doctor123`
- `sarah@doctor.com` / `doctor123`
- `emily@doctor.com` / `doctor123`
- `robert@doctor.com` / `doctor123`
- `lisa@doctor.com` / `doctor123`

You can use any of these to test the doctor dashboard immediately!
