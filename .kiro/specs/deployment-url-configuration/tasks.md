# Implementation Plan

- [x] 1. Update backend environment variable configuration
  - Replace hardcoded CORS origins with environment variable configuration
  - Add comprehensive environment variable validation at server startup
  - Update server.js to use dynamic URL configuration from environment variables
  - _Requirements: 1.1, 1.5, 3.1, 3.3_

- [x] 2. Fix Docker health check configurations
  - [x] 2.1 Update backend Dockerfile health check to use environment variables
    - Replace hardcoded localhost:3000 with configurable HEALTH_CHECK_URL
    - Add fallback logic for health check URL configuration
    - _Requirements: 1.4, 4.1, 4.4_
  
  - [x] 2.2 Update frontend Dockerfile health check to use environment variables
    - Replace hardcoded localhost:80 with configurable frontend health check URL
    - Add support for both HTTP and HTTPS health check protocols
    - _Requirements: 1.4, 4.1, 4.2_

- [x] 3. Replace hardcoded URLs in frontend Angular services
  - [x] 3.1 Update environment configuration files
    - Modify environment.ts and environment.prod.ts to support dynamic API URLs
    - Add Socket.IO URL configuration to environment files
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [x] 3.2 Replace hardcoded API URLs in Angular services
    - Update admin.service.ts to use environment-based API URL
    - Update user-management.service.ts to use environment-based API URL
    - Update subscription.service.ts to use environment-based API URL
    - Update socket.service.ts to use environment-based Socket URL
    - _Requirements: 2.1, 2.3, 2.5_
  
  - [x] 3.3 Update test files to use configurable URLs
    - Update admin.service.spec.ts to use environment-based test URLs
    - Ensure all test configurations use dynamic URL resolution
    - _Requirements: 2.1, 2.3_

- [x] 4. Create environment variable validation system
  - [x] 4.1 Implement backend environment validation service
    - Create comprehensive validation for all required environment variables
    - Add URL format validation for API_URL, FRONTEND_URL, and MONGODB_URI
    - Implement startup validation with clear error messages for missing variables
    - _Requirements: 1.5, 3.5, 5.3, 5.4_
  
  - [x] 4.2 Add CORS configuration validation
    - Validate CORS_ORIGINS environment variable format
    - Support multiple frontend URLs through comma-separated configuration
    - Add fallback CORS configuration for development environments
    - _Requirements: 3.1, 3.3, 5.4_

- [x] 5. Update configuration files and documentation
  - [x] 5.1 Update environment example files
    - Update backend/.env.example with all required URL environment variables
    - Add comprehensive comments explaining each URL configuration option
    - Include examples for Render and Vercel deployment configurations
    - _Requirements: 5.1, 5.2_
  
  - [x] 5.2 Update Docker Compose configurations
    - Update docker-compose.yml to use environment variables for health checks
    - Update docker-compose.ssl.yml to use configurable HTTPS URLs
    - Add environment variable support for all hardcoded localhost references
    - _Requirements: 1.1, 4.1, 4.3_

- [x] 6. Create deployment configuration templates
  - [x] 6.1 Create Render deployment configuration
    - Create environment variable template for Render backend deployment
    - Document required environment variables for Render platform
    - Add health check configuration for Render deployment
    - _Requirements: 5.1, 5.2, 4.1_
  
  - [x] 6.2 Create Vercel deployment configuration
    - Create environment variable template for Vercel frontend deployment
    - Document API URL configuration for Vercel platform
    - Add build-time environment variable configuration
    - _Requirements: 5.1, 5.2, 2.2_

- [x] 7. Add comprehensive testing for URL configuration
  - [x] 7.1 Create environment variable validation tests
    - Write unit tests for environment variable validation logic
    - Test various URL format scenarios and error handling
    - _Requirements: 1.5, 5.4_
  
  - [x] 7.2 Create integration tests for cross-service communication
    - Test frontend-backend communication with configured URLs
    - Validate Socket.IO connections with environment-based URLs
    - _Requirements: 2.5, 3.1_

- [x] 8. Update SSL and security configurations
  - [x] 8.1 Update SSL configuration to use environment variables
    - Replace hardcoded localhost in SSL certificate generation
    - Add support for dynamic domain configuration in SSL setup
    - _Requirements: 4.2, 4.3_
  
  - [x] 8.2 Update security middleware for dynamic URLs
    - Ensure security headers work with configurable frontend URLs
    - Update HTTPS redirect middleware to use environment-based URLs
    - _Requirements: 3.1, 4.2_