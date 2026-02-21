import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../config/environment';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  isRootAdmin: boolean;
  isActive: boolean;
  lastLogin?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  permissions?: AdminPermission[];
}

export interface AdminPermission {
  resource: string; // 'patients', 'doctors', 'hospitals', 'admins'
  actions: string[]; // 'read', 'create', 'update', 'delete'
}

export interface UserManagementResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;
  private currentAdminSubject = new BehaviorSubject<AdminUser | null>(null);
  public currentAdmin$ = this.currentAdminSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentAdmin();
  }

  private loadCurrentAdmin(): void {
    // Get admin data from the same place as AuthService
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Only set as admin if the user has admin role
        if (user && (user.role === 'admin' || user.role === 'root_admin')) {
          const adminUser: AdminUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            isRootAdmin: user.email === 'admin@gmail.com', // Root admin check
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          this.currentAdminSubject.next(adminUser);
        }
      } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  public get currentAdminValue(): AdminUser | null {
    return this.currentAdminSubject.value;
  }

  public setCurrentAdmin(admin: AdminUser): void {
    localStorage.setItem('currentAdmin', JSON.stringify(admin));
    this.currentAdminSubject.next(admin);
  }

  public clearCurrentAdmin(): void {
    localStorage.removeItem('currentAdmin');
    this.currentAdminSubject.next(null);
  }

  // Role-based permission checking methods
  public isRootAdmin(): boolean {
    const admin = this.currentAdminValue;
    return admin ? admin.isRootAdmin : false;
  }

  public isAdmin(): boolean {
    const admin = this.currentAdminValue;
    return admin !== null;
  }

  public canManageAdmins(): boolean {
    return this.isRootAdmin();
  }

  public canManageUserType(userType: string): boolean {
    const admin = this.currentAdminValue;
    if (!admin) return false;
    
    // Root admin can manage everything
    if (admin.isRootAdmin) return true;
    
    // Regular admins can manage patients, doctors, and hospitals but not admins
    const allowedTypes = ['patient', 'doctor', 'hospital'];
    return allowedTypes.includes(userType.toLowerCase());
  }

  public canPerformAction(resource: string, action: string): boolean {
    const admin = this.currentAdminValue;
    if (!admin) return false;
    
    // Root admin can perform all actions
    if (admin.isRootAdmin) return true;
    
    // Check specific permissions if available
    if (admin.permissions) {
      const permission = admin.permissions.find(p => p.resource === resource);
      return permission ? permission.actions.includes(action) : false;
    }
    
    // Default permissions for regular admins
    const defaultPermissions: { [key: string]: string[] } = {
      'patients': ['read', 'create', 'update', 'delete'],
      'doctors': ['read', 'create', 'update', 'delete'],
      'hospitals': ['read', 'create', 'update', 'delete'],
      'admins': [] // No admin permissions for regular admins
    };
    
    const allowedActions = defaultPermissions[resource] || [];
    return allowedActions.includes(action);
  }

  public hasAuditLogAccess(): boolean {
    return this.isRootAdmin();
  }

  public canRestoreUsers(): boolean {
    return this.isRootAdmin();
  }

  // Get platform metrics
  getMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/metrics`);
  }

  // Get all users with optional filters
  getUsers(userType?: string, params?: any): Observable<any> {
    let url = `${this.apiUrl}/admin/users`;
    const queryParams: string[] = [];
    
    if (userType && userType !== 'all' && userType !== '') {
      queryParams.push(`userType=${userType}`);
    }
    
    if (params) {
      if (params.search) {
        queryParams.push(`search=${encodeURIComponent(params.search)}`);
      }
      if (params.status && params.status !== 'all') {
        // Convert status filter to isActive parameter
        const isActive = params.status === 'active' ? 'true' : 'false';
        queryParams.push(`isActive=${isActive}`);
      }
      if (params.page) {
        queryParams.push(`page=${params.page}`);
      }
      if (params.limit) {
        queryParams.push(`limit=${params.limit}`);
      }
      if (params.sortBy) {
        queryParams.push(`sortBy=${params.sortBy}`);
      }
      if (params.sortOrder) {
        queryParams.push(`sortOrder=${params.sortOrder}`);
      }
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    return this.http.get(url).pipe(
      tap((response: any) => {
        // Backend response format: { success: true, users: [...], pagination: {...}, filters: {...} }
        console.log('getUsers response:', response);
      })
    );
  }

  // Get user detail
  getUserDetail(id: string, collectionType?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/users/${id}`;
    if (collectionType) {
      url += `?collectionType=${collectionType}`;
    }
    return this.http.get(url);
  }

  // Get performance metrics
  getPerformanceMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/performance/metrics`);
  }

  // Get system logs
  getSystemLogs(level?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/performance/logs`;
    if (level && level !== 'all') {
      url += `?level=${level}`;
    }
    return this.http.get(url);
  }

  // Enhanced user management methods with role-based validation
  removeUser(userId: string, userType: string, reason?: string): Observable<UserManagementResponse> {
    // Client-side permission check
    if (!this.canManageUserType(userType)) {
      return new Observable<UserManagementResponse>(observer => {
        observer.next({
          success: false,
          error: { message: 'Insufficient permissions to remove this user type' }
        });
        observer.complete();
      });
    }

    // Send userType as query parameter and reason in body
    const params = new HttpParams().set('userType', userType);
    
    return this.http.delete<UserManagementResponse>(`${this.apiUrl}/admin/users/${userId}/remove`, {
      params: params,
      body: { reason }
    }).pipe(
      tap(response => {
        // Backend response format: { success: true, message: "...", removedUser: {...}, activeProcesses: {...}, emailDeliveryStatus: "..." }
        if (response.success) {
          console.log(`User ${userId} of type ${userType} removed successfully`);
        }
      })
    );
  }

  bulkRemoveUsers(userIds: string[], userType: string, reason?: string): Observable<UserManagementResponse> {
    // Client-side permission check
    if (!this.canManageUserType(userType)) {
      return new Observable<UserManagementResponse>(observer => {
        observer.next({
          success: false,
          error: { message: 'Insufficient permissions to remove users of this type' }
        });
        observer.complete();
      });
    }

    return this.http.post<UserManagementResponse>(`${this.apiUrl}/admin/users/bulk-remove`, {
      userIds,
      userType,
      reason
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log(`Bulk removal of ${userIds.length} ${userType} users completed`);
        }
      })
    );
  }

  restoreUser(userId: string, userType: string, notes?: string): Observable<UserManagementResponse> {
    // Only root admin can restore users
    if (!this.canRestoreUsers()) {
      return new Observable<UserManagementResponse>(observer => {
        observer.next({
          success: false,
          error: { message: 'Only root admin can restore users' }
        });
        observer.complete();
      });
    }

    return this.http.post<UserManagementResponse>(`${this.apiUrl}/admin/users/${userId}/restore?userType=${userType}`, {
      notes
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log(`User ${userId} of type ${userType} restored successfully`);
        }
      })
    );
  }

  addAdmin(adminData: { name: string; email: string; password: string }): Observable<UserManagementResponse> {
    // Only root admin can add new admins
    if (!this.canManageAdmins()) {
      return new Observable<UserManagementResponse>(observer => {
        observer.next({
          success: false,
          error: { message: 'Only root admin can add new administrators' }
        });
        observer.complete();
      });
    }

    return this.http.post<UserManagementResponse>(`${this.apiUrl}/admin/users/add-admin`, adminData).pipe(
      tap(response => {
        if (response.success) {
          console.log(`New admin ${adminData.email} added successfully`);
        }
      })
    );
  }

  removeAdmin(adminId: string, reason?: string): Observable<UserManagementResponse> {
    // Only root admin can remove other admins
    if (!this.canManageAdmins()) {
      return new Observable<UserManagementResponse>(observer => {
        observer.next({
          success: false,
          error: { message: 'Only root admin can remove administrators' }
        });
        observer.complete();
      });
    }

    return this.http.delete<UserManagementResponse>(`${this.apiUrl}/admin/users/${adminId}/remove`, {
      body: { userType: 'admin', reason }
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log(`Admin ${adminId} removed successfully`);
        }
      })
    );
  }

  getAdmins(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users?userType=admin`).pipe(
      tap((response: any) => {
        // Backend response format: { success: true, users: [...], pagination: {...}, filters: {...} }
        console.log('getAdmins response:', response);
      })
    );
  }

  getRemovedUsers(filters?: any, options?: any): Observable<any> {
    let url = `${this.apiUrl}/admin/users/removed`;
    const params: string[] = [];
    
    if (filters) {
      if (filters.userType) {
        params.push(`userType=${filters.userType}`);
      }
      if (filters.isRestored !== undefined) {
        params.push(`isRestored=${filters.isRestored}`);
      }
      if (filters.searchEmail) {
        params.push(`searchEmail=${encodeURIComponent(filters.searchEmail)}`);
      }
      if (filters.startDate) {
        params.push(`startDate=${filters.startDate}`);
      }
      if (filters.endDate) {
        params.push(`endDate=${filters.endDate}`);
      }
      if (filters.removedBy) {
        params.push(`removedBy=${filters.removedBy}`);
      }
    }
    
    if (options) {
      if (options.page) {
        params.push(`page=${options.page}`);
      }
      if (options.limit) {
        params.push(`limit=${options.limit}`);
      }
      if (options.sortBy) {
        params.push(`sortBy=${options.sortBy}`);
      }
      if (options.sortOrder) {
        params.push(`sortOrder=${options.sortOrder}`);
      }
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url).pipe(
      tap((response: any) => {
        // Backend response format: { success: true, removedUsers: [...], pagination: {...} }
        console.log('getRemovedUsers response:', response);
      })
    );
  }

  // Data integrity and system management
  getDataIntegrityStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/data-integrity/status`);
  }

  triggerDataCleanup(): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/jobs/trigger/data-cleanup`, {});
  }

  triggerDataIntegrityCheck(): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/jobs/trigger/integrity-check`, {});
  }

  getScheduledJobStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/jobs/status`);
  }

  getRemovalStatistics(filters?: any): Observable<any> {
    let url = `${this.apiUrl}/admin/users/removal-statistics`;
    const params: string[] = [];
    
    if (filters) {
      if (filters.startDate) {
        params.push(`startDate=${filters.startDate}`);
      }
      if (filters.endDate) {
        params.push(`endDate=${filters.endDate}`);
      }
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url);
  }

  // Enhanced audit log methods with role-based access control
  getAuditLogs(filters?: any): Observable<any> {
    // Only root admin can access audit logs
    if (!this.hasAuditLogAccess()) {
      return new Observable<any>(observer => {
        observer.next({
          success: false,
          error: { message: 'Only root admin can access audit logs' }
        });
        observer.complete();
      });
    }

    let url = `${this.apiUrl}/admin/audit-logs`;
    const params: string[] = [];
    
    if (filters) {
      if (filters.startDate) {
        params.push(`startDate=${filters.startDate}`);
      }
      if (filters.endDate) {
        params.push(`endDate=${filters.endDate}`);
      }
      if (filters.adminId) {
        params.push(`adminId=${filters.adminId}`);
      }
      if (filters.adminEmail) {
        params.push(`adminEmail=${encodeURIComponent(filters.adminEmail)}`);
      }
      if (filters.action) {
        if (Array.isArray(filters.action)) {
          params.push(`action=${filters.action.join(',')}`);
        } else {
          params.push(`action=${filters.action}`);
        }
      }
      if (filters.targetUserType) {
        params.push(`targetUserType=${filters.targetUserType}`);
      }
      if (filters.targetUserEmail) {
        params.push(`targetUserEmail=${encodeURIComponent(filters.targetUserEmail)}`);
      }
      if (filters.ipAddress) {
        params.push(`ipAddress=${filters.ipAddress}`);
      }
      if (filters.status) {
        params.push(`status=${filters.status}`);
      }
      if (filters.searchTerm) {
        params.push(`searchTerm=${encodeURIComponent(filters.searchTerm)}`);
      }
      if (filters.page) {
        params.push(`page=${filters.page}`);
      }
      if (filters.limit) {
        params.push(`limit=${filters.limit}`);
      }
      if (filters.sortBy) {
        params.push(`sortBy=${filters.sortBy}`);
      }
      if (filters.sortOrder) {
        params.push(`sortOrder=${filters.sortOrder}`);
      }
      if (filters.includeDetails !== undefined) {
        params.push(`includeDetails=${filters.includeDetails}`);
      }
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url).pipe(
      tap((response: any) => {
        // Backend response format: { success: true, logs: [...], pagination: {...}, summary: {...} }
        console.log('getAuditLogs response:', response);
      })
    );
  }

  exportAuditLogs(filters?: any, format: string = 'csv'): Observable<any> {
    // Only root admin can export audit logs
    if (!this.hasAuditLogAccess()) {
      return new Observable<any>(observer => {
        observer.next({
          success: false,
          error: { message: 'Only root admin can export audit logs' }
        });
        observer.complete();
      });
    }

    let url = `${this.apiUrl}/admin/audit-logs/export`;
    const params: string[] = [];
    
    params.push(`format=${format}`);
    
    if (filters) {
      if (filters.startDate) {
        params.push(`startDate=${filters.startDate}`);
      }
      if (filters.endDate) {
        params.push(`endDate=${filters.endDate}`);
      }
      if (filters.adminId) {
        params.push(`adminId=${filters.adminId}`);
      }
      if (filters.adminEmail) {
        params.push(`adminEmail=${encodeURIComponent(filters.adminEmail)}`);
      }
      if (filters.action) {
        if (Array.isArray(filters.action)) {
          params.push(`action=${filters.action.join(',')}`);
        } else {
          params.push(`action=${filters.action}`);
        }
      }
      if (filters.targetUserType) {
        params.push(`targetUserType=${filters.targetUserType}`);
      }
      if (filters.targetUserEmail) {
        params.push(`targetUserEmail=${encodeURIComponent(filters.targetUserEmail)}`);
      }
      if (filters.ipAddress) {
        params.push(`ipAddress=${filters.ipAddress}`);
      }
      if (filters.status) {
        params.push(`status=${filters.status}`);
      }
      if (filters.searchTerm) {
        params.push(`searchTerm=${encodeURIComponent(filters.searchTerm)}`);
      }
      if (filters.maxRecords) {
        params.push(`maxRecords=${filters.maxRecords}`);
      }
      if (filters.includeDetails !== undefined) {
        params.push(`includeDetails=${filters.includeDetails}`);
      }
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url, { responseType: 'blob' });
  }

  getAuditStatistics(filters?: any): Observable<any> {
    // Only root admin can access audit statistics
    if (!this.hasAuditLogAccess()) {
      return new Observable<any>(observer => {
        observer.next({
          success: false,
          error: { message: 'Only root admin can access audit statistics' }
        });
        observer.complete();
      });
    }

    let url = `${this.apiUrl}/admin/audit-logs/statistics`;
    const params: string[] = [];
    
    if (filters) {
      if (filters.startDate) {
        params.push(`startDate=${filters.startDate}`);
      }
      if (filters.endDate) {
        params.push(`endDate=${filters.endDate}`);
      }
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url);
  }

  public refreshCurrentAdmin(): void {
    this.loadCurrentAdmin();
  }
}
