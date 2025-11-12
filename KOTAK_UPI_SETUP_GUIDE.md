# Kotak UPI Payment Integration Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the Kotak Mahindra Bank UPI payment integration in the healthcare platform. The integration enables doctors to pay subscription fees via UPI QR code with automatic payment verification.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Setup](#environment-variables-setup)
3. [UAT Environment Configuration](#uat-environment-configuration)
4. [Production Environment Configuration](#production-environment-configuration)
5. [Verification Steps](#verification-steps)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the Kotak UPI integration, ensure you have:

- Node.js version 14.x or higher installed
- MongoDB database running
- Access to Kotak Mahindra Bank merchant portal
- Kotak API credentials (Client ID, Client Secret, Merchant VPA, etc.)
- SSL certificate for production deployment

## Environment Variables Setup

### Step 1: Locate Environment File

Navigate to the backend directory and locate the `.env` file:

```bash
cd backend
```

If the `.env` file doesn't exist, create it:

```bash
touch .env
```

### Step 2: Add Kotak API Configuration

Add the following environment variables to your `.env` file:

```bash
# Kotak API Base Configuration
KOTAK_API_BASE_URL=https://apigwuat.kotak.com:8443
KOTAK_CLIENT_ID=your_client_id_here
KOTAK_CLIENT_SECRET=your_client_secret_here

# Merchant Details
KOTAK_MERCHANT_VPA=merchant@kotak
KOTAK_MERCHANT_MOBILE=919XXXXXXXXX
KOTAK_AGGREGATOR_ID=AC001
KOTAK_MERCHANT_ID=MC001

# Security
KOTAK_SECRET_KEY=your_secret_key_here

# Payment Configuration
PAYMENT_TIMEOUT_MINUTES=10
PAYMENT_POLL_INTERVAL_SECONDS=5
PAYMENT_MAX_RETRIES=3
```

### Step 3: Replace Placeholder Values

Replace the placeholder values with your actual Kotak API credentials:

| Variable | Description | Example |
|----------|-------------|---------|
| `KOTAK_CLIENT_ID` | OAuth 2.0 Client ID provided by Kotak | `ABC123XYZ456` |
| `KOTAK_CLIENT_SECRET` | OAuth 2.0 Client Secret provided by Kotak | `secret_key_abc123` |
| `KOTAK_MERCHANT_VPA` | Your merchant UPI ID | `yourstore@kotak` |
| `KOTAK_MERCHANT_MOBILE` | Merchant mobile number with country code | `919876543210` |
| `KOTAK_AGGREGATOR_ID` | Aggregator ID assigned by Kotak | `AG12345` |
| `KOTAK_MERCHANT_ID` | Merchant ID assigned by Kotak | `MER67890` |
| `KOTAK_SECRET_KEY` | Secret key for checksum generation | `32-character-hex-string` |

### Step 4: Verify Configuration File

Ensure the configuration file is properly loaded by checking `backend/config/kotakConfig.js`:

```bash
cat backend/config/kotakConfig.js
```

The file should export all required configuration values from environment variables.

## UAT Environment Configuration

### UAT Endpoint Details

For testing in the UAT (User Acceptance Testing) environment, use the following configuration:

```bash
# UAT Environment
KOTAK_API_BASE_URL=https://apigwuat.kotak.com:8443

# UAT Endpoints
# Token Endpoint: /token
# Check Transaction Status: /upi/v1/merchant/checkTxnStatus
# Validate VPA: /upi/v1/merchant/validateVPA
```

### UAT Test Credentials

Contact Kotak support to obtain UAT test credentials. Typical UAT setup includes:

- Test Client ID and Secret
- Test Merchant VPA (e.g., `testmerchant@kotak`)
- Test Aggregator and Merchant IDs
- Test Secret Key for checksum generation

### UAT IP Whitelisting

Ensure your UAT server IP address is whitelisted with Kotak:

1. Obtain your server's public IP address:
   ```bash
   curl ifconfig.me
   ```

2. Contact Kotak support to whitelist the IP address

3. Verify IP whitelisting by making a test API call

## Production Environment Configuration

### Production Endpoint Details

For production deployment, update the configuration:

```bash
# Production Environment
KOTAK_API_BASE_URL=https://apigw.kotak.com:8443

# Production Endpoints (same paths as UAT)
# Token Endpoint: /token
# Check Transaction Status: /upi/v1/merchant/checkTxnStatus
# Validate VPA: /upi/v1/merchant/validateVPA
```

### Production Credentials

1. **Obtain Production Credentials:**
   - Request production credentials from Kotak after successful UAT testing
   - Ensure all credentials are different from UAT

2. **Update Environment Variables:**
   ```bash
   KOTAK_API_BASE_URL=https://apigw.kotak.com:8443
   KOTAK_CLIENT_ID=prod_client_id
   KOTAK_CLIENT_SECRET=prod_client_secret
   KOTAK_MERCHANT_VPA=yourstore@kotak
   # ... update all other credentials
   ```

3. **Secure Credential Storage:**
   - Never commit `.env` file to version control
   - Use secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)
   - Rotate credentials periodically

### Production IP Whitelisting

1. Obtain production server IP address(es)
2. Submit IP whitelisting request to Kotak
3. Wait for confirmation before going live
4. Test connectivity after whitelisting

### SSL Certificate Setup

Production environment requires valid SSL certificate:

1. Obtain SSL certificate from trusted CA
2. Install certificate on your server
3. Configure HTTPS in your application
4. Verify SSL configuration:
   ```bash
   curl -I https://yourdomain.com
   ```

## Verification Steps

### Step 1: Verify Environment Variables

Create a verification script to check all required variables are set:

```bash
node -e "
const config = require('./config/kotakConfig');
console.log('Kotak Configuration:');
console.log('Base URL:', config.baseURL ? '✓' : '✗');
console.log('Client ID:', config.clientId ? '✓' : '✗');
console.log('Client Secret:', config.clientSecret ? '✓' : '✗');
console.log('Merchant VPA:', config.merchantVPA ? '✓' : '✗');
console.log('Secret Key:', config.secretKey ? '✓' : '✗');
"
```

### Step 2: Test OAuth Token Generation

Start the backend server and test token generation:

```bash
# Start server
npm start

# In another terminal, test token endpoint
curl -X POST http://localhost:5000/api/payments/test-token
```

Expected response:
```json
{
  "success": true,
  "message": "Token generated successfully"
}
```

### Step 3: Test Checksum Generation

Verify checksum generation is working correctly:

```bash
node -e "
const cryptoService = require('./services/cryptoService');
const checksum = cryptoService.generateCheckTransactionChecksum(
  'C', 'TEST123', '', '', '20231115120000', '100.00', 
  'merchant@kotak', '919876543210', 'your_secret_key'
);
console.log('Checksum generated:', checksum ? '✓' : '✗');
"
```

### Step 4: Test Payment Initiation

Use the frontend or API client to initiate a test payment:

```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 999,
    "planId": "monthly"
  }'
```

Expected response should include:
- `paymentId`
- `txnId` (with KMB prefix)
- `merchantVPA`
- `qrCodeData`

### Step 5: Monitor Logs

Check server logs for any errors:

```bash
tail -f logs/app.log
```

Look for:
- Successful token generation
- Payment initiation logs
- Polling service activity
- Any error messages

## Troubleshooting

### Issue 1: "Invalid Client Credentials" Error

**Symptoms:**
```
Error: OAuth token generation failed: Invalid client credentials
```

**Solutions:**
1. Verify `KOTAK_CLIENT_ID` and `KOTAK_CLIENT_SECRET` are correct
2. Check for extra spaces or newlines in environment variables
3. Ensure credentials are for the correct environment (UAT vs Production)
4. Contact Kotak support to verify credentials are active

### Issue 2: "IP Not Whitelisted" Error

**Symptoms:**
```
Error: OL95 - Invalid IP
```

**Solutions:**
1. Verify your server's public IP address:
   ```bash
   curl ifconfig.me
   ```
2. Check if IP is whitelisted with Kotak
3. If using load balancer, whitelist load balancer IP
4. Contact Kotak support to add/update IP whitelist

### Issue 3: "Invalid Checksum" Error

**Symptoms:**
```
Error: Checksum validation failed
```

**Solutions:**
1. Verify `KOTAK_SECRET_KEY` is correct (32-character hex string)
2. Check checksum generation logic in `cryptoService.js`
3. Ensure input parameters are in correct order
4. Verify AES encryption is using CBC mode with zero IV
5. Test with known checksum values provided by Kotak

### Issue 4: "Merchant VPA Not Found" Error

**Symptoms:**
```
Error: 03 - Merchant VPA not found
```

**Solutions:**
1. Verify `KOTAK_MERCHANT_VPA` format (e.g., `merchant@kotak`)
2. Ensure VPA is registered with Kotak
3. Check if VPA is active in Kotak merchant portal
4. Contact Kotak support to verify VPA status

### Issue 5: Payment Verification Timeout

**Symptoms:**
- Payment status remains "pending" for 10+ minutes
- No status updates from Kotak API

**Solutions:**
1. Check if polling service is running:
   ```bash
   # Look for polling logs
   grep "Polling payment status" logs/app.log
   ```
2. Verify network connectivity to Kotak API
3. Check if transaction ID is valid
4. Manually verify payment status using test endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/payments/PAYMENT_ID/verify
   ```
5. Check Kotak merchant portal for transaction status

### Issue 6: "Connection Timeout" Error

**Symptoms:**
```
Error: ETIMEDOUT - Connection timeout
```

**Solutions:**
1. Check network connectivity:
   ```bash
   ping apigwuat.kotak.com
   ```
2. Verify firewall rules allow outbound HTTPS (port 8443)
3. Check if proxy settings are required
4. Increase timeout values in configuration
5. Contact network administrator

### Issue 7: Environment Variables Not Loading

**Symptoms:**
- `undefined` values in configuration
- Server fails to start

**Solutions:**
1. Verify `.env` file exists in backend directory
2. Check `.env` file format (no quotes around values)
3. Ensure `dotenv` package is installed:
   ```bash
   npm install dotenv
   ```
4. Verify `dotenv` is loaded at top of `server.js`:
   ```javascript
   require('dotenv').config();
   ```
5. Restart server after updating `.env` file

### Issue 8: Database Connection Issues

**Symptoms:**
```
Error: Payment record not saved
```

**Solutions:**
1. Verify MongoDB is running:
   ```bash
   systemctl status mongod
   ```
2. Check database connection string in `.env`
3. Verify Payment model is properly defined
4. Check database permissions
5. Review database logs for errors

## Security Best Practices

### 1. Credential Management

- **Never commit `.env` file to version control**
- Add `.env` to `.gitignore`
- Use different credentials for each environment
- Rotate credentials every 90 days
- Use secret management services in production

### 2. API Security

- Always use HTTPS in production
- Implement rate limiting on payment endpoints
- Validate all input parameters
- Log all payment activities for audit
- Monitor for suspicious activity

### 3. Error Handling

- Never expose sensitive information in error messages
- Log detailed errors server-side only
- Return generic error messages to clients
- Implement proper error monitoring and alerting

### 4. Network Security

- Whitelist only necessary IP addresses
- Use VPN for accessing production systems
- Implement firewall rules
- Monitor network traffic for anomalies

## Support and Resources

### Kotak Support

- **UAT Support Email:** uat-support@kotak.com
- **Production Support Email:** merchant-support@kotak.com
- **Support Phone:** +91-22-XXXX-XXXX (Contact Kotak for actual number)
- **Merchant Portal:** https://merchant.kotak.com

### Internal Resources

- **Technical Documentation:** See `KOTAK_UPI_TESTING_GUIDE.md`
- **API Integration Spec:** See `KOTAK_UPI_INTEGRATION_SPEC.md`
- **Design Document:** See `.kiro/specs/kotak-upi-payment-integration/design.md`

### Useful Commands

```bash
# Check server status
pm2 status

# View real-time logs
pm2 logs

# Restart server
pm2 restart healthcare-backend

# Check environment variables
printenv | grep KOTAK

# Test database connection
mongo --eval "db.adminCommand('ping')"

# Check disk space
df -h

# Check memory usage
free -m
```

## Next Steps

After completing the setup:

1. Review the testing guide: `KOTAK_UPI_TESTING_GUIDE.md`
2. Perform end-to-end testing in UAT environment
3. Conduct security audit
4. Prepare production deployment checklist
5. Schedule go-live with Kotak support

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-15 | 1.0 | Initial setup guide created |

---

**Note:** This guide is for internal use only. Do not share Kotak API credentials or sensitive configuration details outside the organization.
