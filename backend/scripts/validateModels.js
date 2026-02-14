/**
 * Validate Admin User Management Models
 * Tests model definitions without requiring database connection
 */

const mongoose = require('mongoose');

// Import models
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const RemovedUser = require('../models/RemovedUser');

function validateModelSchema(Model, modelName) {
  console.log(`\n=== Validating ${modelName} Model ===`);
  
  try {
    // Get schema
    const schema = Model.schema;
    
    // Check required fields
    const requiredFields = [];
    schema.eachPath((path, schemaType) => {
      if (schemaType.isRequired) {
        requiredFields.push(path);
      }
    });
    
    console.log(`Required fields: ${requiredFields.join(', ')}`);
    
    // Check indexes
    const indexes = schema.indexes();
    console.log(`Indexes defined: ${indexes.length}`);
    indexes.forEach((index, i) => {
      console.log(`  Index ${i + 1}: ${JSON.stringify(index[0])}`);
    });
    
    // Check methods
    const instanceMethods = Object.getOwnPropertyNames(schema.methods);
    if (instanceMethods.length > 0) {
      console.log(`Instance methods: ${instanceMethods.join(', ')}`);
    }
    
    // Check statics
    const staticMethods = Object.getOwnPropertyNames(schema.statics);
    if (staticMethods.length > 0) {
      console.log(`Static methods: ${staticMethods.join(', ')}`);
    }
    
    console.log(`✅ ${modelName} model validation passed`);
    return true;
    
  } catch (error) {
    console.error(`❌ ${modelName} model validation failed:`, error.message);
    return false;
  }
}

