import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

interface RemovedUser {
  _id: string;
  originalId: string;
  userType: string;
  userData: {
    name: string;
    email: string;
    [key: string]: any;
  };
  removedBy: {
    _id: string;
    name: string;
    email: string;
    isRootAdmin: boolean;
  };
  removedByEmail: string;
  removedAt: string;
  reason: string;
  isRestored: boolean;
  restoredBy?: {
    _id: string;
    name: string;
    email: string;
    isRootAdmin: boolean;
  };
  restoredByEmail?: string;
  restoredAt?: string;
  scheduledDeletion: string;
  removalContext: {
    hasActiveCases: boolean;
    hasActiveConsultations: boolean;
    hasActiveSubscriptions: boolean;
    relatedRecordsCount: number;
  };
  restorationNotes?: string;
  canBeRestored?: boolean;
  daysUntilDeletion?: number;
  dataIntegrityValid?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

@Component({
  selector: 'app-removed-users',
  templateUrl: './removed-users.component.html',
  styleUrls: ['./removed-users.component.css']
})
export class RemovedUsersComponent implements OnInit {
  // Current admin info
  currentAdmin: any;
  isRootAdmin: boolean = false;

  // Data
  removedUsers: RemovedUser[] = [];
  filteredUsers: RemovedUser[] = [];
  selectedUsers: Set<string> = new Set();

  // Loading states
  loading: boolean = false;
  error: string = '';
  success: string = '';

  // Filters
  userTypeFilter: string = 'all';
  restorationStatusFilter: string = 'not_restored'; // 'all', 'restored', 'not_restored'
  searchTerm: string = '';
  dateRangeStart: string = '';
  dateRangeEnd: string = '';
  removedByFilter: string = '';

  // Sorting
  sortBy: string = 'removedAt';
  sortOrder: string = 'desc';

  // Pagination
  pagination: PaginationInfo = {
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  };

  // Modal states
  showRestorationModal: boolean = false;
  showDetailsModal: boolean = false;
  selectedUser: RemovedUser | null = null;
  restorationNotes: string = '';
  restorationLoading: boolean = false;

  // User type options
  userTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'patient', label: 'Patients' },
    { value: 'doctor', label: 'Doctors' },
    { value: 'hospital', label: 'Hospitals' },
    { value: 'admin', label: 'Admins' }
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    // Get current admin info
    this.currentAdmin = this.authService.currentUserValue;
    this.isRootAdmin = this.currentAdmin?.email === 'admin@gmail.com';

    // Only root admin can access this component
    if (!this.isRootAdmin) {
      this.error = 'Access denied. Only root admin can view removed users.';
      return;
    }

    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.dateRangeEnd = endDate.toISOString().split('T')[0];
    this.dateRangeStart = startDate.toISOString().split('T')[0];

