# Design Document

## Overview

This design addresses the systematic removal of hardcoded static URLs from the healthcare platform and their replacement with environment variable-based configuration. The solution ensures seamless deployment across different environments (development, staging, production) on cloud platforms like Render and Vercel.

## Architecture

### Environment Variable Strategy

The application will use a hierarchical environment variable approach:

1. **Development**: Local `.env` files with localhost URLs
2. **Production**: Cloud platform environment variables with deployed URLs
3. **Docker**: Container environment variables with configurable endpoints

### Configuration Layers

```
Application Layer
├── Frontend (Angular)
│   ├── Environment Files (build-time)
│   └── Runtime Configuration (container injection)
├── Backend (Node.js)
│   ├── Environment Variables (runtime)
│   └── CORS Configuration (dynamic)
└── Infrastructure
    ├── Docker Health Checks (configurable)
    └── SSL/HTTPS Support (environment-based)
```

## Components and Interfaces

### 1. Frontend Environment Configuration

**Current State:**
- Hardcoded `http://localhost:3000/api` in multiple services
- Static environment files with localhost references
- Fixed Socket.IO connection URLs

**New Design:**
- Centralized environment configuration service
- Runtime environment variable injection for containers
- Dynamic API URL resolution

**Interface:**
```typescript
interface EnvironmentConfig {
  production: boolean;
  apiUrl: string;
  socketUrl: string;
  healthCheckUrl?: string;
}

interface RuntimeConfig {
  API_URL: string;
  SOCKET_URL: string;
  FRONTEND_URL: string;
}
```

### 2. Backend URL Configuration

**Current State:**
- Hardcoded CORS origins
- Static health check URLs in Docker
- Fixed database connection strings

**New Design:**
- Dynamic CORS configuration from environment
- Configurable health check endpoints
- Environment-based service URLs

**Interface:**
```javascript
const config = {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL,
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [process.env.FRONTEND_URL],
  healthCheckUrl: process.env.HEALTH_CHECK_URL,
  databaseUrl: process.env.MONGODB_URI,
  apiBaseUrl: process.env.API_BASE_URL
};
```

### 3. Docker Configuration

**Current State:**
- Hardcoded localhost in health checks
- Static port references
- Fixed SSL configurations

**New Design:**
- Environment variable-based health checks
- Configurable port and protocol
- Dynamic SSL endpoint configuration

## Data Models

### Environment Variable Schema

```yaml
# Required Variables
API_URL: string              # Backend API endpoint
FRONTEND_URL: string         # Frontend application URL
MONGODB_URI: string          # Database connection string

# Optional Variables
SOCKET_URL: string           # WebSocket endpoint (defaults to API_URL)
HEALTH_CHECK_URL: string     # Health check endpoint (defaults to API_URL/health)
CORS_ORIGINS: string         # Comma-separated allowed origins
SSL_ENABLED: boolean         # Enable HTTPS configuration
PORT: number                 # Application port (default: 3000)
```

### Configuration Validation

```javascript
const requiredVars = ['API_URL', 'FRONTEND_URL', 'MONGODB_URI'];
const optionalVars = ['SOCKET_URL', 'HEALTH_CHECK_URL', 'CORS_ORIGINS', 'SSL_ENABLED', 'PORT'];

const validationSchema = {
  API_URL: /^https?:\/\/.+/,
  FRONTEND_URL: /^https?:\/\/.+/,
  MONGODB_URI: /^mongodb(\+srv)?:\/\/.+/,
  PORT: /^\d+$/
};
```

## Error Handling

### 1. Missing Environment Variables

```javascript
class ConfigurationError extends Error {
  constructor(missingVars) {
    super(`Missing required environment variables: ${missingVars.join(', ')}`);
    this.name = 'ConfigurationError';
    this.missingVars = missingVars;
  }
}
```

### 2. Invalid URL Formats

```javascript
class URLValidationError extends Error {
  constructor(variable, value) {
    super(`Invalid URL format for ${variable}: ${value}`);
    this.name = 'URLValidationError';
    this.variable = variable;
    this.value = value;
  }
}
```

### 3. Health Check Failures

```javascript
// Docker health check with fallback
const healthCheckCommand = `curl -f ${process.env.HEALTH_CHECK_URL || 'http://localhost:' + (process.env.PORT || 3000) + '/api/health'} || exit 1`;
```

## Testing Strategy

### 1. Environment Variable Testing

- **Unit Tests**: Validate configuration parsing and validation logic
- **Integration Tests**: Test application startup with various environment configurations
- **E2E Tests**: Verify cross-service communication with configured URLs

### 2. Deployment Testing

- **Local Docker**: Test container startup with environment variables
- **Staging**: Validate configuration on cloud platforms
- **Production**: Monitor health checks and service connectivity

### 3. Configuration Validation

```javascript
// Test configuration scenarios
const testConfigs = [
  { name: 'development', env: { API_URL: 'http://localhost:3000/api' } },
  { name: 'production', env: { API_URL: 'https://api.example.com/api' } },
  { name: 'docker', env: { API_URL: 'http://backend:3000/api' } }
];
```

## Implementation Phases

### Phase 1: Backend Configuration
1. Replace hardcoded CORS origins with environment variables
2. Update Docker health checks to use configurable URLs
3. Add environment variable validation at startup
4. Update documentation with required variables

### Phase 2: Frontend Configuration
1. Create environment configuration service
2. Replace hardcoded API URLs in all services
3. Update Socket.IO connection configuration
4. Implement runtime configuration for containers

### Phase 3: Infrastructure Updates
1. Update Docker files with environment variable support
2. Create deployment configuration templates
3. Add health check endpoint validation
4. Update SSL configuration for dynamic URLs

### Phase 4: Documentation and Validation
1. Create comprehensive environment variable documentation
2. Add configuration validation scripts
3. Update deployment guides for Render and Vercel
4. Implement automated configuration testing

## Security Considerations

### 1. Environment Variable Security
- Sensitive URLs should not be logged
- Use secure environment variable injection in containers
- Validate URL formats to prevent injection attacks

### 2. CORS Configuration
- Dynamically configure allowed origins
- Support multiple frontend URLs for different environments
- Validate origin URLs at startup

### 3. Health Check Security
- Use internal health check endpoints when possible
- Implement authentication for sensitive health checks
- Configure appropriate timeouts and retry logic

## Performance Considerations

### 1. Configuration Loading
- Load environment variables once at startup
- Cache configuration values to avoid repeated parsing
- Use lazy loading for optional configuration

### 2. Health Check Optimization
- Configure appropriate health check intervals
- Use lightweight health check endpoints
- Implement circuit breaker patterns for external dependencies

## Deployment Configuration Examples

### Render Backend Configuration
```bash
API_BASE_URL=https://your-app.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
HEALTH_CHECK_URL=https://your-app.onrender.com/api/health
```

### Vercel Frontend Configuration
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
```

### Docker Environment Variables
```yaml
environment:
  - API_URL=${API_URL:-http://backend:3000/api}
  - FRONTEND_URL=${FRONTEND_URL:-http://frontend:80}
  - HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-http://localhost:3000/api/health}
```