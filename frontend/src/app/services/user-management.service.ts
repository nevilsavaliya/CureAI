import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, throwError } from 'rxjs';
import { map, tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '../../config/environment';
import { AdminService, UserManagementResponse } from './admin.service';
import { ToastService } from './toast.service';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  userType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  // Additional fields based on user type
  specialization?: string; // for doctors
  hospitalName?: string; // for hospitals
  phoneNumber?: string;
  address?: string;
}

export interface UserFilter {
  userType?: string;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: User[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message?: string;
  error?: any;
}

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  failures: Array<{
    userId: string;
    error: string;
  }>;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private apiUrl = environment.apiUrl;
  
  // State management
  private usersSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private filtersSubject = new BehaviorSubject<UserFilter>({});
  private paginationSubject = new BehaviorSubject<PaginationOptions>({ page: 1, limit: 10 });
  private totalCountSubject = new BehaviorSubject<number>(0);
  private selectedUsersSubject = new BehaviorSubject<string[]>([]);
  
  // Search debouncing
  private searchSubject = new Subject<string>();
  
  // Public observables
  public users$ = this.usersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public filters$ = this.filtersSubject.asObservable();
  public pagination$ = this.paginationSubject.asObservable();
  public totalCount$ = this.totalCountSubject.asObservable();
  public selectedUsers$ = this.selectedUsersSubject.asObservable();
  
