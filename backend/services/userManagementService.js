const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Admin = require('../models/Admin');
const RemovedUser = require('../models/RemovedUser');
const AuditLog = require('../models/AuditLog');
const Case = require('../models/Case');
const Consultation = require('../models/Consultation');

class UserManagementService {
  constructor() {
    this.userModels = {
      patient: Patient,
      doctor: Doctor,
      hospital: Hospital,
      admin: Admin
    };
  }

  /**
   * Remove user with soft deletion and data preservation
   * @param {string} userId - ID of user to remove
   * @param {string} userType - Type of user (patient, doctor, hospital, admin)
   * @param {string} adminId - ID of admin performing the action
   * @param {string} adminEmail - Email of admin performing the action
   * @param {string} reason - Reason for removal
   * @param {Object} context - Additional context (IP, user agent, etc.)
   * @returns {Object} Result of removal operation
   */
  async removeUser(userId, userType, adminId, adminEmail, reason = '', context = {}) {
    const requestId = context.requestId || 'unknown';
    
    try {
      console.log(`[${requestId}] UserManagementService.removeUser called with:`, {
        userId, userType, adminId, adminEmail, reason
      });

      const UserModel = this.userModels[userType];
      if (!UserModel) {
        console.log(`[${requestId}] ERROR: Invalid user type: ${userType}`);
        throw new Error(`Invalid user type: ${userType}`);
      }

      console.log(`[${requestId}] UserModel found: ${UserModel.modelName}`);

      // Find the user to be removed
      console.log(`[${requestId}] Finding user with ID: ${userId}`);
      const user = await UserModel.findById(userId);
      if (!user) {
        console.log(`[${requestId}] ERROR: User not found with ID: ${userId}`);
        throw new Error(`${userType} not found with ID: ${userId}`);
      }

      console.log(`[${requestId}] User found:`, {
        id: user._id,
        email: user.email,
        name: user.name,
        isActive: user.isActive
      });

      // Check if user is already inactive
      if (user.isActive === false) {
        console.log(`[${requestId}] ERROR: User is already inactive`);
        throw new Error(`${userType} is already inactive`);
      }

      // Special check for root admin - cannot be removed
      if (userType === 'admin' && user.isRoot && user.isRoot()) {
        console.log(`[${requestId}] ERROR: Attempting to remove root admin`);
        throw new Error('Root admin cannot be removed');
      }

      // Check for active processes that might prevent removal
      console.log(`[${requestId}] Checking active processes...`);
      const activeProcesses = await this._checkActiveProcesses(userId, userType);
      console.log(`[${requestId}] Active processes check result:`, activeProcesses);
      
      // If there are critical active processes, prevent removal
      if (activeProcesses.hasCriticalProcesses) {
        console.log(`[${requestId}] ERROR: Critical processes prevent removal: ${activeProcesses.reason}`);
        throw new Error(`Cannot remove ${userType}: ${activeProcesses.reason}`);
      }

      // Create removal context
      const removalContext = {
        hasActiveCases: activeProcesses.activeCasesCount > 0,
        hasActiveConsultations: activeProcesses.activeConsultationsCount > 0,
        hasActiveSubscriptions: activeProcesses.hasActiveSubscriptions,
        relatedRecordsCount: activeProcesses.totalRelatedRecords,
        ...context
      };

      console.log(`[${requestId}] Removal context created:`, removalContext);

      // Create removed user record for data preservation
      console.log(`[${requestId}] Creating removed user record...`);
      const removedUser = await RemovedUser.createRemovedUser(
        user,
        userType,
        adminId,
        adminEmail,
        reason,
        removalContext
      );

      console.log(`[${requestId}] Removed user record created with ID: ${removedUser._id}`);

      // Mark user as inactive instead of deleting
      console.log(`[${requestId}] Marking user as inactive...`);
      user.isActive = false;
      await user.save();
      console.log(`[${requestId}] User marked as inactive successfully`);

      // Log the action
      console.log(`[${requestId}] Logging audit action...`);
      await AuditLog.logAction({
        adminId,
        adminEmail,
        action: 'USER_REMOVED',
        targetUserId: userId,
        targetUserType: userType,
        targetUserEmail: user.email,
        details: {
          reason,
          ipAddress: context.ipAddress || 'unknown',
          userAgent: context.userAgent || 'unknown',
          sessionId: context.sessionId,
          additionalData: {
            activeProcesses,
            removalContext,
            emailDeliveryStatus: context.emailDeliveryStatus || 'not_tracked',
            requestId
          }
        },
        status: 'success'
      });

      console.log(`[${requestId}] Audit action logged successfully`);

      const result = {
        success: true,
        message: `${userType} removed successfully`,
        removedUserId: removedUser._id,
        userData: {
          id: user._id,
          email: user.email,
          name: user.name,
          removedAt: removedUser.removedAt
        },
        activeProcesses
      };

      console.log(`[${requestId}] UserManagementService.removeUser completed successfully:`, result);
      return result;

    } catch (error) {
      console.error(`[${requestId}] UserManagementService.removeUser ERROR:`, {
        message: error.message,
        stack: error.stack,
        userId,
        userType
      });

      // Log failed removal attempt
      try {
        await AuditLog.logAction({
          adminId,
          adminEmail,
          action: 'USER_REMOVED',
          targetUserId: userId,
          targetUserType: userType,
          details: {
            reason,
            ipAddress: context.ipAddress || 'unknown',
            userAgent: context.userAgent || 'unknown',
            sessionId: context.sessionId,
            additionalData: {
              requestId,
              errorStack: error.stack
            }
          },
          status: 'failed',
          errorMessage: error.message
        });
      } catch (auditError) {
        console.error(`[${requestId}] Failed to log audit action:`, auditError);
      }

      throw error;
    }
  }

