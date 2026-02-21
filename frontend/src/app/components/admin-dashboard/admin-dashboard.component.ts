import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { HospitalService, Hospital as BaseHospital } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';

interface Hospital extends Omit<BaseHospital, 'address'> {
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  // Mobile navigation
  mobileSidebarOpen: boolean = false;

  userName: string = '';
  
  // Expose Math for template
  Math = Math;

  // Metrics
  metrics: any = {
    totalPatients: 0,
    totalDoctors: 0,
    totalAdmins: 0,
    totalRegisteredUsers: 0,
    totalSymptoms: 0,
    totalPredictions: 0,
    activeUsers: 0
  };
  loadingMetrics: boolean = true;
  metricsError: string = '';

  // Hospital statistics
  hospitalStats: any = {
    totalHospitals: 0,
    pendingHospitals: 0,
    verifiedHospitals: 0,
    rejectedHospitals: 0,
    activeHospitals: 0,
    totalApiAccess: 0,
    recentlyActiveHospitals: 0
  };
  loadingHospitalStats: boolean = true;
  hospitalStatsError: string = '';

  // User management
  users: any[] = [];
  loadingUsers: boolean = false;
  usersError: string = '';
  selectedRole: string = '';
  searchTerm: string = '';
  
  // User pagination
  userCurrentPage: number = 1;
  userItemsPerPage: number = 10;
  userTotalPages: number = 1;
  userTotalItems: number = 0;

  // Hospital management
  pendingHospitalsCount: number = 0;
  hospitals: Hospital[] = [];
  filteredHospitals: Hospital[] = [];
  loadingHospitals: boolean = false;
  hospitalsError: string = '';
  selectedHospitalStatus: string = '';
  hospitalSearchTerm: string = '';
  verifyingHospitalId: string = '';
  rejectingHospitalId: string = '';
  revokingHospitalId: string = '';
  selectedHospital: Hospital | null = null;
  showHospitalDetailsModal: boolean = false;
  showHospitalRejectModal: boolean = false;
  rejectionReason: string = '';

