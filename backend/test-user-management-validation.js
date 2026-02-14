#!/usr/bin/env node

/**
 * User Management System Validation Script
 * 
 * This script validates the core functionality of the admin user management system
 * by testing key workflows and role-based access control.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const Admin = require('./models/Admin');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');
const RemovedUser = require('./models/RemovedUser');
const AuditLog = require('./models/AuditLog');

// Import services
const userManagementService = require('./services/userManagementService');
const auditLoggerService = require('./services/auditLoggerService');
const adminService = require('./services/adminSecurityService');

// Test configuration
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform-test';

class UserManagementValidator {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async connect() {
    try {
      await mongoose.connect(TEST_DB_URI);
      console.log('✅ Connected to test database');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }

  async cleanup() {
    // Clean up test data
    await Admin.deleteMany({ 
      $or: [
        { email: { $regex: /test.*@/ } },
        { email: 'admin@gmail.com' }
      ]
    });
    await Patient.deleteMany({ email: { $regex: /test.*@/ } });
    await Doctor.deleteMany({ email: { $regex: /test.*@/ } });
    await Hospital.deleteMany({ email: { $regex: /test.*@/ } });
    await RemovedUser.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('✅ Test data cleaned up');
  }

  async createTestData() {
    console.log('\n📋 Creating test data...');

    // Create root admin
    const rootAdmin = new Admin({
      name: 'Test Root Admin',
      email: 'admin@gmail.com',
      password: await bcrypt.hash('rootpassword123', 10),
      isRootAdmin: true
    });
    await rootAdmin.save();

    // Create regular admin
    const regularAdmin = new Admin({
      name: 'Test Regular Admin',
      email: 'testregular@admin.com',
      password: await bcrypt.hash('regularpassword123', 10),
      createdBy: rootAdmin._id
    });
    await regularAdmin.save();

    // Create test patient
    const testPatient = new Patient({
      name: 'Test Patient',
      email: 'testpatient@example.com',
      password: await bcrypt.hash('patientpassword123', 10),
      phone: '1234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      bloodGroup: 'O+'
    });
    await testPatient.save();

    // Create test doctor
    const testDoctor = new Doctor({
      name: 'Test Doctor',
      email: 'testdoctor@example.com',
      password: await bcrypt.hash('doctorpassword123', 10),
      phone: '0987654321',
      specializations: ['cardiology'],
      qualifications: ['MD'],
      experienceYears: 5,
      degree: 'MD',
      dateOfBirth: new Date('1980-01-01'),
      consultationFee: 500
    });
    await testDoctor.save();

    // Create test hospital
    const testHospital = new Hospital({
      hospitalName: 'Test Hospital',
      name: 'Test Hospital Admin',
      email: 'testhospital@example.com',
      password: await bcrypt.hash('hospitalpassword123', 10),
      contactNumber: '1122334455',
      registrationNumber: 'TEST123456',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      departments: ['cardiology', 'neurology']
    });
    await testHospital.save();

    console.log('✅ Test data created successfully');
    return { rootAdmin, regularAdmin, testPatient, testDoctor, testHospital };
  }

  async test(description, testFn) {
    try {
      console.log(`\n🧪 Testing: ${description}`);
      await testFn();
      console.log(`✅ PASSED: ${description}`);
      this.testResults.passed++;
    } catch (error) {
      console.error(`❌ FAILED: ${description}`);
      console.error(`   Error: ${error.message}`);
      this.testResults.failed++;
      this.testResults.errors.push({ description, error: error.message });
    }
  }

  async validateRootAdminIdentification() {
    await this.test('Root admin identification', async () => {
      const rootAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
      if (!rootAdmin) throw new Error('Root admin not found');
      if (!rootAdmin.isRootAdmin) throw new Error('Root admin flag not set');
    });
  }

  async validateUserRemoval() {
    await this.test('User removal functionality', async () => {
      const patient = await Patient.findOne({ email: 'testpatient@example.com' });
      const regularAdmin = await Admin.findOne({ email: 'testregular@admin.com' });
      
      if (!patient || !regularAdmin) throw new Error('Test data not found');

      // Test user removal
      const result = await userManagementService.removeUser(
        patient._id.toString(),
        'patient',
        regularAdmin._id.toString(),
        regularAdmin.email,
        'Test removal'
      );

      if (!result.success) throw new Error('User removal failed');

      // Verify user was soft-deleted
      const removedPatient = await Patient.findById(patient._id);
      if (removedPatient.isActive) throw new Error('User was not deactivated');

      // Verify removed user record was created
      const removedUserRecord = await RemovedUser.findOne({ originalId: patient._id });
      if (!removedUserRecord) throw new Error('Removed user record not created');
    });
  }

  async validateUserRestoration() {
    await this.test('User restoration functionality', async () => {
      const patient = await Patient.findOne({ email: 'testpatient@example.com' });
      const rootAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
      
      if (!patient || !rootAdmin) throw new Error('Test data not found');

      // Test user restoration
      const result = await userManagementService.restoreUser(
        patient._id.toString(),
        'patient',
        rootAdmin._id.toString(),
        rootAdmin.email,
        'Test restoration'
      );

      if (!result.success) throw new Error('User restoration failed');

      // Verify user was restored
      const restoredPatient = await Patient.findById(patient._id);
      if (!restoredPatient.isActive) throw new Error('User was not reactivated');

      // Verify removed user record was updated
      const removedUserRecord = await RemovedUser.findOne({ originalId: patient._id });
      if (!removedUserRecord.isRestored) throw new Error('Removed user record not updated');
    });
  }

  async validateAdminCreation() {
    await this.test('Admin creation functionality', async () => {
      const rootAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
      if (!rootAdmin) throw new Error('Root admin not found');

      // Test admin creation
      const result = await userManagementService.addAdmin(
        {
          name: 'Test New Admin',
          email: 'testnewadmin@example.com',
          password: 'newadminpassword123'
        },
        rootAdmin._id.toString(),
        rootAdmin.email
      );

      if (!result.success) throw new Error('Admin creation failed');

      // Verify admin was created
      const newAdmin = await Admin.findOne({ email: 'testnewadmin@example.com' });
      if (!newAdmin) throw new Error('New admin not found in database');
      if (newAdmin.isRootAdmin) throw new Error('New admin should not be root admin');
      if (newAdmin.createdBy.toString() !== rootAdmin._id.toString()) {
        throw new Error('Admin creator not recorded correctly');
      }
    });
  }

  async validateRoleBasedAccess() {
    await this.test('Role-based access control', async () => {
      const rootAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
      const regularAdmin = await Admin.findOne({ email: 'testregular@admin.com' });
      
      if (!rootAdmin || !regularAdmin) throw new Error('Test admins not found');

      // Test root admin can manage admins
      const rootCanManageAdmins = await userManagementService.canManageUserType('admin', rootAdmin);
      if (!rootCanManageAdmins) throw new Error('Root admin should be able to manage admins');

      // Test regular admin cannot manage admins
      const regularCanManageAdmins = await userManagementService.canManageUserType('admin', regularAdmin);
      if (regularCanManageAdmins) throw new Error('Regular admin should not be able to manage admins');

      // Test both can manage patients
      const rootCanManagePatients = await userManagementService.canManageUserType('patient', rootAdmin);
      const regularCanManagePatients = await userManagementService.canManageUserType('patient', regularAdmin);
      
      if (!rootCanManagePatients) throw new Error('Root admin should be able to manage patients');
      if (!regularCanManagePatients) throw new Error('Regular admin should be able to manage patients');
    });
  }

  async validateAuditLogging() {
    await this.test('Audit logging functionality', async () => {
      const rootAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
      if (!rootAdmin) throw new Error('Root admin not found');

      // Log a test action
      await auditLoggerService.logAdminAction(
        'TEST_ACTION',
        rootAdmin._id,
        rootAdmin.email,
        'Test audit log entry',
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent'
        }
      );

      // Verify audit log was created
      const auditLog = await AuditLog.findOne({ 
        adminId: rootAdmin._id,
        action: 'TEST_ACTION'
      });

      if (!auditLog) throw new Error('Audit log not created');
      if (auditLog.adminEmail !== rootAdmin.email) throw new Error('Audit log admin email incorrect');
    });
  }

  async validateDataIntegrity() {
    await this.test('Data integrity preservation', async () => {
      const doctor = await Doctor.findOne({ email: 'testdoctor@example.com' });
      const regularAdmin = await Admin.findOne({ email: 'testregular@admin.com' });
      
      if (!doctor || !regularAdmin) throw new Error('Test data not found');

      // Store original doctor data
      const originalData = doctor.toObject();

      // Remove doctor
      await userManagementService.removeUser(
        doctor._id.toString(),
        'doctor',
        regularAdmin._id.toString(),
        regularAdmin.email,
        'Data integrity test'
      );

      // Verify removed user record preserves data
      const removedUserRecord = await RemovedUser.findOne({ originalId: doctor._id });
      if (!removedUserRecord) throw new Error('Removed user record not found');
      
      if (removedUserRecord.userData.name !== originalData.name) {
        throw new Error('User data not preserved correctly');
      }
      if (removedUserRecord.userData.email !== originalData.email) {
        throw new Error('User email not preserved correctly');
      }
    });
  }

  async validateEmailNotifications() {
    await this.test('Email notification system', async () => {
      // This is a basic test since email service might not be configured in test environment
      const emailNotificationService = require('./services/emailNotificationService');
      
      // Test that the service exists and has required methods
      if (typeof emailNotificationService.sendUserRemovalNotification !== 'function') {
        throw new Error('Email notification service missing required methods');
      }
      
      if (typeof emailNotificationService.sendAdminWelcomeEmail !== 'function') {
        throw new Error('Email notification service missing admin welcome method');
      }
      
      if (typeof emailNotificationService.sendUserRestorationNotification !== 'function') {
        throw new Error('Email notification service missing restoration method');
      }
    });
  }

  async validateSecurityFeatures() {
    await this.test('Security features validation', async () => {
      const rootAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
      if (!rootAdmin) throw new Error('Root admin not found');

      // Test that root admin cannot be removed
      try {
        await userManagementService.removeUser(
          rootAdmin._id.toString(),
          'admin',
          rootAdmin._id.toString(),
          rootAdmin.email,
          'Attempt to remove root admin'
        );
        throw new Error('Root admin removal should have been prevented');
      } catch (error) {
        if (!error.message.includes('Root admin cannot be removed')) {
          throw new Error('Incorrect error message for root admin removal attempt');
        }
      }

      // Test duplicate admin email prevention
      try {
        await userManagementService.addAdmin(
          {
            name: 'Duplicate Admin',
            email: 'admin@gmail.com', // Same as root admin
            password: 'password123'
          },
          rootAdmin._id.toString(),
          rootAdmin.email
        );
        throw new Error('Duplicate admin email should have been prevented');
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw new Error('Incorrect error message for duplicate admin email');
        }
      }
    });
  }

  async runAllTests() {
    console.log('🚀 Starting User Management System Validation\n');
    console.log('=' .repeat(60));

    try {
      await this.connect();
      await this.cleanup();
      
      const testData = await this.createTestData();

      // Run all validation tests
      await this.validateRootAdminIdentification();
      await this.validateUserRemoval();
      await this.validateUserRestoration();
      await this.validateAdminCreation();
      await this.validateRoleBasedAccess();
      await this.validateAuditLogging();
      await this.validateDataIntegrity();
      await this.validateEmailNotifications();
      await this.validateSecurityFeatures();

      // Print results
      console.log('\n' + '=' .repeat(60));
      console.log('📊 VALIDATION RESULTS');
      console.log('=' .repeat(60));
      console.log(`✅ Tests Passed: ${this.testResults.passed}`);
      console.log(`❌ Tests Failed: ${this.testResults.failed}`);
      console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

      if (this.testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        this.testResults.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.description}`);
          console.log(`   Error: ${error.error}`);
        });
      }

      if (this.testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! User Management System is working correctly.');
      } else {
        console.log('\n⚠️  Some tests failed. Please review the errors above.');
      }

    } catch (error) {
      console.error('\n💥 Validation failed with critical error:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
      await this.disconnect();
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new UserManagementValidator();
  validator.runAllTests()
    .then(() => {
      process.exit(validator.testResults.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Validation script error:', error);
      process.exit(1);
    });
}

module.exports = UserManagementValidator;