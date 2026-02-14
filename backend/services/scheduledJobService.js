const cron = require('node-cron');
const RemovedUser = require('../models/RemovedUser');
const logger = require('./logger');
const auditLoggerService = require('./auditLoggerService');

/**
 * Scheduled Job Service
 * Handles automated tasks like data cleanup and maintenance
 */
class ScheduledJobService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize all scheduled jobs
   */
  initialize() {
    if (this.isInitialized) {
      logger.warn('Scheduled jobs already initialized');
      return;
    }

    try {
      // Schedule daily cleanup at 2 AM
      this.scheduleDataCleanup();
      
      // Schedule weekly data integrity checks on Sundays at 3 AM
      this.scheduleDataIntegrityCheck();
      
      // Schedule monthly removal statistics cleanup
      this.scheduleStatisticsCleanup();

      this.isInitialized = true;
      logger.info('Scheduled jobs initialized successfully', {
        type: 'SCHEDULED_JOBS_INIT',
        jobCount: this.jobs.size,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to initialize scheduled jobs', {
        type: 'SCHEDULED_JOBS_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Schedule daily data cleanup job
   * Runs every day at 2:00 AM to clean up expired removed user records
   */
  scheduleDataCleanup() {
    const job = cron.schedule('0 2 * * *', async () => {
      await this.performDataCleanup();
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set('dataCleanup', job);
    job.start();

    logger.info('Data cleanup job scheduled', {
      type: 'JOB_SCHEDULED',
      jobName: 'dataCleanup',
      schedule: '0 2 * * *',
      timezone: process.env.TIMEZONE || 'UTC'
    });
  }

  /**
   * Schedule weekly data integrity check
   * Runs every Sunday at 3:00 AM to verify data integrity of removed users
   */
  scheduleDataIntegrityCheck() {
    const job = cron.schedule('0 3 * * 0', async () => {
      await this.performDataIntegrityCheck();
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set('dataIntegrityCheck', job);
    job.start();

    logger.info('Data integrity check job scheduled', {
      type: 'JOB_SCHEDULED',
      jobName: 'dataIntegrityCheck',
      schedule: '0 3 * * 0',
      timezone: process.env.TIMEZONE || 'UTC'
    });
  }

  /**
   * Schedule monthly statistics cleanup
   * Runs on the 1st of every month at 4:00 AM to clean old statistics
   */
  scheduleStatisticsCleanup() {
    const job = cron.schedule('0 4 1 * *', async () => {
      await this.performStatisticsCleanup();
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set('statisticsCleanup', job);
    job.start();

    logger.info('Statistics cleanup job scheduled', {
      type: 'JOB_SCHEDULED',
      jobName: 'statisticsCleanup',
      schedule: '0 4 1 * *',
      timezone: process.env.TIMEZONE || 'UTC'
    });
  }

  /**
   * Perform data cleanup - remove expired removed user records
   */
  async performDataCleanup() {
    const startTime = Date.now();
    
    try {
      logger.info('Starting data cleanup job', {
        type: 'DATA_CLEANUP_START',
        timestamp: new Date().toISOString()
      });

      // Get users scheduled for deletion (expired after 90 days)
      const expiredUsers = await RemovedUser.getUsersScheduledForDeletion(0);
      
      if (expiredUsers.length === 0) {
        logger.info('No expired user records found for cleanup', {
          type: 'DATA_CLEANUP_COMPLETE',
          recordsProcessed: 0,
          duration: Date.now() - startTime
        });
        return;
      }

      // Create backup information before deletion
      const backupInfo = expiredUsers.map(user => ({
        originalId: user.originalId,
        userType: user.userType,
        email: user.userData.email,
        name: user.userData.name,
        removedAt: user.removedAt,
        removedBy: user.removedByEmail,
        reason: user.reason,
        scheduledDeletion: user.scheduledDeletion
      }));

      // Perform cleanup
      const cleanupResult = await RemovedUser.cleanupExpiredRecords();

      // Log the cleanup operation
      await auditLoggerService.logSystemAction({
        action: 'AUTOMATED_DATA_CLEANUP',
        details: {
          recordsDeleted: cleanupResult.deletedCount,
          expiredRecords: backupInfo,
          operationDuration: Date.now() - startTime,
          scheduledDeletion: true
        },
        status: 'success'
      });

      logger.info('Data cleanup job completed successfully', {
        type: 'DATA_CLEANUP_COMPLETE',
        recordsDeleted: cleanupResult.deletedCount,
        duration: Date.now() - startTime,
        expiredRecords: backupInfo.length
      });

    } catch (error) {
      logger.error('Data cleanup job failed', {
        type: 'DATA_CLEANUP_ERROR',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      // Log the failed cleanup operation
      await auditLoggerService.logSystemAction({
        action: 'AUTOMATED_DATA_CLEANUP',
        details: {
          operationDuration: Date.now() - startTime,
          scheduledDeletion: true
        },
        status: 'failed',
        errorMessage: error.message
      });
    }
  }

  /**
   * Perform data integrity check on removed user records
   */
  async performDataIntegrityCheck() {
    const startTime = Date.now();
    
    try {
      logger.info('Starting data integrity check job', {
        type: 'DATA_INTEGRITY_CHECK_START',
        timestamp: new Date().toISOString()
      });

      // Get all non-restored removed users
      const removedUsers = await RemovedUser.find({
        isRestored: false
      }).limit(1000); // Process in batches

      let integrityIssues = 0;
      let checkedRecords = 0;
      const corruptedRecords = [];

      for (const removedUser of removedUsers) {
        checkedRecords++;
        
        try {
          // Verify data integrity hash
          if (!removedUser.verifyDataIntegrity()) {
            integrityIssues++;
            corruptedRecords.push({
              id: removedUser._id,
              originalId: removedUser.originalId,
              userType: removedUser.userType,
              email: removedUser.userData.email,
              removedAt: removedUser.removedAt
            });

            logger.warn('Data integrity issue detected', {
              type: 'DATA_INTEGRITY_ISSUE',
              removedUserId: removedUser._id,
              originalId: removedUser.originalId,
              userType: removedUser.userType,
              email: removedUser.userData.email
            });
          }
        } catch (verificationError) {
          integrityIssues++;
          corruptedRecords.push({
            id: removedUser._id,
            originalId: removedUser.originalId,
            userType: removedUser.userType,
            email: removedUser.userData.email,
            removedAt: removedUser.removedAt,
            error: verificationError.message
          });

          logger.error('Data integrity verification failed', {
            type: 'DATA_INTEGRITY_VERIFICATION_ERROR',
            removedUserId: removedUser._id,
            error: verificationError.message
          });
        }
      }

      // Log the integrity check results
      await auditLoggerService.logSystemAction({
        action: 'AUTOMATED_DATA_INTEGRITY_CHECK',
        details: {
          recordsChecked: checkedRecords,
          integrityIssues: integrityIssues,
          corruptedRecords: corruptedRecords,
          operationDuration: Date.now() - startTime
        },
        status: integrityIssues === 0 ? 'success' : 'warning'
      });

      logger.info('Data integrity check completed', {
        type: 'DATA_INTEGRITY_CHECK_COMPLETE',
        recordsChecked: checkedRecords,
        integrityIssues: integrityIssues,
        duration: Date.now() - startTime
      });

      // Alert if integrity issues found
      if (integrityIssues > 0) {
        logger.warn('Data integrity issues detected', {
          type: 'DATA_INTEGRITY_ALERT',
          issueCount: integrityIssues,
          totalChecked: checkedRecords,
          corruptedRecords: corruptedRecords.length
        });
      }

    } catch (error) {
      logger.error('Data integrity check job failed', {
        type: 'DATA_INTEGRITY_CHECK_ERROR',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      // Log the failed integrity check
      await auditLoggerService.logSystemAction({
        action: 'AUTOMATED_DATA_INTEGRITY_CHECK',
        details: {
          operationDuration: Date.now() - startTime
        },
        status: 'failed',
        errorMessage: error.message
      });
    }
  }

  /**
   * Perform statistics cleanup - remove old audit logs and statistics
   */
  async performStatisticsCleanup() {
    const startTime = Date.now();
    
    try {
      logger.info('Starting statistics cleanup job', {
        type: 'STATISTICS_CLEANUP_START',
        timestamp: new Date().toISOString()
      });

      // Clean up audit logs older than 2 years
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const AuditLog = require('../models/AuditLog');
      const oldLogsCount = await AuditLog.countDocuments({
        timestamp: { $lt: twoYearsAgo }
      });

      if (oldLogsCount > 0) {
        await AuditLog.deleteMany({
          timestamp: { $lt: twoYearsAgo }
        });

        logger.info('Old audit logs cleaned up', {
          type: 'AUDIT_LOGS_CLEANUP',
          deletedCount: oldLogsCount,
          cutoffDate: twoYearsAgo
        });
      }

      // Log the cleanup operation
      await auditLoggerService.logSystemAction({
        action: 'AUTOMATED_STATISTICS_CLEANUP',
        details: {
          auditLogsDeleted: oldLogsCount,
          cutoffDate: twoYearsAgo,
          operationDuration: Date.now() - startTime
        },
        status: 'success'
      });

      logger.info('Statistics cleanup job completed', {
        type: 'STATISTICS_CLEANUP_COMPLETE',
        auditLogsDeleted: oldLogsCount,
        duration: Date.now() - startTime
      });

    } catch (error) {
      logger.error('Statistics cleanup job failed', {
        type: 'STATISTICS_CLEANUP_ERROR',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      // Log the failed cleanup operation
      await auditLoggerService.logSystemAction({
        action: 'AUTOMATED_STATISTICS_CLEANUP',
        details: {
          operationDuration: Date.now() - startTime
        },
        status: 'failed',
        errorMessage: error.message
      });
    }
  }

  /**
   * Manually trigger a specific job
   * @param {string} jobName - Name of the job to trigger
   */
  async triggerJob(jobName) {
    try {
      switch (jobName) {
        case 'dataCleanup':
          await this.performDataCleanup();
          break;
        case 'dataIntegrityCheck':
          await this.performDataIntegrityCheck();
          break;
        case 'statisticsCleanup':
          await this.performStatisticsCleanup();
          break;
        default:
          throw new Error(`Unknown job: ${jobName}`);
      }

      logger.info('Manual job execution completed', {
        type: 'MANUAL_JOB_EXECUTION',
        jobName: jobName,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Manual job execution failed', {
        type: 'MANUAL_JOB_ERROR',
        jobName: jobName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Get status of all scheduled jobs
   */
  getJobStatus() {
    const status = {};
    
    for (const [jobName, job] of this.jobs) {
      status[jobName] = {
        running: job.running,
        scheduled: job.scheduled,
        destroyed: job.destroyed
      };
    }

    return {
      initialized: this.isInitialized,
      jobCount: this.jobs.size,
      jobs: status
    };
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs() {
    for (const [jobName, job] of this.jobs) {
      job.stop();
      logger.info('Scheduled job stopped', {
        type: 'JOB_STOPPED',
        jobName: jobName
      });
    }

    logger.info('All scheduled jobs stopped', {
      type: 'ALL_JOBS_STOPPED',
      jobCount: this.jobs.size
    });
  }

  /**
   * Destroy all scheduled jobs
   */
  destroyAllJobs() {
    for (const [jobName, job] of this.jobs) {
      job.destroy();
    }

    this.jobs.clear();
    this.isInitialized = false;

    logger.info('All scheduled jobs destroyed', {
      type: 'ALL_JOBS_DESTROYED'
    });
  }
}

module.exports = new ScheduledJobService();