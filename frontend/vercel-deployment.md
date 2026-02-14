# Vercel Frontend Deployment Configuration

This document provides comprehensive configuration templates and instructions for deploying the healthcare platform frontend to Vercel.

## Quick Setup

### 1. Environment Variables Template

Add these environment variables in your Vercel project dashboard:

```bash
# =============================================================================
# VERCEL FRONTEND ENVIRONMENT VARIABLES
# =============================================================================

# =============================================================================
# CORE CONFIGURATION
# =============================================================================
NODE_ENV=production

# =============================================================================
# API CONFIGURATION (CRITICAL FOR DEPLOYMENT)
# =============================================================================

# Backend API URL - Replace with your actual backend deployment URL
# Render: https://your-backend.onrender.com/api
# Heroku: https://your-app.herokuapp.com/api
# Railway: https://your-app.up.railway.app/api
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api

# WebSocket/Socket.IO URL - Replace with your actual backend deployment URL
# Should be the same as API URL but without the /api suffix
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com

# Frontend URL - Your Vercel deployment URL (for CORS configuration)
# This will be automatically set by Vercel, but you can override if needed
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend.vercel.app

# =============================================================================
# BUILD-TIME CONFIGURATION
# =============================================================================

# Angular build configuration
NG_BUILD_ENV=production

# Enable Angular production optimizations
NG_BUILD_OPTIMIZATION=true

# Enable source maps for debugging (optional)
NG_BUILD_SOURCE_MAP=false

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# Content Security Policy (optional)
CSP_ENABLED=true

# Enable HTTPS redirect (Vercel handles this automatically)
HTTPS_REDIRECT=true
```

### 2. Vercel Configuration Files

#### vercel.json (Project Configuration)

```json
{
  "version": 2,
  "name": "healthcare-platform-frontend",
  "framework": "angular",
  
  "buildCommand": "npm run build:prod",
  "outputDirectory": "dist/healthcare-platform-frontend",
  "installCommand": "npm ci",
  
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend.onrender.com/api/$1",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ],
  
  "env": {
    "NODE_ENV": "production",
    "NG_BUILD_ENV": "production"
  },
  
  "build": {
    "env": {
      "NODE_ENV": "production",
      "NG_BUILD_ENV": "production"
    }
  },
  
  "functions": {
    "app/api/**/*.js": {
      "runtime": "@vercel/node"
    }
  }
}
```

### 3. Angular Environment Configuration

#### environment.prod.ts (Production Environment)

```typescript
export const environment = {
  production: true,
  
  // API Configuration - Uses environment variables with fallbacks
  apiUrl: process.env['NEXT_PUBLIC_API_URL'] || 
          (typeof window !== 'undefined' ? window.location.origin + '/api' : '/api'),
  
  socketUrl: process.env['NEXT_PUBLIC_SOCKET_URL'] || 
             (typeof window !== 'undefined' ? window.location.origin : ''),
  
  // Frontend URL for CORS and redirects
  frontendUrl: process.env['NEXT_PUBLIC_FRONTEND_URL'] || 
               (typeof window !== 'undefined' ? window.location.origin : ''),
  
  // Feature flags
  enableAnalytics: true,
  enableErrorReporting: true,
  enablePerformanceMonitoring: true,
  
  // Security settings
  enableCSP: process.env['CSP_ENABLED'] === 'true',
  httpsRedirect: process.env['HTTPS_REDIRECT'] === 'true'
};
```

## Step-by-Step Deployment Guide

### Step 1: Prepare Your Repository

1. Ensure your frontend code is in the `frontend/` directory
2. Verify `package.json` has the correct build scripts:
   ```json
   {
     "scripts": {
       "build": "ng build",
       "build:prod": "ng build --configuration production",
       "start": "ng serve",
       "test": "ng test --watch=false --browsers=ChromeHeadless"
     }
   }
   ```

### Step 2: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Angular
   - **Root Directory**: frontend
   - **Build Command**: `npm run build:prod`
   - **Output Directory**: `dist/healthcare-platform-frontend`
   - **Install Command**: `npm ci`

### Step 3: Configure Environment Variables

1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add each environment variable from the template above
3. **Critical Variables** (must be set):
   - `NEXT_PUBLIC_API_URL` (your backend API URL)
   - `NEXT_PUBLIC_SOCKET_URL` (your backend WebSocket URL)
   - `NODE_ENV=production`

### Step 4: Configure Build Settings

1. In Vercel dashboard, go to "Settings" → "General"
2. Set build configuration:
   - **Framework**: Angular
   - **Root Directory**: frontend
   - **Build Command**: `npm run build:prod`
   - **Output Directory**: `dist/healthcare-platform-frontend`

### Step 5: Deploy

1. Click "Deploy" or push to your configured branch
2. Vercel will automatically build and deploy your application
3. Monitor the build logs for any errors
4. Test your application endpoints

## Environment Variable Configuration Script

Create a script to help configure environment variables:

```javascript
// scripts/configure-vercel-env.js
const { execSync } = require('child_process');

const envVars = {
  'NODE_ENV': 'production',
  'NEXT_PUBLIC_API_URL': process.env.BACKEND_URL || 'https://your-backend.onrender.com/api',
  'NEXT_PUBLIC_SOCKET_URL': process.env.BACKEND_URL?.replace('/api', '') || 'https://your-backend.onrender.com',
  'NG_BUILD_ENV': 'production',
  'NG_BUILD_OPTIMIZATION': 'true',
  'NG_BUILD_SOURCE_MAP': 'false'
};

console.log('🚀 Configuring Vercel Environment Variables...\n');

Object.entries(envVars).forEach(([key, value]) => {
  try {
    execSync(`vercel env add ${key} production`, { 
      input: value,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log(`✅ Set ${key}=${value}`);
  } catch (error) {
    console.log(`❌ Failed to set ${key}: ${error.message}`);
  }
});

console.log('\n✅ Environment variables configured!');
console.log('Run "vercel --prod" to deploy with new configuration.');
```

## Build Optimization

### Angular Build Configuration

Update `angular.json` for optimized production builds:

```json
{
  "projects": {
    "healthcare-platform-frontend": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "6kb",
                  "maximumError": "10kb"
                }
              ],
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              "outputHashing": "all",
              "sourceMap": false,
              "namedChunks": false,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true,
              "optimization": true,
              "aot": true
            }
          }
        }
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors
   - Ensure Angular CLI version compatibility

2. **API Connection Issues**
   - Verify `NEXT_PUBLIC_API_URL` is correctly set
   - Check CORS configuration on backend
   - Ensure backend is accessible from Vercel
   - Test API endpoints manually

3. **Environment Variable Issues**
   - Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
   - Check that variables are set in Vercel dashboard
   - Verify environment variable names match exactly
   - Test with `console.log(process.env)` in development

4. **Routing Issues**
   - Verify `vercel.json` routes configuration
   - Check that all routes redirect to `index.html`
   - Test deep linking and page refresh

### Performance Optimization

1. **Bundle Size Optimization**
   - Use Angular's built-in tree shaking
   - Implement lazy loading for routes
   - Optimize images and assets
   - Use Vercel's automatic compression

2. **Caching Strategy**
   - Configure appropriate cache headers
   - Use Vercel's Edge Network
   - Implement service worker for offline support

3. **Build Performance**
   - Use `npm ci` instead of `npm install`
   - Enable build caching in Vercel
   - Optimize Angular build configuration

## Security Configuration

### Content Security Policy

Add CSP headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://your-backend.onrender.com wss://your-backend.onrender.com; font-src 'self' data:;"
        }
      ]
    }
  ]
}
```

### Environment Variable Security

- Never expose sensitive backend secrets in frontend environment variables
- Use `NEXT_PUBLIC_` prefix only for variables that should be publicly accessible
- Validate all environment variables at build time
- Monitor for exposed secrets in client-side code

## Monitoring and Analytics

### Error Tracking

Integrate error tracking in your Angular application:

```typescript
// src/app/services/error-tracking.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {
  constructor() {
    if (environment.enableErrorReporting) {
      // Initialize error tracking service
      this.initializeErrorTracking();
    }
  }

  private initializeErrorTracking() {
    // Configure error tracking (e.g., Sentry, LogRocket)
  }
}
```

### Performance Monitoring

Monitor application performance:

```typescript
// src/app/services/performance.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  constructor() {
    if (environment.enablePerformanceMonitoring) {
      this.initializePerformanceMonitoring();
    }
  }

  private initializePerformanceMonitoring() {
    // Configure performance monitoring
  }
}
```

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Angular on Vercel](https://vercel.com/guides/deploying-angular-with-vercel)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Build Configuration](https://vercel.com/docs/concepts/projects/project-configuration)
- [Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)