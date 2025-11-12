# Quick Start - Real Payments (5 Steps)

## 🚀 Get Real Payments Working in 5 Steps

### Step 1: Get Kotak Credentials (1-2 weeks)

**Option A - Direct Kotak (Recommended if you have business):**
1. Visit: https://www.kotak.com/en/business-banking/payments.html
2. Apply for "UPI Payment Gateway"
3. Submit: Business docs, PAN, bank details
4. Wait for approval (7-15 days)
5. Receive: Client ID, Secret, Merchant VPA, etc.

**Option B - Payment Aggregator (Faster, easier):**
1. Sign up: https://razorpay.com or https://cashfree.com
2. Complete KYC (2-3 days)
3. Get API keys
4. 2% transaction fee applies

### Step 2: Configure `.env` File (5 minutes)

Create `backend/.env`:
```env
KOTAK_API_BASE_URL=https://api.kotak.com/upi
KOTAK_CLIENT_ID=your_client_id_here
KOTAK_CLIENT_SECRET=your_client_secret_here
KOTAK_MERCHANT_VPA=yourname@kotak
KOTAK_MERCHANT_MOBILE=919876543210
KOTAK_AGGREGATOR_ID=your_aggregator_id
KOTAK_MERCHANT_ID=your_merchant_id
KOTAK_SECRET_KEY=your_32_char_secret_key
```

### Step 3: Start Server & Test (10 minutes)

```bash
# Start server
cd backend
npm start

# Should see: ✓ Kotak API configuration validated successfully

# Register test doctor
curl -X POST http://localhost:3000/api/auth/signup/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test",
    "email": "test@doctor.com",
    "password": "Test123!",
    "confirmPassword": "Test123!",
    "dateOfBirth": "1980-01-01",
    "degree": "MBBS",
    "specializations": ["General Medicine"],
    "experienceYears": 5
  }'

# Save the token from response
```

### Step 4: Make Test Payment (5 minutes)

```bash
# Initiate ₹10 test payment
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "planId": "test", "planName": "Test", "duration": 1}'

# You'll get QR code in response
# Scan with Google Pay/PhonePe and pay ₹10
```

### Step 5: Verify It Works (2 minutes)

```bash
# Wait 10-30 seconds for verification

# Check subscription status
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should show: "subscriptionStatus": "active"

# Check your bank account - ₹10 should be credited
```

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Server starts without config errors
2. ✅ Payment QR code is generated
3. ✅ You can scan and pay via UPI app
4. ✅ Money appears in your bank account
5. ✅ Subscription status becomes "active"
6. ✅ Doctor can access dashboard

## 🎯 What Happens in Real Flow

```
Doctor Registers
    ↓
Tries to access dashboard → BLOCKED (no subscription)
    ↓
Goes to subscription page
    ↓
Clicks "Pay ₹999"
    ↓
QR code appears
    ↓
Scans with UPI app (Google Pay/PhonePe)
    ↓
Pays ₹999
    ↓
💰 Money → YOUR BANK ACCOUNT
    ↓
System polls Kotak API (5-30 seconds)
    ↓
Payment confirmed
    ↓
Subscription activated
    ↓
Doctor can NOW access dashboard ✅
```

## 🔥 Common Issues & Fixes

### "UPI payment service is not configured"
**Fix:** Check `.env` file has all Kotak credentials

### "Payment initiated but not verified"
**Fix:** 
1. Check Kotak API credentials are correct
2. Verify merchant VPA matches
3. Check logs: `backend/logs/payment-errors.log`

### "Money received but subscription not active"
**Fix:**
```bash
# Manually verify payment
curl -X POST http://localhost:3000/api/payments/PAYMENT_ID/verify \
  -H "Authorization: Bearer TOKEN"
```

## 📞 Need Help?

1. **Check logs:** `backend/logs/payment-*.log`
2. **Read full guide:** `REAL_PAYMENT_SETUP_GUIDE.md`
3. **Kotak support:** 1860 266 2666
4. **Test with ₹10 first** before going live

## 🎉 Ready to Go Live?

Once ₹10 test works:
1. Update subscription price to ₹999 (or your price)
2. Share app with real doctors
3. Monitor payments in logs
4. Check bank account for credits
5. Celebrate! 🎊

**Your payment system is production-ready!**
