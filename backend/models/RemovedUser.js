const mongoose = require('mongoose');

const removedUserSchema = new mongoose.Schema({
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Original user ID is required']
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['patient', 'doctor', 'hospital', 'admin']
  },
  userData: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'User data is required']
  },
  removedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Removed by admin ID is required']
  },
  removedByEmail: {
    type: String,
    required: [true, 'Removed by admin email is required']
  },
  removedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  isRestored: {
    type: Boolean,
    default: false
  },
  restoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  restoredByEmail: {
    type: String
  },
  restoredAt: {
    type: Date
  },
  scheduledDeletion: {
    type: Date,
    default: function() {
      // Auto-delete after 90 days
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }
  },
  // Additional metadata for tracking
  removalContext: {
    hasActiveCases: {
      type: Boolean,
      default: false
    },
    hasActiveConsultations: {
      type: Boolean,
      default: false
    },
    hasActiveSubscriptions: {
      type: Boolean,
      default: false
    },
    relatedRecordsCount: {
      type: Number,
      default: 0
    },
    backupLocation: {
      type: String // For external backup references
    }
  },
  // Restoration validation
  restorationNotes: {
    type: String
  },
  restorationValidated: {
    type: Boolean,
    default: false
  },
  // Data integrity checks
  dataIntegrityHash: {
    type: String
  },
  originalCreatedAt: {
    type: Date
  },
  originalUpdatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
removedUserSchema.index({ originalId: 1, userType: 1 }, { unique: true });
removedUserSchema.index({ userType: 1, removedAt: -1 });
removedUserSchema.index({ removedBy: 1, removedAt: -1 });
removedUserSchema.index({ isRestored: 1, removedAt: -1 });
removedUserSchema.index({ scheduledDeletion: 1 });
removedUserSchema.index({ 'userData.email': 1 });
removedUserSchema.index({ removedAt: -1 });

// Compound indexes for common queries
removedUserSchema.index({ userType: 1, isRestored: 1, removedAt: -1 });
removedUserSchema.index({ removedBy: 1, userType: 1, removedAt: -1 });

// Pre-save middleware to generate data integrity hash
removedUserSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('userData')) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(this.userData);
    this.dataIntegrityHash = crypto.createHash('sha256').update(dataString).digest('hex');
    
    // Store original timestamps if available
    if (this.userData.createdAt) {
      this.originalCreatedAt = new Date(this.userData.createdAt);
    }
    if (this.userData.updatedAt) {
      this.originalUpdatedAt = new Date(this.userData.updatedAt);
    }
  }
  next();
});

// Method to verify data integrity
removedUserSchema.methods.verifyDataIntegrity = function() {
  try {
    const crypto = require('crypto');
    const dataString = JSON.stringify(this.userData);
    const currentHash = crypto.createHash('sha256').update(dataString).digest('hex');
    return currentHash === this.dataIntegrityHash;
  } catch (error) {
    console.error('Data integrity verification failed:', error);
    return false;
  }
};

// Method to perform comprehensive data integrity check
removedUserSchema.methods.performComprehensiveIntegrityCheck = function() {
  const results = {
    hashIntegrity: false,
    structuralIntegrity: false,
    temporalIntegrity: false,
    contextIntegrity: false,
    issues: []
  };

  try {
    // Check hash integrity
    results.hashIntegrity = this.verifyDataIntegrity();
    if (!results.hashIntegrity) {
      results.issues.push('Data hash mismatch - data may have been corrupted');
    }

    // Check structural integrity
    if (!this.userData || typeof this.userData !== 'object') {
      results.issues.push('User data structure is invalid');
    } else {
      // Check for required fields based on user type
      const requiredFields = this._getRequiredFieldsForUserType(this.userType);
      const missingFields = requiredFields.filter(field => !this.userData[field]);
      
      if (missingFields.length === 0) {
        results.structuralIntegrity = true;
      } else {
        results.issues.push(`Missing required fields: ${missingFields.join(', ')}`);
      }
    }

    // Check temporal integrity
    if (this.removedAt && this.originalCreatedAt) {
      if (this.removedAt < this.originalCreatedAt) {
        results.issues.push('Removal date is before creation date');
      } else {
        results.temporalIntegrity = true;
      }
    } else {
      results.temporalIntegrity = true; // No temporal data to check
    }

    // Check context integrity
    if (this.removalContext) {
      const contextValid = this._validateRemovalContext();
      results.contextIntegrity = contextValid;
      if (!contextValid) {
        results.issues.push('Removal context data is inconsistent');
      }
    } else {
      results.contextIntegrity = true; // No context to validate
    }

    return results;

  } catch (error) {
    results.issues.push(`Integrity check failed: ${error.message}`);
    return results;
  }
};

// Helper method to get required fields for user type
removedUserSchema.methods._getRequiredFieldsForUserType = function(userType) {
  const requiredFieldsMap = {
    patient: ['name', 'email', 'dateOfBirth', 'bloodGroup'],
    doctor: ['name', 'email', 'dateOfBirth', 'degree', 'specializations'],
    hospital: ['name', 'email', 'hospitalName', 'registrationNumber'],
    admin: ['name', 'email']
  };

  return requiredFieldsMap[userType] || ['name', 'email'];
};

// Helper method to validate removal context
removedUserSchema.methods._validateRemovalContext = function() {
  try {
    const context = this.removalContext;
    
    // Check if boolean fields are actually boolean
    if (typeof context.hasActiveCases !== 'boolean' ||
        typeof context.hasActiveConsultations !== 'boolean' ||
        typeof context.hasActiveSubscriptions !== 'boolean') {
      return false;
    }

    // Check if numeric fields are valid numbers
    if (typeof context.relatedRecordsCount !== 'number' || 
        context.relatedRecordsCount < 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Method to mark as restored
removedUserSchema.methods.markAsRestored = async function(adminId, adminEmail, notes = '') {
  this.isRestored = true;
  this.restoredBy = adminId;
  this.restoredByEmail = adminEmail;
  this.restoredAt = new Date();
  this.restorationNotes = notes;
  this.restorationValidated = true;
  return await this.save();
};

// Static method to create removed user record
removedUserSchema.statics.createRemovedUser = async function(userData, userType, adminId, adminEmail, reason = '', context = {}) {
  const requestId = context.requestId || 'unknown';
  
  try {
    console.log(`[${requestId}] RemovedUser.createRemovedUser called with:`, {
      originalId: userData._id,
      userType,
      adminId,
      adminEmail,
      reason,
      contextKeys: Object.keys(context)
    });

    const removedUserData = {
      originalId: userData._id,
      userType,
      userData: userData.toObject ? userData.toObject() : userData,
      removedBy: adminId,
      removedByEmail: adminEmail,
      reason,
      removalContext: {
        hasActiveCases: context.hasActiveCases || false,
        hasActiveConsultations: context.hasActiveConsultations || false,
        hasActiveSubscriptions: context.hasActiveSubscriptions || false,
        relatedRecordsCount: context.relatedRecordsCount || 0,
        backupLocation: context.backupLocation || ''
      }
    };

    console.log(`[${requestId}] Creating RemovedUser document with data:`, {
      originalId: removedUserData.originalId,
      userType: removedUserData.userType,
      userDataKeys: Object.keys(removedUserData.userData),
      removalContext: removedUserData.removalContext
    });

    const removedUser = new this(removedUserData);
    
    console.log(`[${requestId}] RemovedUser document created, saving...`);
    const savedUser = await removedUser.save();
    
    console.log(`[${requestId}] RemovedUser saved successfully with ID: ${savedUser._id}`);
    return savedUser;

  } catch (error) {
    console.error(`[${requestId}] RemovedUser.createRemovedUser ERROR:`, {
      message: error.message,
      stack: error.stack,
      userData: userData ? { id: userData._id, email: userData.email } : 'null',
      userType,
      adminId,
      adminEmail
    });
    throw error;
  }
};

// Static method to get removed users with filters
removedUserSchema.statics.getFilteredRemovedUsers = async function(filters = {}, options = {}) {
  const {
    userType,
    removedBy,
    isRestored,
    startDate,
    endDate,
    searchEmail
  } = filters;
  
  const {
    page = 1,
    limit = 50,
    sortBy = 'removedAt',
    sortOrder = -1
  } = options;
  
  const query = {};
  
  if (userType) query.userType = userType;
  if (removedBy) query.removedBy = removedBy;
  if (typeof isRestored === 'boolean') query.isRestored = isRestored;
  if (searchEmail) query['userData.email'] = new RegExp(searchEmail, 'i');
  
  if (startDate || endDate) {
    query.removedAt = {};
    if (startDate) query.removedAt.$gte = new Date(startDate);
    if (endDate) query.removedAt.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [removedUsers, total] = await Promise.all([
    this.find(query)
      .populate('removedBy', 'name email isRootAdmin')
      .populate('restoredBy', 'name email isRootAdmin')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);
  
  return {
    removedUsers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get users scheduled for deletion
removedUserSchema.statics.getUsersScheduledForDeletion = async function(daysFromNow = 7) {
  const cutoffDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  
  return await this.find({
    isRestored: false,
    scheduledDeletion: { $lte: cutoffDate }
  })
  .populate('removedBy', 'name email')
  .sort({ scheduledDeletion: 1 });
};

// Static method to permanently delete expired records
removedUserSchema.statics.cleanupExpiredRecords = async function() {
  const now = new Date();
  
  try {
    // Get expired records before deletion for audit purposes
    const expiredRecords = await this.find({
      isRestored: false,
      scheduledDeletion: { $lte: now }
    }).lean();
    
    if (expiredRecords.length === 0) {
      return {
        deletedCount: 0,
        expiredRecords: []
      };
    }

    // Verify data integrity before deletion
    const integrityResults = [];
    for (const record of expiredRecords) {
      try {
        const recordDoc = await this.findById(record._id);
        const isIntegrityValid = recordDoc.verifyDataIntegrity();
        integrityResults.push({
          id: record._id,
          originalId: record.originalId,
          userType: record.userType,
          email: record.userData.email,
          integrityValid: isIntegrityValid
        });
      } catch (error) {
        integrityResults.push({
          id: record._id,
          originalId: record.originalId,
          userType: record.userType,
          email: record.userData.email,
          integrityValid: false,
          error: error.message
        });
      }
    }

    // Create backup information before deletion
    const backupData = expiredRecords.map(record => ({
      originalId: record.originalId,
      userType: record.userType,
      email: record.userData.email,
      name: record.userData.name,
      removedAt: record.removedAt,
      removedBy: record.removedByEmail,
      reason: record.reason,
      scheduledDeletion: record.scheduledDeletion,
      dataIntegrityHash: record.dataIntegrityHash,
      removalContext: record.removalContext
    }));

    // Perform the deletion
    const deleteResult = await this.deleteMany({
      isRestored: false,
      scheduledDeletion: { $lte: now }
    });
    
    return {
      deletedCount: deleteResult.deletedCount,
      expiredRecords: backupData,
      integrityResults: integrityResults,
      cleanupTimestamp: now
    };

  } catch (error) {
    console.error('Error during cleanup of expired records:', error);
    throw error;
  }
};

// Static method to get removal statistics
removedUserSchema.statics.getRemovalStatistics = async function(filters = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate = new Date()
  } = filters;
  
  const matchStage = {
    removedAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRemoved: { $sum: 1 },
        totalRestored: {
          $sum: { $cond: [{ $eq: ['$isRestored', true] }, 1, 0] }
        },
        byUserType: {
          $push: '$userType'
        },
        byAdmin: {
          $push: '$removedBy'
        }
      }
    }
  ]);
  
  // Get breakdown by user type
  const userTypeBreakdown = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userType',
        count: { $sum: 1 },
        restored: {
          $sum: { $cond: [{ $eq: ['$isRestored', true] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return {
    summary: stats[0] || {
      totalRemoved: 0,
      totalRestored: 0
    },
    userTypeBreakdown
  };
};

// Static method to perform batch data integrity check
removedUserSchema.statics.performBatchIntegrityCheck = async function(options = {}) {
  const {
    batchSize = 100,
    userType = null,
    onlyNonRestored = true
  } = options;

  try {
    const query = {};
    if (userType) query.userType = userType;
    if (onlyNonRestored) query.isRestored = false;

    const totalRecords = await this.countDocuments(query);
    const batches = Math.ceil(totalRecords / batchSize);
    
    let processedRecords = 0;
    let integrityIssues = 0;
    const corruptedRecords = [];
    const integrityReport = {
      totalRecords,
      processedRecords: 0,
      integrityIssues: 0,
      corruptedRecords: [],
      batchResults: [],
      startTime: new Date(),
      endTime: null
    };

    for (let batch = 0; batch < batches; batch++) {
      const skip = batch * batchSize;
      const records = await this.find(query)
        .skip(skip)
        .limit(batchSize)
        .lean();

      const batchResult = {
        batchNumber: batch + 1,
        recordsInBatch: records.length,
        integrityIssues: 0,
        corruptedRecords: []
      };

      for (const record of records) {
        processedRecords++;
        
        try {
          // Create a temporary document to use instance methods
          const tempDoc = new this(record);
          const integrityCheck = tempDoc.performComprehensiveIntegrityCheck();
          
          if (integrityCheck.issues.length > 0) {
            integrityIssues++;
            batchResult.integrityIssues++;
            
            const corruptedRecord = {
              id: record._id,
              originalId: record.originalId,
              userType: record.userType,
              email: record.userData?.email || 'Unknown',
              removedAt: record.removedAt,
              issues: integrityCheck.issues,
              integrityResults: integrityCheck
            };
            
            corruptedRecords.push(corruptedRecord);
            batchResult.corruptedRecords.push(corruptedRecord);
          }
        } catch (error) {
          integrityIssues++;
          batchResult.integrityIssues++;
          
          const errorRecord = {
            id: record._id,
            originalId: record.originalId,
            userType: record.userType,
            email: record.userData?.email || 'Unknown',
            removedAt: record.removedAt,
            issues: [`Integrity check failed: ${error.message}`],
            error: error.message
          };
          
          corruptedRecords.push(errorRecord);
          batchResult.corruptedRecords.push(errorRecord);
        }
      }

      integrityReport.batchResults.push(batchResult);
    }

    integrityReport.processedRecords = processedRecords;
    integrityReport.integrityIssues = integrityIssues;
    integrityReport.corruptedRecords = corruptedRecords;
    integrityReport.endTime = new Date();
    integrityReport.duration = integrityReport.endTime - integrityReport.startTime;

    return integrityReport;

  } catch (error) {
    throw new Error(`Batch integrity check failed: ${error.message}`);
  }
};

// Static method to get data integrity statistics
removedUserSchema.statics.getDataIntegrityStatistics = async function() {
  try {
    const totalRecords = await this.countDocuments({ isRestored: false });
    
    if (totalRecords === 0) {
      return {
        totalRecords: 0,
        integrityStatus: 'No records to check',
        lastChecked: new Date()
      };
    }

    // Sample check on recent records (last 100)
    const sampleRecords = await this.find({ isRestored: false })
      .sort({ removedAt: -1 })
      .limit(100)
      .lean();

    let integrityIssues = 0;
    const issueTypes = {
      hashMismatch: 0,
      structuralIssues: 0,
      temporalIssues: 0,
      contextIssues: 0
    };

    for (const record of sampleRecords) {
      try {
        const tempDoc = new this(record);
        const integrityCheck = tempDoc.performComprehensiveIntegrityCheck();
        
        if (integrityCheck.issues.length > 0) {
          integrityIssues++;
          
          // Categorize issues
          if (!integrityCheck.hashIntegrity) issueTypes.hashMismatch++;
          if (!integrityCheck.structuralIntegrity) issueTypes.structuralIssues++;
          if (!integrityCheck.temporalIntegrity) issueTypes.temporalIssues++;
          if (!integrityCheck.contextIntegrity) issueTypes.contextIssues++;
        }
      } catch (error) {
        integrityIssues++;
        issueTypes.structuralIssues++;
      }
    }

    const integrityPercentage = ((sampleRecords.length - integrityIssues) / sampleRecords.length) * 100;

    return {
      totalRecords,
      sampleSize: sampleRecords.length,
      integrityIssues,
      integrityPercentage: Math.round(integrityPercentage * 100) / 100,
      issueTypes,
      integrityStatus: integrityPercentage >= 95 ? 'Good' : 
                      integrityPercentage >= 85 ? 'Fair' : 'Poor',
      lastChecked: new Date()
    };

  } catch (error) {
    throw new Error(`Failed to get integrity statistics: ${error.message}`);
  }
};

const RemovedUser = mongoose.model('RemovedUser', removedUserSchema);

module.exports = RemovedUser;