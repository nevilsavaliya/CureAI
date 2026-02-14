# Environment Configuration Guide

## Overview

This document describes all environment variables required for the Healthcare Platform, including the Hospital Feature.

## Required Environment Variables

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | Yes |

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/healthcare-platform` | Yes |

### JWT Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT token generation | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` | No |

### CORS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FRONTEND_URL` | Frontend application URL for CORS | `http://localhost:4200` | Yes |

### Email Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_USER` | Email address for sending notifications | - | Yes |
| `EMAIL_PASSWORD` | Email password (use App Password for Gmail) | - | Yes |

### Hospital Feature Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_RATE_LIMIT` | API requests per hour per hospital | `100` | No |
| `HOSPITAL_API_KEY_PREFIX` | Prefix for hospital API keys | `HK_` | No |
| `HOSPITAL_API_SECRET_LENGTH` | Length of API secret in bytes | `64` | No |

### Payment Configuration (Optional)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PAYMENT_TIMEOUT_MINUTES` | Payment timeout in minutes | `10` | No |
| `PAYMENT_POLL_INTERVAL_SECONDS` | Payment polling interval | `5` | No |
| `PAYMENT_MAX_RETRIES` | Maximum payment retries | `3` | No |

## Environment Files

### Development (.env)
Used for local development. Contains actual values for testing.

### Example (.env.example)
Template file with placeholder values. Used for documentation and setup.

### Production (.env.production)
Template for production deployment with security considerations.

## Setup Instructions

### 1. Local Development

1. Copy the example file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Update the following required variables:
   - `MONGODB_URI` - Your local MongoDB connection
   - `JWT_SECRET` - Generate a secure secret (32+ characters)
   - `EMAIL_USER` - Your Gmail address
   - `EMAIL_PASSWORD` - Your Gmail App Password

3. Generate a secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 2. Production Deployment

1. Set all required environment variables in your deployment platform
2. Use strong, unique values for production
3. Never commit production secrets to version control

### 3. Gmail App Password Setup

For email functionality:

1. Enable 2-Factor Authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use this 16-character password as `EMAIL_PASSWORD`

## Security Considerations

### JWT Secret
- Must be at least 32 characters long
- Use cryptographically secure random generation
- Different secret for each environment
- Never expose in logs or client-side code

### Email Credentials
- Use App Passwords, not regular passwords
- Restrict email account permissions
- Monitor for suspicious activity

### API Rate Limiting
- Default 100 requests/hour per hospital
- Adjust based on usage patterns
- Monitor for abuse

### Database Security
- Use MongoDB Atlas for production
- Enable authentication
- Use connection string with credentials
- Whitelist IP addresses

## Environment Variable Validation

The application validates required environment variables on startup:

```javascript
// Required variables
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'EMAIL_USER',
  'EMAIL_PASSWORD'
];

// Validation happens in server.js
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` format
   - Verify database is running
   - Check network connectivity

2. **JWT Token Invalid**
   - Verify `JWT_SECRET` is set
   - Check token expiration
   - Ensure secret consistency

3. **Email Not Sending**
   - Verify `EMAIL_USER` and `EMAIL_PASSWORD`
   - Check Gmail App Password setup
   - Verify 2FA is enabled

4. **CORS Errors**
   - Check `FRONTEND_URL` matches frontend domain
   - Verify protocol (http/https)
   - Check port numbers

### Debugging

Enable debug logging:
```bash
DEBUG=* npm start
```

Check environment variables:
```bash
node -e "console.log(process.env)"
```

## Examples

### Development .env
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/healthcare-platform
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:4200
EMAIL_USER=developer@example.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
API_RATE_LIMIT=100
HOSPITAL_API_KEY_PREFIX=HK_
HOSPITAL_API_SECRET_LENGTH=64
```

### Production Environment Variables
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/healthcare-platform
JWT_SECRET=production-secret-32-chars-minimum
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://healthcare-app.vercel.app
EMAIL_USER=noreply@healthcare-platform.com
EMAIL_PASSWORD=production-app-password
API_RATE_LIMIT=100
HOSPITAL_API_KEY_PREFIX=HK_
HOSPITAL_API_SECRET_LENGTH=64
```

## Deployment Platforms

### Render
Add environment variables in the Render dashboard:
1. Go to your service settings
2. Click "Environment"
3. Add each variable individually

### Vercel
Use the Vercel CLI or dashboard:
```bash
vercel env add VARIABLE_NAME
```

### Heroku
Use the Heroku CLI:
```bash
heroku config:set VARIABLE_NAME=value
```

## Monitoring

Monitor environment configuration:
- Log startup validation
- Track missing variables
- Monitor configuration changes
- Alert on security issues

## Updates

When adding new environment variables:
1. Update all three environment files
2. Update this documentation
3. Update deployment guides
4. Notify team members
5. Update validation logic if required