# Environment Configuration

## Quick Start

### 1. Setup Environment
```bash
# Interactive setup
npm run setup

# Or copy and edit manually
cp .env.example .env
# Edit .env with your values
```

### 2. Validate Configuration
```bash
# Check current environment
npm run setup:validate

# Or validate and start server
npm start
```

### 3. Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/healthcare-platform` |
| `JWT_SECRET` | Token signing key (32+ chars) | `ee7cb02137438289318fb92ae0d97be5decf84030c40f6ddb07c2804ebf1574e` |
| `FRONTEND_URL` | Frontend app URL | `http://localhost:4200` |
| `EMAIL_USER` | Gmail address | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Gmail App Password | `abcd efgh ijkl mnop` |

## Hospital Feature Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_RATE_LIMIT` | Requests per hour per hospital | `100` |
| `HOSPITAL_API_KEY_PREFIX` | API key prefix | `HK_` |
| `HOSPITAL_API_SECRET_LENGTH` | Secret length in bytes | `64` |

## Commands

```bash
# Environment setup
npm run setup              # Interactive setup
npm run setup:validate     # Validate current config

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test environment
npm test tests/validateEnv.test.js
```

## Gmail Setup

1. Enable 2-Factor Authentication
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate password for "Mail"
4. Use 16-character password as `EMAIL_PASSWORD`

## Deployment

See [Deployment Environment Guide](docs/DEPLOYMENT_ENV_GUIDE.md) for platform-specific instructions.

## Troubleshooting

### Common Issues

**JWT Secret Too Short**
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**MongoDB Connection Failed**
- Check MongoDB is running
- Verify connection string format
- Test with MongoDB Compass

**Email Not Sending**
- Verify Gmail App Password setup
- Check 2FA is enabled
- Test credentials with test script

### Debug Commands

```bash
# Check environment variables
node -e "console.log(Object.keys(process.env).filter(k => !k.includes('PASSWORD')))"

# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(console.error)"

# Validate specific variable
node -e "console.log('JWT Secret length:', process.env.JWT_SECRET?.length || 0)"
```

## Documentation

- [Environment Configuration Guide](docs/ENVIRONMENT_CONFIGURATION.md) - Complete reference
- [Deployment Environment Guide](docs/DEPLOYMENT_ENV_GUIDE.md) - Platform-specific setup
- [Hospital Feature Requirements](.kiro/specs/hospital-feature/requirements.md) - Feature specifications