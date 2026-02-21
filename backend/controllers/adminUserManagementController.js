const Admin = require('../models/Admin');
const userManagementService = require('../services/userManagementService');
const auditLoggerService = require('../services/auditLoggerService');
const emailNotificationService = require('../services/emailNotificationService');

/**
 * Admin User Management Controller
 * Handles admin operations for managing users across the platform
 * Implements role-based access control with root admin privileges
 */

/**
 * Add new admin (Root admin only)
 * Creates a new admin user with regular admin privileges
 */
exports.addAdmin = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { name, email, password } = req.body;
    const requestingAdmin = req.admin;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if admin with email already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      await auditLoggerService.logAdminAction({
        adminId: requestingAdmin._id,
        adminEmail: requestingAdmin.email,
        action: 'ADMIN_ADDED',
        details: {
          reason: 'Failed - duplicate email',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          sessionId: req.sessionID,
          additionalData: {
            attemptedEmail: email,
            operationDuration: Date.now() - startTime
          }
        },
        status: 'failed',
        errorMessage: 'Admin with this email already exists'
      });

      return res.status(409).json({
        success: false,
        message: 'Admin with this email already exists',
        code: 'DUPLICATE_ADMIN_EMAIL'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      createdBy: requestingAdmin._id,
      isActive: true
    });

    // Set default permissions (done automatically in pre-save middleware)
    await newAdmin.save();

    // Send welcome email to new admin
    let emailDeliveryStatus = 'not_sent';
    try {
      const emailResult = await emailNotificationService.sendNewAdminWelcomeEmail(
        { email: newAdmin.email, name: newAdmin.name },
        password, // Send temporary password
        requestingAdmin.name
      );
      emailDeliveryStatus = emailResult ? 'sent' : 'failed';
    } catch (emailError) {
      console.error('Failed to send welcome email to new admin:', emailError);
      emailDeliveryStatus = 'failed';
      // Don't fail the operation if email fails
    }

    // Log successful admin creation
    await auditLoggerService.logAdminAction({
      adminId: requestingAdmin._id,
      adminEmail: requestingAdmin.email,
      action: 'ADMIN_ADDED',
      targetUserId: newAdmin._id,
      targetUserType: 'admin',
      targetUserEmail: newAdmin.email,
      details: {
        reason: 'New admin account created',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        additionalData: {
          newAdminName: newAdmin.name,
          emailDeliveryStatus,
          operationDuration: Date.now() - startTime
        }
      },
      status: 'success'
    });

    // Return success response (exclude password)
    const { password: _, ...adminData } = newAdmin.toObject();
    
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: adminData
    });

  } catch (error) {
    // Log failed admin creation
    await auditLoggerService.logAdminAction({
      adminId: req.admin?._id,
      adminEmail: req.admin?.email || 'unknown',
      action: 'ADMIN_ADDED',
      details: {
        reason: 'Failed - system error',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        additionalData: {
          operationDuration: Date.now() - startTime
        }
      },
      status: 'failed',
      errorMessage: error.message
    });

    console.error('Add admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating admin',
      code: 'ADMIN_CREATION_ERROR'
    });
  }
};

/**
 * Remove user with role-based permissions
 * Allows admins to remove users based on their permission level
 */