  /**
   * Restore removed user
   * @param {string} userId - Original ID of user to restore
   * @param {string} userType - Type of user
   * @param {string} adminId - ID of admin performing restoration
   * @param {string} adminEmail - Email of admin performing restoration
   * @param {string} notes - Restoration notes
   * @param {Object} context - Additional context
   * @returns {Object} Result of restoration operation
   */
  async restoreUser(userId, userType, adminId, adminEmail, notes = '', context = {}) {
    try {
      // Find the removed user record
      const removedUser = await RemovedUser.findOne({
        originalId: userId,
        userType,
        isRestored: false
      });

      if (!removedUser) {
        throw new Error(`No removed ${userType} found with ID: ${userId}`);
      }

      // Verify data integrity
      if (!removedUser.verifyDataIntegrity()) {
        throw new Error('Data integrity check failed - cannot restore user');
      }

      const UserModel = this.userModels[userType];
      
      // Find the inactive user record
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(`${userType} record not found for restoration`);
      }

      // Reactivate the user
      user.isActive = true;
      await user.save();

      // Mark removed user record as restored
      await removedUser.markAsRestored(adminId, adminEmail, notes);

      // Log the restoration
      await AuditLog.logAction({
        adminId,
        adminEmail,
        action: 'USER_RESTORED',
        targetUserId: userId,
        targetUserType: userType,
        targetUserEmail: user.email,
        details: {
          reason: notes,
          ipAddress: context.ipAddress || 'unknown',
          userAgent: context.userAgent || 'unknown',
          sessionId: context.sessionId,
          additionalData: {
            originalRemovalDate: removedUser.removedAt,
            originalRemovalReason: removedUser.reason,
            emailDeliveryStatus: context.emailDeliveryStatus || 'not_tracked'
          }
        },
        status: 'success'
      });

      return {
        success: true,
        message: `${userType} restored successfully`,
        userData: {
          id: user._id,
          email: user.email,
          name: user.name,
          restoredAt: removedUser.restoredAt
        }
      };

    } catch (error) {
      // Log failed restoration attempt
      await AuditLog.logAction({
        adminId,
        adminEmail,
        action: 'USER_RESTORED',
        targetUserId: userId,
        targetUserType: userType,
        details: {
          reason: notes,
          ipAddress: context.ipAddress || 'unknown',
          userAgent: context.userAgent || 'unknown',
          sessionId: context.sessionId
        },
        status: 'failed',
        errorMessage: error.message
      });

      throw error;
    }
  }

  /**
   * Get users by type with role-based filtering
   * @param {string} userType - Type of users to retrieve
   * @param {Object} filters - Filtering options
   * @param {string} adminRole - Role of requesting admin
   * @param {Object} options - Pagination and sorting options
   * @returns {Object} Users list with pagination
   */
  async getUsersByType(userType, filters = {}, adminRole = 'admin', options = {}) {
    const requestId = `getUsersByType_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${requestId}] getUsersByType called with:`, {
        userType, filters, adminRole, options
      });
      
      // If no userType specified, fetch all user types
      if (!userType) {
        console.log(`[${requestId}] No userType specified, fetching all user types`);
        return await this.getAllUserTypes(filters, adminRole, options, requestId);
      }
      
      const UserModel = this.userModels[userType];
      if (!UserModel) {
        console.log(`[${requestId}] ERROR: Invalid user type: ${userType}`);
        throw new Error(`Invalid user type: ${userType}`);
      }

      console.log(`[${requestId}] UserModel found: ${UserModel.modelName}`);

      // Role-based access control
      if (userType === 'admin' && adminRole !== 'root') {
        console.log(`[${requestId}] ERROR: Non-root admin trying to access admin list`);
        throw new Error('Only root admin can access admin user list');
      }

      const {
        search = '',
        isActive = true,
        startDate,
        endDate,
        specialization, // for doctors
        verificationStatus // for hospitals
      } = filters;

      const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;

      // Build query
      const query = { isActive };

      // Search functionality
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Type-specific filters
      if (userType === 'doctor' && specialization) {
        query.specializations = new RegExp(specialization, 'i');
      }

      if (userType === 'hospital' && verificationStatus) {
        query.verificationStatus = verificationStatus;
      }

      const skip = (page - 1) * limit;

      console.log(`[${requestId}] Built query:`, query);
      console.log(`[${requestId}] Query options:`, { skip, limit, sortBy, sortOrder });

      // Execute query with population for related fields
      let queryBuilder = UserModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

      // Add population based on user type
      if (userType === 'admin') {
        queryBuilder = queryBuilder.populate('createdBy', 'name email');
      }

      console.log(`[${requestId}] Executing database query...`);
      const [users, total] = await Promise.all([
        queryBuilder.lean(),
        UserModel.countDocuments(query)
      ]);

      console.log(`[${requestId}] Database query results:`, {
        usersFound: users.length,
        totalCount: total,
        sampleUser: users[0] ? { id: users[0]._id, email: users[0].email, name: users[0].name } : 'none'
      });

      // Remove sensitive data and add role field
      const sanitizedUsers = users.map(user => {
        const { password, apiSecret, ...sanitizedUser } = user;
        // Add role field based on userType for frontend compatibility
        sanitizedUser.role = userType;
        return sanitizedUser;
      });

      return {
        users: sanitizedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          userType,
          search,
          isActive,
          startDate,
          endDate,
          specialization,
          verificationStatus
        }
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all user types (patients, doctors, admins) combined
   * @param {Object} filters - Search and filter criteria
   * @param {string} adminRole - Role of requesting admin
   * @param {Object} options - Pagination and sorting options
   * @param {string} requestId - Request ID for logging
   * @returns {Object} Combined users list with pagination
   */
  async getAllUserTypes(filters = {}, adminRole = 'admin', options = {}, requestId) {
    try {
      console.log(`[${requestId}] getAllUserTypes called`);
      
      const {
        search = '',
        isActive = true,
        startDate,
        endDate
      } = filters;

      const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;

      // Build base query
      const baseQuery = { isActive };

      // Search functionality
      if (search) {
        baseQuery.$or = [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        baseQuery.createdAt = {};
        if (startDate) baseQuery.createdAt.$gte = startDate;
        if (endDate) baseQuery.createdAt.$lte = endDate;
      }

      // Fetch from all user types
      const userTypePromises = [];
      const userTypes = ['patient', 'doctor', 'admin'];
      
      // Only include admin if requesting admin is root
      const typesToFetch = adminRole === 'root' ? userTypes : ['patient', 'doctor'];
      
      for (const type of typesToFetch) {
        const UserModel = this.userModels[type];
        const promise = UserModel.find(baseQuery)
          .select('-password -apiSecret')
          .sort({ [sortBy]: sortOrder })
          .lean()
          .then(users => users.map(user => ({
            ...user,
            role: type,
            collectionType: type
          })));
        userTypePromises.push(promise);
      }

      // Execute all queries in parallel
      const userArrays = await Promise.all(userTypePromises);
      
      // Combine all users
      let allUsers = [];
      userArrays.forEach(users => {
        allUsers = allUsers.concat(users);
      });

      // Sort combined results
      allUsers.sort((a, b) => {
        if (sortBy === 'createdAt') {
          const aDate = new Date(a.createdAt);
          const bDate = new Date(b.createdAt);
          return sortOrder === -1 ? bDate - aDate : aDate - bDate;
        }
        // Add other sorting logic if needed
        return 0;
      });

      // Apply pagination to combined results
      const total = allUsers.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = allUsers.slice(startIndex, endIndex);

      console.log(`[${requestId}] getAllUserTypes result: ${paginatedUsers.length} users from ${total} total`);

      return {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          userType: 'all',
          search,
          isActive,
          startDate,
          endDate
        }
      };

    } catch (error) {
      console.error(`[${requestId}] getAllUserTypes error:`, error);
      throw error;
    }
  }

  /**
   * Bulk remove users
   * @param {Array} userIds - Array of user IDs to remove
   * @param {string} userType - Type of users
   * @param {string} adminId - ID of admin performing the action
   * @param {string} adminEmail - Email of admin performing the action
   * @param {string} reason - Reason for bulk removal
   * @param {Object} context - Additional context
   * @returns {Object} Result of bulk removal operation
   */
  async bulkRemoveUsers(userIds, userType, adminId, adminEmail, reason = '', context = {}) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('User IDs array is required and cannot be empty');
      }

      if (userIds.length > 50) {
        throw new Error('Cannot remove more than 50 users at once');
      }

      const results = {
        successful: [],
        failed: [],
        totalProcessed: userIds.length
      };

      // Process each user removal
      for (const userId of userIds) {
        try {
          const result = await this.removeUser(
            userId,
            userType,
            adminId,
            adminEmail,
            reason,
            context
          );
          results.successful.push({
            userId,
            email: result.userData.email,
            name: result.userData.name
          });
        } catch (error) {
          results.failed.push({
            userId,
            error: error.message
          });
        }
      }

      // Log bulk operation
      await AuditLog.logAction({
        adminId,
        adminEmail,
        action: 'BULK_USER_OPERATION',
        targetUserType: userType,
        details: {
          reason,
          ipAddress: context.ipAddress || 'unknown',
          userAgent: context.userAgent || 'unknown',
          sessionId: context.sessionId,
          affectedRecords: results.successful.length,
          additionalData: {
            totalRequested: userIds.length,
            successful: results.successful.length,
            failed: results.failed.length,
            failedUsers: results.failed
          }
        },
        status: results.failed.length === 0 ? 'success' : 'partial'
      });

      return {
        success: true,
        message: `Bulk removal completed: ${results.successful.length} successful, ${results.failed.length} failed`,
        results
      };

    } catch (error) {
      // Log failed bulk operation
      await AuditLog.logAction({
        adminId,
        adminEmail,
        action: 'BULK_USER_OPERATION',
        targetUserType: userType,
        details: {
          reason,
          ipAddress: context.ipAddress || 'unknown',
          userAgent: context.userAgent || 'unknown',
          sessionId: context.sessionId,
          affectedRecords: 0
        },
        status: 'failed',
        errorMessage: error.message
      });

      throw error;
    }
  }

  /**
   * Get removed users (root admin only)
   * @param {Object} filters - Filtering options
   * @param {Object} options - Pagination options
   * @returns {Object} Removed users list with pagination
   */
  async getRemovedUsers(filters = {}, options = {}) {
    try {
      return await RemovedUser.getFilteredRemovedUsers(filters, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user removal statistics
   * @param {Object} filters - Date range and other filters
   * @returns {Object} Removal statistics
   */
  async getRemovalStatistics(filters = {}) {
    try {
      return await RemovedUser.getRemovalStatistics(filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check for active processes that might prevent user removal
   * @private
   * @param {string} userId - User ID to check
   * @param {string} userType - Type of user
   * @returns {Object} Active processes information
   */
  async _checkActiveProcesses(userId, userType) {
    try {
      const processes = {
        activeCasesCount: 0,
        activeConsultationsCount: 0,
        hasActiveSubscriptions: false,
        totalRelatedRecords: 0,
        hasCriticalProcesses: false,
        reason: ''
      };

      // Check for active cases
      if (Case) {
        const activeCases = await Case.countDocuments({
          $or: [
            { patientId: userId },
            { doctorId: userId }
          ],
          status: { $in: ['open', 'in_progress', 'pending'] }
        });
        processes.activeCasesCount = activeCases;
        processes.totalRelatedRecords += activeCases;
      }

      // Check for active consultations
      if (Consultation) {
        const activeConsultations = await Consultation.countDocuments({
          $or: [
            { patientId: userId },
            { doctorId: userId }
          ],
          status: { $in: ['scheduled', 'in_progress'] }
        });
        processes.activeConsultationsCount = activeConsultations;
        processes.totalRelatedRecords += activeConsultations;
      }

      // Check for active subscriptions (for doctors)
      if (userType === 'doctor') {
        const doctor = await Doctor.findById(userId);
        if (doctor && doctor.subscriptionStatus === 'active') {
          processes.hasActiveSubscriptions = true;
        }
      }

      // Determine if there are critical processes that prevent removal
      if (processes.activeConsultationsCount > 0) {
        processes.hasCriticalProcesses = true;
        processes.reason = `User has ${processes.activeConsultationsCount} active consultation(s)`;
      }

      return processes;

    } catch (error) {
      console.error('Error checking active processes:', error);
      return {
        activeCasesCount: 0,
        activeConsultationsCount: 0,
        hasActiveSubscriptions: false,
        totalRelatedRecords: 0,
        hasCriticalProcesses: false,
        reason: ''
      };
    }
  }

  /**
   * Get user by ID and type
   * @param {string} userId - User ID
   * @param {string} userType - Type of user
   * @returns {Object} User data
   */
  async getUserById(userId, userType) {
    try {
      const UserModel = this.userModels[userType];
      if (!UserModel) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      const user = await UserModel.findById(userId).lean();
      if (!user) {
        throw new Error(`${userType} not found with ID: ${userId}`);
      }

      // Remove sensitive data
      const { password, apiSecret, ...sanitizedUser } = user;
      return sanitizedUser;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user can be removed
   * @param {string} userId - User ID
   * @param {string} userType - Type of user
   * @param {string} adminRole - Role of requesting admin
   * @returns {Object} Removal eligibility information
   */
  async checkRemovalEligibility(userId, userType, adminRole = 'admin') {
    try {
      const UserModel = this.userModels[userType];
      if (!UserModel) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(`${userType} not found with ID: ${userId}`);
      }

      // Check admin permissions
      if (userType === 'admin' && adminRole !== 'root') {
        return {
          canRemove: false,
          reason: 'Only root admin can remove other admins'
        };
      }

      // Check if root admin
      if (userType === 'admin' && user.isRoot()) {
        return {
          canRemove: false,
          reason: 'Root admin cannot be removed'
        };
      }

      // Check if already inactive
      if (user.isActive === false) {
        return {
          canRemove: false,
          reason: 'User is already inactive'
        };
      }

      // Check active processes
      const activeProcesses = await this._checkActiveProcesses(userId, userType);
      
      if (activeProcesses.hasCriticalProcesses) {
        return {
          canRemove: false,
          reason: activeProcesses.reason,
          activeProcesses
        };
      }

      return {
        canRemove: true,
        reason: 'User can be removed',
        activeProcesses
      };

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserManagementService();