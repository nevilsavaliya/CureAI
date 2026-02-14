# Database Scripts

## ⚠️ IMPORTANT: Admin Account Protection

**ALL database cleanup/reset scripts preserve the admin account:**
- Email: `admin@gmail.com`
- Password: `Admin@123`

**This admin account should NEVER be deleted!**

## Available Scripts

### 1. Create Admin Account
```bash
node backend/scripts/create-admin.js
```
Creates or restores the admin account. Run this if admin was accidentally deleted.

### 2. Enhanced Database Cleanup (Recommended)
```bash
# Interactive mode with confirmation
npm run cleanup

# Preview what would be deleted (dry run)
npm run cleanup:dry-run

# Delete only messages
npm run cleanup:messages

# Delete only symptom conversations
npm run cleanup:conversations

# Delete only cases (requires extra confirmation)
npm run cleanup:cases

# Delete everything (messages, conversations, cases)
npm run cleanup:all

# Skip confirmation prompts
npm run cleanup -- --yes
```

**Features:**
- Selective cleanup of messages, symptom conversations, and cases
- Dry-run mode to preview changes
- Interactive confirmation prompts
- Detailed logging with timestamps
- Preserves all user accounts, doctor profiles, hospital data, and system configuration
- Clears extracted symptoms from patient records
- Shows affected record counts

**What is preserved:**
- ✓ User accounts (Patients, Doctors, Admins)
- ✓ Hospital information
- ✓ Doctor profiles and specializations
- ✓ Subscription data
- ✓ System configuration
- ✓ Audit logs

**What is removed:**
- Messages (optional)
- Symptom conversations (optional)
- Cases (optional, requires extra confirmation)
- Extracted symptoms from patient records

### 3. Clean Database (Legacy)
```bash
node backend/scripts/cleanDatabase.js
```
Use the new `npm run cleanup` commands instead for better control.

### 4. Reset Database
```bash
node backend/scripts/reset-database.js
```
- Deletes all data from all collections
- **Preserves admin@gmail.com account**
- 3-second delay before execution (can cancel with Ctrl+C)

### 5. Quick Reset
```bash
node backend/scripts/quick-reset.js
```
- Drops entire database and recreates it
- **Automatically restores admin account**
- No confirmation delay
- Fastest method

### 6. Seed Data
```bash
node backend/scripts/seedData.js
```
- Populates database with sample data
- Creates test patients and doctors
- **Preserves existing admin**

### 7. Migrate Users (Legacy)
```bash
node backend/scripts/migrateUsers.js
```
- Migrates old User collection to separate Patient/Doctor/Admin collections
- **Preserves existing admin**
- Only needed for legacy database upgrades

### 8. Hospital Feature Migration
```bash
node backend/scripts/migrate-hospital-feature.js
```
- Creates Hospital collection with proper indexes
- Adds enhanced medical fields to Patient collection
- Creates all necessary database indexes for hospital API access
- Migrates existing patient data to include new fields
- **Safe to run multiple times**

### 9. Verify Hospital Migration
```bash
node backend/scripts/verify-hospital-migration.js
```
- Verifies Hospital Feature migration was successful
- Tests all indexes and model functionality
- Runs performance checks
- **Non-destructive verification only**

### 10. Rollback Hospital Feature
```bash
node backend/scripts/rollback-hospital-feature.js
```
- **⚠️ DESTRUCTIVE:** Removes Hospital collection entirely
- Removes enhanced medical fields from Patient collection
- Drops all hospital-related indexes
- **Requires confirmation prompt**
- Use only if you need to completely remove hospital functionality

### 11. Check Migration Status
```bash
node backend/scripts/check-migration-status.js
```
- **Non-destructive:** Quick status check of all migrations
- Shows Hospital Feature migration status
- Displays database health information
- Shows collection and index counts

## Cleanup Script Examples

### Example 1: Preview cleanup (safe)
```bash
npm run cleanup:dry-run
```
Shows what would be deleted without making any changes.

### Example 2: Clean messages and conversations
```bash
npm run cleanup
```
Removes messages and symptom conversations with confirmation prompt.

### Example 3: Clean everything including cases
```bash
npm run cleanup:all
```
Removes messages, conversations, and cases (requires multiple confirmations).

### Example 4: Automated cleanup (CI/CD)
```bash
npm run cleanup -- --messages --conversations --yes
```
Removes messages and conversations without prompts (useful for automated scripts).

## Admin Account Details

The admin account is protected in all scripts:
- **Email:** admin@gmail.com
- **Password:** Admin@123
- **Role:** admin

If you need to restore the admin account, run:
```bash
node backend/scripts/create-admin.js
```

## Notes

- Always use these scripts instead of manually dropping collections
- The admin account is essential for system administration
- All scripts connect to the database specified in `.env` file
- Scripts will create the admin account if it doesn't exist
- Use `--dry-run` flag to preview changes before executing
- All cleanup operations are logged with timestamps
