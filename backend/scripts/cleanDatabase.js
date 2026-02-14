/**
 * Enhanced Database Cleanup Script
 * Selectively removes non-essential data while preserving system integrity
 * 
 * Usage:
 *   npm run cleanup                    # Interactive mode with confirmation
 *   npm run cleanup -- --dry-run       # Preview what would be deleted
 *   npm run cleanup -- --messages      # Delete only messages
 *   npm run cleanup -- --conversations # Delete only symptom conversations
 *   npm run cleanup -- --cases         # Delete only cases (requires confirmation)
 *   npm run cleanup -- --all           # Delete messages, conversations, and cases
 *   npm run cleanup -- --yes           # Skip confirmation prompts
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const logger = require('../services/logger');

// Import models
const Message = require('../models/Message');
const SymptomConversation = require('../models/SymptomConversation');
const Case = require('../models/Case');
const Patient = require('../models/Patient');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  messages: args.includes('--messages'),
  conversations: args.includes('--conversations'),
  cases: args.includes('--cases'),
  all: args.includes('--all'),
  skipConfirmation: args.includes('--yes') || args.includes('-y')
};

// If --all is specified, enable all cleanup options
if (options.all) {
  options.messages = true;
  options.conversations = true;
  options.cases = true;
}

// If no specific options, default to messages and conversations only
if (!options.messages && !options.conversations && !options.cases) {
  options.messages = true;
  options.conversations = true;
}

/**
 * Create readline interface for user input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Display cleanup summary
 */
