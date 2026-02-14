# Deployment Environment Configuration Guide

## Overview

This guide provides platform-specific instructions for configuring environment variables during deployment.

## Required Environment Variables

### Core Variables (Required for all deployments)

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform
JWT_SECRET=your-secure-32-character-secret-key
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-frontend-domain.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### Hospital Feature Variables

```bash
API_RATE_LIMIT=100
HOSPITAL_API_KEY_PREFIX=HK_
HOSPITAL_API_SECRET_LENGTH=64
```

### Optional Payment Variables

```bash
PAYMENT_TIMEOUT_MINUTES=10
PAYMENT_POLL_INTERVAL_SECONDS=5
PAYMENT_MAX_RETRIES=3
```

## Platform-Specific Setup

### 1. Render.com

#### Step 1: Create Web Service
1. Connect your GitHub repository
2. Set **Root Directory** to `backend`
3. Set **Build Command** to `npm install`
4. Set **Start Command** to `npm start`

#### Step 2: Add Environment Variables
Go to **Environment** tab and add each variable:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `3000` | Default port |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas URI |
| `JWT_SECRET` | `[32+ char secret]` | Generate with crypto |
| `JWT_EXPIRES_IN` | `24h` | Token expiration |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your frontend URL |
| `EMAIL_USER` | `your-email@gmail.com` | Gmail address |
| `EMAIL_PASSWORD` | `abcd efgh ijkl mnop` | Gmail App Password |
| `API_RATE_LIMIT` | `100` | Requests per hour |
| `HOSPITAL_API_KEY_PREFIX` | `HK_` | API key prefix |
| `HOSPITAL_API_SECRET_LENGTH` | `64` | Secret length in bytes |

#### Step 3: Deploy
Click **Deploy Latest Commit**

### 2. Vercel

#### Step 1: Project Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from backend directory
cd backend
vercel
```

#### Step 2: Configure Environment Variables
```bash
# Add each variable
vercel env add NODE_ENV
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
vercel env add EMAIL_USER
vercel env add EMAIL_PASSWORD
vercel env add API_RATE_LIMIT
vercel env add HOSPITAL_API_KEY_PREFIX
vercel env add HOSPITAL_API_SECRET_LENGTH
```

Or use the Vercel dashboard:
1. Go to Project Settings
2. Click **Environment Variables**
3. Add each variable for **Production** environment

#### Step 3: Deploy
```bash
vercel --prod
```

### 3. Heroku

#### Step 1: Create App
```bash
# Install Heroku CLI
# Create app
heroku create your-app-name

# Set buildpack
heroku buildpacks:set heroku/nodejs
```

#### Step 2: Configure Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set JWT_EXPIRES_IN=24h
heroku config:set FRONTEND_URL="https://your-frontend.com"
heroku config:set EMAIL_USER="your-email@gmail.com"
heroku config:set EMAIL_PASSWORD="your-app-password"
heroku config:set API_RATE_LIMIT=100
heroku config:set HOSPITAL_API_KEY_PREFIX=HK_
heroku config:set HOSPITAL_API_SECRET_LENGTH=64
```

#### Step 3: Deploy
```bash
# From backend directory
git subtree push --prefix=backend heroku main
```

### 4. Railway

#### Step 1: Create Project
1. Connect GitHub repository
2. Select **backend** as root directory

#### Step 2: Add Environment Variables
In Railway dashboard:
1. Go to **Variables** tab
2. Add each environment variable

#### Step 3: Deploy
Railway auto-deploys on git push

### 5. DigitalOcean App Platform

#### Step 1: Create App
1. Connect GitHub repository
2. Set **Source Directory** to `backend`
3. Set **Build Command** to `npm install`
4. Set **Run Command** to `npm start`

#### Step 2: Environment Variables
In App Platform dashboard:
1. Go to **Settings** → **App-Level Environment Variables**
2. Add each variable

## Security Best Practices

### 1. JWT Secret Generation
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Gmail App Password Setup
1. Enable 2-Factor Authentication on Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate app password for "Mail"
4. Use 16-character password as `EMAIL_PASSWORD`

### 3. MongoDB Atlas Setup
1. Create cluster on [MongoDB Atlas](https://cloud.mongodb.com)
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for cloud platforms)
4. Get connection string from **Connect** → **Connect your application**

### 4. Environment Variable Security
- Never commit secrets to version control
- Use different secrets for each environment
- Rotate secrets regularly
- Monitor for exposed secrets

## Validation

### Pre-deployment Checklist
- [ ] All required variables are set
- [ ] JWT secret is 32+ characters
- [ ] MongoDB URI is valid and accessible
- [ ] Email credentials are tested
- [ ] Frontend URL matches deployed frontend
- [ ] No default/example values in production

### Post-deployment Validation
```bash
# Test environment endpoint
curl https://your-api.com/api/health

# Check logs for validation errors
# Platform-specific log viewing commands
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
**Symptoms:** App crashes on startup
**Solutions:**
- Check all required variables are set
- Verify JWT secret length (32+ chars)
- Test MongoDB connection string

#### 2. Database Connection Failed
**Symptoms:** MongoDB connection errors
**Solutions:**
- Verify MongoDB URI format
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

#### 3. Email Not Sending
**Symptoms:** Hospital verification emails not sent
**Solutions:**
- Verify Gmail App Password setup
- Check 2FA is enabled on Google account
- Test email credentials locally

#### 4. CORS Errors
**Symptoms:** Frontend can't connect to API
**Solutions:**
- Verify `FRONTEND_URL` matches frontend domain
- Check protocol (http vs https)
- Ensure no trailing slash in URL

### Debug Commands

```bash
# Check environment variables (remove sensitive data)
node -e "console.log(Object.keys(process.env).filter(k => k.includes('HOSPITAL') || k.includes('API')))"

# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"

# Validate JWT secret
node -e "console.log('JWT Secret length:', process.env.JWT_SECRET?.length || 0)"
```

## Environment Templates

### Render Environment Variables (Copy-Paste)
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform
JWT_SECRET=your-32-character-secret-key-here
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-frontend.vercel.app
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
API_RATE_LIMIT=100
HOSPITAL_API_KEY_PREFIX=HK_
HOSPITAL_API_SECRET_LENGTH=64
```

### Heroku Config Vars (Bash Commands)
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform"
heroku config:set JWT_SECRET="your-32-character-secret-key-here"
heroku config:set JWT_EXPIRES_IN=24h
heroku config:set FRONTEND_URL="https://your-frontend.vercel.app"
heroku config:set EMAIL_USER="your-email@gmail.com"
heroku config:set EMAIL_PASSWORD="your-16-char-app-password"
heroku config:set API_RATE_LIMIT=100
heroku config:set HOSPITAL_API_KEY_PREFIX=HK_
heroku config:set HOSPITAL_API_SECRET_LENGTH=64
```

## Monitoring

### Health Check Endpoint
The application provides a health check endpoint:
```
GET /api/health
```

Response includes environment validation status.

### Logging
Environment validation results are logged on startup:
- ✅ Valid configuration
- ⚠️ Warnings for non-critical issues
- ❌ Errors that prevent startup

### Alerts
Set up monitoring for:
- Application startup failures
- Environment validation errors
- Database connection issues
- Email service failures

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test individual components
4. Review platform-specific documentation
5. Contact support with error logs and configuration details