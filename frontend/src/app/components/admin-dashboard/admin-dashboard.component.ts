import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  userName: string = '';
  
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

  // User management
  users: any[] = [];
  loadingUsers: boolean = false;
  usersError: string = '';
  selectedRole: string = '';
  searchTerm: string = '';
  
  // View state
  activeView: string = 'metrics'; // 'metrics' or 'users'

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name;
    }
    
    this.loadMetrics();
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

  switchView(view: string): void {
    this.activeView = view;
    if (view === 'users' && this.users.length === 0) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.usersError = '';
    
    this.adminService.getUsers(this.selectedRole, this.searchTerm).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.users;
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
    this.loadUsers();
  }

  clearFilters(): void {
    this.selectedRole = '';
    this.searchTerm = '';
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

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
