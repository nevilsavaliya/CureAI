# Database Reset Guide

## Overview
This guide explains how to safely delete all data from MongoDB and start fresh.

## ⚠️ WARNING
**These operations will permanently delete ALL data from your database!**
- All patients, doctors, and admins
- All cases and messages
- All notifications and consultations
- All OTPs and user records

**Make sure you have backups if needed!**

## Methods to Reset Database

### Method 1: Safe Reset (Recommended)
This method shows you what will be deleted and gives you 3 seconds to cancel.

```bash
cd backend
npm run reset
```

**What it does:**
1. Connects to MongoDB
2. Shows current data count for each collection
3. Waits 3 seconds (you can press Ctrl+C to cancel)
4. Deletes all documents from all collections
5. Shows summary of deleted data

**Output Example:**
```
============================================================
DATABASE RESET SCRIPT
============================================================

⚠️  WARNING: This will delete ALL data from the database!

Connecting to: mongodb://localhost:27017/healthcare-platform
✓ Connected to database

Current Database State:
------------------------------------------------------------
  Patients: 15 documents
  Doctors: 8 documents
  Admins: 2 documents
  Cases: 42 documents
  Messages: 156 documents
  Notifications: 89 documents
  Consultations: 12 documents
  OTPs: 3 documents
  Users: 0 documents

Deleting all data...
------------------------------------------------------------
  ✓ Patients: 15 documents deleted
  ✓ Doctors: 8 documents deleted
  ✓ Admins: 2 documents deleted
  ✓ Cases: 42 documents deleted
  ✓ Messages: 156 documents deleted
  ✓ Notifications: 89 documents deleted
  ✓ Consultations: 12 documents deleted
  ✓ OTPs: 3 documents deleted
  ✓ Users: 0 documents deleted

============================================================
DATABASE RESET COMPLETE!
============================================================

Total documents deleted: 327

The database is now empty and ready for fresh data.
```

### Method 2: Quick Reset (Instant)
This method immediately drops the entire database without confirmation.

```bash
cd backend
npm run reset:quick
```

**What it does:**
1. Connects to MongoDB
2. Drops the entire database immediately
3. No confirmation, no delay

**Use this when:**
- You're absolutely sure you want to delete everything
- You're in development and need to reset quickly
- You don't need to see what's being deleted

### Method 3: Manual MongoDB Commands
If you prefer using MongoDB directly:

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use healthcare-platform

# Drop entire database
db.dropDatabase()

# Or delete specific collections
db.patients.deleteMany({})
db.doctors.deleteMany({})
db.cases.deleteMany({})
db.messages.deleteMany({})
db.notifications.deleteMany({})
db.consultations.deleteMany({})
db.otps.deleteMany({})
db.admins.deleteMany({})
db.users.deleteMany({})
```

### Method 4: Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Select `healthcare-platform` database
4. Click on each collection
5. Click "Delete" → "Delete All Documents"
6. Or right-click database → "Drop Database"

## After Reset

### 1. Restart Backend Server
```bash
cd backend
npm start
```

### 2. Create Fresh Data

**Option A: Manual Testing**
- Open frontend: `http://localhost:4200`
- Sign up new patients and doctors
- Test the application from scratch

**Option B: Seed Sample Data** (if you have a seed script)
```bash
npm run seed
```

### 3. Verify Reset
Check that collections are empty:
```bash
mongosh
use healthcare-platform
db.patients.countDocuments()  // Should return 0
db.doctors.countDocuments()   // Should return 0
db.cases.countDocuments()     // Should return 0
```

## Common Use Cases

### Starting Fresh for Demo
```bash
npm run reset:quick
npm start
# Now create demo accounts via frontend
```

### Cleaning Test Data
```bash
npm run reset
# Wait for confirmation
# Creates clean slate for testing
```

### Before Production Deployment
```bash
# DON'T run reset on production!
# Only use in development/staging
```

## Safety Tips

1. **Never run on production database**
   - These scripts use `MONGODB_URI` from `.env`
   - Make sure it points to development database

2. **Backup important data**
   ```bash
   # Create backup before reset
   mongodump --db healthcare-platform --out ./backup
   
   # Restore if needed
   mongorestore --db healthcare-platform ./backup/healthcare-platform
   ```

3. **Check environment**
   ```bash
   # Verify you're in development
   echo $NODE_ENV
   # Should be 'development' or empty
   ```

4. **Double-check database URI**
   ```bash
   # Check .env file
   cat backend/.env | grep MONGODB_URI
   # Should be localhost, not production URL
   ```

## Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if needed
sudo systemctl start mongod
```

### "Permission denied"
```bash
# Run with proper permissions
sudo npm run reset
```

### "Database not found"
This is normal if database doesn't exist yet. The script will handle it gracefully.

### "Some collections not deleted"
This can happen if collections don't exist. The script will skip them and continue.

## What Gets Deleted

| Collection | Description |
|------------|-------------|
| patients | All patient accounts and medical info |
| doctors | All doctor accounts and professional details |
| admins | All admin accounts |
| cases | All medical cases and treatment records |
| messages | All case messages and chat history |
| notifications | All user notifications |
| consultations | All video consultation records |
| otps | All password reset tokens |
| users | All generic user records |

## What Doesn't Get Deleted

- Database structure (collections will be recreated automatically)
- Indexes (will be recreated when models are used)
- MongoDB configuration
- Environment variables
- Application code

## Quick Reference

```bash
# Safe reset with confirmation
npm run reset

# Quick reset without confirmation  
npm run reset:quick

# Check database status
mongosh
use healthcare-platform
db.stats()

# Count documents in all collections
db.patients.countDocuments()
db.doctors.countDocuments()
db.cases.countDocuments()
```

## Need Help?

If you encounter issues:
1. Check MongoDB is running: `sudo systemctl status mongod`
2. Verify database URI in `.env` file
3. Check logs in `backend/logs/`
4. Try manual MongoDB commands as fallback