function displaySummary(results, isDryRun) {
  console.log('\n' + '='.repeat(60));
  console.log(isDryRun ? '📋 DRY RUN SUMMARY' : '✨ CLEANUP SUMMARY');
  console.log('='.repeat(60));
  
  if (results.messagesRemoved !== undefined) {
    console.log(`📧 Messages ${isDryRun ? 'to be removed' : 'removed'}: ${results.messagesRemoved}`);
  }
  
  if (results.conversationsRemoved !== undefined) {
    console.log(`💬 Symptom Conversations ${isDryRun ? 'to be removed' : 'removed'}: ${results.conversationsRemoved}`);
  }
  
  if (results.casesRemoved !== undefined) {
    console.log(`📋 Cases ${isDryRun ? 'to be removed' : 'removed'}: ${results.casesRemoved}`);
  }
  
  if (results.patientsUpdated !== undefined) {
    console.log(`👤 Patients with cleared symptoms: ${results.patientsUpdated}`);
  }
  
  console.log('='.repeat(60));
  
  if (results.errors && results.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n📦 PRESERVED DATA:');
  console.log('   ✓ User accounts (Patients, Doctors, Admins)');
  console.log('   ✓ Hospital information');
  console.log('   ✓ Doctor profiles and specializations');
  console.log('   ✓ Subscription data');
  console.log('   ✓ System configuration');
  console.log('   ✓ Audit logs');
  console.log('='.repeat(60) + '\n');
}

/**
 * Main cleanup function
 */
async function cleanupDatabase() {
  const startTime = Date.now();
  const results = {
    messagesRemoved: 0,
    conversationsRemoved: 0,
    casesRemoved: 0,
    patientsUpdated: 0,
    errors: []
  };

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    // Display what will be cleaned
    console.log('🗑️  DATABASE CLEANUP UTILITY');
    console.log('='.repeat(60));
    console.log(`Mode: ${options.dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
    console.log('\nOperations to perform:');
    if (options.messages) console.log('   • Delete all messages');
    if (options.conversations) console.log('   • Delete all symptom conversations');
    if (options.cases) console.log('   • Delete all cases');
    console.log('   • Clear extracted symptoms from patient records');
    console.log('='.repeat(60) + '\n');

    // Get counts before cleanup
    if (options.messages) {
      const messageCount = await Message.countDocuments({});
      results.messagesRemoved = messageCount;
      console.log(`📧 Found ${messageCount} messages`);
    }

    if (options.conversations) {
      const conversationCount = await SymptomConversation.countDocuments({});
      results.conversationsRemoved = conversationCount;
      console.log(`💬 Found ${conversationCount} symptom conversations`);
    }

    if (options.cases) {
      const caseCount = await Case.countDocuments({});
      results.casesRemoved = caseCount;
      console.log(`📋 Found ${caseCount} cases`);
    }

    const patientCount = await Patient.countDocuments({ 'extractedSymptoms.0': { $exists: true } });
    results.patientsUpdated = patientCount;
    console.log(`👤 Found ${patientCount} patients with extracted symptoms\n`);

    // If dry run, just display summary and exit
    if (options.dryRun) {
      displaySummary(results, true);
      await mongoose.connection.close();
      console.log('✅ Dry run completed - no changes made\n');
      process.exit(0);
    }

    // Ask for confirmation unless --yes flag is provided
    if (!options.skipConfirmation) {
      console.log('⚠️  WARNING: This operation cannot be undone!\n');
      const confirmed = await askConfirmation('Are you sure you want to proceed? (yes/no): ');
      
      if (!confirmed) {
        console.log('\n❌ Cleanup cancelled by user\n');
        await mongoose.connection.close();
        process.exit(0);
      }
      console.log('');
    }

    // Log cleanup start
    logger.info('Database cleanup started', {
      type: 'DATABASE_CLEANUP_START',
      options: {
        messages: options.messages,
        conversations: options.conversations,
        cases: options.cases
      },
      timestamp: new Date().toISOString()
    });

    console.log('🔄 Starting cleanup operations...\n');

    // Delete messages
    if (options.messages) {
      try {
        const messageResult = await Message.deleteMany({});
        results.messagesRemoved = messageResult.deletedCount;
        console.log(`✅ Deleted ${messageResult.deletedCount} messages`);
        
        logger.info('Messages deleted', {
          type: 'DATABASE_CLEANUP_MESSAGES',
          count: messageResult.deletedCount,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const errorMsg = `Failed to delete messages: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        logger.error(errorMsg, { type: 'DATABASE_CLEANUP_ERROR', error: error.stack });
      }
    }

    // Delete symptom conversations
    if (options.conversations) {
      try {
        const conversationResult = await SymptomConversation.deleteMany({});
        results.conversationsRemoved = conversationResult.deletedCount;
        console.log(`✅ Deleted ${conversationResult.deletedCount} symptom conversations`);
        
        logger.info('Symptom conversations deleted', {
          type: 'DATABASE_CLEANUP_CONVERSATIONS',
          count: conversationResult.deletedCount,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const errorMsg = `Failed to delete conversations: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        logger.error(errorMsg, { type: 'DATABASE_CLEANUP_ERROR', error: error.stack });
      }
    }

    // Delete cases (with extra confirmation)
    if (options.cases) {
      try {
        // Extra confirmation for cases since they contain medical records
        if (!options.skipConfirmation) {
          console.log('\n⚠️  CRITICAL: Cases contain medical records!');
          const caseConfirmed = await askConfirmation('Are you ABSOLUTELY sure you want to delete all cases? (yes/no): ');
          
          if (!caseConfirmed) {
            console.log('❌ Case deletion skipped\n');
            results.casesRemoved = 0;
          } else {
            const caseResult = await Case.deleteMany({});
            results.casesRemoved = caseResult.deletedCount;
            console.log(`✅ Deleted ${caseResult.deletedCount} cases`);
            
            logger.warn('Cases deleted', {
              type: 'DATABASE_CLEANUP_CASES',
              count: caseResult.deletedCount,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          const caseResult = await Case.deleteMany({});
          results.casesRemoved = caseResult.deletedCount;
          console.log(`✅ Deleted ${caseResult.deletedCount} cases`);
          
          logger.warn('Cases deleted', {
            type: 'DATABASE_CLEANUP_CASES',
            count: caseResult.deletedCount,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        const errorMsg = `Failed to delete cases: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        logger.error(errorMsg, { type: 'DATABASE_CLEANUP_ERROR', error: error.stack });
      }
    }

    // Clear extracted symptoms from patient records
    try {
      const patientResult = await Patient.updateMany(
        { 'extractedSymptoms.0': { $exists: true } },
        { $set: { extractedSymptoms: [] } }
      );
      results.patientsUpdated = patientResult.modifiedCount;
      console.log(`✅ Cleared extracted symptoms from ${patientResult.modifiedCount} patient records`);
      
      logger.info('Patient symptoms cleared', {
        type: 'DATABASE_CLEANUP_PATIENT_SYMPTOMS',
        count: patientResult.modifiedCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMsg = `Failed to clear patient symptoms: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      logger.error(errorMsg, { type: 'DATABASE_CLEANUP_ERROR', error: error.stack });
    }

    // Calculate execution time
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Display summary
    displaySummary(results, false);

    // Log cleanup completion
    logger.info('Database cleanup completed', {
      type: 'DATABASE_CLEANUP_COMPLETE',
      results,
      executionTime: `${executionTime}s`,
      timestamp: new Date().toISOString()
    });

    console.log(`⏱️  Execution time: ${executionTime}s\n`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    
    process.exit(results.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error during cleanup:', error.message);
    logger.error('Database cleanup failed', {
      type: 'DATABASE_CLEANUP_FATAL_ERROR',
      error: error.stack,
      timestamp: new Date().toISOString()
    });
    
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('Failed to close database connection:', closeError.message);
    }
    
    process.exit(1);
  }
}

// Run cleanup
cleanupDatabase();