exports.removeUser = async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] ===== USER REMOVAL REQUEST START =====`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[${requestId}] Request params:`, req.params);
  console.log(`[${requestId}] Request query:`, req.query);
  console.log(`[${requestId}] Request body:`, req.body);
  console.log(`[${requestId}] Request headers:`, {
    'user-agent': req.get('User-Agent'),
    'x-forwarded-for': req.get('X-Forwarded-For'),
    'authorization': req.get('Authorization') ? 'Bearer [REDACTED]' : 'None'
  });
  
  try {
    const { id } = req.params;
    const { userType } = req.query;
    const { reason = '' } = req.body;
    const requestingAdmin = req.admin;

    console.log(`[${requestId}] Extracted parameters:`, { id, userType, reason });
    console.log(`[${requestId}] Requesting admin:`, {
      id: requestingAdmin?._id,
      email: requestingAdmin?.email,
      isRoot: requestingAdmin?.isRoot ? requestingAdmin.isRoot() : 'unknown'
    });

    // Validate required parameters
    if (!id || !userType) {
      console.log(`[${requestId}] VALIDATION ERROR: Missing required parameters`);
      return res.status(400).json({
        success: false,
        message: 'User ID and user type are required',
        code: 'MISSING_REQUIRED_PARAMETERS'
      });
    }

    // Validate user type
    const validUserTypes = ['patient', 'doctor', 'hospital', 'admin'];
    if (!validUserTypes.includes(userType)) {
      console.log(`[${requestId}] VALIDATION ERROR: Invalid user type: ${userType}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid user type',
        code: 'INVALID_USER_TYPE'
      });
    }

    console.log(`[${requestId}] Validation passed, checking removal eligibility...`);

    // Check removal eligibility
    const eligibilityCheck = await userManagementService.checkRemovalEligibility(
      id,
      userType,
      requestingAdmin.isRoot() ? 'root' : 'admin'
    );

    console.log(`[${requestId}] Eligibility check result:`, eligibilityCheck);

    if (!eligibilityCheck.canRemove) {
      console.log(`[${requestId}] ELIGIBILITY ERROR: ${eligibilityCheck.reason}`);
      
      await auditLoggerService.logAdminAction({
        adminId: requestingAdmin._id,
        adminEmail: requestingAdmin.email,
        action: 'USER_REMOVED',
        targetUserId: id,
        targetUserType: userType,
        details: {
          reason: `Failed - ${eligibilityCheck.reason}`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          sessionId: req.sessionID,
          additionalData: {
            operationDuration: Date.now() - startTime,
            requestId
          }
        },
        status: 'failed',
        errorMessage: eligibilityCheck.reason
      });

      return res.status(403).json({
        success: false,
        message: eligibilityCheck.reason,
        code: 'REMOVAL_NOT_ALLOWED',
        activeProcesses: eligibilityCheck.activeProcesses
      });
    }

    console.log(`[${requestId}] Eligibility check passed, proceeding with removal...`);

    // Initialize email delivery status
    let emailDeliveryStatus = 'not_sent';

    // Perform user removal
    console.log(`[${requestId}] Calling userManagementService.removeUser...`);
    const removalResult = await userManagementService.removeUser(
      id,
      userType,
      requestingAdmin._id,
      requestingAdmin.email,
      reason,
      {
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        emailDeliveryStatus,
        requestId
      }
    );

    console.log(`[${requestId}] User removal completed successfully:`, {
      removedUserId: removalResult.removedUserId,
      userData: removalResult.userData
    });

    // Send notification email to removed user
    console.log(`[${requestId}] Sending notification email...`);
    try {
      const emailResult = await emailNotificationService.sendUserRemovalNotification(
        {
          email: removalResult.userData.email,
          name: removalResult.userData.name,
          userType: userType
        },
        reason,
        requestingAdmin.name
      );
      emailDeliveryStatus = emailResult ? 'sent' : 'failed';
      console.log(`[${requestId}] Email notification result: ${emailDeliveryStatus}`);
    } catch (emailError) {
      console.error(`[${requestId}] Failed to send removal notification email:`, emailError);
      emailDeliveryStatus = 'failed';
      // Don't fail the operation if email fails
    }

    console.log(`[${requestId}] ===== USER REMOVAL REQUEST SUCCESS =====`);
    console.log(`[${requestId}] Total duration: ${Date.now() - startTime}ms`);

    res.status(200).json({
      success: true,
      message: `${userType} removed successfully`,
      removedUser: removalResult.userData,
      activeProcesses: removalResult.activeProcesses,
      emailDeliveryStatus
    });

  } catch (error) {
    console.error(`[${requestId}] ===== USER REMOVAL REQUEST ERROR =====`);
    console.error(`[${requestId}] Error details:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.error(`[${requestId}] Total duration: ${Date.now() - startTime}ms`);

    // Log failed removal attempt
    try {
      await auditLoggerService.logAdminAction({
        adminId: req.admin?._id,
        adminEmail: req.admin?.email || 'unknown',
        action: 'USER_REMOVED',
        targetUserId: req.params.id,
        targetUserType: req.query.userType,
        details: {
          reason: `Failed - ${error.message}`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          sessionId: req.sessionID,
          additionalData: {
            operationDuration: Date.now() - startTime,
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

    console.error('Remove user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing user',
      code: 'USER_REMOVAL_ERROR',
      requestId: requestId
    });
  }
};

/**
 * Get users with filtering and role-based access
 * Returns users based on admin permissions and applied filters
 */
exports.getUsers = async (req, res) => {
  const requestId = `getUsers_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] ===== GET USERS REQUEST =====`);
    console.log(`[${requestId}] Query parameters:`, req.query);
    
    const {
      userType,  // Remove default value to allow fetching all types
      search = '',
      isActive = 'true',
      startDate,
      endDate,
      specialization,
      verificationStatus,
      page = '1',
      limit = '50',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const requestingAdmin = req.admin;
    
    console.log(`[${requestId}] Parsed parameters:`, {
      userType, search, isActive, page, limit, sortBy, sortOrder
    });
    console.log(`[${requestId}] Requesting admin:`, {
      id: requestingAdmin?._id,
      email: requestingAdmin?.email,
      isRoot: requestingAdmin?.isRoot ? requestingAdmin.isRoot() : 'unknown'
    });

    // Validate user type (allow undefined for fetching all types)
    const validUserTypes = ['patient', 'doctor', 'hospital', 'admin'];
    if (userType && !validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type',
        code: 'INVALID_USER_TYPE'
      });
    }

    // Build filters
    const filters = {
      search,
      isActive: isActive === 'true',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      specialization,
      verificationStatus
    };

    // Build options
    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 per page
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };

    // Get users with role-based filtering
    console.log(`[${requestId}] Calling getUsersByType with:`, {
      userType,
      filters,
      adminRole: requestingAdmin.isRoot() ? 'root' : 'admin',
      options
    });
    
    const result = await userManagementService.getUsersByType(
      userType,
      filters,
      requestingAdmin.isRoot() ? 'root' : 'admin',
      options
    );

    console.log(`[${requestId}] getUsersByType result:`, {
      userCount: result.users?.length || 0,
      pagination: result.pagination,
      filters: result.filters
    });

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
      code: 'USER_FETCH_ERROR'
    });
  }
};