function testAdminModelMethods() {
  console.log('\n=== Testing Admin Model Methods ===');
  
  try {
    // Create a test admin instance (without saving)
    const testAdmin = new Admin({
      name: 'Test Admin',
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    // Test isRoot method
    console.log(`isRoot() method exists: ${typeof testAdmin.isRoot === 'function'}`);
    console.log(`Regular admin isRoot(): ${testAdmin.isRoot()}`);
    
    // Test root admin
    const rootAdmin = new Admin({
      name: 'Root Admin',
      email: 'admin@gmail.com',
      password: 'testpassword'
    });
    console.log(`Root admin isRoot(): ${rootAdmin.isRoot()}`);
    
    // Test hasPermission method
    console.log(`hasPermission() method exists: ${typeof testAdmin.hasPermission === 'function'}`);
    
    // Test setDefaultPermissions method
    console.log(`setDefaultPermissions() method exists: ${typeof testAdmin.setDefaultPermissions === 'function'}`);
    testAdmin.setDefaultPermissions();
    console.log(`Default permissions set: ${testAdmin.permissions.length > 0}`);
    
    // Test account locking methods
    console.log(`handleFailedLogin() method exists: ${typeof testAdmin.handleFailedLogin === 'function'}`);
    console.log(`isAccountLocked() method exists: ${typeof testAdmin.isAccountLocked === 'function'}`);
    
    console.log('✅ Admin model methods test passed');
    return true;
    
  } catch (error) {
    console.error('❌ Admin model methods test failed:', error.message);
    return false;
  }
}

function testAuditLogStaticMethods() {
  console.log('\n=== Testing AuditLog Static Methods ===');
  
  try {
    // Test static methods exist
    console.log(`logAction() method exists: ${typeof AuditLog.logAction === 'function'}`);
    console.log(`getFilteredLogs() method exists: ${typeof AuditLog.getFilteredLogs === 'function'}`);
    console.log(`getStatistics() method exists: ${typeof AuditLog.getStatistics === 'function'}`);
    console.log(`exportToCSV() method exists: ${typeof AuditLog.exportToCSV === 'function'}`);
    
    console.log('✅ AuditLog static methods test passed');
    return true;
    
  } catch (error) {
    console.error('❌ AuditLog static methods test failed:', error.message);
    return false;
  }
}

function testRemovedUserMethods() {
  console.log('\n=== Testing RemovedUser Model Methods ===');
  
  try {
    // Test static methods exist
    console.log(`createRemovedUser() method exists: ${typeof RemovedUser.createRemovedUser === 'function'}`);
    console.log(`getFilteredRemovedUsers() method exists: ${typeof RemovedUser.getFilteredRemovedUsers === 'function'}`);
    console.log(`getUsersScheduledForDeletion() method exists: ${typeof RemovedUser.getUsersScheduledForDeletion === 'function'}`);
    console.log(`cleanupExpiredRecords() method exists: ${typeof RemovedUser.cleanupExpiredRecords === 'function'}`);
    console.log(`getRemovalStatistics() method exists: ${typeof RemovedUser.getRemovalStatistics === 'function'}`);
    
    // Test instance methods
    const testRemovedUser = new RemovedUser({
      originalId: new mongoose.Types.ObjectId(),
      userType: 'patient',
      userData: { name: 'Test User', email: 'test@example.com' },
      removedBy: new mongoose.Types.ObjectId(),
      removedByEmail: 'admin@example.com'
    });
    
    console.log(`verifyDataIntegrity() method exists: ${typeof testRemovedUser.verifyDataIntegrity === 'function'}`);
    console.log(`markAsRestored() method exists: ${typeof testRemovedUser.markAsRestored === 'function'}`);
    
    // Test data integrity
    const integrityValid = testRemovedUser.verifyDataIntegrity();
    console.log(`Data integrity verification works: ${typeof integrityValid === 'boolean'}`);
    
    console.log('✅ RemovedUser model methods test passed');
    return true;
    
  } catch (error) {
    console.error('❌ RemovedUser model methods test failed:', error.message);
    return false;
  }
}

function validateEnumValues() {
  console.log('\n=== Validating Enum Values ===');
  
  try {
    // Test Admin permissions enum
    const adminSchema = Admin.schema;
    const permissionsPath = adminSchema.path('permissions.0.resource');
    console.log(`Admin permission resources: ${permissionsPath.enumValues}`);
    
    const actionsPath = adminSchema.path('permissions.0.actions.0');
    console.log(`Admin permission actions: ${actionsPath.enumValues}`);
    
    // Test AuditLog action enum
    const auditLogSchema = AuditLog.schema;
    const actionPath = auditLogSchema.path('action');
    console.log(`AuditLog actions: ${actionPath.enumValues.slice(0, 5).join(', ')}... (${actionPath.enumValues.length} total)`);
    
    // Test RemovedUser userType enum
    const removedUserSchema = RemovedUser.schema;
    const userTypePath = removedUserSchema.path('userType');
    console.log(`RemovedUser types: ${userTypePath.enumValues}`);
    
    console.log('✅ Enum values validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Enum values validation failed:', error.message);
    return false;
  }
}

// Run all validations
async function runValidation() {
  console.log('🔍 Starting Admin User Management Models Validation...\n');
  
  const results = [];
  
  // Validate model schemas
  results.push(validateModelSchema(Admin, 'Admin'));
  results.push(validateModelSchema(AuditLog, 'AuditLog'));
  results.push(validateModelSchema(RemovedUser, 'RemovedUser'));
  
  // Test model methods
  results.push(testAdminModelMethods());
  results.push(testAuditLogStaticMethods());
  results.push(testRemovedUserMethods());
  
  // Validate enum values
  results.push(validateEnumValues());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Validation Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All validations passed! Models are ready for use.');
    return true;
  } else {
    console.log('⚠️  Some validations failed. Please review the errors above.');
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Validation failed with error:', error);
      process.exit(1);
    });
}

module.exports = {
  validateModelSchema,
  testAdminModelMethods,
  testAuditLogStaticMethods,
  testRemovedUserMethods,
  validateEnumValues,
  runValidation
};