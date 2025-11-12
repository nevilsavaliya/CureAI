# Razorpay Payment Integration Guide

## Complete Setup for Real UPI Payments

This guide will help you set up Razorpay to accept real payments to your UPI ID: `9909232769@superyes`

---

## Step 1: Create Razorpay Account

### 1.1 Sign Up
1. Go to https://razorpay.com/
2. Click "Sign Up" (top right)
3. Fill in your details:
   - **Business Name**: Your healthcare platform name
   - **Email**: savaliyanevil9@gmail.com
   - **Mobile**: Your mobile number
   - **Password**: Create a strong password

### 1.2 Verify Your Account
1. Check your email for verification link
2. Click the link to verify your email
3. Verify your mobile number with OTP

### 1.3 Complete KYC (Required for Live Mode)
For test mode, you can skip this initially. For production:
1. Go to Settings → Account & Settings
2. Upload required documents:
   - PAN Card
   - Business Registration (if applicable)
   - Bank Account Details
   - Address Proof

---

## Step 2: Get API Keys

### 2.1 Test Mode Keys (For Development)
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Key**
4. You'll see:
   - **Key ID**: `rzp_test_XXXXXXXXXXXX`
   - **Key Secret**: `YYYYYYYYYYYYYYYY`
5. **IMPORTANT**: Copy both and save them securely

### 2.2 Live Mode Keys (For Production)
1. Complete KYC verification first
2. Go to **Settings** → **API Keys**
3. Toggle to **Live Mode**
4. Click **Generate Live Key**
5. You'll see:
   - **Key ID**: `rzp_live_XXXXXXXXXXXX`
   - **Key Secret**: `YYYYYYYYYYYYYYYY`

---

## Step 3: Configure Your Backend

### 3.1 Update .env File

Open `backend/.env` and update:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
UPI_ID=9909232769@superyes
```

**Example with real keys:**
```env
RAZORPAY_KEY_ID=rzp_test_AbCdEfGhIjKlMn
RAZORPAY_KEY_SECRET=xYz123456789aBcDeF
UPI_ID=9909232769@superyes
```

### 3.2 Restart Backend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd backend
npm start
```

---

## Step 4: Configure Payment Settlement

### 4.1 Add Bank Account
1. Go to Razorpay Dashboard
2. Navigate to **Settings** → **Bank Accounts**
3. Click **Add Bank Account**
4. Enter your bank details:
   - Account Number
   - IFSC Code
   - Account Holder Name
5. Verify with penny drop (Razorpay will deposit ₹1 to verify)

### 4.2 Link UPI ID
1. Go to **Settings** → **Payment Methods**
2. Enable **UPI**
3. Add your UPI ID: `9909232769@superyes`
4. Verify the UPI ID

### 4.3 Configure Settlement
1. Go to **Settings** → **Settlements**
2. Choose settlement schedule:
   - **Instant**: Immediate (charges apply)
   - **Daily**: Once per day
   - **Weekly**: Once per week
3. All payments will be settled to your linked bank account

---

## Step 5: Test the Integration

### 5.1 Test Mode Testing

Razorpay provides test cards and UPI IDs:

**Test UPI IDs:**
- Success: `success@razorpay`
- Failure: `failure@razorpay`

**Test Cards:**
- Success: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

### 5.2 Test the Flow

1. **Sign up as a doctor** on your platform
2. You'll be redirected to subscription page
3. Click "Pay Now"
4. Razorpay checkout will open
5. Select UPI payment method
6. Enter test UPI: `success@razorpay`
7. Payment should succeed
8. You should be redirected to doctor dashboard

### 5.3 Verify in Razorpay Dashboard

1. Go to **Transactions** → **Payments**
2. You should see your test payment
3. Check payment status, amount, and details

---

## Step 6: Enable UPI AutoPay (Optional)

For recurring subscriptions:

1. Go to **Settings** → **Subscriptions**
2. Enable **UPI AutoPay**
3. Configure:
   - Subscription amount: ₹30
   - Frequency: Monthly
   - Max amount: ₹30

---

## Step 7: Webhook Configuration (Important!)

Webhooks notify your backend about payment status changes.

### 7.1 Create Webhook

1. Go to **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Enter webhook URL:
   ```
   https://yourdomain.com/api/webhooks/razorpay
   ```
   (For local testing, use ngrok - see below)
4. Select events:
   - ✅ payment.authorized
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ order.paid
5. Set webhook secret (save this!)
6. Click **Create Webhook**

### 7.2 Local Testing with ngrok

