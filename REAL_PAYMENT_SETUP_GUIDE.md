# Real Payment Setup Guide - Kotak UPI Integration

## 🎯 Goal
Set up real UPI payments so when doctors pay, money actually comes to your UPI account.

## 📋 Prerequisites

### What You Need:
1. **Business/Company Registration** - GST certificate or business registration
2. **Bank Account** - Business bank account (preferably Kotak Mahindra Bank)
3. **KYC Documents** - PAN, Aadhaar, business proof
4. **Website/App** - Your healthcare platform (this project)

## 🏦 Step 1: Apply for Kotak UPI Payment Gateway

### Option A: Direct with Kotak Mahindra Bank

1. **Visit Kotak Branch or Website**
   - Go to: https://www.kotak.com/en/business-banking/payments.html
   - Or visit nearest Kotak branch

2. **Request UPI Payment Gateway**
   - Ask for "UPI Payment Gateway for Merchants"
   - Mention you need API integration (not just QR code)

3. **Submit Documents**
   - Business registration certificate
   - GST certificate
   - PAN card (business/individual)
   - Bank account details
   - Website/app details
   - Expected transaction volume

4. **Wait for Approval** (7-15 days)
   - Kotak will verify your documents
   - They'll conduct due diligence
   - You'll receive approval notification

5. **Receive Credentials**
   You'll get:
   - Client ID
   - Client Secret
   - Merchant VPA (your UPI ID like: yourname@kotak)
   - Merchant Mobile Number
   - Aggregator ID
   - Merchant ID
   - API Documentation
   - Test environment credentials

### Option B: Through Payment Aggregator (Easier & Faster)

If Kotak direct is difficult, use aggregators that support Kotak:

1. **Razorpay** - https://razorpay.com
   - Easier onboarding
   - Supports UPI via Kotak
   - 2% transaction fee
   - Setup in 2-3 days

2. **Paytm Payment Gateway** - https://business.paytm.com
   - Quick approval
   - UPI support
   - 2% transaction fee

3. **Cashfree** - https://www.cashfree.com
   - Developer-friendly
   - Good documentation
   - 2% transaction fee

**Note:** With aggregators, you'll need to modify the code slightly to use their APIs instead of direct Kotak APIs.

## 🔧 Step 2: Configure Your Application

### 2.1 Create `.env` File

Create `backend/.env` file with your real credentials:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/healthcare-platform

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Kotak UPI Payment Gateway - PRODUCTION
KOTAK_API_BASE_URL=https://api.kotak.com/upi
KOTAK_CLIENT_ID=your_actual_client_id_from_kotak
KOTAK_CLIENT_SECRET=your_actual_client_secret_from_kotak
KOTAK_MERCHANT_VPA=yourname@kotak
KOTAK_MERCHANT_MOBILE=919876543210
KOTAK_AGGREGATOR_ID=your_aggregator_id_from_kotak
KOTAK_MERCHANT_ID=your_merchant_id_from_kotak
KOTAK_SECRET_KEY=your_32_character_secret_key_from_kotak

# Payment Configuration
PAYMENT_TIMEOUT_MINUTES=10
PAYMENT_POLL_INTERVAL_SECONDS=5
PAYMENT_MAX_RETRIES=3

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Server
PORT=3000
NODE_ENV=production
```

### 2.2 Verify Configuration

Run this command to check if config is valid:

```bash
cd backend
node -e "const config = require('./config/kotakConfig'); try { config.validate(); console.log('✅ Config valid!'); } catch(e) { console.error('❌ Config error:', e.message); }"
```

## 🧪 Step 3: Test with Real Money (Small Amount)

### 3.1 Start the Server

```bash
cd backend
npm start
```

You should see:
```
✓ Kotak API configuration validated successfully
Server is running on port 3000
MongoDB Connected
```

### 3.2 Register a Test Doctor

```bash
curl -X POST http://localhost:3000/api/auth/signup/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test Real",
    "email": "testreal@doctor.com",
    "password": "Test123!",
    "confirmPassword": "Test123!",
    "dateOfBirth": "1980-01-01",
    "degree": "MBBS",
    "specializations": ["General Medicine"],
    "experienceYears": 5
  }'
```

Save the token from response.

### 3.3 Initiate Real Payment

```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "planId": "test",
    "planName": "Test Payment",
    "duration": 1
  }'
```

**Start with ₹10 for testing!**

Response will include:
```json
{
  "success": true,
  "payment": {
    "paymentId": "...",
    "txnId": "KMB...",
    "merchantVPA": "yourname@kotak",
    "amount": 10,
    "qrCodeData": "upi://pay?pa=yourname@kotak&am=10&tn=KMB...",
    "expiresAt": "...",
    "status": "pending"
  }
}
```

### 3.4 Make Real Payment

1. **Open any UPI app** (Google Pay, PhonePe, Paytm, etc.)
2. **Scan QR code** or use the UPI string
3. **Pay ₹10** to the merchant VPA
4. **Confirm payment**

### 3.5 Watch the Logs

In another terminal:
```bash
cd backend
tail -f logs/payment-verification.log
```

You should see:
```
[2024-...] Polling payment status (attempt 1/120): KMB...
[2024-...] Polling payment status (attempt 2/120): KMB...
[2024-...] Payment KMB... completed successfully
[2024-...] Subscription activated for doctor ...
```

### 3.6 Verify Subscription Activated

```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Should show:
```json
{
  "valid": true,
  "user": {
    "subscriptionStatus": "active",
    "subscriptionExpiryDate": "..."
  }
}
```

