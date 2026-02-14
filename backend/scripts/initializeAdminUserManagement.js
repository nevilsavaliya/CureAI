const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const RemovedUser = require('../models/RemovedUser');

/**
 * Initialize Admin User Management System
 * - Ensures root admin exists
 * - Creates necessary database indexes
 * - Sets up initial permissions
 */
async function initializeAdminUserManagement() {
  try {
    console.log('Initializing Admin User Management System...');
    
    // 1. Ensure root admin exists
    await ensureRootAdminExists();
    
    // 2. Create database indexes
    await createDatabaseIndexes();
    
    // 3. Update existing admins with new schema
    await updateExistingAdmins();
    
    console.log('Admin User Management System initialized successfully!');
    
  } catch (error) {
    console.error('Failed to initialize Admin User Management System:', error);
    throw error;
  }
}

/**
 * Ensure root admin exists and is properly configured
 */
async function ensureRootAdminExists() {
  console.log('Checking for root admin...');
  
  let rootAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
  
  if (!rootAdmin) {
    console.log('Root admin not found. Please create admin@gmail.com account first.');
    return;
  }
  
  // Update root admin with new schema fields
  let updated = false;
  
  if (!rootAdmin.isRootAdmin) {
    rootAdmin.isRootAdmin = true;
    updated = true;
  }
  
  // Clear permissions for root admin (they have all permissions by default)
  if (rootAdmin.permissions && rootAdmin.permissions.length > 0) {
    rootAdmin.permissions = [];
    updated = true;
  }
  
  if (updated) {
    await rootAdmin.save();
    console.log('Root admin updated with new schema.');
  } else {
    console.log('Root admin already properly configured.');
  }
}

/**
 * Create database indexes for performance optimization
 */
async function createDatabaseIndexes() {
  console.log('Creating database indexes...');
  
  try {
    // Admin model indexes
    await Admin.collection.createIndex({ email: 1 }, { unique: true });
    await Admin.collection.createIndex({ isRootAdmin: 1 });
    await Admin.collection.createIndex({ isActive: 1 });
    await Admin.collection.createIndex({ createdBy: 1 });
    await Admin.collection.createIndex({ lastLogin: -1 });
    
    console.log('Admin indexes created successfully.');
    
    // AuditLog model indexes
    await AuditLog.collection.createIndex({ adminId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ action: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ targetUserType: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ targetUserId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ timestamp: -1 });
    await AuditLog.collection.createIndex({ 'details.ipAddress': 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ status: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ adminId: 1, action: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ targetUserType: 1, action: 1, timestamp: -1 });
    
    console.log('AuditLog indexes created successfully.');
    
    // RemovedUser model indexes
    await RemovedUser.collection.createIndex({ originalId: 1, userType: 1 }, { unique: true });
    await RemovedUser.collection.createIndex({ userType: 1, removedAt: -1 });
    await RemovedUser.collection.createIndex({ removedBy: 1, removedAt: -1 });
    await RemovedUser.collection.createIndex({ isRestored: 1, removedAt: -1 });
    await RemovedUser.collection.createIndex({ scheduledDeletion: 1 });
    await RemovedUser.collection.createIndex({ 'userData.email': 1 });
    await RemovedUser.collection.createIndex({ removedAt: -1 });
    await RemovedUser.collection.createIndex({ userType: 1, isRestored: 1, removedAt: -1 });
    await RemovedUser.collection.createIndex({ removedBy: 1, userType: 1, removedAt: -1 });
    
    console.log('RemovedUser indexes created successfully.');
    
  } catch (error) {
    console.error('Error creating indexes:', error);
    // Don't throw error for index creation failures
  }
}

/**
 * Update existing admins with new schema fields
 */
async function updateExistingAdmins() {
  console.log('Updating existing admins with new schema...');
  
  const admins = await Admin.find({ 
    $or: [
      { isRootAdmin: { $exists: false } },
      { permissions: { $exists: false } },
      { failedLoginAttempts: { $exists: false } }
    ]
  });
  
  for (const admin of admins) {
    let updated = false;
    
    // Set isRootAdmin flag
    if (admin.isRootAdmin === undefined) {
      admin.isRootAdmin = admin.email === 'admin@gmail.com';
      updated = true;
    }
    
    // Set default permissions for regular admins
    if (!admin.permissions) {
      if (!admin.isRootAdmin) {
        admin.setDefaultPermissions();
        updated = true;
      } else {
        admin.permissions = [];
        updated = true;
      }
    }
    
    // Set security tracking fields
    if (admin.failedLoginAttempts === undefined) {
      admin.failedLoginAttempts = 0;
      updated = true;
    }
    
    if (updated) {
      await admin.save();
      console.log(`Updated admin: ${admin.email}`);
    }
  }
  
  console.log(`Updated ${admins.length} existing admins.`);
}

/**
 * Get system statistics
 */
async function getSystemStatistics() {
  const stats = {
    admins: {
      total: await Admin.countDocuments(),
      rootAdmins: await Admin.countDocuments({ isRootAdmin: true }),
      regularAdmins: await Admin.countDocuments({ isRootAdmin: false }),
      activeAdmins: await Admin.countDocuments({ isActive: true })
    },
    auditLogs: {
      total: await AuditLog.countDocuments(),
      last30Days: await AuditLog.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    },
    removedUsers: {
      total: await RemovedUser.countDocuments(),
      restored: await RemovedUser.countDocuments({ isRestored: true }),
      pendingDeletion: await RemovedUser.countDocuments({ 
        isRestored: false,
        scheduledDeletion: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      })
    }
  };
  
  return stats;
}

// Export functions for use in other scripts
module.exports = {
  initializeAdminUserManagement,
  ensureRootAdminExists,
  createDatabaseIndexes,
  updateExistingAdmins,
  getSystemStatistics
};

// Run initialization if this script is executed directly
if (require.main === module) {
  const connectDB = require('../config/database');
  
  connectDB()
    .then(async () => {
      await initializeAdminUserManagement();
      
      // Display system statistics
      const stats = await getSystemStatistics();
      console.log('\nSystem Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}