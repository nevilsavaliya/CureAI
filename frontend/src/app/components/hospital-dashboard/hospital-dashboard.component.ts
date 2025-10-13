import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HospitalService } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';

interface ApiRequest {
  patientEmail: string;
  timestamp: Date;
  status: 'success' | 'error';
  responseTime?: number;
}

interface ApiUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  successRate: number;
  remainingRequests: number;
  rateLimit: number;
}

@Component({
  selector: 'app-hospital-dashboard',
  templateUrl: './hospital-dashboard.component.html',
  styleUrls: ['./hospital-dashboard.component.css']
})
export class HospitalDashboardComponent implements OnInit, OnDestroy {
  hospitalName: string = '';
  loading: boolean = true;
  
  // Hospital data
  hospital: any = null;
  
  // API Credentials
  apiKey: string = '';
  apiSecret: string = '';
  showApiSecret: boolean = false;
  
  // API Usage Statistics
  apiUsageStats: ApiUsageStats = {
    totalRequests: 0,
    requestsToday: 0,
    requestsThisWeek: 0,
    requestsThisMonth: 0,
    averageResponseTime: 0,
    successRate: 100,
    remainingRequests: 100,
    rateLimit: 100
  };
  
  // Recent API Requests
  recentApiRequests: ApiRequest[] = [];
  
  // Copy feedback
  apiKeyCopied: boolean = false;
  apiSecretCopied: boolean = false;

  constructor(
    public authService: AuthService,
    private hospitalService: HospitalService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.hospitalName = user.name;
    }
    
    this.loadHospitalData();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadHospitalData(): void {
    this.loading = true;
    
    // Get hospital profile
    // Note: This would need a backend endpoint to get current hospital's profile
    // For now, we'll simulate with stored data
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.hospital = user;
      
      // In a real implementation, fetch from backend
      // this.hospitalService.getHospitalProfile().subscribe(...)
      
      // Simulate API credentials (in real app, fetch from backend)
      this.apiKey = this.hospital.apiKey || 'HK_' + 'x'.repeat(32);
      this.apiSecret = '*'.repeat(64); // Never show real secret
      
      // Simulate API usage stats
      this.simulateApiUsageStats();
      
      // Simulate recent requests
      this.simulateRecentRequests();
    }
    
    this.loading = false;
  }

  simulateApiUsageStats(): void {
    // In real implementation, fetch from backend
    const totalRequests = this.hospital?.apiAccessCount || 0;
    
    this.apiUsageStats = {
      totalRequests: totalRequests,
      requestsToday: Math.floor(totalRequests * 0.1),
      requestsThisWeek: Math.floor(totalRequests * 0.3),
      requestsThisMonth: totalRequests,
      averageResponseTime: 245, // ms
      successRate: 98.5,
      remainingRequests: 100 - (totalRequests % 100),
      rateLimit: 100
    };
  }

  simulateRecentRequests(): void {
    // In real implementation, fetch from backend
    const now = new Date();
    const requests: ApiRequest[] = [
      {
        patientEmail: 'john.doe@example.com',
        timestamp: new Date(now.getTime() - 30 * 60000),
        status: 'success' as const,
        responseTime: 234
      },
      {
        patientEmail: 'jane.smith@example.com',
        timestamp: new Date(now.getTime() - 90 * 60000),
        status: 'success' as const,
        responseTime: 198
      },
      {
        patientEmail: 'bob.wilson@example.com',
        timestamp: new Date(now.getTime() - 150 * 60000),
        status: 'success' as const,
        responseTime: 312
      }
    ];
    this.recentApiRequests = requests.slice(0, this.hospital?.apiAccessCount || 0);
  }

  copyApiKey(): void {
    navigator.clipboard.writeText(this.apiKey).then(() => {
      this.apiKeyCopied = true;
      this.toastService.show('API Key copied to clipboard!', 'success');
      
      setTimeout(() => {
        this.apiKeyCopied = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy API Key:', err);
      this.toastService.show('Failed to copy API Key', 'error');
    });
  }

  copyApiSecret(): void {
    // In real implementation, this would require re-authentication
    // or fetch the actual secret from backend with proper security
    this.toastService.show('API Secret cannot be copied. Please refer to your verification email.', 'warning');
  }

  toggleApiSecretVisibility(): void {
    this.showApiSecret = !this.showApiSecret;
  }

  getUsagePercentage(): number {
    return ((this.apiUsageStats.rateLimit - this.apiUsageStats.remainingRequests) / this.apiUsageStats.rateLimit) * 100;
  }

  getUsageColor(): string {
    const percentage = this.getUsagePercentage();
    if (percentage < 50) return '#10b981'; // Green
    if (percentage < 80) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  goToApiDocs(): void {
    // Navigate to API documentation page
    this.router.navigate(['/hospital/api-docs']);
  }

  goToProfile(): void {
    // Navigate to profile management page
    // this.router.navigate(['/hospital/profile']);
    this.toastService.show('Profile management coming soon!', 'info');
  }

  refreshData(): void {
    this.loadHospitalData();
    this.toastService.show('Data refreshed successfully!', 'success');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/hospital/login']);
  }
}
