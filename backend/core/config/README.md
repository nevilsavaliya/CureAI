# Configuration Module

## Overview

The configuration module provides centralized management of all application settings and environment variables. It implements the singleton pattern to ensure consistent configuration access throughout the application.

## Purpose

- Centralize all environment variable access
- Validate required configuration at startup
- Provide type-safe configuration getters
- Support multiple environments (development, staging, production)
- Prevent hardcoded values in the codebase

## Files

### ConfigService.js

**Purpose**: Singleton service that loads, validates, and provides access to all configuration values.

**Key Features**:
- Lazy loading of configuration
- Type conversion (string, number, boolean, array)
- Default values for optional settings
- Configuration validation
- Sanitized configuration for logging (secrets masked)

**Usage**:
```javascript
const ConfigService = require('./ConfigService');

// Server configuration
const port = ConfigService.getPort();
const nodeEnv = ConfigService.getNodeEnv();
const apiBaseUrl = ConfigService.getApiBaseUrl();

// Database configuration
const mongoUri = ConfigService.getMongoUri();

// Security configuration
const jwtSecret = ConfigService.getJwtSecret();
const encryptionKey = ConfigService.getEncryptionKey();

// External services
const mailersendConfig = ConfigService.getMailerSendConfig();
const razorpayConfig = ConfigService.getRazorpayConfig();

// Feature flags
const isSslEnabled = ConfigService.isSslEnabled();
const isRateLimitEnabled = ConfigService.isRateLimitEnabled();
```

### startupValidation.js

**Purpose**: Validates all required environment variables before the application starts.

**Key Features**:
- Validates required variables for all environments
- Additional validation for production environment
- Clear error messages for missing configuration
- Warnings for optional but recommended variables

**Usage**:
```javascript
const { validateStartupConfig } = require('./startupValidation');

// Validate configuration at startup
const validation = validateStartupConfig();

if (!validation.isValid) {
  console.error('Configuration validation failed:');
  validation.errors.forEach(err => {
    console.error(`  - ${err.key}: ${err.message}`);
  });
  process.exit(1);
}
```

## Configuration Categories

### Server Configuration
- `PORT`: Server port number
- `NODE_ENV`: Environment (development/production)
- `API_BASE_URL`: Base URL for the API
- `API_URL`: Full API URL
- `SOCKET_URL`: WebSocket server URL
- `HEALTH_CHECK_URL`: Health check endpoint URL

### Database Configuration
- `MONGODB_URI`: MongoDB connection string

### Security Configuration
- `JWT_SECRET`: Secret key for JWT tokens (required)
- `JWT_EXPIRES_IN`: JWT expiration time
- `ENCRYPTION_MASTER_KEY`: Master key for encryption (required in production)
- `API_RATE_LIMIT`: Default API rate limit

### Rate Limiting Configuration
- `RATE_LIMIT_ENABLED`: Enable/disable rate limiting
- `DEFAULT_RATE_LIMIT`: Default rate limit
- `AUTH_RATE_LIMIT`: Rate limit for authentication endpoints
- `API_RATE_LIMIT`: Rate limit for API endpoints
- `HOSPITAL_API_RATE_LIMIT`: Rate limit for hospital API
- `ADMIN_RATE_LIMIT`: Rate limit for admin operations

### SSL/TLS Configuration
- `SSL_ENABLED`: Enable SSL
- `SSL_PORT`: SSL port
- `SSL_CERT_PATH`: Path to SSL certificates
- `SSL_DOMAIN`: SSL domain name

### CORS Configuration
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `FRONTEND_URL`: Frontend application URL

### Email Configuration
- `MAILERSEND_API_KEY`: MailerSend API key (required in production)
- `MAILERSEND_FROM_EMAIL`: Default sender email (required in production)
- `MAILERSEND_FROM_NAME`: Default sender name
- `SUPPORT_EMAIL`: Support email address

### Payment Configuration
- `RAZORPAY_KEY_ID`: Razorpay key ID
- `RAZORPAY_KEY_SECRET`: Razorpay secret key
- `UPI_ID`: UPI ID for payments
- `KOTAK_CLIENT_ID`: Kotak bank client ID
- `KOTAK_CLIENT_SECRET`: Kotak bank client secret