  // Performance monitoring
  performanceData: any = {
    lastUpdated: new Date(),
    api: {
      totalRequests: 0,
      requestsPerSecond: 0,
      avgResponseTime: 0,
      errorRate: 0
    },
    system: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      totalMemory: 0,
      freeMemory: 0,
      uptime: 0
    },
    database: {
      connections: 0,
      avgQueryTime: 0,
      queriesPerSecond: 0,
      size: 0
    },
    network: {
      activeUsers: 0,
      bandwidth: 0,
      avgPayloadSize: 0,
      totalDataTransfer: 0
    }
  };
  systemStatus: any = { overall: 'healthy' };
  chartData: any = {
    responseTime: [],
    maxResponseTime: 1000
  };
  selectedTimeRange: string = '24h';
  selectedLogLevel: string = 'all';
  filteredLogs: any[] = [];
  loadingLogs: boolean = false;
  performanceAlerts: any[] = [];
  loadingPerformance: boolean = false;
  performanceError: string = '';

  // View state
  activeView: string = 'metrics'; // 'metrics', 'users', 'hospitals', 'performance', or 'add-admin'

  // User management metrics
  userManagementStats: any = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    recentRemovals: 0,
    pendingRestorations: 0,
    adminCount: 0,
    rootAdminCount: 0
  };
  loadingUserManagementStats: boolean = false;
  userManagementStatsError: string = '';

  // Current admin info for user management
  currentAdminInfo: any = null;
  isRootAdmin: boolean = false;

  // Add Admin functionality
  newAdmin: any = {
    name: '',
    email: '',
    password: '',
    role: 'admin'
  };
  creatingAdmin: boolean = false;
  admins: any[] = [];
  loadingAdmins: boolean = false;
  adminsError: string = '';
  removingAdminId: string = '';
  currentAdminId: string = '';

  // User management actions
  removingUserId: string = '';
  restoringUserId: string = '';
  selectedUser: any = null;
  showUserDetailsModal: boolean = false;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private hospitalService: HospitalService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name;
      this.currentAdminInfo = user;
      this.currentAdminId = user.id;
      this.isRootAdmin = user.email === 'admin@gmail.com';
    }

    // Refresh admin data in AdminService
    this.adminService.refreshCurrentAdmin();

    // Set default view to overview
    this.activeView = 'overview';

    this.loadMetrics();
    this.loadPendingHospitalsCount();
    this.loadHospitalStatistics();
    this.loadUserManagementStatistics();
  }

  getViewTitle(): string {
    switch (this.activeView) {
      case 'overview':
        return 'Dashboard Overview';
      case 'metrics':
        return 'Platform Metrics';
      case 'users':
        return 'User Management';
      case 'hospitals':
        return 'Hospital Management';
      case 'audit-logs':
        return 'Audit Logs';
      case 'add-admin':
        return 'Add Administrator';
      case 'performance':
        return 'Performance Monitor';
      default:
        return 'Admin Dashboard';
    }
  }

  getViewSubtitle(): string {
    switch (this.activeView) {
      case 'overview':
        return 'Monitor key metrics and system health';
      case 'metrics':
        return 'View detailed platform statistics';
      case 'users':
        return 'Manage patients, doctors, and administrators';
      case 'hospitals':
        return 'Review and verify hospital registrations';
      case 'audit-logs':
        return 'Track administrative actions and system events';
      case 'add-admin':
        return 'Create new administrator accounts';
      case 'performance':
        return 'Monitor system performance and health';
      default:
        return '';
    }
  }

  loadMetrics(): void {
    this.loadingMetrics = true;
    this.metricsError = '';

    this.adminService.getMetrics().subscribe({
      next: (response) => {
        if (response.success) {
          this.metrics = response;
        }
        this.loadingMetrics = false;
      },
      error: (error) => {
        this.metricsError = error.error?.message || 'Failed to load metrics';
        this.loadingMetrics = false;
      }
    });
  }

  loadPendingHospitalsCount(): void {
    this.hospitalService.getPendingHospitalsCount().subscribe({
      next: (response) => {
        if (response.success && response.count !== undefined) {
          this.pendingHospitalsCount = response.count;
        }
      },
      error: (error) => {
        console.error('Failed to load pending hospitals count:', error);
        // Silently fail - don't show error to user for this non-critical feature
      }
    });
  }

  loadHospitalStatistics(): void {
    this.loadingHospitalStats = true;
    this.hospitalStatsError = '';

    this.hospitalService.getHospitalStatistics().subscribe({
      next: (response) => {
        if (response.success && response.statistics) {
          this.hospitalStats = response.statistics;
        }
        this.loadingHospitalStats = false;
      },
      error: (error) => {
        this.hospitalStatsError = error.error?.message || 'Failed to load hospital statistics';
        this.loadingHospitalStats = false;
        console.error('Failed to load hospital statistics:', error);
      }
    });
  }

  loadUserManagementStatistics(): void {
    this.loadingUserManagementStats = true;
    this.userManagementStatsError = '';

    // Load user management statistics
    this.adminService.getUsers('all', { includeStats: true }).subscribe({
      next: (response) => {
        if (response.success) {
          // Calculate user management statistics
          const allUsers = response.users || [];
          this.userManagementStats = {
            totalUsers: allUsers.length,
            activeUsers: allUsers.filter((u: any) => u.isActive).length,
            inactiveUsers: allUsers.filter((u: any) => !u.isActive).length,
            adminCount: allUsers.filter((u: any) => u.role === 'admin').length,
            rootAdminCount: allUsers.filter((u: any) => u.isRootAdmin).length,
            recentRemovals: 0, // Will be populated from removed users endpoint
            pendingRestorations: 0 // Will be populated from removed users endpoint
          };

          // Load removed users statistics if root admin
          if (this.isRootAdmin) {
            this.loadRemovedUsersStatistics();
          }
        }
        this.loadingUserManagementStats = false;
      },
      error: (error) => {
        this.userManagementStatsError = error.error?.message || 'Failed to load user management statistics';
        this.loadingUserManagementStats = false;
        console.error('Failed to load user management statistics:', error);
      }
    });
  }

  loadRemovedUsersStatistics(): void {
    if (!this.isRootAdmin) return;

    this.adminService.getRemovedUsers({ isRestored: false }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const removedUsers = response.data.users || [];
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          this.userManagementStats.recentRemovals = removedUsers.filter((u: any) =>
            new Date(u.removedAt) > thirtyDaysAgo
          ).length;
          this.userManagementStats.pendingRestorations = removedUsers.length;
        }
      },
      error: (error) => {
        console.error('Failed to load removed users statistics:', error);
      }
    });
  }

  switchView(view: string): void {
    this.activeView = view;
    
    // Load data based on view
    if (view === 'users' && this.users.length === 0) {
      this.loadUsers();
    } else if (view === 'hospitals' && this.hospitals.length === 0) {
      this.loadHospitals();
    } else if (view === 'performance') {
      this.loadPerformanceData();
      this.loadSystemLogs();
      this.startPerformanceMonitoring();
    } else if (view === 'add-admin' && this.admins.length === 0) {
      this.loadAdmins();
    } else if (view === 'overview') {
      // Refresh overview data
      this.loadMetrics();
      this.loadHospitalStatistics();
    }
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.usersError = '';

    // Pass the role filter and search term properly
    const roleFilter = this.selectedRole || undefined; // Convert empty string to undefined
    const searchParams: any = {};
    
    if (this.searchTerm) {
      searchParams.search = this.searchTerm;
    }
    
    // Add pagination parameters
    searchParams.page = this.userCurrentPage;
    searchParams.limit = this.userItemsPerPage;

    this.adminService.getUsers(roleFilter, searchParams).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.users;
          
          // Extract pagination if present
          if (response.pagination) {
            this.userCurrentPage = response.pagination.page;
            this.userTotalPages = response.pagination.pages;
            this.userTotalItems = response.pagination.total;
            this.userItemsPerPage = response.pagination.limit;
          }
        }
        this.loadingUsers = false;
      },
      error: (error) => {
        this.usersError = error.error?.message || 'Failed to load users';
        this.loadingUsers = false;
      }
    });
  }

  filterUsers(): void {
    this.userCurrentPage = 1; // Reset to first page when filtering
    this.loadUsers();
  }

  clearFilters(): void {
    this.selectedRole = '';
    this.searchTerm = '';
    this.userCurrentPage = 1; // Reset to first page
    this.loadUsers();
  }

  getUserRoleBadgeClass(role: string): string {
    switch (role) {
      case 'patient':
        return 'badge-patient';
      case 'doctor':
        return 'badge-doctor';
      case 'admin':
        return 'badge-admin';
      default:
        return 'badge-default';
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  // Hospital Management Methods
  loadHospitals(): void {
    this.loadingHospitals = true;
    this.hospitalsError = '';

    this.hospitalService.getAllHospitals().subscribe({
      next: (response) => {
        if (response.success && response.hospitals) {
          this.hospitals = response.hospitals;
          this.filterHospitals();
        }
        this.loadingHospitals = false;
      },
      error: (error) => {
        this.hospitalsError = error.error?.message || 'Failed to load hospitals';
        this.loadingHospitals = false;
      }
    });
  }

  filterHospitals(): void {
    let filtered = [...this.hospitals];

    if (this.selectedHospitalStatus) {
      filtered = filtered.filter(hospital =>
        hospital.verificationStatus === this.selectedHospitalStatus
      );
    }

    if (this.hospitalSearchTerm) {
      const searchTerm = this.hospitalSearchTerm.toLowerCase();
      filtered = filtered.filter(hospital =>
        hospital.hospitalName.toLowerCase().includes(searchTerm) ||
        hospital.name.toLowerCase().includes(searchTerm) ||
        hospital.email.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredHospitals = filtered;
  }

  clearHospitalFilters(): void {
    this.selectedHospitalStatus = '';
    this.hospitalSearchTerm = '';
    this.filterHospitals();
  }

  getPendingHospitalsCount(): number {
    return this.hospitals.filter(h => h.verificationStatus === 'pending').length;
  }

  getVerifiedHospitalsCount(): number {
    return this.hospitals.filter(h => h.verificationStatus === 'verified').length;
  }

  getRejectedHospitalsCount(): number {
    return this.hospitals.filter(h => h.verificationStatus === 'rejected').length;
  }

  getHospitalStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge-pending';
      case 'verified':
        return 'badge-verified';
      case 'rejected':
        return 'badge-rejected';
      default:
        return 'badge-default';
    }
  }

  viewHospitalDetails(hospital: Hospital): void {
    this.selectedHospital = hospital;
    this.showHospitalDetailsModal = true;
  }

  closeHospitalDetailsModal(): void {
    this.showHospitalDetailsModal = false;
    this.selectedHospital = null;
  }

  verifyHospital(hospitalId: string): void {
    this.verifyingHospitalId = hospitalId;

    this.hospitalService.verifyHospital(hospitalId).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the hospital in the local array
          const hospital = this.hospitals.find(h => h._id === hospitalId);
          if (hospital) {
            hospital.verificationStatus = 'verified';
            hospital.isActive = true;
          }
          this.filterHospitals();
        }
        this.verifyingHospitalId = '';
      },
      error: (error) => {
        console.error('Failed to verify hospital:', error);
        this.verifyingHospitalId = '';
      }
    });
  }

  openHospitalRejectModal(hospital: Hospital): void {
    this.selectedHospital = hospital;
    this.rejectionReason = '';
    this.showHospitalRejectModal = true;
  }

  closeHospitalRejectModal(): void {
    this.showHospitalRejectModal = false;
    this.selectedHospital = null;
    this.rejectionReason = '';
  }

  confirmHospitalReject(): void {
    if (!this.selectedHospital || !this.rejectionReason.trim()) {
      return;
    }

    this.rejectHospital(this.selectedHospital._id, this.rejectionReason);
    this.closeHospitalRejectModal();
  }

  rejectHospital(hospitalId: string, reason: string): void {
    this.rejectingHospitalId = hospitalId;

    this.hospitalService.rejectHospital(hospitalId, reason).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the hospital in the local array
          const hospital = this.hospitals.find(h => h._id === hospitalId);
          if (hospital) {
            hospital.verificationStatus = 'rejected';
            hospital.rejectionReason = reason;
          }
          this.filterHospitals();
        }
        this.rejectingHospitalId = '';
      },
      error: (error) => {
        console.error('Failed to reject hospital:', error);
        this.rejectingHospitalId = '';
      }
    });
  }

  revokeHospitalAccess(hospitalId: string): void {
    if (confirm('Are you sure you want to revoke access for this hospital?')) {
      this.revokingHospitalId = hospitalId;

      this.hospitalService.revokeHospitalAccess(hospitalId).subscribe({
        next: (response: any) => {
          if (response.success) {
            // Update the hospital in the local array
            const hospital = this.hospitals.find(h => h._id === hospitalId);
            if (hospital) {
              hospital.isActive = false;
            }
            this.filterHospitals();
          }
          this.revokingHospitalId = '';
        },
        error: (error: any) => {
          console.error('Failed to revoke hospital access:', error);
          this.revokingHospitalId = '';
        }
      });
    }
  }

  restoreHospitalAccess(hospitalId: string): void {
    if (confirm('Are you sure you want to restore API access for this hospital?')) {
      this.revokingHospitalId = hospitalId; // Reuse the same loading state

      this.hospitalService.restoreHospitalAccess(hospitalId).subscribe({
        next: (response: any) => {
          if (response.success) {
            // Update the hospital in the local array
            const hospital = this.hospitals.find(h => h._id === hospitalId);
            if (hospital) {
              hospital.isActive = true;
              hospital.rejectionReason = undefined; // Clear rejection reason
            }
            this.filterHospitals();
          }
          this.revokingHospitalId = '';
        },
        error: (error: any) => {
          console.error('Failed to restore hospital access:', error);
          this.revokingHospitalId = '';
        }
      });
    }
  }

  formatDateTime(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatDocumentType(type: string): string {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  getHospitalLocation(hospital: Hospital): string {
    if (!hospital.address) return 'N/A, N/A';
    const city = hospital.address.city || 'N/A';
    const state = hospital.address.state || 'N/A';
    return `${city}, ${state}`;
  }

  getHospitalAddress(hospital: Hospital): string {
    if (!hospital.address) return 'N/A';
    const parts = [
      hospital.address.street || '',
      hospital.address.city || '',
      hospital.address.state || '',
      hospital.address.zipCode || '',
      hospital.address.country || ''
    ].filter(part => part.trim());
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }

  // Performance Monitoring Methods
  loadPerformanceData(): void {
    this.loadingPerformance = true;
    this.performanceError = '';

    this.adminService.getPerformanceMetrics().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.performanceData = {
            ...this.performanceData,
            ...response.data,
            lastUpdated: new Date()
          };
          this.updateSystemStatus();
          this.updateChartData();
        }
        this.loadingPerformance = false;
      },
      error: (error: any) => {
        this.performanceError = error.error?.message || 'Failed to load performance data';
        this.loadingPerformance = false;
        console.error('Failed to load performance data:', error);
      }
    });
  }

  generateMockPerformanceData(): void {
    this.performanceData = {
      lastUpdated: new Date(),
      api: {
        totalRequests: Math.floor(Math.random() * 100000) + 50000,
        requestsPerSecond: Math.random() * 50 + 10,
        avgResponseTime: Math.random() * 200 + 50,
        errorRate: Math.random() * 5
      },
      system: {
        cpuUsage: Math.random() * 60 + 20,
        memoryUsage: Math.random() * 70 + 15,
        diskUsage: Math.random() * 50 + 30,
        totalMemory: 16 * 1024 * 1024 * 1024, // 16GB
        freeMemory: Math.random() * 8 * 1024 * 1024 * 1024 + 2 * 1024 * 1024 * 1024,
        uptime: Math.random() * 30 * 24 * 60 * 60 * 1000 // Up to 30 days
      },
      database: {
        connections: Math.floor(Math.random() * 50) + 10,
        avgQueryTime: Math.random() * 100 + 20,
        queriesPerSecond: Math.random() * 200 + 50,
        size: Math.random() * 5 * 1024 * 1024 * 1024 + 1024 * 1024 * 1024 // 1-6GB
      },
      network: {
        activeUsers: Math.floor(Math.random() * 500) + 100,
        bandwidth: Math.random() * 100 * 1024 * 1024 + 10 * 1024 * 1024, // 10-110 MB/s
        avgPayloadSize: Math.random() * 500 + 50,
        totalDataTransfer: Math.random() * 100 + 20
      }
    };
    this.updateSystemStatus();
    this.updateChartData();
  }

  updateSystemStatus(): void {
    const cpu = this.performanceData.system.cpuUsage;
    const memory = this.performanceData.system.memoryUsage;
    const errorRate = this.performanceData.api.errorRate;

    if (cpu > 90 || memory > 90 || errorRate > 10) {
      this.systemStatus.overall = 'critical';
    } else if (cpu > 70 || memory > 80 || errorRate > 5) {
      this.systemStatus.overall = 'warning';
    } else {
      this.systemStatus.overall = 'healthy';
    }
  }

  updateChartData(): void {
    // Generate mock chart data for demo
    const dataPoints = 24; // 24 hours
    this.chartData.responseTime = [];

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - (dataPoints - i));

      this.chartData.responseTime.push({
        timestamp: timestamp.toLocaleTimeString(),
        value: Math.random() * 500 + 50
      });
    }

    this.chartData.maxResponseTime = Math.max(...this.chartData.responseTime.map((p: any) => p.value));
  }

  loadSystemLogs(): void {
    this.loadingLogs = true;

    this.adminService.getSystemLogs(this.selectedLogLevel).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.filteredLogs = response.logs;
        }
        this.loadingLogs = false;
      },
      error: (error: any) => {
        this.loadingLogs = false;
        console.error('Failed to load system logs:', error);
        this.filteredLogs = [];
      }
    });
  }

  generateMockLogs(): void {
    const logLevels = ['info', 'warning', 'error'];
    const messages = [
      'User authentication successful',
      'Database connection established',
      'High memory usage detected',
      'API response time exceeded threshold',
      'Failed to connect to external service',
      'Cache cleared successfully',
      'Backup completed',
      'SSL certificate expires in 30 days'
    ];

    this.filteredLogs = [];
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - i * 5);

      this.filteredLogs.push({
        id: i,
        timestamp: timestamp,
        level: logLevels[Math.floor(Math.random() * logLevels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        details: Math.random() > 0.7 ? 'Additional error details here...' : null
      });
    }
    this.filterLogs();
  }

  filterLogs(): void {
    if (this.selectedLogLevel === 'all') {
      return;
    }
    this.filteredLogs = this.filteredLogs.filter(log => log.level === this.selectedLogLevel);
  }

  startPerformanceMonitoring(): void {
    // Refresh performance data every 30 seconds
    setInterval(() => {
      if (this.activeView === 'performance') {
        this.loadPerformanceData();
      }
    }, 30000);
  }

  dismissAlert(alertId: string): void {
    this.performanceAlerts = this.performanceAlerts.filter(alert => alert.id !== alertId);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Navigation methods
  navigateToUserManagement(): void {
    this.router.navigate(['/admin/users']);
  }

  canAccessUserManagement(): boolean {
    return this.adminService.isAdmin();
  }

  canAccessAdvancedUserManagement(): boolean {
    return this.adminService.isRootAdmin();
  }

  // Add Admin functionality
  loadAdmins(): void {
    if (!this.isRootAdmin) return;

    this.loadingAdmins = true;
    this.adminsError = '';

    this.adminService.getAdmins().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.admins = response.data.admins || [];
        }
        this.loadingAdmins = false;
      },
      error: (error) => {
        this.adminsError = error.error?.message || 'Failed to load administrators';
        this.loadingAdmins = false;
      }
    });
  }

  addAdmin(): void {
    if (!this.isRootAdmin) return;

    this.creatingAdmin = true;

    const adminData = {
      name: this.newAdmin.name,
      email: this.newAdmin.email,
      password: this.newAdmin.password
    };

    this.adminService.addAdmin(adminData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Administrator created successfully!');
          this.resetAdminForm();
          this.loadAdmins(); // Refresh the list
        }
        this.creatingAdmin = false;
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Failed to create administrator');
        this.creatingAdmin = false;
      }
    });
  }

  resetAdminForm(): void {
    this.newAdmin = {
      name: '',
      email: '',
      password: '',
      role: 'admin'
    };
  }

  removeAdmin(adminId: string): void {
    if (!this.isRootAdmin || adminId === this.currentAdminId) return;

    if (!confirm('Are you sure you want to remove this administrator?')) {
      return;
    }

    this.removingAdminId = adminId;

    this.adminService.removeUser(adminId, 'admin').subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Administrator removed successfully!');
          this.loadAdmins(); // Refresh the list
        }
        this.removingAdminId = '';
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Failed to remove administrator');
        this.removingAdminId = '';
      }
    });
  }

  // User management actions
  canRemoveUser(user: any): boolean {
    // Can't remove yourself
    if (user._id === this.currentAdminId) return false;

    // Root admin can remove anyone
    if (this.isRootAdmin) return true;

    // Regular admin can remove patients and doctors, but not other admins
    return user.role !== 'admin';
  }

  removeUser(userId: string, userType: string): void {
    if (!confirm(`Are you sure you want to remove this ${userType}?`)) {
      return;
    }

    this.removingUserId = userId;

    // Use the userType as-is (singular form)
    this.adminService.removeUser(userId, userType).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`${userType} removed successfully!`);
          this.loadUsers(); // Refresh the list
        } else {
          this.toastService.error(response.message || `Failed to remove ${userType}`);
        }
        this.removingUserId = '';
      },
      error: (error) => {
        console.error('Remove user error:', error);
        this.toastService.error(error.error?.message || `Failed to remove ${userType}`);
        this.removingUserId = '';
      }
    });
  }

  restoreUser(userId: string): void {
    if (!this.isRootAdmin) return;

    if (!confirm('Are you sure you want to restore this user?')) {
      return;
    }

    this.restoringUserId = userId;

    // We need to determine the user type from the user object
    const user = this.users.find(u => u._id === userId);
    const userType = user ? user.role : 'patient';

    this.adminService.restoreUser(userId, userType).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('User restored successfully!');
          this.loadUsers(); // Refresh the list
        }
        this.restoringUserId = '';
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Failed to restore user');
        this.restoringUserId = '';
      }
    });
  }

  viewUserDetails(user: any): void {
    this.selectedUser = user;
    this.showUserDetailsModal = true;
  }

  closeUserDetailsModal(): void {
    this.showUserDetailsModal = false;
    this.selectedUser = null;
  }

  /**
   * Toggle mobile sidebar
   */
  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  /**
   * Close mobile sidebar
   */
  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  /**
   * Switch view and close mobile sidebar
   */
  switchViewMobile(view: string): void {
    this.switchView(view);
    this.closeMobileSidebar();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // User pagination methods
  nextUserPage(): void {
    if (this.userCurrentPage < this.userTotalPages) {
      this.userCurrentPage++;
      this.loadUsers();
    }
  }

  previousUserPage(): void {
    if (this.userCurrentPage > 1) {
      this.userCurrentPage--;
      this.loadUsers();
    }
  }

  goToUserPage(page: number): void {
    if (page >= 1 && page <= this.userTotalPages) {
      this.userCurrentPage = page;
      this.loadUsers();
    }
  }

  getUserPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.userTotalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= this.userTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page with 2 pages on each side
      let startPage = Math.max(1, this.userCurrentPage - 2);
      let endPage = Math.min(this.userTotalPages, this.userCurrentPage + 2);
      
      // Adjust if we're near the start or end
      if (this.userCurrentPage <= 3) {
        endPage = maxPagesToShow;
      } else if (this.userCurrentPage >= this.userTotalPages - 2) {
        startPage = this.userTotalPages - maxPagesToShow + 1;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}