/**
 * Get admin users (Root admin only)
 * Returns list of all admin users with their details
 */
exports.getAdmins = async (req, res) => {
  try {
    const {
      search = '',
      isActive = 'true',
      page = '1',
      limit = '50',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const requestingAdmin = req.admin;

    // Build filters
    const filters = {
      search,
      isActive: isActive === 'true'
    };

    // Build options
    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };

    // Get admin users (only root admin can access this)
    const result = await userManagementService.getUsersByType(
      'admin',
      filters,
      'root', // Force root admin check
      options
    );

    // Add additional admin-specific information
    const adminsWithDetails = result.users.map(admin => ({
      ...admin,
      isRootAdmin: admin.isRootAdmin || admin.email === 'admin@gmail.com',
      canBeRemoved: admin.email !== 'admin@gmail.com' && !admin.isRootAdmin,
      permissionCount: admin.permissions ? admin.permissions.length : 0
    }));

    res.status(200).json({
      success: true,
      users: adminsWithDetails,
      pagination: result.pagination,
      filters: result.filters
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching admins',
      code: 'ADMIN_FETCH_ERROR'
    });
  }
};
/*
*
 * Restore removed user (Root admin only)
 * Restores a previously removed user account
 */
exports.restoreUser = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { userType } = req.query;
    const { notes = '' } = req.body;
    const requestingAdmin = req.admin;

    // Validate required parameters
    if (!id || !userType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and user type are required',
        code: 'MISSING_REQUIRED_PARAMETERS'
      });
    }

    // Validate user type
    const validUserTypes = ['patient', 'doctor', 'hospital', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type',
        code: 'INVALID_USER_TYPE'
      });
    }

    // Perform user restoration
    const restorationResult = await userManagementService.restoreUser(
      id,
      userType,
      requestingAdmin._id,
      requestingAdmin.email,
      notes,
      {
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        emailDeliveryStatus
      }
    );

    // Send restoration notification email
    let emailDeliveryStatus = 'not_sent';
    try {
      const emailResult = await emailNotificationService.sendUserRestorationNotification(
        {
          email: restorationResult.userData.email,
          name: restorationResult.userData.name,
          userType: userType
        },
        requestingAdmin.name,
        notes
      );
      emailDeliveryStatus = emailResult ? 'sent' : 'failed';
    } catch (emailError) {
      console.error('Failed to send restoration notification email:', emailError);
      emailDeliveryStatus = 'failed';
      // Don't fail the operation if email fails
    }

    res.status(200).json({
      success: true,
      message: `${userType} restored successfully`,
      restoredUser: restorationResult.userData,
      emailDeliveryStatus
    });

  } catch (error) {
    // Log failed restoration attempt
    await auditLoggerService.logAdminAction({
      adminId: req.admin?._id,
      adminEmail: req.admin?.email || 'unknown',
      action: 'USER_RESTORED',
      targetUserId: req.params.id,
      targetUserType: req.query.userType,
      details: {
        reason: `Failed - ${error.message}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        additionalData: {
          operationDuration: Date.now() - startTime
        }
      },
      status: 'failed',
      errorMessage: error.message
    });

    console.error('Restore user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while restoring user',
      code: 'USER_RESTORATION_ERROR'
    });
  }
};

/**
 * Get audit logs (Root admin only)
 * Returns comprehensive audit logs with filtering options
 */
exports.getAuditLogs = async (req, res) => {
  try {
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
      searchTerm,
      page = '1',
      limit = '50',
      sortBy = 'timestamp',
      sortOrder = 'desc',
      includeDetails = 'true'
    } = req.query;

    const requestingAdmin = req.admin;

    // Build filters
    const filters = {
      adminId,
      adminEmail,
      action: action ? (action.includes(',') ? action.split(',') : action) : undefined,
      targetUserType,
      targetUserEmail,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      ipAddress,
      status,
      searchTerm
    };

    // Build options
    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 200), // Max 200 per page for audit logs
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1,
      includeDetails: includeDetails === 'true'
    };

    // Get audit logs (only root admin can access)
    const result = await auditLoggerService.getAuditLogs(
      filters,
      options,
      requestingAdmin._id
    );

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching audit logs',
      code: 'AUDIT_LOGS_FETCH_ERROR'
    });
  }
};

/**
 * Get removed users (Root admin only)
 * Returns list of removed users with restoration options
 */
exports.getRemovedUsers = async (req, res) => {
  try {
    const {
      userType,
      removedBy,
      isRestored,
      startDate,
      endDate,
      searchEmail,
      page = '1',
      limit = '50',
      sortBy = 'removedAt',
      sortOrder = 'desc'
    } = req.query;

    const requestingAdmin = req.admin;

    // Build filters
    const filters = {
      userType,
      removedBy,
      isRestored: isRestored !== undefined ? isRestored === 'true' : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      searchEmail
    };

    // Build options
    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };

    // Get removed users
    const result = await userManagementService.getRemovedUsers(filters, options);

    // Add additional information for each removed user
    const removedUsersWithDetails = result.removedUsers.map(removedUser => ({
      ...removedUser,
      canBeRestored: !removedUser.isRestored && new Date() < new Date(removedUser.scheduledDeletion),
      daysUntilDeletion: Math.ceil((new Date(removedUser.scheduledDeletion) - new Date()) / (24 * 60 * 60 * 1000)),
      dataIntegrityValid: removedUser.verifyDataIntegrity ? removedUser.verifyDataIntegrity() : true
    }));

    res.status(200).json({
      success: true,
      removedUsers: removedUsersWithDetails,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get removed users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching removed users',
      code: 'REMOVED_USERS_FETCH_ERROR'
    });
  }
};

/**
 * Bulk remove users
 * Removes multiple users in a single operation
 */
exports.bulkRemoveUsers = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { userIds, userType, reason = '' } = req.body;
    const requestingAdmin = req.admin;

    // Validate required parameters
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required and cannot be empty',
        code: 'MISSING_USER_IDS'
      });
    }

    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'User type is required',
        code: 'MISSING_USER_TYPE'
      });
    }

    // Validate user type
    const validUserTypes = ['patient', 'doctor', 'hospital', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type',
        code: 'INVALID_USER_TYPE'
      });
    }

    // Limit bulk operations
    if (userIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove more than 50 users at once',
        code: 'BULK_LIMIT_EXCEEDED'
      });
    }

    // Perform bulk removal
    const bulkResult = await userManagementService.bulkRemoveUsers(
      userIds,
      userType,
      requestingAdmin._id,
      requestingAdmin.email,
      reason,
      {
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID
      }
    );

    // Send notification emails to successfully removed users
    let emailDeliveryResults = {
      sent: 0,
      failed: 0,
      total: bulkResult.results.successful.length
    };
    
    try {
      for (const removedUser of bulkResult.results.successful) {
        try {
          const emailResult = await emailNotificationService.sendUserRemovalNotification(
            {
              email: removedUser.email,
              name: removedUser.name,
              userType: userType
            },
            reason,
            requestingAdmin.name
          );
          if (emailResult) {
            emailDeliveryResults.sent++;
          } else {
            emailDeliveryResults.failed++;
          }
        } catch (individualEmailError) {
          console.error(`Failed to send removal notification to ${removedUser.email}:`, individualEmailError);
          emailDeliveryResults.failed++;
        }
      }
    } catch (emailError) {
      console.error('Failed to send bulk removal notification emails:', emailError);
      emailDeliveryResults.failed = emailDeliveryResults.total;
    }

    // Send bulk operation summary to admin
    try {
      await emailNotificationService.sendBulkOperationSummary(
        requestingAdmin.email,
        {
          operation: 'removal',
          userType,
          totalRequested: bulkResult.results.totalProcessed,
          successful: bulkResult.results.successful.length,
          failed: bulkResult.results.failed.length,
          failedUsers: bulkResult.results.failed,
          reason
        }
      );
    } catch (summaryEmailError) {
      console.error('Failed to send bulk operation summary email:', summaryEmailError);
    }

    res.status(200).json({
      success: true,
      message: bulkResult.message,
      results: bulkResult.results,
      emailDeliveryResults
    });

  } catch (error) {
    // Log failed bulk operation
    await auditLoggerService.logAdminAction({
      adminId: req.admin?._id,
      adminEmail: req.admin?.email || 'unknown',
      action: 'BULK_USER_OPERATION',
      targetUserType: req.body.userType,
      details: {
        reason: `Failed - ${error.message}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        additionalData: {
          requestedUserIds: req.body.userIds,
          operationDuration: Date.now() - startTime
        }
      },
      status: 'failed',
      errorMessage: error.message
    });

    console.error('Bulk remove users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during bulk user removal',
      code: 'BULK_REMOVAL_ERROR'
    });
  }
};

/**
 * Get user removal statistics
 * Returns statistics about user removals and restorations
 */
exports.getRemovalStatistics = async (req, res) => {
  try {
    const {
      startDate,
      endDate
    } = req.query;

    const requestingAdmin = req.admin;

    // Build filters
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    // Get removal statistics
    const stats = await userManagementService.getRemovalStatistics(filters);

    res.status(200).json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Get removal statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching removal statistics',
      code: 'STATISTICS_FETCH_ERROR'
    });
  }
};

/**
 * Export audit logs
 * Exports audit logs in CSV or JSON format
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const {
      format = 'csv',
      includeDetails = 'true',
      maxRecords = '10000',
      ...filters
    } = req.query;

    const requestingAdmin = req.admin;

    // Build export options
    const exportOptions = {
      format,
      includeDetails: includeDetails === 'true',
      maxRecords: parseInt(maxRecords),
      saveToFile: false // Return data directly
    };

    // Export audit logs
    const exportResult = await auditLoggerService.exportAuditLogs(
      filters,
      requestingAdmin._id,
      exportOptions
    );

    if (format === 'csv') {
      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      
      // Convert data to CSV string
      const csvData = exportResult.data;
      if (csvData && csvData.length > 0) {
        const headers = Object.keys(csvData[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of csvData) {
          const values = headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          });
          csvRows.push(values.join(','));
        }
        
        res.send(csvRows.join('\n'));
      } else {
        res.send('No data available for export');
      }
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportResult);
    }

  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while exporting audit logs',
      code: 'EXPORT_ERROR'
    });
  }
};

/**
 * Get data integrity status
 * Returns current data integrity statistics for removed users
 */
exports.getDataIntegrityStatus = async (req, res) => {
  try {
    const requestingAdmin = req.admin;

    // Get data integrity statistics
    const RemovedUser = require('../models/RemovedUser');
    const integrityStats = await RemovedUser.getDataIntegrityStatistics();

    res.status(200).json({
      success: true,
      integrityStatus: integrityStats
    });

  } catch (error) {
    console.error('Get data integrity status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching data integrity status',
      code: 'INTEGRITY_STATUS_ERROR'
    });
  }
};

/**
 * Trigger manual data cleanup
 * Manually triggers the data cleanup job (root admin only)
 */
exports.triggerDataCleanup = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const requestingAdmin = req.admin;

    // Trigger manual cleanup
    const scheduledJobService = require('../services/scheduledJobService');
    await scheduledJobService.triggerJob('dataCleanup');

    // Log the manual trigger
    await auditLoggerService.logAdminAction({
      adminId: requestingAdmin._id,
      adminEmail: requestingAdmin.email,
      action: 'MANUAL_DATA_CLEANUP',
      details: {
        reason: 'Manual data cleanup triggered',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        additionalData: {
          operationDuration: Date.now() - startTime
        }
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Data cleanup job triggered successfully'
    });

  } catch (error) {
    // Log failed manual trigger
    await auditLoggerService.logAdminAction({
      adminId: req.admin?._id,
      adminEmail: req.admin?.email || 'unknown',
      action: 'MANUAL_DATA_CLEANUP',
      details: {
        reason: 'Manual data cleanup failed',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        additionalData: {
          operationDuration: Date.now() - startTime
        }
      },
      status: 'failed',
      errorMessage: error.message
    });

    console.error('Trigger data cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while triggering data cleanup',
      code: 'DATA_CLEANUP_TRIGGER_ERROR'
    });
  }
};

/**
 * Trigger manual data integrity check
 * Manually triggers the data integrity check job (root admin only)
 */
exports.triggerDataIntegrityCheck = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const requestingAdmin = req.admin;

    // Trigger manual integrity check
    const scheduledJobService = require('../services/scheduledJobService');
    await scheduledJobService.triggerJob('dataIntegrityCheck');

    // Log the manual trigger
    await auditLoggerService.logAdminAction({
      adminId: requestingAdmin._id,
      adminEmail: requestingAdmin.email,
      action: 'MANUAL_INTEGRITY_CHECK',
      details: {
        reason: 'Manual data integrity check triggered',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        additionalData: {
          operationDuration: Date.now() - startTime
        }
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Data integrity check job triggered successfully'
    });

  } catch (error) {
    // Log failed manual trigger
    await auditLoggerService.logAdminAction({
      adminId: req.admin?._id,
      adminEmail: req.admin?.email || 'unknown',
      action: 'MANUAL_INTEGRITY_CHECK',
      details: {
        reason: 'Manual data integrity check failed',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID,
        additionalData: {
          operationDuration: Date.now() - startTime
        }
      },
      status: 'failed',
      errorMessage: error.message
    });

    console.error('Trigger data integrity check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while triggering data integrity check',
      code: 'INTEGRITY_CHECK_TRIGGER_ERROR'
    });
  }
};

/**
 * Get audit log statistics
 * Returns comprehensive audit log statistics (root admin only)
 */
exports.getAuditStatistics = async (req, res) => {
  try {
    const {
      startDate,
      endDate
    } = req.query;

    const requestingAdmin = req.admin;

    // Build filters
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    // Get audit statistics
    const statistics = await auditLoggerService.getAuditStatistics(filters, requestingAdmin._id);

    res.status(200).json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('Get audit statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching audit statistics',
      code: 'AUDIT_STATISTICS_ERROR'
    });
  }
};

/**
 * Get scheduled job status
 * Returns status of all scheduled jobs (root admin only)
 */
exports.getScheduledJobStatus = async (req, res) => {
  try {
    const requestingAdmin = req.admin;

    // Get job status
    const scheduledJobService = require('../services/scheduledJobService');
    const jobStatus = scheduledJobService.getJobStatus();

    res.status(200).json({
      success: true,
      jobStatus
    });

  } catch (error) {
    console.error('Get scheduled job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching job status',
      code: 'JOB_STATUS_ERROR'
    });
  }
};

/**
 * Get email delivery statistics
 * Returns comprehensive email delivery statistics (root admin only)
 */
exports.getEmailDeliveryStatistics = async (req, res) => {
  try {
    const requestingAdmin = req.admin;

    // Get email delivery statistics from the notification service
    const deliveryStats = emailNotificationService.getDeliveryStatistics();

    // Get email logs from audit logs
    const emailLogs = await auditLoggerService.getAuditLogs(
      {
        action: 'EMAIL_NOTIFICATION',
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
      },
      {
        page: 1,
        limit: 1000,
        sortBy: 'timestamp',
        sortOrder: -1,
        includeDetails: true
      },
      requestingAdmin._id
    );

    // Process email logs to get detailed statistics
    const emailTypeStats = {};
    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;

    if (emailLogs.logs) {
      emailLogs.logs.forEach(log => {
        const emailType = log.details?.additionalData?.emailType || 'unknown';
        const status = log.details?.additionalData?.status || 'unknown';

        if (!emailTypeStats[emailType]) {
          emailTypeStats[emailType] = { sent: 0, failed: 0, total: 0 };
        }

        emailTypeStats[emailType].total++;
        if (status === 'success') {
          emailTypeStats[emailType].sent++;
          totalEmailsSent++;
        } else if (status === 'failed') {
          emailTypeStats[emailType].failed++;
          totalEmailsFailed++;
        }
      });
    }

    res.status(200).json({
      success: true,
      statistics: {
        overall: {
          ...deliveryStats,
          totalEmailsSent,
          totalEmailsFailed,
          totalEmailsProcessed: totalEmailsSent + totalEmailsFailed
        },
        byEmailType: emailTypeStats,
        recentActivity: emailLogs.logs ? emailLogs.logs.slice(0, 10) : []
      }
    });

  } catch (error) {
    console.error('Get email delivery statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching email statistics',
      code: 'EMAIL_STATISTICS_ERROR'
    });
  }
};