# Vercel Deployment Checklist

## Pre-Deployment Setup

### ✅ 1. Repository Preparation
- [ ] Ensure frontend code is in `frontend/` directory
- [ ] Verify `package.json` has correct build scripts
- [ ] Check that `angular.json` is properly configured
- [ ] Ensure all dependencies are listed in `package.json`

### ✅ 2. Environment Configuration
- [ ] Create `.env.vercel.template` with all required variables
- [ ] Identify backend API URL (e.g., Render, Heroku, Railway)
- [ ] Prepare list of environment variables to set
- [ ] Test environment variable configuration locally

### ✅ 3. Build Configuration
- [ ] Verify `vercel.json` is properly configured
- [ ] Test production build locally: `npm run build:prod`
- [ ] Check build output in `dist/healthcare-platform-frontend`
- [ ] Ensure no build errors or warnings

## Vercel Project Setup

### ✅ 4. Create Vercel Project
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click "New Project"
- [ ] Import GitHub repository
- [ ] Select correct repository and branch

### ✅ 5. Configure Project Settings
- [ ] **Framework Preset**: Angular
- [ ] **Root Directory**: `frontend`
- [ ] **Build Command**: `npm run build:prod`
- [ ] **Output Directory**: `dist/healthcare-platform-frontend`
- [ ] **Install Command**: `npm ci`
- [ ] **Node.js Version**: 18.x (recommended)

### ✅ 6. Environment Variables Setup
- [ ] Go to Project Settings → Environment Variables
- [ ] Add all required variables from template:

#### Required Variables:
- [ ] `NODE_ENV=production`
- [ ] `NG_BUILD_ENV=production`
- [ ] `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`
- [ ] `NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com`

#### Optional Variables:
- [ ] `NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app`
- [ ] `NG_BUILD_OPTIMIZATION=true`
- [ ] `NG_BUILD_SOURCE_MAP=false`
- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS=true`
- [ ] `NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true`

## Deployment Process

### ✅ 7. Initial Deployment
- [ ] Click "Deploy" in Vercel dashboard
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete
- [ ] Note the deployment URL

### ✅ 8. Post-Deployment Testing
- [ ] Visit the deployed application URL
- [ ] Test basic navigation and routing
- [ ] Check browser console for errors
- [ ] Verify API connections are working
- [ ] Test real-time features (WebSocket connections)

## Verification Steps

### ✅ 9. Functionality Testing
- [ ] **Authentication**: Login/logout functionality
- [ ] **API Calls**: All API endpoints responding correctly
- [ ] **Real-time Features**: Socket.IO connections working
- [ ] **Routing**: Deep links and page refresh working
- [ ] **Responsive Design**: Mobile and desktop layouts
- [ ] **Performance**: Page load times acceptable

### ✅ 10. Cross-Origin Testing
- [ ] Verify CORS configuration on backend
- [ ] Test API calls from deployed frontend
- [ ] Check WebSocket connections
- [ ] Verify file uploads (if applicable)
- [ ] Test authentication flows

### ✅ 11. Security Testing
- [ ] Check HTTPS is enforced
- [ ] Verify security headers are present
- [ ] Test Content Security Policy
- [ ] Check for exposed sensitive information
- [ ] Verify environment variables are not exposed

## Configuration Validation

### ✅ 12. Environment Variable Validation
- [ ] All required variables are set
- [ ] URLs are correctly formatted (HTTPS)
- [ ] No placeholder values remain
- [ ] Variables are scoped correctly (production/preview)

### ✅ 13. Build Configuration Validation
- [ ] Build command executes successfully
- [ ] Output directory contains all necessary files
- [ ] Static assets are properly served
- [ ] Routing configuration works for all routes

## Performance Optimization

### ✅ 14. Bundle Analysis
- [ ] Check bundle size warnings
- [ ] Verify code splitting is working
- [ ] Ensure lazy loading is implemented
- [ ] Check for unused dependencies

### ✅ 15. Caching Configuration
- [ ] Static assets have proper cache headers
- [ ] Service worker is configured (if applicable)
- [ ] CDN caching is optimized
- [ ] Browser caching is configured

## Monitoring Setup

### ✅ 16. Error Tracking
- [ ] Configure error tracking service (Sentry, LogRocket)
- [ ] Test error reporting functionality
- [ ] Set up error alerts
- [ ] Verify error logs are being captured

### ✅ 17. Analytics Setup
- [ ] Configure Google Analytics (if enabled)
- [ ] Set up conversion tracking
- [ ] Test analytics events
- [ ] Verify data collection

### ✅ 18. Performance Monitoring
- [ ] Set up performance monitoring
- [ ] Configure Core Web Vitals tracking
- [ ] Set up performance alerts
- [ ] Test performance metrics collection

## Domain Configuration (Optional)

### ✅ 19. Custom Domain Setup
- [ ] Purchase/configure custom domain
- [ ] Add domain to Vercel project
- [ ] Configure DNS records
- [ ] Verify SSL certificate is issued
- [ ] Test domain accessibility

### ✅ 20. SSL Configuration
- [ ] Verify SSL certificate is active
- [ ] Test HTTPS enforcement
- [ ] Check SSL rating (SSL Labs)
- [ ] Configure HSTS headers

## Final Validation

### ✅ 21. End-to-End Testing
- [ ] Complete user registration flow
- [ ] Test all major user journeys
- [ ] Verify data persistence
- [ ] Test error handling scenarios
- [ ] Validate mobile experience

### ✅ 22. Load Testing
- [ ] Test application under load
- [ ] Verify performance under stress
- [ ] Check resource utilization
- [ ] Test auto-scaling (if configured)

### ✅ 23. Backup and Recovery
- [ ] Verify deployment rollback capability
- [ ] Test preview deployments
- [ ] Configure deployment notifications
- [ ] Document recovery procedures

## Documentation

### ✅ 24. Update Documentation
- [ ] Update deployment URLs in README
- [ ] Document environment variable requirements
- [ ] Update API documentation with new URLs
- [ ] Create troubleshooting guide

### ✅ 25. Team Communication
- [ ] Notify team of deployment completion
- [ ] Share deployment URLs
- [ ] Document any configuration changes
- [ ] Update project status

## Troubleshooting Common Issues

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors
- Ensure Angular CLI version compatibility

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correctly set
- Check CORS configuration on backend
- Test API endpoints manually
- Check network tab in browser dev tools

### Environment Variable Issues
- Ensure variables are prefixed with `NEXT_PUBLIC_` for client access
- Verify variables are set in Vercel dashboard
- Check variable names match exactly
- Test with `console.log(process.env)` in development

### Routing Issues
- Verify `vercel.json` routes configuration
- Check that all routes redirect to `index.html`
- Test deep linking and page refresh
- Ensure Angular routing is properly configured

## Quick Commands

```bash
# Configure environment variables
npm run configure:vercel

# Build for production
npm run build:prod

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Angular on Vercel](https://vercel.com/guides/deploying-angular-with-vercel)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Build Configuration](https://vercel.com/docs/concepts/projects/project-configuration)