For local development:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this as webhook URL: https://abc123.ngrok.io/api/webhooks/razorpay
```

### 7.3 Implement Webhook Handler (Already done in your code!)

The webhook handler is already implemented in your backend.

---

## Step 8: Go Live Checklist

Before switching to live mode:

### 8.1 Complete Requirements
- ✅ KYC verification completed
- ✅ Bank account added and verified
- ✅ UPI ID linked
- ✅ Test payments working correctly
- ✅ Webhook configured and tested
- ✅ SSL certificate on your domain (HTTPS)

### 8.2 Switch to Live Mode

1. Get Live API keys (Step 2.2)
2. Update `.env` with live keys:
   ```env
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
   RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
   NODE_ENV=production
   ```
3. Update webhook URL to production domain
4. Test with small real payment (₹1)
5. Verify settlement in your bank account

---

## Step 9: Payment Flow Explanation

### How it works:

1. **Doctor signs up** → Subscription status: `pending`
2. **Redirected to subscription page**
3. **Clicks "Pay ₹30"**
4. **Backend creates Razorpay order**:
   ```javascript
   POST /api/payment/subscription/create-order
   Response: { orderId, amount, keyId }
   ```
5. **Frontend opens Razorpay checkout** with order details
6. **Doctor completes payment** via UPI/Card/NetBanking
7. **Razorpay sends payment details** to frontend
8. **Frontend sends to backend for verification**:
   ```javascript
   POST /api/payment/subscription/verify
   Body: { orderId, paymentId, signature }
   ```
9. **Backend verifies signature** (security check)
10. **Updates doctor subscription** to `active`
11. **Doctor can access dashboard**

---

## Step 10: Monitoring & Analytics

### 10.1 Razorpay Dashboard

Monitor your payments:
- **Dashboard** → Overview of all transactions
- **Payments** → Individual payment details
- **Settlements** → Money transferred to your account
- **Analytics** → Payment success rates, trends

### 10.2 Important Metrics

Track these:
- **Success Rate**: Should be > 85%
- **Average Settlement Time**: 1-3 days
- **Failed Payments**: Investigate reasons
- **Refunds**: Handle customer complaints

---

## Step 11: Handle Edge Cases

### 11.1 Payment Failures

Already handled in your code:
- User sees error message
- Can retry payment
- Subscription remains `pending`

### 11.2 Refunds

To issue refund:

```bash
# Via Razorpay Dashboard
1. Go to Payments
2. Find the payment
3. Click "Refund"
4. Enter amount
5. Confirm

# Via API (if needed)
curl -X POST https://api.razorpay.com/v1/payments/{payment_id}/refund \
  -u rzp_test_key:secret \
  -d amount=3000
```

### 11.3 Subscription Expiry

Your code already handles this:
- Subscription expires after 30 days
- Doctor needs to renew
- Automatic check on dashboard access

---

## Step 12: Security Best Practices

### 12.1 Protect API Keys

✅ **DO:**
- Store keys in `.env` file
- Add `.env` to `.gitignore`
- Use environment variables
- Rotate keys periodically

❌ **DON'T:**
- Commit keys to Git
- Share keys publicly
- Use test keys in production
- Hardcode keys in code

### 12.2 Verify Payment Signature

Your code already does this:
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(orderId + '|' + paymentId)
  .digest('hex');

if (signature === razorpay_signature) {
  // Payment is genuine
}
```

---

## Step 13: Testing Checklist

Before going live, test:

- [ ] Doctor signup works
- [ ] Subscription page loads
- [ ] Payment order creation works
- [ ] Razorpay checkout opens
- [ ] Test payment succeeds
- [ ] Payment verification works
- [ ] Subscription activates
- [ ] Doctor can access dashboard
- [ ] Payment failure handling works
- [ ] Webhook receives events
- [ ] Settlement appears in dashboard

---

## Step 14: Common Issues & Solutions

### Issue 1: "Invalid API Key"
**Solution**: Check if keys are correct in `.env`, restart server

### Issue 2: "Payment verification failed"
**Solution**: Check if signature verification logic is correct

### Issue 3: "Webhook not receiving events"
**Solution**: 
- Check webhook URL is accessible
- Use ngrok for local testing
- Verify webhook secret

### Issue 4: "Payment succeeded but subscription not activated"
**Solution**: Check backend logs, verify database update logic

### Issue 5: "UPI payment not working"
**Solution**: 
- Verify UPI ID is linked in Razorpay
- Check if UPI is enabled in payment methods
- Try with different UPI app

---

## Step 15: Support & Resources

### Razorpay Support
- **Email**: support@razorpay.com
- **Phone**: 1800-102-0480
- **Chat**: Available in dashboard
- **Docs**: https://razorpay.com/docs/

### Useful Links
- **API Reference**: https://razorpay.com/docs/api/
- **Checkout Integration**: https://razorpay.com/docs/payment-gateway/web-integration/standard/
- **Webhooks**: https://razorpay.com/docs/webhooks/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/

---

## Quick Start Commands

```bash
# 1. Update .env with your Razorpay keys
nano backend/.env

# 2. Restart backend
cd backend
npm start

# 3. Test the flow
# - Sign up as doctor
# - Try payment with test UPI: success@razorpay

# 4. Check Razorpay dashboard for payment
# https://dashboard.razorpay.com/

# 5. For local webhook testing
ngrok http 3000
# Update webhook URL in Razorpay dashboard
```

---

## Summary

1. ✅ Create Razorpay account
2. ✅ Get API keys (test mode first)
3. ✅ Update `.env` file
4. ✅ Link your UPI ID and bank account
5. ✅ Test with test UPI IDs
6. ✅ Configure webhooks
7. ✅ Complete KYC for live mode
8. ✅ Switch to live keys
9. ✅ Monitor payments in dashboard
10. ✅ Settlements go to your bank account

**Your UPI ID `9909232769@superyes` will receive all payments after settlement!**

---

## Need Help?

If you face any issues:
1. Check Razorpay dashboard logs
2. Check your backend console logs
3. Verify API keys are correct
4. Contact Razorpay support
5. Check this guide's troubleshooting section

Good luck with your payment integration! 🚀
