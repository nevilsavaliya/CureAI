# Hospital Feature Deployment Checklist

## Pre-Deployment

### Database Migration
- [ ] **Backup Production Database**
  ```bash
  mongodump --uri="production_mongodb_uri" --out=backup_$(date +%Y%m%d_%H%M%S)
  ```

- [ ] **Test Migration on Staging**
  ```bash
  npm run migrate:hospital
  npm run migrate:hospital:verify
  ```

- [ ] **Verify Migration Status**
  ```bash
  npm run migrate:status
  ```

### Environment Configuration
- [ ] **Update Environment Variables**
  - Verify `MONGODB_URI` is correct
  - Ensure `JWT_SECRET` is set
  - Configure `EMAIL_USER` and `EMAIL_PASSWORD` for hospital notifications
  - Set `API_RATE_LIMIT` (default: 100 requests/hour)

- [ ] **Validate Environment**
  ```bash
  npm run setup:validate
  ```

### Code Deployment
- [ ] **Deploy Backend Code**
  - Hospital models (`Hospital.js`, enhanced `Patient.js`)
  - Hospital controllers (`hospitalController.js`, `hospitalAdminController.js`)
  - Hospital routes (`hospitalRoutes.js`, `hospitalAdminRoutes.js`)
  - Hospital middleware (`hospitalApiAuth.js`)
  - Email service enhancements

- [ ] **Deploy Frontend Code**
  - Hospital components (registration, login, dashboard)
  - Admin hospital management components
  - Hospital service and guards
  - Updated routing

## Deployment Steps

### 1. Database Migration (Production)
```bash
# Run during maintenance window
npm run migrate:hospital

# Verify immediately
npm run migrate:hospital:verify

# Check status
npm run migrate:status
```

### 2. Application Deployment
- [ ] **Deploy Backend**
  - Stop existing backend processes
  - Deploy new code
  - Start backend services
  - Verify health endpoints

- [ ] **Deploy Frontend**
  - Build production assets
  - Deploy to web server
  - Clear CDN cache if applicable
  - Verify static assets load

### 3. Service Verification
- [ ] **Backend Health Check**
  ```bash
  curl -X GET http://your-api-url/health
  ```

- [ ] **Database Connection**
  ```bash
  curl -X GET http://your-api-url/api/admin/hospitals
  ```

- [ ] **Hospital Endpoints**
  - Test hospital registration endpoint
  - Test hospital login endpoint
  - Test hospital API authentication
  - Test admin hospital management

## Post-Deployment Testing

### Critical Path Testing
- [ ] **Hospital Registration Flow**
  1. Register new hospital
  2. Verify email sent
  3. Check admin can see pending hospital
  4. Admin verifies hospital
  5. Hospital receives API credentials
  6. Hospital can login to dashboard

- [ ] **Hospital API Access**
  1. Hospital authenticates with API credentials
  2. Hospital requests patient data
  3. Verify patient data returned correctly
  4. Check access logging works
  5. Verify rate limiting works

- [ ] **Admin Management**
  1. Admin can view all hospitals
  2. Admin can verify/reject hospitals
  3. Admin can revoke hospital access
  4. Admin can view hospital details

### Performance Testing
- [ ] **Database Performance**
  - Check query response times
  - Verify index usage
  - Monitor memory usage
  - Check connection pool

- [ ] **API Performance**
  - Test hospital API response times
  - Verify rate limiting works correctly
  - Check concurrent request handling
  - Monitor error rates

### Security Testing
- [ ] **Authentication**
  - Verify JWT tokens work correctly
  - Test API key/secret authentication
  - Check password hashing
  - Verify session management

- [ ] **Authorization**
  - Test role-based access control
  - Verify hospital can only access allowed endpoints
  - Check admin-only endpoints are protected
  - Test API rate limiting

## Monitoring Setup

### Application Monitoring
- [ ] **Error Tracking**
  - Configure error logging for hospital endpoints
  - Set up alerts for API failures
  - Monitor authentication failures
  - Track hospital registration errors

- [ ] **Performance Monitoring**
  - Monitor hospital API response times
  - Track database query performance
  - Monitor memory and CPU usage
  - Set up alerts for slow queries

### Business Metrics
- [ ] **Hospital Metrics**
  - Track hospital registration rate
  - Monitor verification time
  - Track API usage per hospital
  - Monitor patient data access frequency

- [ ] **Admin Metrics**
  - Track admin verification actions
  - Monitor pending hospital queue
  - Track rejection reasons
  - Monitor admin response time

## Rollback Plan

### If Critical Issues Found
1. **Immediate Actions**
   - Stop accepting new hospital registrations
   - Disable hospital API endpoints
   - Notify stakeholders

2. **Rollback Database**
   ```bash
   npm run migrate:hospital:rollback
   ```

3. **Rollback Application**
   - Deploy previous version of backend
   - Deploy previous version of frontend
   - Verify core functionality works

4. **Restore from Backup** (if needed)
   ```bash
   mongorestore --uri="production_mongodb_uri" backup_folder/
   ```

## Success Criteria

### Technical Success
- [ ] All migration scripts run without errors
- [ ] All hospital endpoints respond correctly
- [ ] Database performance is acceptable
- [ ] No increase in error rates
- [ ] All tests pass

### Business Success
- [ ] Hospitals can register successfully
- [ ] Admin can verify hospitals efficiently
- [ ] Hospital API access works reliably
- [ ] Patient data is accessible to verified hospitals
- [ ] Email notifications are sent correctly

## Post-Deployment Tasks

### Documentation Updates
- [ ] Update API documentation
- [ ] Update user guides
- [ ] Update admin procedures
- [ ] Update troubleshooting guides

### Training and Communication
- [ ] Train admin users on hospital verification
- [ ] Communicate new features to stakeholders
- [ ] Provide hospital registration instructions
- [ ] Update support documentation

### Ongoing Maintenance
- [ ] Schedule regular database maintenance
- [ ] Plan for hospital data archival
- [ ] Monitor and optimize performance
- [ ] Plan for future enhancements

## Emergency Contacts

### Technical Team
- Backend Developer: [contact info]
- Frontend Developer: [contact info]
- Database Administrator: [contact info]
- DevOps Engineer: [contact info]

### Business Team
- Product Manager: [contact info]
- Admin Users: [contact info]
- Support Team: [contact info]

## Notes

- **Maintenance Window:** Schedule during low-traffic hours
- **Communication:** Notify users of any expected downtime
- **Backup Retention:** Keep backups for at least 30 days
- **Documentation:** Update all relevant documentation post-deployment