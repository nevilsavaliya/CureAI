# Render Backend Deployment Configuration

This document provides comprehensive configuration templates and instructions for deploying the healthcare platform backend to Render.

## Quick Setup

### 1. Environment Variables Template

Copy these environment variables to your Render service dashboard:

```bash
# =============================================================================
# CORE CONFIGURATION
# =============================================================================
NODE_ENV=production
PORT=10000

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
JWT_SECRET=your_64_character_jwt_secret_key_generate_securely_for_production
JWT_EXPIRES_IN=24h
ENCRYPTION_MASTER_KEY=your_64_character_hex_encryption_master_key_here_make_it_secure_and_random

# =============================================================================
# URL CONFIGURATION (CRITICAL FOR DEPLOYMENT)
# =============================================================================

# Replace 'your-backend' with your actual Render service name
API_BASE_URL=https://your-backend.onrender.com
API_URL=https://your-backend.onrender.com/api
SOCKET_URL=https://your-backend.onrender.com
HEALTH_CHECK_URL=https://your-backend.onrender.com/api/health

# Replace with your actual frontend URL (Vercel, Netlify, etc.)
FRONTEND_URL=https://your-frontend.vercel.app

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
# Add all domains that will access your API (comma-separated)
CORS_ORIGINS=https://your-frontend.vercel.app

# For multiple domains:
# CORS_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com,https://admin.your-domain.com

# =============================================================================
# EMAIL CONFIGURATION (Optional)
# =============================================================================
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# =============================================================================
# PAYMENT CONFIGURATION (Optional)
# =============================================================================
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
UPI_ID=your_upi_id@provider

# Kotak UPI Configuration
KOTAK_API_BASE_URL=https://apigwuat.kotak.com:8443
KOTAK_CLIENT_ID=your_kotak_client_id
KOTAK_CLIENT_SECRET=your_kotak_client_secret
KOTAK_MERCHANT_VPA=merchant@kotak
KOTAK_MERCHANT_MOBILE=919XXXXXXXXX
KOTAK_AGGREGATOR_ID=AC001
KOTAK_MERCHANT_ID=MC001
KOTAK_SECRET_KEY=your_kotak_secret_key

# =============================================================================
# HOSPITAL FEATURE CONFIGURATION (Optional)
# =============================================================================
API_RATE_LIMIT=100
HOSPITAL_API_KEY_PREFIX=HK_
HOSPITAL_API_SECRET_LENGTH=64

# =============================================================================
# PAYMENT TIMEOUT CONFIGURATION (Optional)
# =============================================================================
PAYMENT_TIMEOUT_MINUTES=10
PAYMENT_POLL_INTERVAL_SECONDS=5
PAYMENT_MAX_RETRIES=3
```

### 2. Render Service Configuration

#### render.yaml (Infrastructure as Code)

```yaml
services:
  - type: web
    name: healthcare-platform-backend
    env: node
    region: oregon  # Choose: oregon, frankfurt, singapore
    plan: starter   # Choose: free, starter, standard, pro
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    
    # Environment Variables (add these in Render dashboard for security)
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      # Add other sensitive variables manually in dashboard
    
    # Auto-deploy settings
    autoDeploy: true
    branch: main  # or your production branch
    
    # Build settings
    buildFilter:
      paths:
      - backend/**
      ignoredPaths:
      - frontend/**
      - docs/**
```

#### Manual Service Setup

If not using render.yaml, configure these settings in the Render dashboard:

- **Name**: healthcare-platform-backend
- **Environment**: Node
- **Region**: Oregon (or closest to your users)
- **Branch**: main
- **Root Directory**: backend
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

## Step-by-Step Deployment Guide

### Step 1: Prepare Your Repository

1. Ensure your backend code is in the `backend/` directory
2. Verify `package.json` has the correct start script:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     }
   }
   ```

### Step 2: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure service settings:
   - **Name**: healthcare-platform-backend
   - **Environment**: Node
   - **Region**: Choose closest to your users
   - **Branch**: main (or your production branch)
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Configure Environment Variables

1. In your Render service dashboard, go to "Environment"
2. Add each environment variable from the template above
3. **Critical Variables** (must be set):
   - `NODE_ENV=production`
   - `MONGODB_URI` (your MongoDB Atlas connection string)
   - `JWT_SECRET` (generate a secure 64-character string)
   - `API_BASE_URL` (your Render service URL)
   - `API_URL` (your Render service URL + /api)
   - `FRONTEND_URL` (your frontend deployment URL)
   - `CORS_ORIGINS` (your frontend URL)

### Step 4: Configure Health Checks

The service automatically uses `/api/health` for health checks. Ensure your backend has this endpoint implemented.

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your service
3. Monitor the build logs for any errors
4. Once deployed, test your API endpoints

## Environment Variable Generation Script

Use the provided script to generate secure environment variables:

```bash
cd backend
node generate-env-for-render.js
```

This script will:
- Generate a secure JWT secret
- Prompt for your MongoDB URI
- Prompt for your frontend URL
- Output formatted environment variables for Render

## Health Check Configuration

The backend includes automatic health check configuration:

```javascript
// Health check endpoint with environment variable support
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  });
});
```

Health check URL is automatically configured from environment variables:
- Uses `HEALTH_CHECK_URL` if provided
- Falls back to `${API_BASE_URL}/api/health`
- Default: `http://localhost:3000/api/health` (development)

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

2. **Health Check Failures**
   - Verify `/api/health` endpoint is accessible
   - Check if `HEALTH_CHECK_URL` is correctly configured
   - Ensure the service is listening on the correct port

3. **CORS Errors**
   - Verify `CORS_ORIGINS` includes your frontend URL
   - Check that `FRONTEND_URL` is correctly set
   - Ensure URLs use HTTPS in production

4. **Database Connection Issues**
   - Verify `MONGODB_URI` is correct
   - Check MongoDB Atlas network access settings
   - Ensure database user has proper permissions

### Environment Variable Validation

The backend includes startup validation for required environment variables:

```javascript
// Required environment variables for production
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'API_BASE_URL'
];

// Validation runs at startup and will prevent deployment if variables are missing
```

### Logs and Monitoring

Access logs through Render dashboard:
1. Go to your service dashboard
2. Click "Logs" tab
3. Monitor for startup errors and runtime issues

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use strong, unique passwords and keys**
3. **Regularly rotate API keys and secrets**
4. **Use HTTPS URLs in production**
5. **Validate all environment variables at startup**
6. **Monitor and log configuration errors**

## Performance Optimization

1. **Choose appropriate Render plan** based on expected traffic
2. **Configure proper health check intervals**
3. **Use connection pooling for database connections**
4. **Implement caching where appropriate**
5. **Monitor resource usage and scale as needed**

## Support and Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Health Checks](https://render.com/docs/health-checks)