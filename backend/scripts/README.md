# Database Scripts

This directory contains scripts for database management and seeding.

## Migration Script

### migrateUsers.js

Migrates existing user data from the old `users` collection to separate `patients`, `doctors`, and `admins` collections.

**Purpose:**
- Move patient users to `patients` collection
- Move doctor users to `doctors` collection  
- Move admin users to `admins` collection
- Create hardcoded admin user (admin@gmail.com / admin@123) if it doesn't exist

**Usage:**

```bash
cd backend
node scripts/migrateUsers.js
```

**What it does:**
1. Connects to MongoDB using MONGODB_URI from .env
2. Checks if User collection has any documents
3. Migrates each user to the appropriate collection based on role
4. Preserves all existing data (passwords remain hashed)
5. Skips users that already exist in target collections
6. Creates hardcoded admin if not present
7. Displays migration summary

**Important Notes:**
- The script does NOT delete the old User collection
- To remove the old collection, manually run: `db.users.drop()` in MongoDB shell
- Safe to run multiple times (skips existing records)
- Passwords are preserved in their hashed form

## Seed Data Script

### seedData.js

Populates the database with sample data for development and testing.

**Purpose:**
- Clear existing data from patients, doctors, and admins collections
- Create sample patients with blood group data
- Create registered doctors with active subscriptions
- Create hardcoded admin user

**Usage:**

```bash
cd backend
node scripts/seedData.js
```

**What it creates:**

**Admin:**
- Email: admin@gmail.com
- Password: admin@123

**Patients:**
1. John Doe (john@patient.com / patient123) - Blood Group: O+
2. Jane Smith (jane@patient.com / patient123) - Blood Group: A+

**Doctors (all with active subscriptions):**
1. Dr. Sarah Johnson (sarah@doctor.com / doctor123) - General Medicine, 10 years
2. Dr. Michael Chen (michael@doctor.com / doctor123) - Cardiology, 15 years
3. Dr. Emily Brown (emily@doctor.com / doctor123) - Dermatology, 8 years
4. Dr. Robert Williams (robert@doctor.com / doctor123) - Neurology, 12 years
5. Dr. Lisa Anderson (lisa@doctor.com / doctor123) - Orthopedics, 11 years

**Important Notes:**
- ⚠️ This script DELETES all existing data in patients, doctors, and admins collections
- All doctors have active subscriptions (30-day validity)
- All passwords are automatically hashed before storage
- Use this for development/testing only, NOT in production

## Recommended Workflow

### For New Setup:
```bash
# Just run seed data to populate fresh database
node scripts/seedData.js
```

### For Migration from Old Schema:
```bash
# 1. First migrate existing users
node scripts/migrateUsers.js

# 2. Optionally add more sample data (will not affect migrated users)
node scripts/seedData.js
```

## Environment Variables

Both scripts require the following environment variable in your `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/healthcare-platform
```

Or for MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform
```
