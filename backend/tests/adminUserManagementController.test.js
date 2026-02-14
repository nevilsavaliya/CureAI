const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Patient = require('../models/Patient');
const adminUserManagementController = require('../controllers/adminUserManagementController');

// Mock the services
jest.mock('../services/userManagementService');
jest.mock('../services/auditLoggerService');
jest.mock('../services/emailNotificationService');

const userManagementService = require('../services/userManagementService');
const auditLoggerService = require('../services/auditLoggerService');
const emailNotificationService = require('../services/emailNotificationService');

describe('AdminUserManagementController', () => {
  let app;
  let mockAdmin;
  let mockRootAdmin;

  beforeAll(async () => {
    // Setup express app for testing
    app = express();
    app.use(express.json());
    
    // Mock middleware
    app.use((req, res, next) => {
      req.admin = mockRootAdmin;
      req.ip = '127.0.0.1';
      req.get = jest.fn().mockReturnValue('test-user-agent');
      req.sessionID = 'test-session-id';
      next();
    });

    // Setup routes
    app.post('/admin/users/add-admin', adminUserManagementController.addAdmin);
    app.delete('/admin/users/:id/remove', adminUserManagementController.removeUser);
    app.get('/admin/users', adminUserManagementController.getUsers);
    app.get('/admin/users/admins', adminUserManagementController.getAdmins);
  });

  beforeEach(() => {
    // Create mock admin objects
    mockAdmin = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Admin',
      email: 'test@admin.com',
      isRoot: jest.fn().mockReturnValue(false),
      isActive: true
    };

    mockRootAdmin = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Root Admin',
      email: 'admin@gmail.com',
      isRoot: jest.fn().mockReturnValue(true),
      isActive: true
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('addAdmin', () => {
    it('should successfully create a new admin', async () => {
      // Mock Admin.findOne to return null (no existing admin)
      jest.spyOn(Admin, 'findOne').mockResolvedValue(null);
      
      // Mock Admin constructor and save
      const mockNewAdmin = {
        _id: new mongoose.Types.ObjectId(),
        name: 'New Admin',
        email: 'newadmin@test.com',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: new mongoose.Types.ObjectId(),
          name: 'New Admin',
          email: 'newadmin@test.com',
          isActive: true
        })
      };
      
      jest.spyOn(Admin.prototype, 'save').mockResolvedValue(mockNewAdmin);
      
      // Mock email service
      emailNotificationService.sendNewAdminWelcomeEmail.mockResolvedValue(true);
      
      // Mock audit logger
      auditLoggerService.logAdminAction.mockResolvedValue(true);

      const response = await request(app)
        .post('/admin/users/add-admin')
        .send({
          name: 'New Admin',
          email: 'newadmin@test.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin created successfully');
      expect(emailNotificationService.sendNewAdminWelcomeEmail).toHaveBeenCalled();
      expect(auditLoggerService.logAdminAction).toHaveBeenCalled();
    });

    it('should reject duplicate admin email', async () => {
      // Mock Admin.findOne to return existing admin
      jest.spyOn(Admin, 'findOne').mockResolvedValue(mockAdmin);
      
      // Mock audit logger
      auditLoggerService.logAdminAction.mockResolvedValue(true);

      const response = await request(app)
        .post('/admin/users/add-admin')
        .send({
          name: 'Duplicate Admin',
          email: 'test@admin.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('DUPLICATE_ADMIN_EMAIL');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/admin/users/add-admin')
        .send({
          name: 'Test Admin'
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/admin/users/add-admin')
        .send({
          name: 'Test Admin',
          email: 'test@admin.com',
          password: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('WEAK_PASSWORD');
    });
  });

  describe('removeUser', () => {
    it('should successfully remove a user', async () => {
      const mockRemovalResult = {
        success: true,
        userData: {
          id: 'user123',
          email: 'user@test.com',
          name: 'Test User'
        },
        activeProcesses: {
          activeCasesCount: 0,
          activeConsultationsCount: 0
        }
      };

      // Mock eligibility check
      userManagementService.checkRemovalEligibility.mockResolvedValue({
        canRemove: true,
        reason: 'User can be removed'
      });

      // Mock removal service
      userManagementService.removeUser.mockResolvedValue(mockRemovalResult);
      
      // Mock email service
      emailNotificationService.sendUserRemovalNotification.mockResolvedValue(true);

      const response = await request(app)
        .delete('/admin/users/user123/remove?userType=patient')
        .send({
          reason: 'Test removal'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('patient removed successfully');
      expect(userManagementService.removeUser).toHaveBeenCalledWith(
        'user123',
        'patient',
        mockRootAdmin._id,
        mockRootAdmin.email,
        'Test removal',
        expect.any(Object)
      );
    });

    it('should reject removal when not eligible', async () => {
      // Mock eligibility check to fail
      userManagementService.checkRemovalEligibility.mockResolvedValue({
        canRemove: false,
        reason: 'User has active consultations'
      });

      // Mock audit logger
      auditLoggerService.logAdminAction.mockResolvedValue(true);

      const response = await request(app)
        .delete('/admin/users/user123/remove?userType=patient')
        .send({
          reason: 'Test removal'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('REMOVAL_NOT_ALLOWED');
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .delete('/admin/users/user123/remove')
        .send({
          reason: 'Test removal'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_REQUIRED_PARAMETERS');
    });
  });

  describe('getUsers', () => {
    it('should successfully get users list', async () => {
      const mockUsersResult = {
        users: [
          {
            _id: 'user1',
            name: 'User 1',
            email: 'user1@test.com',
            isActive: true
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        }
      };

      userManagementService.getUsersByType.mockResolvedValue(mockUsersResult);

      const response = await request(app)
        .get('/admin/users?userType=patient');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(1);
      expect(userManagementService.getUsersByType).toHaveBeenCalledWith(
        'patient',
        expect.any(Object),
        'root',
        expect.any(Object)
      );
    });

    it('should validate user type', async () => {
      const response = await request(app)
        .get('/admin/users?userType=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_USER_TYPE');
    });
  });

  describe('getAdmins', () => {
    it('should successfully get admins list', async () => {
      const mockAdminsResult = {
        users: [
          {
            _id: 'admin1',
            name: 'Admin 1',
            email: 'admin1@test.com',
            isActive: true,
            isRootAdmin: false,
            permissions: []
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        }
      };

      userManagementService.getUsersByType.mockResolvedValue(mockAdminsResult);

      const response = await request(app)
        .get('/admin/users/admins');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0]).toHaveProperty('canBeRemoved');
      expect(response.body.users[0]).toHaveProperty('permissionCount');
    });
  });
});