### Hospital Configuration
- `HOSPITAL_API_KEY_PREFIX`: Prefix for hospital API keys
- `HOSPITAL_API_SECRET_LENGTH`: Length of hospital API secrets

## Environment Variables

### Required (All Environments)
```env
JWT_SECRET=your-secret-key-at-least-32-characters
MONGODB_URI=mongodb://localhost:27017/healthcare-platform
```

### Required (Production Only)
```env
ENCRYPTION_MASTER_KEY=64-character-hex-string
MAILERSEND_API_KEY=your-mailersend-api-key
MAILERSEND_FROM_EMAIL=noreply@yourdomain.com
```

### Optional (With Defaults)
```env
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000
RATE_LIMIT_ENABLED=true
DEFAULT_RATE_LIMIT=100
```

See `.env.example` for complete list.

## Validation

The ConfigService validates configuration at startup:

```javascript
const validation = ConfigService.validate();

if (!validation.isValid) {
  // Handle validation errors
  validation.errors.forEach(error => {
    console.error(`${error.key}: ${error.message}`);
  });
}

// Check warnings
validation.warnings.forEach(warning => {
  console.warn(`${warning.key}: ${warning.message}`);
});
```

## Type Conversion

ConfigService automatically converts environment variables to appropriate types:

```javascript
// String (default)
const apiUrl = ConfigService.getApiUrl(); // string

// Number
const port = ConfigService.getPort(); // number

// Boolean
const sslEnabled = ConfigService.isSslEnabled(); // boolean

// Array (comma-separated)
const corsOrigins = ConfigService.getCorsOrigins(); // string[]
```

## Security

### Sensitive Data Protection

ConfigService provides a sanitized configuration view for logging:

```javascript
// Get sanitized config (secrets masked)
const sanitized = ConfigService.getSanitizedConfig();
console.log(sanitized); // Secrets shown as '***'

// Never log the full config in production
if (ConfigService.isDevelopment()) {
  console.log(ConfigService.getAllConfig());
}
```

### Best Practices

1. **Never hardcode secrets**: Always use environment variables
2. **Use strong secrets**: JWT_SECRET should be at least 32 characters
3. **Rotate secrets regularly**: Especially in production
4. **Validate at startup**: Fail fast if configuration is invalid
5. **Use different secrets per environment**: Never reuse production secrets in development

## Testing

### Unit Tests

```javascript
const ConfigService = require('./ConfigService');

describe('ConfigService', () => {
  it('should load configuration', () => {
    expect(ConfigService.getPort()).toBeDefined();
  });
  
  it('should validate required variables', () => {
    const validation = ConfigService.validate();
    expect(validation.isValid).toBe(true);
  });
});
```

### Integration Tests

```javascript
// Test with different environment variables
process.env.PORT = '4000';
const config = new ConfigService();
expect(config.getPort()).toBe(4000);
```

## Troubleshooting

### Common Issues

**Issue**: Application fails to start with "JWT_SECRET is required"
**Solution**: Add JWT_SECRET to your .env file

**Issue**: "ENCRYPTION_MASTER_KEY must be exactly 64 characters"
**Solution**: Generate a 64-character hex string:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Issue**: Configuration changes not reflected
**Solution**: Restart the application (ConfigService caches configuration)

## Migration from Hardcoded Values

Replace hardcoded values with ConfigService:

**Before**:
```javascript
const port = 3000;
const jwtSecret = 'hardcoded-secret';
```

**After**:
```javascript
const ConfigService = require('./core/config/ConfigService');
const port = ConfigService.getPort();
const jwtSecret = ConfigService.getJwtSecret();
```

## Contributing

When adding new configuration:

1. Add environment variable to ConfigService.loadConfiguration()
2. Add getter method to ConfigService
3. Add validation if required
4. Update .env.example
5. Update this README
6. Add tests for new configuration

## Support

For configuration issues, check:
1. .env file exists and is properly formatted
2. All required variables are set
3. Variable names match exactly (case-sensitive)
4. No trailing spaces in values
5. Restart application after changes