### 3.7 Check Your Bank Account

- Log into your bank account
- Check transactions
- You should see ₹10 credited from the test payment

## 🚀 Step 4: Go Live with Real Amounts

Once ₹10 test works:

### 4.1 Update Payment Amount

Edit `backend/controllers/kotakPaymentController.js` or configure in frontend:

```javascript
// Set your actual subscription price
const MONTHLY_SUBSCRIPTION_PRICE = 999; // ₹999
const YEARLY_SUBSCRIPTION_PRICE = 9999; // ₹9,999
```

### 4.2 Update Frontend

In `frontend/src/app/components/subscription/subscription.component.ts`:

```typescript
plans = [
  {
    name: 'Monthly',
    price: 999,
    duration: 30,
    features: ['Access to dashboard', '30 days validity', 'Unlimited consultations']
  },
  {
    name: 'Yearly',
    price: 9999,
    duration: 365,
    features: ['Access to dashboard', '365 days validity', 'Unlimited consultations', '2 months free']
  }
];
```

### 4.3 Test with Real Doctors

1. Share your app URL with test doctors
2. Ask them to register and pay
3. Monitor the payment flow
4. Verify money reaches your account
5. Confirm they can access dashboard

## 📊 Step 5: Monitor Production

### 5.1 Check Payment Logs

```bash
# Payment initiations
tail -f backend/logs/payment-initiation.log

# Verification attempts
tail -f backend/logs/payment-verification.log

# Status changes
tail -f backend/logs/payment-status-changes.log

# Subscription activations
tail -f backend/logs/subscription-activation.log

# Errors
tail -f backend/logs/payment-errors.log
```

### 5.2 Check Database

```bash
# Connect to MongoDB
mongosh healthcare-platform

# Check payments
db.payments.find().sort({createdAt: -1}).limit(10)

# Check subscriptions
db.subscriptions.find().sort({createdAt: -1}).limit(10)

# Check doctors with active subscriptions
db.doctors.find({subscriptionStatus: 'active'}).count()
```

### 5.3 View Metrics Dashboard

Access: `http://localhost:3000/api/payment-metrics/comprehensive`

(Add authentication token)

## ⚠️ Important Security Notes

### 1. Never Commit `.env` File
```bash
# Add to .gitignore
echo "backend/.env" >> .gitignore
```

### 2. Use HTTPS in Production
```bash
# Install SSL certificate
# Use nginx or similar reverse proxy
# Force HTTPS redirect
```

### 3. Secure API Keys
- Store in environment variables
- Use secrets manager (AWS Secrets Manager, Azure Key Vault)
- Rotate keys periodically

### 4. Rate Limiting
Already implemented:
- 3 payment initiations per hour per doctor
- Prevents abuse

### 5. Monitor for Fraud
- Check for unusual payment patterns
- Monitor failed payment attempts
- Set up alerts for suspicious activity

## 🐛 Troubleshooting Real Payments

### Issue: Payment initiated but not verified

**Check:**
1. Kotak API credentials are correct
2. Merchant VPA matches exactly
3. Network connectivity to Kotak servers
4. Check logs: `backend/logs/payment-errors.log`

**Solution:**
```bash
# Manually verify payment
curl -X POST http://localhost:3000/api/payments/PAYMENT_ID/verify \
  -H "Authorization: Bearer TOKEN"
```

### Issue: Money received but subscription not activated

**Check:**
1. Background verification service is running
2. Check `backend/logs/subscription-activation.log`
3. Check database for payment status

**Solution:**
```bash
# Check payment in database
mongosh healthcare-platform
db.payments.findOne({txnId: "KMB..."})

# If status is 'completed' but subscription not active, manually activate:
# (Create a script or use Node.js REPL)
```

### Issue: QR code not working

**Check:**
1. Merchant VPA is correct format
2. Amount is valid (not 0 or negative)
3. Transaction ID is unique

**Solution:**
- Regenerate payment
- Try different UPI app
- Check if merchant VPA is active

## 💰 Pricing Recommendations

### For Indian Market:

**Monthly Plan:**
- ₹999 - ₹1,499 (Good starting point)
- ₹1,999 - ₹2,999 (Premium)

**Yearly Plan:**
- ₹9,999 - ₹14,999 (10-12 months price)
- ₹19,999 - ₹29,999 (Premium)

**Consider:**
- Competitor pricing
- Features offered
- Target doctor segment
- Market conditions

## 📞 Support Contacts

### Kotak Support:
- Phone: 1860 266 2666
- Email: service.helpdesk@kotak.com
- Website: https://www.kotak.com/en/contact-us.html

### Technical Issues:
- Check documentation: `KOTAK_UPI_SETUP_GUIDE.md`
- Review logs in `backend/logs/`
- Test with small amounts first

## ✅ Final Checklist

Before going live:

- [ ] Kotak merchant account approved
- [ ] API credentials received and configured
- [ ] Test payment of ₹10 successful
- [ ] Money received in bank account
- [ ] Subscription activated automatically
- [ ] Doctor can access dashboard
- [ ] Logs are working
- [ ] Error handling tested
- [ ] HTTPS enabled
- [ ] `.env` file secured
- [ ] Backup system in place
- [ ] Monitoring set up
- [ ] Support process defined

## 🎉 You're Ready!

Once all checks pass, your real payment system is live. Doctors can:
1. Register on your platform
2. Pay subscription via UPI
3. Money comes to your account
4. Subscription activates automatically
5. Access dashboard immediately

**The system is production-ready!**
