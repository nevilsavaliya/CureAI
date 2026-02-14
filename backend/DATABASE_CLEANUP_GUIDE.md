# Database Cleanup Utility Guide

## Overview

The enhanced database cleanup utility provides selective, safe cleanup of non-essential data while preserving system integrity. It includes dry-run mode, interactive confirmations, and detailed logging.

## Quick Start

### Preview Changes (Recommended First Step)
```bash
npm run cleanup:dry-run
```
Shows what would be deleted without making any changes.

### Interactive Cleanup
```bash
npm run cleanup
```
Removes messages and symptom conversations with confirmation prompts.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run cleanup` | Interactive cleanup of messages and conversations |
| `npm run cleanup:dry-run` | Preview what would be deleted (no changes) |
| `npm run cleanup:messages` | Delete only messages |
| `npm run cleanup:conversations` | Delete only symptom conversations |
| `npm run cleanup:cases` | Delete only cases (requires extra confirmation) |
| `npm run cleanup:all` | Delete messages, conversations, and cases |

## Command Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without executing |
| `--messages` | Delete messages only |
| `--conversations` | Delete symptom conversations only |
| `--cases` | Delete cases only |
| `--all` | Delete all (messages, conversations, cases) |
| `--yes` or `-y` | Skip confirmation prompts |

## Usage Examples

### Example 1: Safe Preview
```bash
npm run cleanup:dry-run
```
**Output:**
```
🗑️  DATABASE CLEANUP UTILITY
============================================================
Mode: DRY RUN (no changes will be made)

Operations to perform:
   • Delete all messages
   • Delete all symptom conversations
   • Clear extracted symptoms from patient records
============================================================

📧 Found 150 messages
💬 Found 45 symptom conversations
👤 Found 12 patients with extracted symptoms

============================================================
📋 DRY RUN SUMMARY
============================================================
📧 Messages to be removed: 150
💬 Symptom Conversations to be removed: 45
👤 Patients with cleared symptoms: 12
============================================================
```

### Example 2: Clean Messages Only
```bash
npm run cleanup:messages
```
Removes all messages while preserving conversations and cases.

### Example 3: Clean Everything
```bash
npm run cleanup:all
```
Removes messages, conversations, and cases (requires multiple confirmations).

### Example 4: Automated Cleanup (CI/CD)
```bash
npm run cleanup -- --messages --conversations --yes
```
Removes messages and conversations without prompts.

### Example 5: Custom Combination
```bash
node scripts/cleanDatabase.js --messages --conversations --dry-run
```
Preview deletion of messages and conversations.

## What Gets Deleted

### Messages (`--messages`)
- All patient-doctor messages
- Case-related messages
- Message metadata

### Symptom Conversations (`--conversations`)
- All symptom conversation sessions
- Follow-up questions and answers
- Extracted symptoms from conversations
- Prediction data

### Cases (`--cases`)
- All medical cases
- Case history and notes
- Treatment information
- **⚠️ Requires extra confirmation (contains medical records)**

### Patient Records
- Extracted symptoms array is cleared
- All other patient data is preserved

## What Gets Preserved

✓ **User Accounts**
- Patient accounts
- Doctor accounts
- Admin accounts

✓ **Hospital Data**
- Hospital information
- Hospital registrations
- Hospital API credentials

✓ **Doctor Profiles**
- Doctor specializations
- Doctor ratings and experience
- Clinic information

✓ **System Configuration**
- Subscription data
- System settings
- Audit logs

✓ **Patient Medical Data**
- Medical history
- Allergies
- Chronic conditions
- Current medications
- Past surgeries
- Vaccinations
- Vital signs
- Lab results

## Safety Features

### 1. Dry Run Mode
Always preview changes before executing:
```bash
npm run cleanup:dry-run
```

### 2. Interactive Confirmations
The script asks for confirmation before deleting data:
```
⚠️  WARNING: This operation cannot be undone!

Are you sure you want to proceed? (yes/no):
```

### 3. Extra Confirmation for Cases
Cases contain medical records and require additional confirmation:
```
⚠️  CRITICAL: Cases contain medical records!
Are you ABSOLUTELY sure you want to delete all cases? (yes/no):
```

### 4. Detailed Logging
All operations are logged with timestamps:
- Operation start/end
- Record counts
- Errors and warnings
- Execution time

### 5. Error Handling
- Continues on non-fatal errors
- Reports all errors at the end
- Exits with error code if failures occur

## Output Summary

After execution, you'll see a detailed summary:

```
============================================================
✨ CLEANUP SUMMARY
============================================================
📧 Messages removed: 150
💬 Symptom Conversations removed: 45
📋 Cases removed: 0
👤 Patients with cleared symptoms: 12
============================================================

📦 PRESERVED DATA:
   ✓ User accounts (Patients, Doctors, Admins)
   ✓ Hospital information
   ✓ Doctor profiles and specializations
   ✓ Subscription data
   ✓ System configuration
   ✓ Audit logs
============================================================

⏱️  Execution time: 2.34s
```

## Logs

All cleanup operations are logged to:
- `backend/logs/application-YYYY-MM-DD.log` - General operations
- `backend/logs/error-YYYY-MM-DD.log` - Errors only

Log entries include:
- Timestamp
- Operation type
- Record counts
- Execution time
- Error details (if any)

## Best Practices

1. **Always run dry-run first**
   ```bash
   npm run cleanup:dry-run
   ```

2. **Start with selective cleanup**
   ```bash
   npm run cleanup:messages
   ```

3. **Avoid deleting cases unless necessary**
   - Cases contain medical records
   - Use `--cases` only when absolutely needed

4. **Use automation carefully**
   - The `--yes` flag skips all confirmations
   - Only use in trusted automated environments

5. **Check logs after cleanup**
   ```bash
   tail -f backend/logs/application-*.log
   ```

## Troubleshooting

### Issue: Script hangs waiting for input
**Solution:** Use `--yes` flag to skip confirmations:
```bash
npm run cleanup -- --yes
```

### Issue: Permission denied
**Solution:** Ensure MongoDB connection is configured in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/healthcare-platform
```

### Issue: Want to restore deleted data
**Solution:** There is no undo. Always:
1. Run `--dry-run` first
2. Backup database before cleanup
3. Use selective cleanup options

### Issue: Need to backup before cleanup
**Solution:** Use MongoDB backup:
```bash
mongodump --uri="mongodb://localhost:27017/healthcare-platform" --out=backup
```

## Integration with CI/CD

For automated testing environments:

```bash
# Clean test data after each test run
npm run cleanup -- --messages --conversations --yes

# Full cleanup for fresh test environment
npm run cleanup:all -- --yes
```

## Related Scripts

- `npm run reset` - Complete database reset (preserves admin)
- `npm run reset:quick` - Fast database reset
- `npm run seed` - Populate with sample data

## Support

For issues or questions:
1. Check logs in `backend/logs/`
2. Run with `--dry-run` to diagnose
3. Review this guide
4. Check `backend/scripts/README.md`

## Requirements Mapping

This cleanup utility satisfies the following requirements:

- **Requirement 5.1**: Database cleanup script for messages and conversations
- **Requirement 5.2**: Preserve user accounts, doctor profiles, hospital data
- **Requirement 5.3**: Preserve admin accounts and system configuration
- **Requirement 5.4**: Logging and confirmation before execution
- **Requirement 5.5**: Display affected record counts
