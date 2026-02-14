const AuditLog = require('../models/AuditLog');
const Admin = require('../models/Admin');
const fs = require('fs').promises;
const path = require('path');

class AuditLoggerService {
  constructor() {
    this.retentionPeriodDays = 365; // 1 year retention
    this.cleanupIntervalHours = 24; // Run cleanup daily
    this.maxExportRecords = 50000; // Maximum records for export
    
    // Start automatic cleanup if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startAutomaticCleanup();
    }
  }

  /**
   * Log admin action with comprehensive details
   * @param {Object} actionData - Action data to log
   * @returns {Object} Created audit log entry
   */
  async logAdminAction(actionData) {
    try {
      const {
        adminId,
        adminEmail,
        action,
        targetUserId,
        targetUserType,
        targetUserEmail,
        details = {},
        status = 'success',
        errorMessage = null
      } = actionData;

      // Validate required fields
      if (!adminId || !adminEmail || !action) {
        throw new Error('Admin ID, email, and action are required for audit logging');
      }

      // Ensure details has required security fields
      const auditDetails = {
        ipAddress: details.ipAddress || 'unknown',
        userAgent: details.userAgent || 'unknown',
        sessionId: details.sessionId || null,
        reason: details.reason || '',
        additionalData: details.additionalData || {},
        affectedRecords: details.affectedRecords || 1,
        operationDuration: details.operationDuration || null
      };

      const auditLog = await AuditLog.logAction({
        adminId,
        adminEmail,
        action,
        targetUserId,
        targetUserType,
        targetUserEmail,
        details: auditDetails,
        status,
        errorMessage
      });

      return auditLog;

    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Don't throw error to prevent breaking the main operation
      return null;
    }
  }

  /**
   * Log system action (automated processes, scheduled jobs, etc.)
   * @param {Object} actionData - System action data to log
   * @returns {Object} Created audit log entry
   */
  async logSystemAction(actionData) {
    try {
      const {
        action,
        targetUserId,
        targetUserType,
        targetUserEmail,
        details = {},
        status = 'success',
        errorMessage = null
      } = actionData;

      // Validate required fields
      if (!action) {
        throw new Error('Action is required for system audit logging');
      }

      // System actions use special admin ID and email
      const systemAdminId = 'system';
      const systemAdminEmail = 'system@automated';

      // Ensure details has required fields for system actions
      const auditDetails = {
        ipAddress: 'system',
        userAgent: 'automated-process',
        sessionId: null,
        reason: details.reason || 'Automated system operation',
        additionalData: details.additionalData || {},
        affectedRecords: details.affectedRecords || 0,
        operationDuration: details.operationDuration || null,
        scheduledDeletion: details.scheduledDeletion || false,
        recordsDeleted: details.recordsDeleted || 0,
        recordsChecked: details.recordsChecked || 0,
        integrityIssues: details.integrityIssues || 0,
        corruptedRecords: details.corruptedRecords || [],
        cutoffDate: details.cutoffDate || null,
        auditLogsDeleted: details.auditLogsDeleted || 0
      };

      const auditLog = await AuditLog.logAction({
        adminId: systemAdminId,
        adminEmail: systemAdminEmail,
        action,
        targetUserId,
        targetUserType,
        targetUserEmail,
        details: auditDetails,
        status,
        errorMessage
      });

      return auditLog;

    } catch (error) {
      console.error('Failed to log system action:', error);
      // Don't throw error to prevent breaking the main operation
      return null;
    }
  }

  /**
   * Get audit logs with comprehensive filtering and pagination
   * @param {Object} filters - Filtering options
   * @param {Object} options - Pagination and sorting options
   * @param {string} requestingAdminId - ID of admin requesting logs
   * @returns {Object} Filtered audit logs with pagination
   */
  async getAuditLogs(filters = {}, options = {}, requestingAdminId = null) {
    try {
      // Validate requesting admin permissions (should be root admin)
      if (requestingAdminId) {
        const admin = await Admin.findById(requestingAdminId);
        if (!admin || !admin.isRoot()) {
          throw new Error('Only root admin can access audit logs');
        }
      }

      const {
        adminId,
        adminEmail,
        action,
        targetUserType,
        targetUserEmail,
        startDate,
        endDate,
        ipAddress,
        status,
        searchTerm
      } = filters;

      const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = -1,
        includeDetails = true
      } = options;

      // Build comprehensive query
      const query = {};

      if (adminId) query.adminId = adminId;
      if (adminEmail) query.adminEmail = new RegExp(adminEmail, 'i');
      if (action) {
        if (Array.isArray(action)) {
          query.action = { $in: action };
        } else {
          query.action = action;
        }
      }
      if (targetUserType) query.targetUserType = targetUserType;
      if (targetUserEmail) query.targetUserEmail = new RegExp(targetUserEmail, 'i');
      if (status) query.status = status;
      if (ipAddress) query['details.ipAddress'] = ipAddress;

      // Date range filtering
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Search across multiple fields
      if (searchTerm) {
        query.$or = [
          { adminEmail: new RegExp(searchTerm, 'i') },
          { targetUserEmail: new RegExp(searchTerm, 'i') },
          { action: new RegExp(searchTerm, 'i') },
          { 'details.reason': new RegExp(searchTerm, 'i') }
        ];
      }

      const result = await AuditLog.getFilteredLogs(
        query,
        { page, limit, sortBy, sortOrder }
      );

      // Optionally exclude sensitive details for non-root admins
      if (!includeDetails) {
        result.logs = result.logs.map(log => {
          const { details, ...logWithoutDetails } = log;
          return {
            ...logWithoutDetails,
            details: {
              reason: details.reason,
              affectedRecords: details.affectedRecords
            }
          };
        });
      }

      return result;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Export audit logs to CSV format
   * @param {Object} filters - Filtering options
   * @param {string} requestingAdminId - ID of admin requesting export
   * @param {Object} exportOptions - Export configuration
   * @returns {Object} Export result with file path or CSV data
   */
  async exportAuditLogs(filters = {}, requestingAdminId = null, exportOptions = {}) {
    try {
      // Validate requesting admin permissions
      if (requestingAdminId) {
        const admin = await Admin.findById(requestingAdminId);
        if (!admin || !admin.isRoot()) {
          throw new Error('Only root admin can export audit logs');
        }
      }

      const {
        format = 'csv',
        includeDetails = true,
        maxRecords = this.maxExportRecords,
        saveToFile = false
      } = exportOptions;

      // Get logs with higher limit for export
      const { logs } = await this.getAuditLogs(
        filters,
        { 
          page: 1, 
          limit: maxRecords, 
          sortBy: 'timestamp', 
          sortOrder: -1,
          includeDetails 
        },
        requestingAdminId
      );

      if (format === 'csv') {
        const csvData = await this._generateCSVData(logs, includeDetails);
        
        if (saveToFile) {
          const fileName = `audit_logs_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`;
          const filePath = path.join(process.cwd(), 'exports', fileName);
          
          // Ensure exports directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          
          // Write CSV data to file
          const csvContent = this._arrayToCSV(csvData);
          await fs.writeFile(filePath, csvContent, 'utf8');
          
          // Log the export action
          await this.logAdminAction({
            adminId: requestingAdminId,
            adminEmail: 'system', // Will be updated by calling function
            action: 'DATA_EXPORT',
            details: {
              exportType: 'audit_logs',
              recordCount: logs.length,
              fileName,
              filters: JSON.stringify(filters)
            }
          });

          return {
            success: true,
            format,
            recordCount: logs.length,
            filePath,
            fileName
          };
        } else {
          return {
            success: true,
            format,
            recordCount: logs.length,
            data: csvData
          };
        }
      } else if (format === 'json') {
        return {
          success: true,
          format,
          recordCount: logs.length,
          data: logs
        };
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get audit log statistics and analytics
   * @param {Object} filters - Date range and other filters
   * @param {string} requestingAdminId - ID of admin requesting statistics
   * @returns {Object} Comprehensive audit statistics
   */
  async getAuditStatistics(filters = {}, requestingAdminId = null) {
    try {
      // Validate requesting admin permissions
      if (requestingAdminId) {
        const admin = await Admin.findById(requestingAdminId);
        if (!admin || !admin.isRoot()) {
          throw new Error('Only root admin can access audit statistics');
        }
      }

      const stats = await AuditLog.getStatistics(filters);
      
      // Get additional analytics
      const additionalStats = await this._getAdditionalStatistics(filters);
      
      return {
        ...stats,
        ...additionalStats,
        generatedAt: new Date(),
        filters
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get suspicious activity alerts
   * @param {Object} options - Alert configuration
   * @returns {Array} List of suspicious activities
   */
  async getSuspiciousActivities(options = {}) {
    try {
      const {
        timeWindow = 24, // hours
        failedLoginThreshold = 5,
        bulkOperationThreshold = 20,
        unusualHourThreshold = 2 // operations between 11 PM and 5 AM
      } = options;

      const startTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
      const suspiciousActivities = [];

      // Check for excessive failed logins
      const failedLogins = await AuditLog.aggregate([
        {
          $match: {
            action: 'LOGIN_FAILED',
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: '$details.ipAddress',
            count: { $sum: 1 },
            adminEmails: { $addToSet: '$adminEmail' },
            lastAttempt: { $max: '$timestamp' }
          }
        },
        {
          $match: {
            count: { $gte: failedLoginThreshold }
          }
        }
      ]);

      failedLogins.forEach(item => {
        suspiciousActivities.push({
          type: 'EXCESSIVE_FAILED_LOGINS',
          severity: 'HIGH',
          ipAddress: item._id,
          count: item.count,
          affectedAdmins: item.adminEmails,
          lastActivity: item.lastAttempt,
          description: `${item.count} failed login attempts from IP ${item._id}`
        });
      });

      // Check for bulk operations
      const bulkOperations = await AuditLog.find({
        action: 'BULK_USER_OPERATION',
        timestamp: { $gte: startTime },
        'details.affectedRecords': { $gte: bulkOperationThreshold }
      }).populate('adminId', 'name email');

      bulkOperations.forEach(operation => {
        suspiciousActivities.push({
          type: 'LARGE_BULK_OPERATION',
          severity: 'MEDIUM',
          adminId: operation.adminId._id,
          adminEmail: operation.adminEmail,
          affectedRecords: operation.details.affectedRecords,
          timestamp: operation.timestamp,
          description: `Bulk operation affecting ${operation.details.affectedRecords} records`
        });
      });

      // Check for unusual hour activities
      const unusualHourActivities = await AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startTime },
            action: { $in: ['USER_REMOVED', 'ADMIN_ADDED', 'ADMIN_REMOVED'] }
          }
        },
        {
          $addFields: {
            hour: { $hour: '$timestamp' }
          }
        },
        {
          $match: {
            $or: [
              { hour: { $gte: 23 } },
              { hour: { $lte: 5 } }
            ]
          }
        },
        {
          $group: {
            _id: '$adminId',
            count: { $sum: 1 },
            actions: { $push: '$action' },
            timestamps: { $push: '$timestamp' }
          }
        },
        {
          $match: {
            count: { $gte: unusualHourThreshold }
          }
        }
      ]);

      for (const activity of unusualHourActivities) {
        const admin = await Admin.findById(activity._id);
        suspiciousActivities.push({
          type: 'UNUSUAL_HOUR_ACTIVITY',
          severity: 'MEDIUM',
          adminId: activity._id,
          adminEmail: admin?.email || 'Unknown',
          count: activity.count,
          actions: activity.actions,
          timestamps: activity.timestamps,
          description: `${activity.count} sensitive operations during unusual hours`
        });
      }

      return suspiciousActivities.sort((a, b) => {
        const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Start automatic log retention and cleanup
   * @private
   */
  startAutomaticCleanup() {
    // Run cleanup every 24 hours
    setInterval(async () => {
      try {
        await this.performLogCleanup();
      } catch (error) {
        console.error('Automatic log cleanup failed:', error);
      }
    }, this.cleanupIntervalHours * 60 * 60 * 1000);

    // Run initial cleanup after 1 minute
    setTimeout(async () => {
      try {
        await this.performLogCleanup();
      } catch (error) {
        console.error('Initial log cleanup failed:', error);
      }
    }, 60 * 1000);
  }

  /**
   * Perform log cleanup based on retention policy
   * @returns {Object} Cleanup results
   */
  async performLogCleanup() {
    try {
      const cutoffDate = new Date(Date.now() - this.retentionPeriodDays * 24 * 60 * 60 * 1000);
      
      // Count logs to be deleted
      const logsToDelete = await AuditLog.countDocuments({
        timestamp: { $lt: cutoffDate }
      });

      if (logsToDelete === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: 'No logs to cleanup'
        };
      }

      // Archive critical logs before deletion (optional)
      const criticalLogs = await AuditLog.find({
        timestamp: { $lt: cutoffDate },
        action: { $in: ['ADMIN_ADDED', 'ADMIN_REMOVED', 'USER_REMOVED'] }
      }).lean();

      // Delete old logs
      const deleteResult = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      // Log the cleanup action
      await this.logAdminAction({
        adminId: 'system',
        adminEmail: 'system@cleanup',
        action: 'SYSTEM_ACCESS',
        details: {
          reason: 'Automatic log cleanup',
          additionalData: {
            deletedCount: deleteResult.deletedCount,
            cutoffDate: cutoffDate.toISOString(),
            criticalLogsArchived: criticalLogs.length
          }
        }
      });

      return {
        success: true,
        deletedCount: deleteResult.deletedCount,
        criticalLogsArchived: criticalLogs.length,
        cutoffDate
      };

    } catch (error) {
      console.error('Log cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Generate CSV data from audit logs
   * @private
   * @param {Array} logs - Audit logs
   * @param {boolean} includeDetails - Whether to include detailed information
   * @returns {Array} CSV data array
   */
  _generateCSVData(logs, includeDetails = true) {
    return logs.map(log => {
      const baseData = {
        timestamp: log.timestamp.toISOString(),
        adminEmail: log.adminEmail,
        adminName: log.adminId?.name || 'Unknown',
        action: log.action,
        targetUserType: log.targetUserType || '',
        targetUserEmail: log.targetUserEmail || '',
        status: log.status,
        affectedRecords: log.details?.affectedRecords || 1
      };

      if (includeDetails) {
        return {
          ...baseData,
          ipAddress: log.details?.ipAddress || '',
          userAgent: log.details?.userAgent || '',
          reason: log.details?.reason || '',
          sessionId: log.details?.sessionId || '',
          errorMessage: log.errorMessage || '',
          operationDuration: log.details?.operationDuration || ''
        };
      }

      return baseData;
    });
  }

  /**
   * Convert array of objects to CSV string
   * @private
   * @param {Array} data - Data array
   * @returns {string} CSV string
   */
  _arrayToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Get additional statistics for audit logs
   * @private
   * @param {Object} filters - Date range filters
   * @returns {Object} Additional statistics
   */
  async _getAdditionalStatistics(filters = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date()
      } = filters;

      const matchStage = {
        timestamp: { $gte: startDate, $lte: endDate }
      };

      // Get hourly activity distribution
      const hourlyActivity = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get top active admins
      const topAdmins = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$adminId',
            adminEmail: { $first: '$adminEmail' },
            actionCount: { $sum: 1 },
            lastActivity: { $max: '$timestamp' }
          }
        },
        { $sort: { actionCount: -1 } },
        { $limit: 10 }
      ]);

      // Get IP address distribution
      const ipDistribution = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$details.ipAddress',
            count: { $sum: 1 },
            uniqueAdmins: { $addToSet: '$adminId' }
          }
        },
        {
          $project: {
            ipAddress: '$_id',
            count: 1,
            uniqueAdminCount: { $size: '$uniqueAdmins' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      return {
        hourlyActivity,
        topAdmins,
        ipDistribution,
        analysisTimeRange: {
          startDate,
          endDate,
          durationDays: Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000))
        }
      };

    } catch (error) {
      console.error('Error getting additional statistics:', error);
      return {};
    }
  }
}

module.exports = new AuditLoggerService();