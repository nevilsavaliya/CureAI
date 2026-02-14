import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserManagementService, User, UserFilter, BulkOperationResult } from './user-management.service';
import { AdminService } from './admin.service';
import { ToastService } from './toast.service';
import { of, throwError } from 'rxjs';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let httpMock: HttpTestingController;
  let adminServiceSpy: jasmine.SpyObj<AdminService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'patient',
    userType: 'patient',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUserListResponse = {
    success: true,
    data: {
      users: [mockUser],
      totalCount: 1,
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  };

  beforeEach(() => {
    const adminSpy = jasmine.createSpyObj('AdminService', [
      'getUsers', 'removeUser', 'restoreUser', 'bulkRemoveUsers', 
      'canManageUserType', 'isAdmin'
    ]);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserManagementService,
        { provide: AdminService, useValue: adminSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    });

    service = TestBed.inject(UserManagementService);
    httpMock = TestBed.inject(HttpTestingController);
    adminServiceSpy = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
    toastServiceSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('User Search and Filtering', () => {
    it('should update filters and load users', () => {
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));
      
      const filter: Partial<UserFilter> = { userType: 'patient', search: 'test' };
      service.updateFilter(filter);
      service.loadUsers();

      expect(adminServiceSpy.getUsers).toHaveBeenCalled();
    });

    it('should debounce search input', (done) => {
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));
      
      service.searchUsers('test');
      service.searchUsers('test user');
      
      // Wait for debounce
      setTimeout(() => {
        expect(adminServiceSpy.getUsers).toHaveBeenCalledTimes(1);
        done();
      }, 350);
    });

    it('should clear filters', () => {
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));
      
      service.updateFilter({ search: 'test' });
      service.clearFilters();
      
      service.filters$.subscribe(filters => {
        expect(filters).toEqual({});
      });
    });
  });

  describe('User Selection', () => {
    it('should select and deselect users', () => {
      service.selectUser('1');
      expect(service.isUserSelected('1')).toBe(true);
      expect(service.getSelectedCount()).toBe(1);

      service.deselectUser('1');
      expect(service.isUserSelected('1')).toBe(false);
      expect(service.getSelectedCount()).toBe(0);
    });

    it('should toggle user selection', () => {
      service.toggleUserSelection('1');
      expect(service.isUserSelected('1')).toBe(true);

      service.toggleUserSelection('1');
      expect(service.isUserSelected('1')).toBe(false);
    });

    it('should clear all selections', () => {
      service.selectUser('1');
      service.selectUser('2');
      expect(service.getSelectedCount()).toBe(2);

      service.clearSelection();
      expect(service.getSelectedCount()).toBe(0);
    });
  });

  describe('Single User Operations', () => {
    it('should remove user successfully', () => {
      const response = { success: true, message: 'User removed' };
      adminServiceSpy.removeUser.and.returnValue(of(response));
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));

      service.removeUser('1', 'patient', 'Test reason').subscribe(result => {
        expect(result.success).toBe(true);
        expect(toastServiceSpy.success).toHaveBeenCalledWith('User removed successfully');
      });
    });

    it('should handle remove user error', () => {
      const error = { message: 'Remove failed' };
      adminServiceSpy.removeUser.and.returnValue(throwError(() => error));

      service.removeUser('1', 'patient').subscribe({
        error: (err) => {
          expect(toastServiceSpy.error).toHaveBeenCalled();
        }
      });
    });

    it('should restore user successfully', () => {
      const response = { success: true, data: { user: mockUser } };
      adminServiceSpy.restoreUser.and.returnValue(of(response));
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));

      service.restoreUser('1', 'patient', 'Test notes').subscribe(result => {
        expect(result.success).toBe(true);
        expect(toastServiceSpy.success).toHaveBeenCalledWith('User restored successfully');
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should perform bulk remove successfully', () => {
      const response = {
        success: true,
        data: {
          successCount: 2,
          failureCount: 0,
          failures: []
        }
      };
      adminServiceSpy.bulkRemoveUsers.and.returnValue(of(response));
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));

      service.bulkRemoveUsers(['1', '2'], 'patient', 'Bulk test').subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.successCount).toBe(2);
        expect(toastServiceSpy.success).toHaveBeenCalled();
      });
    });

    it('should handle bulk remove with no users selected', () => {
      service.bulkRemoveUsers([], 'patient').subscribe({
        error: (err) => {
          expect(err.message).toBe('No users selected for removal');
        }
      });
    });

    it('should perform bulk restore', () => {
      adminServiceSpy.restoreUser.and.returnValue(of({ success: true }));
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));

      service.bulkRestoreUsers(['1'], 'patient').subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.successCount).toBe(1);
      });
    });
  });

  describe('Permission Checks', () => {
    it('should check if user can manage user type', () => {
      adminServiceSpy.canManageUserType.and.returnValue(true);
      
      expect(service.canManageUserType('patient')).toBe(true);
      expect(adminServiceSpy.canManageUserType).toHaveBeenCalledWith('patient');
    });

    it('should check if user can perform bulk operations', () => {
      adminServiceSpy.isAdmin.and.returnValue(true);
      
      expect(service.canPerformBulkOperations()).toBe(true);
      expect(adminServiceSpy.isAdmin).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should refresh users', () => {
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));
      
      service.refreshUsers();
      expect(adminServiceSpy.getUsers).toHaveBeenCalled();
    });

    it('should reset to first page', () => {
      adminServiceSpy.getUsers.and.returnValue(of(mockUserListResponse));
      
      service.resetToFirstPage();
      
      service.pagination$.subscribe(pagination => {
        expect(pagination.page).toBe(1);
      });
    });

    it('should get current state', () => {
      expect(service.getCurrentUsers()).toEqual([]);
      expect(service.getCurrentFilters()).toEqual({});
      expect(service.getCurrentPagination()).toEqual({ page: 1, limit: 10 });
    });
  });
});