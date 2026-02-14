const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Admin ID is required']
  },
  adminEmail: {
    type: String,
    required: [true, 'Admin email is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'USER_REMOVED',
      'USER_RESTORED',
      'ADMIN_ADDED',
      'ADMIN_REMOVED',
      'USER_UPDATED',
      'PERMISSION_CHANGED',
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'PASSWORD_CHANGED',
      'ACCOUNT_LOCKED',
      'BULK_USER_OPERATION',
      'DATA_EXPORT',
      'SYSTEM_ACCESS'
    ]
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId
  },
  targetUserType: {
    type: String,
    enum: ['patient', 'doctor', 'hospital', 'admin']
  },
  targetUserEmail: {
    type: String
  },
  details: {
    reason: {
      type: String
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required']
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required']
    },
    sessionId: {
      type: String
    },
    additionalData: {
      type: mongoose.Schema.Types.Mixed
    },
    affectedRecords: {
      type: Number,
      default: 1
    },
    operationDuration: {
      type: Number // in milliseconds
    }
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  },
  errorMessage: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false // We're using custom timestamp field
});

// Indexes for performance optimization
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ targetUserType: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'details.ipAddress': 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });

// Compound indexes for common queries
auditLogSchema.index({ adminId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ targetUserType: 1, action: 1, timestamp: -1 });

// Static method to log admin action
auditLogSchema.statics.logAction = async function(logData) {
  try {
    const auditLog = new this(logData);
    return await auditLog.save();
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw error to prevent breaking the main operation
    return null;
  }
};

// Static method to get audit logs with filters
auditLogSchema.statics.getFilteredLogs = async function(filters = {}, options = {}) {
  const {
    adminId,
    action,
    targetUserType,
    startDate,
    endDate,
    ipAddress,
    status
  } = filters;
  
  const {
    page = 1,
    limit = 50,
    sortBy = 'timestamp',
    sortOrder = -1
  } = options;
  
  const query = {};
  
  if (adminId) query.adminId = adminId;
  if (action) query.action = action;
  if (targetUserType) query.targetUserType = targetUserType;
  if (status) query.status = status;
  if (ipAddress) query['details.ipAddress'] = ipAddress;
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    this.find(query)
      .populate('adminId', 'name email isRootAdmin')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get audit statistics
auditLogSchema.statics.getStatistics = async function(filters = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate = new Date()
  } = filters;
  
  const matchStage = {
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        successfulActions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failedActions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        actionsByType: {
          $push: '$action'
        },
        uniqueAdmins: { $addToSet: '$adminId' },
        uniqueIPs: { $addToSet: '$details.ipAddress' }
      }
    },
    {
      $project: {
        totalActions: 1,
        successfulActions: 1,
        failedActions: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successfulActions', '$totalActions'] },
            100
          ]
        },
        uniqueAdminCount: { $size: '$uniqueAdmins' },
        uniqueIPCount: { $size: '$uniqueIPs' },
        actionsByType: 1
      }
    }
  ]);
  
  // Get action type breakdown
  const actionBreakdown = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return {
    summary: stats[0] || {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      successRate: 0,
      uniqueAdminCount: 0,
      uniqueIPCount: 0
    },
    actionBreakdown
  };
};

// Method to export logs as CSV data
auditLogSchema.statics.exportToCSV = async function(filters = {}) {
  const { logs } = await this.getFilteredLogs(filters, { limit: 10000 });
  
  const csvData = logs.map(log => ({
    timestamp: log.timestamp.toISOString(),
    adminEmail: log.adminEmail,
    adminName: log.adminId?.name || 'Unknown',
    action: log.action,
    targetUserType: log.targetUserType || '',
    targetUserEmail: log.targetUserEmail || '',
    status: log.status,
    ipAddress: log.details?.ipAddress || '',
    reason: log.details?.reason || '',
    affectedRecords: log.details?.affectedRecords || 1,
    errorMessage: log.errorMessage || ''
  }));
  
  return csvData;
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;