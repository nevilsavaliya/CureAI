import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

interface AuditLog {
  _id: string;
  adminId: {
    _id: string;
    name: string;
    email: string;
    isRootAdmin: boolean;
  };
  adminEmail: string;
  action: string;
  targetUserId?: string;
  targetUserType?: string;
  targetUserEmail?: string;
  details: {
    reason?: string;
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
    additionalData?: any;
    affectedRecords?: number;
    operationDuration?: number;
  };
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;
  timestamp: string;
}

interface AuditStatistics {
  summary: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    successRate: number;
    uniqueAdminCount: number;
    uniqueIPCount: number;
  };
  actionBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  hourlyActivity: Array<{
    _id: number;
    count: number;
  }>;
  topAdmins: Array<{
    _id: string;
    adminEmail: string;
    actionCount: number;
    lastActivity: string;
  }>;
  ipDistribution: Array<{
    ipAddress: string;
    count: number;
    uniqueAdminCount: number;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  // Make Math available in template
  Math = Math;
  
  // Current admin info
  currentAdmin: any;
  isRootAdmin: boolean = false;

  // Data
  auditLogs: AuditLog[] = [];
  statistics: AuditStatistics | null = null;
  
  // Loading states
  loading: boolean = false;
  statisticsLoading: boolean = false;
  exportLoading: boolean = false;
  error: string = '';

  // Filters
  filters = {
    startDate: '',
    endDate: '',
    adminId: '',
    adminEmail: '',
    action: [] as string[],
    targetUserType: '',
    targetUserEmail: '',
    ipAddress: '',
    status: '',
    searchTerm: ''
  };

  // Pagination
  pagination: PaginationInfo = {
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  };

  // Sorting
  sortBy: string = 'timestamp';
  sortOrder: string = 'desc';

  // UI state
  showFilters: boolean = false;
  showStatistics: boolean = false;
  showSummaryReport: boolean = false;
  selectedLogs: Set<string> = new Set();

  // Available filter options
  availableActions = [
    'USER_REMOVED',
    'USER_RESTORED', 
    'ADMIN_ADDED',
    'ADMIN_REMOVED',
    'USER_UPDATED',
    'PERMISSION_CHANGED',
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'PASSWORD_CHANGED',
    'ACCOUNT_LOCKED',
    'BULK_USER_OPERATION',
    'DATA_EXPORT',
    'SYSTEM_ACCESS'
  ];

  availableUserTypes = ['patient', 'doctor', 'hospital', 'admin'];
  availableStatuses = ['success', 'failed', 'partial'];

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

    // Only root admin can access audit logs
    if (!this.isRootAdmin) {
      this.error = 'Access denied. Only root admin can view audit logs.';
      return;
    }

    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.filters.startDate = startDate.toISOString().split('T')[0];
    this.filters.endDate = endDate.toISOString().split('T')[0];

    // Load initial data
    this.loadAuditLogs();
    this.loadStatistics();
  }

  // Data loading methods
  loadAuditLogs(): void {
    this.loading = true;
    this.error = '';

    const requestFilters = this.buildRequestFilters();

    this.adminService.getAuditLogs(requestFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.auditLogs = response.logs || [];
          this.pagination = response.pagination || this.pagination;
        } else {
          this.error = response.message || 'Failed to load audit logs';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load audit logs';
        this.loading = false;
        console.error('Error loading audit logs:', error);
      }
    });
  }

  loadStatistics(): void {
    this.statisticsLoading = true;

    const statisticsFilters = {
      startDate: this.filters.startDate,
      endDate: this.filters.endDate
    };

    this.adminService.getAuditStatistics(statisticsFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.statistics = response.statistics;
        } else {
          console.error('Failed to load audit statistics:', response.message);
        }
        this.statisticsLoading = false;
      },
      error: (error) => {
        console.error('Error loading audit statistics:', error);
        this.statisticsLoading = false;
      }
    });
  }

  private buildRequestFilters(): any {
    const requestFilters: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      includeDetails: true
    };

    // Add non-empty filters
    if (this.filters.startDate) {
      requestFilters.startDate = this.filters.startDate;
    }
    if (this.filters.endDate) {
      requestFilters.endDate = this.filters.endDate;
    }
    if (this.filters.adminId) {
      requestFilters.adminId = this.filters.adminId;
    }
    if (this.filters.adminEmail) {
      requestFilters.adminEmail = this.filters.adminEmail;
    }
    if (this.filters.action.length > 0) {
      requestFilters.action = this.filters.action;
    }
    if (this.filters.targetUserType) {
      requestFilters.targetUserType = this.filters.targetUserType;
    }
    if (this.filters.targetUserEmail) {
      requestFilters.targetUserEmail = this.filters.targetUserEmail;
    }
    if (this.filters.ipAddress) {
      requestFilters.ipAddress = this.filters.ipAddress;
    }
    if (this.filters.status) {
      requestFilters.status = this.filters.status;
    }
    if (this.filters.searchTerm) {
      requestFilters.searchTerm = this.filters.searchTerm;
    }

    return requestFilters;
  }

  // Filter methods
  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadAuditLogs();
    this.loadStatistics();
  }

  onSearchChange(): void {
    this.debounceSearch();
  }

  private debounceSearch = this.debounce(() => {
    this.pagination.page = 1;
    this.loadAuditLogs();
  }, 500);

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

  clearFilters(): void {
    // Reset to default date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.filters = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      adminId: '',
      adminEmail: '',
      action: [],
      targetUserType: '',
      targetUserEmail: '',
      ipAddress: '',
      status: '',
      searchTerm: ''
    };

    this.pagination.page = 1;
    this.loadAuditLogs();
    this.loadStatistics();
  }

  toggleActionFilter(action: string): void {
    const index = this.filters.action.indexOf(action);
    if (index > -1) {
      this.filters.action.splice(index, 1);
    } else {
      this.filters.action.push(action);
    }
    this.onFilterChange();
  }

  isActionSelected(action: string): boolean {
    return this.filters.action.includes(action);
  }

  // Sorting methods
  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.loadAuditLogs();
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return 'fas fa-sort';
    return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // Pagination methods
  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.pages) {
      this.pagination.page = page;
      this.loadAuditLogs();
    }
  }

  changePageSize(event: any): void {
    const size = +event.target.value;
    this.pagination.limit = size;
    this.pagination.page = 1;
    this.loadAuditLogs();
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

  // Export methods
  exportLogs(format: string = 'csv'): void {
    this.exportLoading = true;

    const exportFilters = this.buildRequestFilters();
    exportFilters.maxRecords = 10000; // Limit export size

    this.adminService.exportAuditLogs(exportFilters, format).subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `audit_logs_${timestamp}.${format}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        this.exportLoading = false;
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.exportLoading = false;
      }
    });
  }

  // Selection methods
  toggleLogSelection(logId: string): void {
    if (this.selectedLogs.has(logId)) {
      this.selectedLogs.delete(logId);
    } else {
      this.selectedLogs.add(logId);
    }
  }

  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedLogs.clear();
    } else {
      this.auditLogs.forEach(log => this.selectedLogs.add(log._id));
    }
  }

  isLogSelected(logId: string): boolean {
    return this.selectedLogs.has(logId);
  }

  isAllSelected(): boolean {
    return this.auditLogs.length > 0 && 
           this.auditLogs.every(log => this.selectedLogs.has(log._id));
  }

  isPartiallySelected(): boolean {
    const selectedCount = this.auditLogs.filter(log => this.selectedLogs.has(log._id)).length;
    return selectedCount > 0 && selectedCount < this.auditLogs.length;
  }

  getSelectedCount(): number {
    return this.selectedLogs.size;
  }

  // Utility methods
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  getCurrentDate(): Date {
    return new Date();
  }

  getStartDate(): Date | null {
    return this.filters.startDate ? new Date(this.filters.startDate) : null;
  }

  getEndDate(): Date | null {
    return this.filters.endDate ? new Date(this.filters.endDate) : null;
  }

  formatDuration(duration: number | undefined): string {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  }

  getActionBadgeClass(action: string): string {
    const actionClasses: { [key: string]: string } = {
      'USER_REMOVED': 'badge-danger',
      'USER_RESTORED': 'badge-success',
      'ADMIN_ADDED': 'badge-info',
      'ADMIN_REMOVED': 'badge-warning',
      'LOGIN_SUCCESS': 'badge-success',
      'LOGIN_FAILED': 'badge-danger',
      'BULK_USER_OPERATION': 'badge-warning',
      'DATA_EXPORT': 'badge-info',
      'SYSTEM_ACCESS': 'badge-secondary'
    };
    return actionClasses[action] || 'badge-primary';
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'success': 'badge-success',
      'failed': 'badge-danger',
      'partial': 'badge-warning'
    };
    return statusClasses[status] || 'badge-secondary';
  }

  getUserTypeBadgeClass(userType: string): string {
    const typeClasses: { [key: string]: string } = {
      'patient': 'badge-patient',
      'doctor': 'badge-doctor',
      'hospital': 'badge-hospital',
      'admin': 'badge-admin'
    };
    return typeClasses[userType] || 'badge-secondary';
  }

  getActionDescription(log: AuditLog): string {
    const descriptions: { [key: string]: string } = {
      'USER_REMOVED': 'User account removed',
      'USER_RESTORED': 'User account restored',
      'ADMIN_ADDED': 'New admin added',
      'ADMIN_REMOVED': 'Admin removed',
      'USER_UPDATED': 'User information updated',
      'PERMISSION_CHANGED': 'User permissions changed',
      'LOGIN_SUCCESS': 'Successful login',
      'LOGIN_FAILED': 'Failed login attempt',
      'PASSWORD_CHANGED': 'Password changed',
      'ACCOUNT_LOCKED': 'Account locked',
      'BULK_USER_OPERATION': 'Bulk user operation',
      'DATA_EXPORT': 'Data exported',
      'SYSTEM_ACCESS': 'System access'
    };
    return descriptions[log.action] || log.action;
  }

  getAdminDisplayName(log: AuditLog): string {
    if (log.adminId) {
      return log.adminId.name || log.adminEmail;
    }
    return log.adminEmail;
  }

  isSystemAction(log: AuditLog): boolean {
    return log.adminEmail === 'system@automated' || log.adminId?._id === 'system';
  }

  // UI toggle methods
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleStatistics(): void {
    this.showStatistics = !this.showStatistics;
    if (this.showStatistics && !this.statistics) {
      this.loadStatistics();
    }
  }

  // Refresh data
  refreshData(): void {
    this.selectedLogs.clear();
    this.loadAuditLogs();
    this.loadStatistics();
  }

  // Statistics helper methods
  getSuccessRate(): number {
    return this.statistics?.summary.successRate || 0;
  }

  getTopActions(): Array<{_id: string, count: number}> {
    return this.statistics?.actionBreakdown.slice(0, 5) || [];
  }

  getActivityPeakHour(): number {
    if (!this.statistics?.hourlyActivity) return 0;
    
    const peak = this.statistics.hourlyActivity.reduce((max, current) => 
      current.count > max.count ? current : max
    );
    
    return peak._id;
  }

  formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  // Date range presets
  setDateRange(days: number): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    this.filters.startDate = startDate.toISOString().split('T')[0];
    this.filters.endDate = endDate.toISOString().split('T')[0];
    
    this.onFilterChange();
  }

  // Summary report methods
  generateSummaryReport(): void {
    this.showSummaryReport = true;
  }

  closeSummaryReport(): void {
    this.showSummaryReport = false;
  }

  exportSummaryReport(): void {
    if (!this.statistics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: {
        startDate: this.filters.startDate,
        endDate: this.filters.endDate
      },
      summary: this.statistics.summary,
      actionBreakdown: this.statistics.actionBreakdown,
      topAdmins: this.statistics.topAdmins,
      ipDistribution: this.statistics.ipDistribution,
      hourlyActivity: this.statistics.hourlyActivity
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `audit_summary_report_${timestamp}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  // Enhanced export with filtered data
  exportFilteredLogs(format: string = 'csv'): void {
    this.exportLoading = true;

    // Use current filters for export
    const exportFilters = this.buildRequestFilters();
    exportFilters.maxRecords = 50000; // Higher limit for filtered export
    delete exportFilters.page; // Remove pagination for export
    delete exportFilters.limit;

    this.adminService.exportAuditLogs(exportFilters, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filterSuffix = this.getFilterSuffix();
        link.download = `audit_logs_${filterSuffix}_${timestamp}.${format}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        this.exportLoading = false;
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.exportLoading = false;
      }
    });
  }

  private getFilterSuffix(): string {
    const parts: string[] = [];
    
    if (this.filters.action.length > 0) {
      parts.push(`actions_${this.filters.action.length}`);
    }
    if (this.filters.targetUserType) {
      parts.push(`type_${this.filters.targetUserType}`);
    }
    if (this.filters.status) {
      parts.push(`status_${this.filters.status}`);
    }
    if (this.filters.adminEmail) {
      parts.push('admin_filtered');
    }
    
    return parts.length > 0 ? parts.join('_') : 'all';
  }

  // Retention policy info
  getRetentionInfo(): string {
    return 'Audit logs are retained for 12 months. Older logs are automatically archived and purged after 2 years.';
  }

  getRetentionDetails(): any {
    return {
      retentionPeriod: '12 months',
      archivePeriod: '2 years',
      cleanupFrequency: 'Daily',
      lastCleanup: 'System managed',
      criticalLogsArchived: 'Admin management actions are archived before deletion'
    };
  }
}