  // Real-time updates
  private userUpdatesSubject = new Subject<{
    action: 'added' | 'updated' | 'removed' | 'restored';
    user: User;
  }>();
  public userUpdates$ = this.userUpdatesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private adminService: AdminService,
    private toastService: ToastService
  ) {
    this.initializeSearchDebouncing();
  }

  private initializeSearchDebouncing(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.updateFilter({ search: searchTerm });
      this.loadUsers();
    });
  }

  // User search and filtering
  public searchUsers(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  public updateFilter(filter: Partial<UserFilter>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = { ...currentFilters, ...filter };
    this.filtersSubject.next(newFilters);
  }

  public clearFilters(): void {
    this.filtersSubject.next({});
    this.loadUsers();
  }

  public updatePagination(pagination: Partial<PaginationOptions>): void {
    const currentPagination = this.paginationSubject.value;
    const newPagination = { ...currentPagination, ...pagination };
    this.paginationSubject.next(newPagination);
    this.loadUsers();
  }

  // Load users with current filters and pagination
  public loadUsers(): void {
    this.loadingSubject.next(true);
    
    const filters = this.filtersSubject.value;
    const pagination = this.paginationSubject.value;
    
    const params = this.buildQueryParams(filters, pagination);
    
    this.adminService.getUsers(filters.userType, params).pipe(
      tap((response: UserListResponse) => {
        if (response.success) {
          this.usersSubject.next(response.data.users);
          this.totalCountSubject.next(response.data.totalCount);
        } else {
          this.handleError('Failed to load users', response.error);
        }
      }),
      catchError(error => {
        this.handleError('Failed to load users', error);
        return throwError(() => error);
      })
    ).subscribe({
      complete: () => this.loadingSubject.next(false)
    });
  }

  private buildQueryParams(filters: UserFilter, pagination: PaginationOptions): any {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit
    };

    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.dateRange?.startDate) {
      params.startDate = filters.dateRange.startDate;
    }
    if (filters.dateRange?.endDate) {
      params.endDate = filters.dateRange.endDate;
    }
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
    }
    if (filters.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }

    return params;
  }

  // User selection management
  public selectUser(userId: string): void {
    const currentSelection = this.selectedUsersSubject.value;
    if (!currentSelection.includes(userId)) {
      this.selectedUsersSubject.next([...currentSelection, userId]);
    }
  }

  public deselectUser(userId: string): void {
    const currentSelection = this.selectedUsersSubject.value;
    this.selectedUsersSubject.next(currentSelection.filter(id => id !== userId));
  }

  public toggleUserSelection(userId: string): void {
    const currentSelection = this.selectedUsersSubject.value;
    if (currentSelection.includes(userId)) {
      this.deselectUser(userId);
    } else {
      this.selectUser(userId);
    }
  }

  public selectAllUsers(): void {
    const currentUsers = this.usersSubject.value;
    const allUserIds = currentUsers.map(user => user.id);
    this.selectedUsersSubject.next(allUserIds);
  }

  public clearSelection(): void {
    this.selectedUsersSubject.next([]);
  }

  public isUserSelected(userId: string): boolean {
    return this.selectedUsersSubject.value.includes(userId);
  }

  public getSelectedCount(): number {
    return this.selectedUsersSubject.value.length;
  }

  // Single user operations
  public removeUser(userId: string, userType: string, reason?: string): Observable<UserManagementResponse> {
    return this.adminService.removeUser(userId, userType, reason).pipe(
      tap(response => {
        if (response.success) {
          this.handleUserRemoved(userId);
          this.showSuccessMessage('User removed successfully');
          this.loadUsers(); // Refresh the list
        } else {
          this.handleError('Failed to remove user', response.error);
        }
      }),
      catchError(error => {
        this.handleError('Failed to remove user', error);
        return throwError(() => error);
      })
    );
  }

  public restoreUser(userId: string, userType: string, notes?: string): Observable<UserManagementResponse> {
    return this.adminService.restoreUser(userId, userType, notes).pipe(
      tap(response => {
        if (response.success) {
          this.handleUserRestored(userId, response.data?.user);
          this.showSuccessMessage('User restored successfully');
          this.loadUsers(); // Refresh the list
        } else {
          this.handleError('Failed to restore user', response.error);
        }
      }),
      catchError(error => {
        this.handleError('Failed to restore user', error);
        return throwError(() => error);
      })
    );
  }

  // Bulk operations
  public bulkRemoveUsers(userIds: string[], userType: string, reason?: string): Observable<BulkOperationResult> {
    if (userIds.length === 0) {
      return throwError(() => new Error('No users selected for removal'));
    }

    return this.adminService.bulkRemoveUsers(userIds, userType, reason).pipe(
      map(response => {
        if (response.success) {
          const result: BulkOperationResult = {
            success: true,
            successCount: response.data?.successCount || userIds.length,
            failureCount: response.data?.failureCount || 0,
            failures: response.data?.failures || [],
            message: `Successfully removed ${response.data?.successCount || userIds.length} users`
          };
          
          // Handle successful removals
          userIds.forEach(userId => this.handleUserRemoved(userId));
          this.clearSelection();
          this.loadUsers(); // Refresh the list
          this.showSuccessMessage(result.message);
          
          return result;
        } else {
          throw new Error(response.error?.message || 'Bulk removal failed');
        }
      }),
      catchError(error => {
        const result: BulkOperationResult = {
          success: false,
          successCount: 0,
          failureCount: userIds.length,
          failures: userIds.map(userId => ({ userId, error: error.message })),
          message: 'Bulk removal failed'
        };
        this.handleError('Bulk removal failed', error);
        return throwError(() => result);
      })
    );
  }

  public bulkRestoreUsers(userIds: string[], userType: string, notes?: string): Observable<BulkOperationResult> {
    if (userIds.length === 0) {
      return throwError(() => new Error('No users selected for restoration'));
    }

    // Since there's no bulk restore endpoint, we'll do individual restores
    const restorePromises = userIds.map(userId => 
      this.adminService.restoreUser(userId, userType, notes).toPromise()
    );

    return new Observable<BulkOperationResult>(observer => {
      Promise.allSettled(restorePromises).then(results => {
        const successes = results.filter(result => result.status === 'fulfilled');
        const failures = results
          .map((result, index) => ({ result, userId: userIds[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, userId }) => ({
            userId,
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          }));

        const result: BulkOperationResult = {
          success: successes.length > 0,
          successCount: successes.length,
          failureCount: failures.length,
          failures,
          message: `Successfully restored ${successes.length} users`
        };

        if (result.success) {
          this.clearSelection();
          this.loadUsers(); // Refresh the list
          this.showSuccessMessage(result.message);
        }

        observer.next(result);
        observer.complete();
      });
    });
  }

  // Real-time UI updates
  private handleUserRemoved(userId: string): void {
    const currentUsers = this.usersSubject.value;
    const user = currentUsers.find(u => u.id === userId);
    if (user) {
      // Remove from current list
      const updatedUsers = currentUsers.filter(u => u.id !== userId);
      this.usersSubject.next(updatedUsers);
      
      // Emit update event
      this.userUpdatesSubject.next({
        action: 'removed',
        user
      });
    }
  }

  private handleUserRestored(userId: string, userData?: User): void {
    if (userData) {
      // Add to current list if not already present
      const currentUsers = this.usersSubject.value;
      if (!currentUsers.find(u => u.id === userId)) {
        this.usersSubject.next([...currentUsers, userData]);
      }
      
      // Emit update event
      this.userUpdatesSubject.next({
        action: 'restored',
        user: userData
      });
    }
  }

  // Error handling and user feedback
  private handleError(message: string, error: any): void {
    console.error(message, error);
    const errorMessage = error?.message || error?.error?.message || message;
    this.toastService.error(errorMessage);
  }

  private showSuccessMessage(message: string): void {
    this.toastService.success(message);
  }

  // Utility methods
  public refreshUsers(): void {
    this.loadUsers();
  }

  public resetToFirstPage(): void {
    this.updatePagination({ page: 1 });
  }

  public canManageUserType(userType: string): boolean {
    return this.adminService.canManageUserType(userType);
  }

  public canPerformBulkOperations(): boolean {
    return this.adminService.isAdmin();
  }

  public getFilteredUserCount(): number {
    return this.totalCountSubject.value;
  }

  public getCurrentUsers(): User[] {
    return this.usersSubject.value;
  }

  public getCurrentFilters(): UserFilter {
    return this.filtersSubject.value;
  }

  public getCurrentPagination(): PaginationOptions {
    return this.paginationSubject.value;
  }

  // Cleanup
  public destroy(): void {
    this.usersSubject.complete();
    this.loadingSubject.complete();
    this.filtersSubject.complete();
    this.paginationSubject.complete();
    this.totalCountSubject.complete();
    this.selectedUsersSubject.complete();
    this.searchSubject.complete();
    this.userUpdatesSubject.complete();
  }
}