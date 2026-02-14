const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Admin = require('../../models/Admin');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Hospital = require('../../models/Hospital');
const RemovedUser = require('../../models/RemovedUser');
const AuditLog = require('../../models/AuditLog');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Admin User Management E2E Tests', () => {
  let mongoServer;
  let rootAdmin;
  let regularAdmin;
  let testPatient;
  let testDoctor;
  let testHospital;
  let rootAdminToken;
  let regularAdminToken;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Create test data
    rootAdmin = new Admin({
      name: 'Root Admin',
      email: 'admin@gmail.com',
      password: 'rootpassword123',
      isRootAdmin: true
    });
    await rootAdmin.save();

    regularAdmin = new Admin({
      name: 'Regular Admin',
      email: 'regular@admin.com',
      password: 'regularpassword123',
      createdBy: rootAdmin._id
    });
    await regularAdmin.save();

    testPatient = new Patient({
      name: 'Test Patient',
      email: 'patient@test.com',
      password: 'patientpassword123',
      phone: '1234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male'
    });
    await testPatient.save();

    testDoctor = new Doctor({
      name: 'Test Doctor',
      email: 'doctor@test.com',
      password: 'doctorpassword123',
      phone: '0987654321',
      specializations: ['cardiology'],
      qualifications: ['MD'],
      experience: 5,
      consultationFee: 500
    });
    await testDoctor.save();

    testHospital = new Hospital({
      hospitalName: 'Test Hospital',
      email: 'hospital@test.com',
      password: 'hospitalpassword123',
      phone: '1122334455',
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

    // Generate mock tokens
    rootAdminToken = 'mock-root-admin-token';
    regularAdminToken = 'mock-regular-admin-token';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear audit logs and removed users before each test
    await AuditLog.deleteMany({});
    await RemovedUser.deleteMany({});
  });

  describe('Complete Admin Management Workflow', () => {
    it('should complete full admin creation and management workflow', async () => {
      // Step 1: Root admin creates a new admin
      const createAdminResponse = await request(app)
        .post('/api/admin/users/add-admin')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({
          name: 'New Admin',
          email: 'newadmin@test.com',
          password: 'newadminpassword123'
        })
        .expect(201);

      expect(createAdminResponse.body.success).toBe(true);
      expect(createAdminResponse.body.admin.email).toBe('newadmin@test.com');

      const newAdminId = createAdminResponse.body.admin._id;

      // Step 2: Verify admin was created in database
      const createdAdmin = await Admin.findById(newAdminId);
      expect(createdAdmin).toBeTruthy();
      expect(createdAdmin.email).toBe('newadmin@test.com');
      expect(createdAdmin.createdBy.toString()).toBe(rootAdmin._id.toString());

      // Step 3: Get list of all admins
      const adminListResponse = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .expect(200);

      expect(adminListResponse.body.success).toBe(true);
      expect(adminListResponse.body.users.length).toBe(3); // root + regular + new
      expect(adminListResponse.body.users.some(admin => admin.email === 'newadmin@test.com')).toBe(true);

      // Step 4: Root admin removes the new admin
      const removeAdminResponse = await request(app)
        .delete(`/api/admin/users/${newAdminId}/remove?userType=admin`)
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({ reason: 'Test removal of admin' })
        .expect(200);

      expect(removeAdminResponse.body.success).toBe(true);
      expect(removeAdminResponse.body.message).toBe('admin removed successfully');

      // Step 5: Verify admin was soft-deleted
      const removedAdmin = await Admin.findById(newAdminId);
      expect(removedAdmin.isActive).toBe(false);

      // Step 6: Verify removed user record was created
      const removedUserRecord = await RemovedUser.findOne({ originalId: newAdminId });
      expect(removedUserRecord).toBeTruthy();
      expect(removedUserRecord.userType).toBe('admin');

      // Step 7: Verify audit logs were created
      const auditLogs = await AuditLog.find({ 
        adminId: rootAdmin._id,
        $or: [
          { action: 'ADMIN_ADDED' },
          { action: 'USER_REMOVED' }
        ]
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Complete User Removal and Restoration Workflow', () => {
    it('should complete full patient removal and restoration workflow', async () => {
      // Step 1: Regular admin removes a patient
      const removePatientResponse = await request(app)
        .delete(`/api/admin/users/${testPatient._id}/remove?userType=patient`)
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .send({ reason: 'Test patient removal' })
        .expect(200);

      expect(removePatientResponse.body.success).toBe(true);
      expect(removePatientResponse.body.message).toBe('patient removed successfully');

      // Step 2: Verify patient was soft-deleted
      const removedPatient = await Patient.findById(testPatient._id);
      expect(removedPatient.isActive).toBe(false);

      // Step 3: Get list of removed users
      const removedUsersResponse = await request(app)
        .get('/api/admin/users/removed')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .expect(200);

      expect(removedUsersResponse.body.success).toBe(true);
      expect(removedUsersResponse.body.removedUsers.length).toBe(1);
      expect(removedUsersResponse.body.removedUsers[0].userType).toBe('patient');

      // Step 4: Root admin restores the patient
      const restorePatientResponse = await request(app)
        .post(`/api/admin/users/${testPatient._id}/restore?userType=patient`)
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({ notes: 'Test patient restoration' })
        .expect(200);

      expect(restorePatientResponse.body.success).toBe(true);
      expect(restorePatientResponse.body.message).toBe('patient restored successfully');

      // Step 5: Verify patient was restored
      const restoredPatient = await Patient.findById(testPatient._id);
      expect(restoredPatient.isActive).toBe(true);

      // Step 6: Verify removed user record was updated
      const removedUserRecord = await RemovedUser.findOne({ originalId: testPatient._id });
      expect(removedUserRecord.isRestored).toBe(true);
      expect(removedUserRecord.restoredBy.toString()).toBe(rootAdmin._id.toString());

      // Step 7: Verify audit logs were created
      const auditLogs = await AuditLog.find({ 
        targetUserId: testPatient._id,
        $or: [
          { action: 'USER_REMOVED' },
          { action: 'USER_RESTORED' }
        ]
      });
      expect(auditLogs.length).toBe(2);
    });
  });

  describe('Bulk User Operations Workflow', () => {
    it('should complete bulk user removal workflow', async () => {
      // Create additional test patients
      const additionalPatients = [];
      for (let i = 0; i < 3; i++) {
        const patient = new Patient({
          name: `Bulk Patient ${i}`,
          email: `bulkpatient${i}@test.com`,
          password: 'password123',
          phone: `123456789${i}`,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male'
        });
        await patient.save();
        additionalPatients.push(patient);
      }

      const patientIds = additionalPatients.map(p => p._id.toString());

      // Step 1: Perform bulk removal
      const bulkRemoveResponse = await request(app)
        .post('/api/admin/users/bulk-remove')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .send({
          userIds: patientIds,
          userType: 'patient',
          reason: 'Bulk test removal'
        })
        .expect(200);

      expect(bulkRemoveResponse.body.success).toBe(true);
      expect(bulkRemoveResponse.body.results.successful.length).toBe(3);
      expect(bulkRemoveResponse.body.results.failed.length).toBe(0);

      // Step 2: Verify all patients were soft-deleted
      for (const patientId of patientIds) {
        const removedPatient = await Patient.findById(patientId);
        expect(removedPatient.isActive).toBe(false);
      }

      // Step 3: Verify removed user records were created
      const removedUserRecords = await RemovedUser.find({ 
        originalId: { $in: patientIds },
        userType: 'patient'
      });
      expect(removedUserRecords.length).toBe(3);

      // Step 4: Verify audit log was created for bulk operation
      const bulkAuditLog = await AuditLog.findOne({ 
        adminId: regularAdmin._id,
        action: 'BULK_USER_OPERATION'
      });
      expect(bulkAuditLog).toBeTruthy();
      expect(bulkAuditLog.details.additionalData.successful).toBe(3);
    });
  });

  describe('Permission-Based Access Control Workflow', () => {
    it('should enforce proper access control across different admin roles', async () => {
      // Test 1: Regular admin can manage patients
      const patientListResponse = await request(app)
        .get('/api/admin/users?userType=patient')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(200);

      expect(patientListResponse.body.success).toBe(true);
      expect(patientListResponse.body.users.length).toBeGreaterThan(0);

      // Test 2: Regular admin can manage doctors
      const doctorListResponse = await request(app)
        .get('/api/admin/users?userType=doctor')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(200);

      expect(doctorListResponse.body.success).toBe(true);

      // Test 3: Regular admin can manage hospitals
      const hospitalListResponse = await request(app)
        .get('/api/admin/users?userType=hospital')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(200);

      expect(hospitalListResponse.body.success).toBe(true);

      // Test 4: Regular admin CANNOT manage other admins
      const adminListResponse = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(403);

      expect(adminListResponse.body.success).toBe(false);
      expect(adminListResponse.body.code).toBe('ROOT_ADMIN_REQUIRED');

      // Test 5: Regular admin CANNOT create new admins
      const createAdminResponse = await request(app)
        .post('/api/admin/users/add-admin')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .send({
          name: 'Unauthorized Admin',
          email: 'unauthorized@admin.com',
          password: 'password123'
        })
        .expect(403);

      expect(createAdminResponse.body.success).toBe(false);
      expect(createAdminResponse.body.code).toBe('ROOT_ADMIN_REQUIRED');

      // Test 6: Root admin CAN manage all user types including admins
      const rootAdminListResponse = await request(app)
        .get('/api/admin/users?userType=admin')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .expect(200);

      expect(rootAdminListResponse.body.success).toBe(true);
      expect(rootAdminListResponse.body.users.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Audit Trail and Monitoring Workflow', () => {
    it('should maintain comprehensive audit trail for all operations', async () => {
      // Perform various operations to generate audit logs
      
      // Operation 1: Create admin
      await request(app)
        .post('/api/admin/users/add-admin')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({
          name: 'Audit Test Admin',
          email: 'auditadmin@test.com',
          password: 'password123'
        });

      // Operation 2: Remove patient
      await request(app)
        .delete(`/api/admin/users/${testPatient._id}/remove?userType=patient`)
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .send({ reason: 'Audit test removal' });

      // Operation 3: Get audit logs
      const auditLogsResponse = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .expect(200);

      expect(auditLogsResponse.body.success).toBe(true);
      expect(auditLogsResponse.body.logs.length).toBeGreaterThanOrEqual(2);

      // Verify audit log structure
      const auditLog = auditLogsResponse.body.logs[0];
      expect(auditLog).toHaveProperty('adminId');
      expect(auditLog).toHaveProperty('adminEmail');
      expect(auditLog).toHaveProperty('action');
      expect(auditLog).toHaveProperty('timestamp');
      expect(auditLog).toHaveProperty('details');

      // Operation 4: Get removal statistics
      const statsResponse = await request(app)
        .get('/api/admin/users/statistics')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.statistics).toHaveProperty('totalRemovals');
      expect(statsResponse.body.statistics).toHaveProperty('totalRestorations');
    });
  });

  describe('Data Integrity and Recovery Workflow', () => {
    it('should maintain data integrity throughout removal and restoration process', async () => {
      // Step 1: Get initial doctor data
      const originalDoctor = await Doctor.findById(testDoctor._id).lean();
      
      // Step 2: Remove doctor
      await request(app)
        .delete(`/api/admin/users/${testDoctor._id}/remove?userType=doctor`)
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .send({ reason: 'Data integrity test' });

      // Step 3: Verify removed user record preserves all data
      const removedUserRecord = await RemovedUser.findOne({ originalId: testDoctor._id });
      expect(removedUserRecord).toBeTruthy();
      expect(removedUserRecord.userData.name).toBe(originalDoctor.name);
      expect(removedUserRecord.userData.email).toBe(originalDoctor.email);
      expect(removedUserRecord.userData.specializations).toEqual(originalDoctor.specializations);

      // Step 4: Verify data integrity check
      const integrityValid = removedUserRecord.verifyDataIntegrity();
      expect(integrityValid).toBe(true);

      // Step 5: Restore doctor
      await request(app)
        .post(`/api/admin/users/${testDoctor._id}/restore?userType=doctor`)
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({ notes: 'Data integrity test restoration' });

      // Step 6: Verify restored doctor has all original data
      const restoredDoctor = await Doctor.findById(testDoctor._id).lean();
      expect(restoredDoctor.name).toBe(originalDoctor.name);
      expect(restoredDoctor.email).toBe(originalDoctor.email);
      expect(restoredDoctor.specializations).toEqual(originalDoctor.specializations);
      expect(restoredDoctor.isActive).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases Workflow', () => {
    it('should handle various error scenarios gracefully', async () => {
      // Test 1: Try to remove non-existent user
      const nonExistentId = new mongoose.Types.ObjectId();
      const removeNonExistentResponse = await request(app)
        .delete(`/api/admin/users/${nonExistentId}/remove?userType=patient`)
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .send({ reason: 'Test removal' })
        .expect(500);

      expect(removeNonExistentResponse.body.success).toBe(false);

      // Test 2: Try to create admin with duplicate email
      const duplicateAdminResponse = await request(app)
        .post('/api/admin/users/add-admin')
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({
          name: 'Duplicate Admin',
          email: 'admin@gmail.com', // Same as root admin
          password: 'password123'
        })
        .expect(409);

      expect(duplicateAdminResponse.body.success).toBe(false);
      expect(duplicateAdminResponse.body.code).toBe('DUPLICATE_ADMIN_EMAIL');

      // Test 3: Try to remove root admin (should fail)
      const removeRootAdminResponse = await request(app)
        .delete(`/api/admin/users/${rootAdmin._id}/remove?userType=admin`)
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({ reason: 'Test removal' })
        .expect(403);

      expect(removeRootAdminResponse.body.success).toBe(false);
      expect(removeRootAdminResponse.body.code).toBe('REMOVAL_NOT_ALLOWED');

      // Test 4: Try to restore non-removed user
      const restoreActiveUserResponse = await request(app)
        .post(`/api/admin/users/${testHospital._id}/restore?userType=hospital`)
        .set('Authorization', `Bearer ${rootAdminToken}`)
        .send({ notes: 'Test restoration' })
        .expect(500);

      expect(restoreActiveUserResponse.body.success).toBe(false);

      // Verify error audit logs were created
      const errorAuditLogs = await AuditLog.find({ 
        status: 'failed'
      });
      expect(errorAuditLogs.length).toBeGreaterThan(0);
    });
  });
});