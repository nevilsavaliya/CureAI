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

### 2. Clean Database (Recommended)
```bash
node backend/scripts/cleanDatabase.js
```
- Deletes all patients, doctors, cases, messages, etc.
- **Preserves admin account**
- Safe for regular cleanup

### 3. Reset Database
```bash
node backend/scripts/reset-database.js
```
- Deletes all data from all collections
- **Preserves admin@gmail.com account**
- 3-second delay before execution (can cancel with Ctrl+C)

### 4. Quick Reset
```bash
node backend/scripts/quick-reset.js
```
- Drops entire database and recreates it
- **Automatically restores admin account**
- No confirmation delay
- Fastest method

### 5. Seed Data
```bash
node backend/scripts/seedData.js
```
- Populates database with sample data
- Creates test patients and doctors
- **Preserves existing admin**

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
