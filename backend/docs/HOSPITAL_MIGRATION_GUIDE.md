# Hospital Feature Database Migration Guide

## Overview

This guide covers the database migration process for the Hospital Feature, which enables hospitals to register, get verified by admins, and access patient medical data via secure API endpoints.

## What the Migration Does

### 1. Hospital Collection
- Creates a new `hospitals` collection with proper schema
- Adds indexes for optimal query performance:
  - Unique index on `email`
  - Unique index on `registrationNumber`
  - Unique sparse index on `apiKey`
  - Index on `verificationStatus`
  - Compound index on `verificationStatus + createdAt`
  - Index on `isActive`

### 2. Enhanced Patient Collection
- Adds new medical fields to existing patients:
  - `emergencyContact` - Emergency contact information
  - `chronicConditions` - List of chronic medical conditions
  - `currentMedications` - Current medications and dosages
  - `pastSurgeries` - Surgical history
  - `vaccinations` - Vaccination records
  - `extractedSymptoms` - Auto-extracted symptoms from chats
  - `vitalSigns` - Vital signs history
  - `labResults` - Laboratory test results

- Adds indexes for hospital API queries:
  - Index on `bloodGroup` (critical for emergencies)
  - Index on `emergencyContact.phone`
  - Index on `extractedSymptoms.symptom`
  - Index on `extractedSymptoms.extractedAt`
  - Index on `chronicConditions.condition`
  - Index on `currentMedications.name`
  - Index on `vitalSigns.recordedAt`
  - Index on `labResults.date`
  - Index on `isActive`

## Migration Commands

### Run Migration
```bash
# Using npm script (recommended)
npm run migrate:hospital

# Or directly
node scripts/migrate-hospital-feature.js
```

### Verify Migration
```bash
# Using npm script (recommended)
npm run migrate:hospital:verify

# Or directly
node scripts/verify-hospital-migration.js
```

### Rollback Migration (if needed)
```bash
# Using npm script (recommended)
npm run migrate:hospital:rollback

# Or directly
node scripts/rollback-hospital-feature.js
```

## Migration Process

### Step 1: Pre-Migration Checklist
- [ ] Backup your database
- [ ] Ensure `.env` file has correct `MONGODB_URI`
- [ ] Stop all running application instances
- [ ] Verify you have sufficient disk space

### Step 2: Run Migration
```bash
cd backend
npm run migrate:hospital
```

Expected output:
```
MongoDB Connected for Hospital Feature Migration
Starting Hospital Feature database migration...

1. Creating indexes for Hospital collection...
✓ Created unique index on Hospital.email
✓ Created unique index on Hospital.registrationNumber
...

=== Migration Summary ===
✓ Hospital collection indexes created
✓ Patient collection indexes created
✓ X patients updated with new fields
✓ Data validation completed
========================
```

### Step 3: Verify Migration
```bash
npm run migrate:hospital:verify
```

Expected output:
```
=== Verification Summary ===
✅ All verification checks PASSED
Hospital Feature migration is successful and ready for use!
============================
```

### Step 4: Test Application
1. Start your backend server
2. Test hospital registration endpoint
3. Test admin hospital verification
4. Test hospital API access

## Troubleshooting

### Common Issues

#### 1. Index Creation Errors
**Error:** `E11000 duplicate key error`
**Solution:** 
- Check for duplicate emails or registration numbers
- Clean up duplicate data before re-running migration

#### 2. Connection Errors
**Error:** `MongoNetworkError: failed to connect`
**Solution:**
- Verify `MONGODB_URI` in `.env` file
- Ensure MongoDB server is running
- Check network connectivity

#### 3. Permission Errors
**Error:** `not authorized on database`
**Solution:**
- Verify database user has read/write permissions
- Check MongoDB authentication credentials

#### 4. Memory Issues
**Error:** `JavaScript heap out of memory`
**Solution:**
- Run migration during low-traffic periods
- Increase Node.js memory limit: `node --max-old-space-size=4096 scripts/migrate-hospital-feature.js`

### Recovery Procedures

#### If Migration Fails Midway
1. Check the error message in the console
2. Fix the underlying issue
3. Re-run the migration (it's safe to run multiple times)
4. Verify with the verification script

#### If You Need to Rollback
```bash
npm run migrate:hospital:rollback
```
**⚠️ WARNING:** This will permanently delete:
- All hospital registrations
- All hospital API credentials
- Enhanced patient medical records
- All related database indexes

## Performance Impact

### During Migration
- **Duration:** 1-5 minutes depending on database size
- **CPU Usage:** Moderate (index creation)
- **Memory Usage:** Low to moderate
- **Disk I/O:** High during index creation

### After Migration
- **Query Performance:** Improved due to proper indexing
- **Storage Overhead:** ~10-20% increase for enhanced patient fields
- **Index Overhead:** ~5-10% increase for new indexes

## Data Safety

### What's Preserved
- ✅ All existing patient data
- ✅ All existing doctor data
- ✅ All existing admin accounts
- ✅ All existing cases and messages
- ✅ All existing authentication tokens

### What's Added
- ✅ New Hospital collection
- ✅ Enhanced patient medical fields (initialized as empty)
- ✅ Database indexes for performance

### What's Never Touched
- ✅ Existing patient core data (name, email, password, etc.)
- ✅ Existing relationships between patients and doctors
- ✅ Existing case history and messages

## Post-Migration Tasks

### 1. Update Application Code
Ensure your application code is updated to use the new hospital features:
- Hospital registration endpoints
- Hospital authentication middleware
- Patient data API endpoints
- Admin hospital management

### 2. Test Critical Paths
- [ ] Hospital registration flow
- [ ] Admin verification process
- [ ] Hospital API authentication
- [ ] Patient data retrieval via API
- [ ] Symptom extraction functionality

### 3. Monitor Performance
- Check query performance on hospital endpoints
- Monitor API response times
- Verify index usage with MongoDB explain plans

### 4. Update Documentation
- Update API documentation
- Update user guides
- Update deployment procedures

## Rollback Procedure

If you need to completely remove the hospital feature:

### 1. Backup Current State
```bash
mongodump --uri="your_mongodb_uri" --out=backup_before_rollback
```

### 2. Run Rollback Script
```bash
npm run migrate:hospital:rollback
```

### 3. Verify Rollback
- Check that Hospital collection is removed
- Verify enhanced patient fields are removed
- Test existing application functionality

### 4. Restore Application
- Revert application code changes
- Remove hospital-related routes and middleware
- Update documentation

## Monitoring and Maintenance

### Regular Checks
- Monitor hospital collection growth
- Check index usage and performance
- Verify data integrity of enhanced patient fields

### Optimization
- Consider archiving old hospital API access logs
- Monitor and optimize slow queries
- Regular database maintenance (reindex if needed)

## Support

If you encounter issues during migration:

1. **Check Logs:** Review console output for specific error messages
2. **Verify Environment:** Ensure `.env` configuration is correct
3. **Test Connection:** Verify database connectivity
4. **Check Resources:** Ensure sufficient disk space and memory
5. **Backup First:** Always backup before attempting fixes

For additional support, refer to:
- Backend logs in `backend/logs/`
- MongoDB logs
- Application error tracking
- Database monitoring tools

## Version Compatibility

- **Node.js:** >= 14.x
- **MongoDB:** >= 4.4
- **Mongoose:** >= 7.x
- **Backend Dependencies:** See `package.json`

## Security Considerations

- Hospital API credentials are generated securely
- Passwords are properly hashed
- Indexes don't expose sensitive data
- Migration preserves existing security measures
- No sensitive data is logged during migration