    // Load initial data
    this.loadRemovedUsers();
  }

  // Data loading
  loadRemovedUsers(): void {
    if (!this.isRootAdmin) {
      return;
    }

    this.loading = true;
    this.error = '';

    const filters = this.buildFilters();
    const options = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.adminService.getRemovedUsers(filters, options).subscribe({
      next: (response) => {
        if (response.success) {
          this.removedUsers = response.removedUsers || [];
          this.pagination = response.pagination || this.pagination;
          this.applyLocalFilters();
        } else {
          this.error = response.message || 'Failed to load removed users';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load removed users';
        this.loading = false;
        console.error('Error loading removed users:', error);
      }
    });
  }

  private buildFilters(): any {
    const filters: any = {};

    if (this.userTypeFilter !== 'all') {
      filters.userType = this.userTypeFilter;
    }

    if (this.restorationStatusFilter !== 'all') {
      filters.isRestored = this.restorationStatusFilter === 'restored';
    }

    if (this.searchTerm) {
      filters.searchEmail = this.searchTerm;
    }

    if (this.dateRangeStart) {
      filters.startDate = this.dateRangeStart;
    }

    if (this.dateRangeEnd) {
      filters.endDate = this.dateRangeEnd;
    }

    if (this.removedByFilter) {
      filters.removedBy = this.removedByFilter;
    }

    return filters;
  }

  private applyLocalFilters(): void {
    this.filteredUsers = [...this.removedUsers];
  }

  // Filtering and searching
  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadRemovedUsers();
  }

  onSearchChange(): void {
    this.debounceSearch();
  }

  private debounceSearch = this.debounce(() => {
    this.pagination.page = 1;
    this.loadRemovedUsers();
  }, 300);

  private debounce(func: Function, wait: number) {
    let timeout: any;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  resetFilters(): void {
    this.userTypeFilter = 'all';
    this.restorationStatusFilter = 'not_restored';
    this.searchTerm = '';
    this.removedByFilter = '';
    
    // Reset date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.dateRangeEnd = endDate.toISOString().split('T')[0];
    this.dateRangeStart = startDate.toISOString().split('T')[0];
    
    this.pagination.page = 1;
    this.loadRemovedUsers();
  }

  // Sorting
  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.loadRemovedUsers();
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return 'fas fa-sort';
    return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // Pagination
  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.pages) {
      this.pagination.page = page;
      this.loadRemovedUsers();
    }
  }

  changePageSize(event: any): void {
    const size = +event.target.value;
    this.pagination.limit = size;
    this.pagination.page = 1;
    this.loadRemovedUsers();
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const total = this.pagination.pages;
    const current = this.pagination.page;
    
    // Show up to 5 pages around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // User restoration
  openRestorationModal(user: RemovedUser): void {
    if (!this.canRestoreUser(user)) {
      return;
    }

    this.selectedUser = user;
    this.restorationNotes = '';
    this.showRestorationModal = true;
  }

  confirmRestoration(): void {
    if (!this.selectedUser) {
      return;
    }

    this.restorationLoading = true;
    this.error = '';

    this.adminService.restoreUser(
      this.selectedUser.originalId,
      this.selectedUser.userType,
      this.restorationNotes
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = `${this.selectedUser?.userType} restored successfully`;
          
          // Update the user in the local array
          if (this.selectedUser) {
            const index = this.removedUsers.findIndex(u => u._id === this.selectedUser!._id);
            if (index !== -1) {
              this.removedUsers[index].isRestored = true;
              this.removedUsers[index].restoredAt = new Date().toISOString();
              this.removedUsers[index].restorationNotes = this.restorationNotes;
              this.removedUsers[index].restoredByEmail = this.currentAdmin.email;
            }
          }
          
          this.applyLocalFilters();
          this.closeRestorationModal();
          
          // Clear success message after 5 seconds
          setTimeout(() => {
            this.success = '';
          }, 5000);
        } else {
          this.error = response.message || 'Failed to restore user';
        }
        this.restorationLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to restore user';
        this.restorationLoading = false;
        console.error('Error restoring user:', error);
      }
    });
  }

  closeRestorationModal(): void {
    this.showRestorationModal = false;
    this.selectedUser = null;
    this.restorationNotes = '';
    this.restorationLoading = false;
  }

  canRestoreUser(user: RemovedUser): boolean {
    return (user.canBeRestored ?? true) && !user.isRestored;
  }

  // User details modal
  openDetailsModal(user: RemovedUser): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedUser = null;
  }

  // Utility methods
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  getDaysUntilDeletion(user: RemovedUser): number {
    if (user.isRestored) return -1;
    
    const now = new Date();
    const deletionDate = new Date(user.scheduledDeletion);
    const diffMs = deletionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  getDeletionUrgencyClass(user: RemovedUser): string {
    const days = this.getDaysUntilDeletion(user);
    
    if (user.isRestored) return 'deletion-restored';
    if (days <= 0) return 'deletion-expired';
    if (days <= 7) return 'deletion-urgent';
    if (days <= 30) return 'deletion-warning';
    return 'deletion-normal';
  }

  getDeletionStatusText(user: RemovedUser): string {
    if (user.isRestored) return 'Restored';
    
    const days = this.getDaysUntilDeletion(user);
    
    if (days <= 0) return 'Expired';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  }

  getUserTypeClass(userType: string): string {
    switch (userType) {
      case 'patient': return 'user-type-patient';
      case 'doctor': return 'user-type-doctor';
      case 'hospital': return 'user-type-hospital';
      case 'admin': return 'user-type-admin';
      default: return 'user-type-default';
    }
  }

  getUserTypeBadgeClass(userType: string): string {
    switch (userType) {
      case 'patient': return 'badge badge-patient';
      case 'doctor': return 'badge badge-doctor';
      case 'hospital': return 'badge badge-hospital';
      case 'admin': return 'badge badge-admin';
      default: return 'badge badge-secondary';
    }
  }

  getRestorationStatusClass(user: RemovedUser): string {
    if (user.isRestored) return 'status-restored';
    if (this.canRestoreUser(user)) return 'status-restorable';
    return 'status-not-restorable';
  }

  getRestorationStatusText(user: RemovedUser): string {
    if (user.isRestored) return 'Restored';
    if (this.canRestoreUser(user)) return 'Can be restored';
    return 'Cannot be restored';
  }

  getDataIntegrityClass(user: RemovedUser): string {
    if (user.dataIntegrityValid === true) return 'integrity-valid';
    if (user.dataIntegrityValid === false) return 'integrity-invalid';
    return 'integrity-unknown';
  }

  getDataIntegrityText(user: RemovedUser): string {
    if (user.dataIntegrityValid === true) return 'Valid';
    if (user.dataIntegrityValid === false) return 'Corrupted';
    return 'Unknown';
  }

  hasActiveProcesses(user: RemovedUser): boolean {
    const context = user.removalContext;
    return context.hasActiveCases || 
           context.hasActiveConsultations || 
           context.hasActiveSubscriptions;
  }

  getActiveProcessesText(user: RemovedUser): string {
    const context = user.removalContext;
    const processes: string[] = [];
    
    if (context.hasActiveCases) processes.push('cases');
    if (context.hasActiveConsultations) processes.push('consultations');
    if (context.hasActiveSubscriptions) processes.push('subscriptions');
    
    if (processes.length === 0) return 'None';
    return processes.join(', ');
  }

  refreshData(): void {
    this.loadRemovedUsers();
  }

  exportData(): void {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  }

  getStartItemNumber(): number {
    return (this.pagination.page - 1) * this.pagination.limit + 1;
  }

  getEndItemNumber(): number {
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }
}