import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  isRootAdmin?: boolean;
  createdBy?: string;
  permissions?: Array<{
    resource: string;
    actions: string[];
  }>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

@Component({
  selector: 'app-admin-user-management',
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class AdminUserManagementComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  // Current admin info
  currentAdmin: any;
  isRootAdmin: boolean = false;

  // Tab management
  activeTab: string = 'patients';
  availableTabs = [
    { id: 'patients', label: 'Patients', icon: 'fas fa-user-injured' },
    { id: 'doctors', label: 'Doctors', icon: 'fas fa-user-md' },
    { id: 'hospitals', label: 'Hospitals', icon: 'fas fa-hospital' },
    { id: 'admins', label: 'Admins', icon: 'fas fa-user-shield' },
    { id: 'removed', label: 'Removed Users', icon: 'fas fa-trash-restore' },
    { id: 'audit-logs', label: 'Audit Logs', icon: 'fas fa-clipboard-list' }
  ];

  // User data
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: Set<string> = new Set();

  // Loading states
  loading: boolean = false;
  error: string = '';
  refreshing: boolean = false;
  showLoadingOverlay: boolean = false;
  loadingMessage: string = '';

  // Real-time feedback
  showFeedback: boolean = false;
  feedbackMessage: string = '';
  feedbackType: 'success' | 'error' | 'info' = 'info';
  private feedbackTimeout: any;

  // Keyboard shortcuts
  showKeyboardHelp: boolean = false;
  private keyboardHelpTimeout: any;

  // Contextual help
  showContextualHelp: boolean = false;

  // Tab counts for role-based display
  tabCounts: { [key: string]: number } = {};

  // Search and filtering
  searchTerm: string = '';
  statusFilter: string = 'all'; // 'all', 'active', 'inactive'
  sortBy: string = 'name'; // 'name', 'email', 'createdAt', 'lastLogin'
  sortOrder: string = 'asc'; // 'asc', 'desc'

  // Pagination
  pagination: PaginationInfo = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  };

  // Bulk operations
  showBulkActions: boolean = false;
  bulkActionLoading: boolean = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }
    if (this.keyboardHelpTimeout) {
      clearTimeout(this.keyboardHelpTimeout);
    }
  }

  // Keyboard shortcuts handler
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Prevent shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key) {
      case 'F5':
        event.preventDefault();
        this.refreshData();
        break;
      case 'Escape':
        event.preventDefault();
        this.clearSelection();
        this.hideKeyboardHelp();
        break;
      case '?':
        event.preventDefault();
        this.toggleKeyboardHelp();
        break;
      case 'f':
      case 'F':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.focusSearch();
        }
        break;
      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleAllSelection();
        }
        break;
      case 'Tab':
        if (!event.shiftKey) {
          this.switchToNextTab();
        }
        break;
    }
  }

  // Keyboard shortcut methods
  private focusSearch(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
      this.searchInput.nativeElement.select();
    }
  }

  private switchToNextTab(): void {
    const currentIndex = this.availableTabs.findIndex(tab => tab.id === this.activeTab);
    const nextIndex = (currentIndex + 1) % this.availableTabs.length;
    const nextTab = this.availableTabs[nextIndex];

    if (this.canAccessTab(nextTab.id)) {
      this.switchTab(nextTab.id);
    }
  }

  private toggleKeyboardHelp(): void {
    this.showKeyboardHelp = !this.showKeyboardHelp;

    if (this.showKeyboardHelp) {
      this.keyboardHelpTimeout = setTimeout(() => {
        this.hideKeyboardHelp();
      }, 5000);
    }
  }

  private hideKeyboardHelp(): void {
    this.showKeyboardHelp = false;
    if (this.keyboardHelpTimeout) {
      clearTimeout(this.keyboardHelpTimeout);
    }
  }

  // Real-time feedback methods
  private showActionFeedback(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    this.showFeedback = true;

    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }

    this.feedbackTimeout = setTimeout(() => {
      this.showFeedback = false;
    }, 4000);
  }

  // Enhanced loading states
  private setLoadingState(loading: boolean, message: string = ''): void {
    this.showLoadingOverlay = loading;
    this.loadingMessage = message;
  }

  // Role-based UI methods
  getCurrentRoleText(): string {
    if (this.isRootAdmin) {
      return 'Root Administrator';
    }
    return 'Administrator';
  }

  getRoleBadgeClass(): string {
    return this.isRootAdmin ? 'root-admin' : 'regular-admin';
  }

  getRoleIcon(): string {
    return this.isRootAdmin ? 'fas fa-crown' : 'fas fa-user-shield';
  }

  getTabTooltip(tab: any): string {
    if (!this.canAccessTab(tab.id)) {
      return `${tab.label} - Root admin access required`;
    }

    const descriptions: { [key: string]: string } = {
      'patients': 'Manage patient accounts and registrations',
      'doctors': 'Manage doctor profiles and verifications',
      'hospitals': 'Manage hospital organizations and partnerships',
      'admins': 'Manage administrator accounts (Root admin only)',
      'removed': 'View and restore removed users (Root admin only)',
      'audit-logs': 'View system audit logs and security events (Root admin only)'
    };

    return descriptions[tab.id] || tab.label;
  }

  getTabCount(tabId: string): number {
    return this.tabCounts[tabId] || 0;
  }

  // Contextual help methods
  toggleContextualHelp(): void {
    this.showContextualHelp = !this.showContextualHelp;
  }

  hideContextualHelp(): void {
    this.showContextualHelp = false;
  }

  getContextualHelpTitle(): string {
    const titles: { [key: string]: string } = {
      'patients': 'Patient Management Help',
      'doctors': 'Doctor Management Help',
      'hospitals': 'Hospital Management Help',
      'admins': 'Administrator Management Help',
      'removed': 'User Recovery Help',
      'audit-logs': 'Audit & Security Help'
    };

    return titles[this.activeTab] || 'User Management Help';
  }

  // Update tab counts when data loads
  private updateTabCounts(): void {
    // This would typically be called after loading data
    // For now, we'll simulate with the current filtered users count
    this.tabCounts[this.activeTab] = this.filteredUsers.length;
  }

  // Dashboard widget methods
  getTabIcon(tabId: string): string {
    const icons: { [key: string]: string } = {
      'patients': 'fas fa-user-injured',
      'doctors': 'fas fa-user-md',
      'hospitals': 'fas fa-hospital',
      'admins': 'fas fa-user-shield'
    };
    return icons[tabId] || 'fas fa-users';
  }

  getActiveUsersCount(): number {
    return this.users.filter(user => user.isActive).length;
  }

  getRootAdminCount(): number {
    if (this.activeTab === 'admins') {
      return this.users.filter(user => user.isRootAdmin).length;
    }
    return 0;
  }

  getRecentActivityCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.users.filter(user => {
      if (!user.lastLogin) return false;
      return new Date(user.lastLogin) > thirtyDaysAgo;
    }).length;
  }

  private initializeComponent(): void {
    // Get current admin info
    this.currentAdmin = this.authService.currentUserValue;
    this.isRootAdmin = this.currentAdmin?.email === 'admin@gmail.com';

    // Filter available tabs based on admin role
    if (!this.isRootAdmin) {
      this.availableTabs = this.availableTabs.filter(tab =>
        tab.id !== 'admins' && tab.id !== 'removed' && tab.id !== 'audit-logs'
      );
    }

    // Load initial data
    this.loadUsers();
  }

  // Tab management
  switchTab(tabId: string): void {
    if ((tabId === 'admins' || tabId === 'removed' || tabId === 'audit-logs') && !this.isRootAdmin) {
      return; // Prevent access to admin, removed, and audit-logs tabs for regular admins
    }

    this.activeTab = tabId;
    this.clearSelection();
    this.resetFilters();

    // Don't load users for removed and audit-logs tabs as they have their own components
    if (tabId !== 'removed' && tabId !== 'audit-logs') {
      this.loadUsers();
    }
  }

  canAccessTab(tabId: string): boolean {
    if (tabId === 'admins' || tabId === 'removed' || tabId === 'audit-logs') {
      return this.isRootAdmin;
    }
    return true;
  }

  // Data loading
  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.setLoadingState(true, `Loading ${this.activeTab}...`);

    const params = this.buildQueryParams();
    const userType = this.getUserTypeFromTab(this.activeTab);

    this.adminService.getUsers(userType, params).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        if (response.success) {
          this.users = response.users || [];
          console.log('Users loaded:', this.users);
          console.log('Users length:', this.users.length);
          this.pagination = response.pagination || this.pagination;
          this.applyFiltersAndSort();
          console.log('Filtered users:', this.filteredUsers);
          console.log('Filtered users length:', this.filteredUsers.length);
          this.updateTabCounts();
          this.showActionFeedback(`Loaded ${this.users.length} ${this.activeTab}`, 'success');
        } else {
          this.error = response.message || 'Failed to load users';
          this.showActionFeedback(this.error, 'error');
        }
        this.loading = false;
        this.setLoadingState(false);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load users';
        this.showActionFeedback(this.error, 'error');
        this.loading = false;
        this.setLoadingState(false);
        console.error('Error loading users:', error);
      }
    });
  }

  private buildQueryParams(): any {
    return {
      page: this.pagination.currentPage,
      limit: this.pagination.itemsPerPage,
      search: this.searchTerm,
      status: this.statusFilter,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
  }

  private getUserTypeFromTab(tabId: string): string {
    // Convert plural tab names to singular user types expected by backend
    const tabToUserTypeMap: { [key: string]: string } = {
      'patients': 'patient',
      'doctors': 'doctor',
      'hospitals': 'hospital',
      'admins': 'admin'
    };

    return tabToUserTypeMap[tabId] || tabId;
  }

  // Search and filtering
  onSearchChange(): void {
    this.pagination.currentPage = 1;
    this.debounceSearch();
  }

  private debounceSearch = this.debounce(() => {
    this.loadUsers();
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

  onStatusFilterChange(): void {
    this.pagination.currentPage = 1;
    this.loadUsers();
  }

  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.pagination.currentPage = 1;
  }

  private applyFiltersAndSort(): void {
    console.log('applyFiltersAndSort called with users:', this.users);
    console.log('Current statusFilter:', this.statusFilter);
    console.log('Current searchTerm:', this.searchTerm);

    let filtered = [...this.users];

    // Apply local filtering if needed (for client-side filtering)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
      console.log('After search filter:', filtered.length);
    }

    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      console.log('Filtering by status. isActive should be:', isActive);
      console.log('Users before status filter:', filtered.map(u => ({ name: u.name, isActive: u.isActive })));
      filtered = filtered.filter(user => user.isActive === isActive);
      console.log('After status filter:', filtered.length);
    } else {
      console.log('Status filter is "all", showing all users');
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof User];
      let bValue: any = b[this.sortBy as keyof User];

      if (this.sortBy === 'createdAt' || this.sortBy === 'lastLogin') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    console.log('Final filtered users:', filtered);
    this.filteredUsers = filtered;
  }

  // Selection management
  toggleUserSelection(userId: string): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
    this.updateBulkActionsVisibility();
  }

  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      this.selectAll();
    }
    this.updateBulkActionsVisibility();
  }

  selectAll(): void {
    this.filteredUsers.forEach(user => {
      if (this.canRemoveUser(user)) {
        this.selectedUsers.add(user._id);
      }
    });
  }

  clearSelection(): void {
    this.selectedUsers.clear();
    this.updateBulkActionsVisibility();
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.has(userId);
  }

  isAllSelected(): boolean {
    const selectableUsers = this.filteredUsers.filter(user => this.canRemoveUser(user));
    return selectableUsers.length > 0 &&
      selectableUsers.every(user => this.selectedUsers.has(user._id));
  }

  isPartiallySelected(): boolean {
    const selectableUsers = this.filteredUsers.filter(user => this.canRemoveUser(user));
    const selectedCount = selectableUsers.filter(user => this.selectedUsers.has(user._id)).length;
    return selectedCount > 0 && selectedCount < selectableUsers.length;
  }

  private updateBulkActionsVisibility(): void {
    this.showBulkActions = this.selectedUsers.size > 0;
  }

  // Pagination
  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.loadUsers();
    }
  }

  changePageSize(event: any): void {
    const size = +event.target.value;
    this.pagination.itemsPerPage = size;
    this.pagination.currentPage = 1;
    this.loadUsers();
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const total = this.pagination.totalPages;
    const current = this.pagination.currentPage;

    // Show up to 5 pages around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // User management permissions
  canRemoveUser(user: User): boolean {
    // Root admin cannot be removed
    if (user.isRootAdmin) {
      return false;
    }

    // Regular admins cannot remove other admins
    if (user.role === 'admin' && !this.isRootAdmin) {
      return false;
    }

    return true;
  }

  canManageAdmins(): boolean {
    return this.isRootAdmin;
  }

  // Modal state
  showRemovalModal: boolean = false;
  modalUser: User | null = null;
  modalUsers: User[] = [];
  modalIsBulkRemoval: boolean = false;

  // Add Admin Modal state
  showAddAdminModal: boolean = false;

  // User actions
  removeUser(user: User): void {
    this.modalUser = user;
    this.modalUsers = [];
    this.modalIsBulkRemoval = false;
    this.showRemovalModal = true;
  }

  bulkRemoveUsers(): void {
    if (this.selectedUsers.size === 0) return;

    this.modalUser = null;
    this.modalUsers = this.filteredUsers.filter(user => this.selectedUsers.has(user._id));
    this.modalIsBulkRemoval = true;
    this.showRemovalModal = true;
  }

  onRemovalConfirmed(data: { reason: string }): void {
    this.loading = true;
    this.error = '';

    if (this.modalIsBulkRemoval) {
      this.performBulkRemoval(data.reason);
    } else if (this.modalUser) {
      this.performSingleRemoval(this.modalUser, data.reason);
    }
  }

  onRemovalCancelled(): void {
    this.showRemovalModal = false;
    this.modalUser = null;
    this.modalUsers = [];
    this.modalIsBulkRemoval = false;
  }

  private performSingleRemoval(user: User, reason: string): void {
    this.setLoadingState(true, `Removing ${user.name}...`);

    this.adminService.removeUser(user._id, user.role, reason).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove user from local array
          this.users = this.users.filter(u => u._id !== user._id);
          this.applyFiltersAndSort();
          this.clearSelection();

          this.showActionFeedback(`${user.name} has been removed successfully`, 'success');
        } else {
          this.error = response.message || 'Failed to remove user';
          this.showActionFeedback(this.error, 'error');
        }
        this.loading = false;
        this.setLoadingState(false);
        this.onRemovalCancelled();
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to remove user';
        this.showActionFeedback(this.error, 'error');
        this.loading = false;
        this.setLoadingState(false);
        this.onRemovalCancelled();
        console.error('Error removing user:', error);
      }
    });
  }

  private performBulkRemoval(reason: string): void {
    const userIds = Array.from(this.selectedUsers);
    const userType = this.getUserTypeFromTab(this.activeTab);

    this.setLoadingState(true, `Removing ${userIds.length} ${userType}...`);

    this.adminService.bulkRemoveUsers(userIds, userType, reason).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove users from local array
          this.users = this.users.filter(u => !this.selectedUsers.has(u._id));
          this.applyFiltersAndSort();
          this.clearSelection();

          this.showActionFeedback(`${userIds.length} ${userType} removed successfully`, 'success');
        } else {
          this.error = response.message || 'Failed to remove users';
          this.showActionFeedback(this.error, 'error');
        }
        this.loading = false;
        this.setLoadingState(false);
        this.onRemovalCancelled();
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to remove users';
        this.showActionFeedback(this.error, 'error');
        this.loading = false;
        this.setLoadingState(false);
        this.onRemovalCancelled();
        console.error('Error removing users:', error);
      }
    });
  }

  // Utility methods
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string | Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  }

  getUserStatusBadgeClass(user: User): string {
    if (user.isRootAdmin) return 'badge-root-admin';
    if (!user.isActive) return 'badge-inactive';

    switch (user.role) {
      case 'patient': return 'badge-patient';
      case 'doctor': return 'badge-doctor';
      case 'hospital': return 'badge-hospital';
      case 'admin': return 'badge-admin';
      default: return 'badge-default';
    }
  }

  getUserStatusText(user: User): string {
    if (user.isRootAdmin) return 'Root Admin';
    if (!user.isActive) return 'Inactive';
    return user.isActive ? 'Active' : 'Inactive';
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return 'fas fa-sort';
    return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  getSelectedCount(): number {
    return this.selectedUsers.size;
  }

  refreshData(): void {
    this.refreshing = true;
    this.clearSelection();
    this.showActionFeedback('Refreshing data...', 'info');

    setTimeout(() => {
      this.loadUsers();
      this.refreshing = false;
    }, 500); // Small delay to show the refresh animation
  }

  getEndItemNumber(): number {
    return Math.min(this.pagination.currentPage * this.pagination.itemsPerPage, this.pagination.totalItems);
  }

  // Admin management actions
  openAddAdminModal(): void {
    if (!this.canManageAdmins()) {
      return;
    }
    this.showAddAdminModal = true;
  }

  onAdminAdded(data: { admin: any; message: string }): void {
    console.log('New admin added:', data.admin);

    // If we're currently viewing the admins tab, refresh the data
    if (this.activeTab === 'admins') {
      this.loadUsers();
    }

    this.showActionFeedback(data.message, 'success');
    this.showAddAdminModal = false;
  }

  onAddAdminCancelled(): void {
    this.showAddAdminModal = false;
  }

  // Admin-specific methods
  removeAdmin(admin: User): void {
    if (!this.canRemoveAdmin(admin)) {
      return;
    }
    this.removeUser(admin);
  }

  canRemoveAdmin(admin: User): boolean {
    // Root admin cannot be removed
    if (admin.isRootAdmin) {
      return false;
    }

    // Only root admin can remove other admins
    if (!this.isRootAdmin) {
      return false;
    }

    return true;
  }

  getAdminTypeText(admin: User): string {
    if (admin.isRootAdmin) {
      return 'Root Admin';
    }
    return 'Regular Admin';
  }

  getAdminTypeClass(admin: User): string {
    if (admin.isRootAdmin) {
      return 'admin-type-root';
    }
    return 'admin-type-regular';
  }

  getAdminCreationInfo(admin: User): string {
    if (admin.isRootAdmin) {
      return 'System Admin';
    }
    return admin.createdBy ? `Created by Admin` : 'Unknown';
  }

  getAdminPermissionsSummary(admin: User): string {
    if (admin.isRootAdmin) {
      return 'Full administrative access';
    }

    if (admin.permissions && admin.permissions.length > 0) {
      const resources = admin.permissions.map(p => p.resource).join(', ');
      return `Can manage: ${resources}`;
    }

    return 'Standard admin permissions';
  }

  formatLastActivity(admin: User): string {
    if (!admin.lastLogin) {
      return 'Never logged in';
    }

    const lastLogin = new Date(admin.lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return this.formatDate(admin.lastLogin);
    }
  }

  getActivityStatusClass(admin: User): string {
    if (!admin.lastLogin) {
      return 'activity-never';
    }

    const lastLogin = new Date(admin.lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return 'activity-recent';
    } else if (diffDays <= 7) {
      return 'activity-moderate';
    } else if (diffDays <= 30) {
      return 'activity-old';
    } else {
      return 'activity-very-old';
    }
  }

  isAdminActive(admin: User): boolean {
    if (!admin.lastLogin) {
      return false;
    }

    const lastLogin = new Date(admin.lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays <= 30; // Consider active if logged in within 30 days
  }
}