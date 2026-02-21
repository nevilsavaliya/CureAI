import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HospitalService, Hospital, HospitalApiStats, ApiRequest } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

interface DashboardState {
  loading: boolean;
  hospital: Hospital | null;
  apiStats: HospitalApiStats | null;
  recentRequests: ApiRequest[];
  errors: {
    profile: string | null;
    stats: string | null;
    requests: string | null;
  };
}

@Component({
  selector: 'app-hospital-dashboard',
  templateUrl: './hospital-dashboard.component.html',
  styleUrls: ['./hospital-dashboard.component.css']
})
export class HospitalDashboardComponent implements OnInit, OnDestroy {
  // Dashboard state
  state: DashboardState = {
    loading: true,
    hospital: null,
    apiStats: null,
    recentRequests: [],
    errors: {
      profile: null,
      stats: null,
      requests: null
    }
  };

  // Loading states for individual sections
  loadingStates = {
    profile: false,
    stats: false,
    requests: false
  };

  // UI state
  showApiSecret: boolean = false;
  apiKeyCopied: boolean = false;
  apiSecretCopied: boolean = false;
  showLogoutConfirm: boolean = false;
  activeTab: 'overview' | 'credentials' | 'activity' = 'overview';
  
  // Action loading states
  actionLoading = {
    copyingApiKey: false,
    copyingApiSecret: false,
    loggingOut: false,
    refreshingAll: false
  };

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];
  
  // Auto-refresh settings
  private autoRefreshInterval: any;
  private readonly AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private isPageVisible: boolean = true;
  private hasShownInitialLoadSuccess: boolean = false;
  
  // Last updated timestamps
  lastUpdated = {
    profile: null as Date | null,
    stats: null as Date | null,
    requests: null as Date | null
  };

  constructor(
    public authService: AuthService,
    private hospitalService: HospitalService,
    private toastService: ToastService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.initializeDashboard();
    this.setupAutoRefresh();
    this.setupVisibilityListener();
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Clear auto-refresh interval
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    // Remove visibility listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Initialize dashboard with proper authentication check and data loading sequence
   */
  private initializeDashboard(): void {
    console.log('🚀 Initializing hospital dashboard...');
    
    // Check hospital authentication first
    const hospitalToken = localStorage.getItem('hospitalToken') || sessionStorage.getItem('hospitalToken');
    const hospitalDataStr = localStorage.getItem('hospitalData') || sessionStorage.getItem('hospitalData');
    
    console.log('🔍 Dashboard auth check:', {
      hasToken: !!hospitalToken,
      hasData: !!hospitalDataStr,
      tokenLength: hospitalToken?.length,
      dataLength: hospitalDataStr?.length
    });
    
    if (!hospitalToken || !hospitalDataStr) {
      console.log('❌ Dashboard: Missing hospital authentication data');
      this.handleAuthenticationError('Hospital authentication required. Please log in again.');
      return;
    }

    // Check if hospital token is expired
    if (this.isHospitalTokenExpired(hospitalToken)) {
      console.log('❌ Dashboard: Hospital token is expired');
      this.handleAuthenticationError('Your session has expired. Please log in again.');
      return;
    }
    
    console.log('✅ Dashboard: Authentication check passed, loading data...');

    // Start loading sequence
    this.state.loading = true;
    this.clearErrors();

    // Load data in sequence: profile first, then stats and requests
    this.loadHospitalProfile();
  }

  /**
   * Load hospital profile data
   */
  private loadHospitalProfile(): void {
    this.loadingStates.profile = true;
    this.state.errors.profile = null;

    const profileSub = this.hospitalService.getHospitalProfile().subscribe({
      next: (response) => {
        this.loadingStates.profile = false;
        
        if (response.success && response.hospital) {
          this.state.hospital = response.hospital;
          this.lastUpdated.profile = new Date();
          // After profile loads successfully, load other data
          this.loadApiUsageStats();
          this.loadRecentApiRequests();
        } else {
          this.handleProfileError({ message: response.message || 'Failed to load hospital profile' });
        }
      },
      error: (error) => {
        this.loadingStates.profile = false;
        this.handleProfileError(error);
      }
    });

    this.subscriptions.push(profileSub);
  }

  /**
   * Load API usage statistics
   */
  loadApiUsageStats(): void {
    this.loadingStates.stats = true;
    this.state.errors.stats = null;

    const statsSub = this.hospitalService.getApiUsageStats().subscribe({
      next: (response) => {
        this.loadingStates.stats = false;
        
        if (response.success && response.stats) {
          this.state.apiStats = response.stats;
          this.lastUpdated.stats = new Date();
        } else {
          this.handleStatsError({ message: response.message || 'Failed to load API usage statistics' });
        }
        
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.loadingStates.stats = false;
        this.handleStatsError(error);
        this.checkLoadingComplete();
      }
    });

    this.subscriptions.push(statsSub);
  }

  /**
   * Load recent API requests
   */
  loadRecentApiRequests(): void {
    this.loadingStates.requests = true;
    this.state.errors.requests = null;

    const requestsSub = this.hospitalService.getRecentApiRequests(1, 10).subscribe({
      next: (response) => {
        this.loadingStates.requests = false;
        
        console.log('📊 Recent API requests response:', {
          success: response.success,
          requestsCount: response.requests?.length,
          fullResponse: response,
          sampleRequest: response.requests?.[0]
        });
        
        if (response.success && response.requests) {
          // Log the timestamp format for debugging
          if (response.requests.length > 0) {
            const firstRequest = response.requests[0];
            console.log('🕐 Timestamp analysis:', {
              rawTimestamp: firstRequest.timestamp,
              timestampType: typeof firstRequest.timestamp,
              parsedDate: new Date(firstRequest.timestamp),
              isValidDate: !isNaN(new Date(firstRequest.timestamp).getTime())
            });
          }
          
          this.state.recentRequests = response.requests;
          this.lastUpdated.requests = new Date();
        } else {
          this.handleRequestsError({ message: response.message || 'Failed to load recent API requests' });
        }
        
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.loadingStates.requests = false;
        console.error('❌ Error loading recent requests:', error);
        this.handleRequestsError(error);
        this.checkLoadingComplete();
      }
    });

    this.subscriptions.push(requestsSub);
  }

  /**
   * Check if all data loading is complete
   */
  private checkLoadingComplete(): void {
    const allLoaded = !this.loadingStates.profile && 
                     !this.loadingStates.stats && 
                     !this.loadingStates.requests;
    
    if (allLoaded) {
      this.state.loading = false;
      
      // Show success message if initial load completed successfully (only once)
      if (this.state.hospital && !this.hasProfileError && !this.hasShownInitialLoadSuccess) {
        this.hasShownInitialLoadSuccess = true;
        
        const hasAnyData = this.state.apiStats || this.state.recentRequests.length > 0;
        if (hasAnyData) {
          this.toastService.success('Dashboard loaded successfully!');
        } else if (!this.hasStatsError && !this.hasRequestsError) {
          this.toastService.info('Dashboard loaded. No recent activity to display.');
        }
      }
    }
  }

  /**
   * Handle authentication errors with redirect to login
   */
  private handleAuthenticationError(message: string): void {
    console.log('❌ Dashboard authentication error:', message);
    console.trace('Authentication error stack trace');
    
    this.state.loading = false;
    this.clearErrors();
    
    // Show user-friendly error message
    this.toastService.error('Your session has expired. Please log in again.');
    
    // Clear hospital authentication data
    localStorage.removeItem('hospitalToken');
    localStorage.removeItem('hospitalData');
    sessionStorage.removeItem('hospitalToken');
    sessionStorage.removeItem('hospitalData');
    
    // Navigate to hospital login page
    setTimeout(() => {
      console.log('🔄 Redirecting to hospital login due to auth error');
      this.router.navigate(['/hospital/login']);
    }, 1000);
  }

  /**
   * Handle profile loading errors with retry mechanisms
   */
  private handleProfileError(error: any): void {
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case 'authentication':
        this.handleAuthenticationError('Authentication failed');
        return;
      
      case 'network':
        this.state.errors.profile = 'Network connection failed. Please check your internet connection.';
        this.toastService.error('Network error. Please check your connection and try again.');
        break;
      
      case 'server':
        this.state.errors.profile = 'Server temporarily unavailable. Please try again in a few moments.';
        break;
      
      case 'permission':
        this.state.errors.profile = 'Access denied. Please contact support if this persists.';
        this.toastService.error('Access denied. Please contact support.');
        break;
      
      default:
        this.state.errors.profile = error.message || 'Failed to load hospital profile. Please try again.';
        this.toastService.error('Failed to load profile data.');
    }
    
    this.checkLoadingComplete();
  }

  /**
   * Handle stats loading errors - don't provide fallback data
   */
  private handleStatsError(error: any): void {
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case 'authentication':
        this.handleAuthenticationError('Authentication failed');
        return;
      
      case 'network':
        this.state.errors.stats = 'Unable to load statistics due to network issues.';
        this.toastService.warning('Unable to load API statistics. Please check your connection.');
        break;
      
      case 'server':
        this.state.errors.stats = 'Statistics service temporarily unavailable.';
        this.toastService.warning('Statistics service is temporarily unavailable.');
        break;
      
      default:
        this.state.errors.stats = 'Unable to load API usage statistics.';
        this.toastService.error('Failed to load API statistics.');
    }
    
    // Don't provide fallback stats - show error instead
    this.state.apiStats = null;
    
    this.checkLoadingComplete();
  }

  /**
   * Handle requests loading errors - don't provide fallback data
   */
  private handleRequestsError(error: any): void {
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case 'authentication':
        this.handleAuthenticationError('Authentication failed');
        return;
      
      case 'network':
        this.state.errors.requests = 'Unable to load recent requests due to network issues.';
        this.toastService.warning('Unable to load recent requests. Please check your connection.');
        break;
      
      case 'server':
        this.state.errors.requests = 'Request logs service temporarily unavailable.';
        this.toastService.warning('Request logs service is temporarily unavailable.');
        break;
      
      default:
        this.state.errors.requests = 'Unable to load recent API requests.';
        this.toastService.error('Failed to load recent requests.');
    }
    
    // Don't provide fallback data - show error instead
    this.state.recentRequests = [];
    
    this.checkLoadingComplete();
  }

  /**
   * Categorize error types for appropriate handling
   */
  private categorizeError(error: any): 'authentication' | 'network' | 'server' | 'permission' | 'data' | 'unknown' {
    if (!error) return 'unknown';
    
    const message = error.message || error.toString().toLowerCase();
    
    // Authentication errors
    if (message.includes('authentication') || 
        message.includes('unauthorized') || 
        message.includes('token') ||
        message.includes('session expired') ||
        error.status === 401) {
      return 'authentication';
    }
    
    // Network errors
    if (message.includes('network') || 
        message.includes('connection') ||
        message.includes('timeout') ||
        error.status === 0 ||
        error.name === 'NetworkError') {
      return 'network';
    }
    
    // Permission errors
    if (message.includes('access denied') || 
        message.includes('forbidden') ||
        message.includes('permission') ||
        error.status === 403) {
      return 'permission';
    }
    
    // Server errors
    if (error.status >= 500 || 
        message.includes('server error') ||
        message.includes('internal error') ||
        message.includes('service unavailable')) {
      return 'server';
    }
    
    // Data errors
    if (message.includes('invalid') || 
        message.includes('malformed') ||
        message.includes('parse') ||
        error.status === 422) {
      return 'data';
    }
    
    return 'unknown';
  }

  /**
   * Provide fallback statistics data when real data fails to load
   */
  private provideFallbackStats(): void {
    this.state.apiStats = {
      totalRequests: 0,
      requestsToday: 0,
      requestsThisWeek: 0,
      requestsThisMonth: 0,
      averageResponseTime: 0,
      successRate: 0,
      remainingRequests: 100,
      rateLimit: 100,
      lastUpdated: new Date()
    };
  }

  /**
   * Clear all error states
   */
  private clearErrors(): void {
    this.state.errors = {
      profile: null,
      stats: null,
      requests: null
    };
  }

  /**
   * Retry loading profile data with exponential backoff
   */
  retryProfileLoad(attempt: number = 1): void {
    const maxAttempts = 3;
    const baseDelay = 1000; // 1 second
    
    if (attempt > maxAttempts) {
      this.toastService.error('Failed to load profile after multiple attempts. Please refresh the page.');
      return;
    }
    
    this.toastService.info(`Retrying... (Attempt ${attempt}/${maxAttempts})`);
    
    // Exponential backoff: 1s, 2s, 4s
    const delay = baseDelay * Math.pow(2, attempt - 1);
    
    setTimeout(() => {
      this.state.errors.profile = null;
      this.loadHospitalProfile();
    }, delay);
  }

  /**
   * Retry loading stats data
   */
  retryStatsLoad(): void {
    this.state.errors.stats = null;
    this.toastService.info('Retrying API statistics...');
    this.loadApiUsageStats();
    
    // Show success message after retry
    setTimeout(() => {
      if (!this.hasStatsError && !this.loadingStates.stats && this.state.apiStats) {
        this.toastService.success('API statistics loaded successfully!');
      }
    }, 2000);
  }

  /**
   * Retry loading requests data
   */
  retryRequestsLoad(): void {
    this.state.errors.requests = null;
    this.toastService.info('Retrying recent requests...');
    this.loadRecentApiRequests();
    
    // Show success message after retry
    setTimeout(() => {
      if (!this.hasRequestsError && !this.loadingStates.requests) {
        this.toastService.success('Recent requests loaded successfully!');
      }
    }, 2000);
  }

  copyApiKey(): void {
    const apiKey = this.state.hospital?.apiKey;
    if (!apiKey) {
      this.toastService.error('API Key not available. Please refresh the page and try again.');
      return;
    }

    if (this.actionLoading.copyingApiKey) {
      return; // Prevent multiple simultaneous copy attempts
    }

    // Show loading state
    this.actionLoading.copyingApiKey = true;

    navigator.clipboard.writeText(apiKey).then(() => {
      this.actionLoading.copyingApiKey = false;
      this.apiKeyCopied = true;
      this.toastService.success('API Key copied to clipboard successfully!');
      
      setTimeout(() => {
        this.apiKeyCopied = false;
      }, 2000);
    }).catch(err => {
      this.actionLoading.copyingApiKey = false;
      console.error('Failed to copy API Key:', err);
      this.toastService.error('Failed to copy API Key. Please try selecting and copying manually.');
      
      // Fallback: show the key in a prompt for manual copying
      try {
        prompt('Copy this API Key manually:', apiKey);
      } catch (promptError) {
        console.error('Prompt fallback failed:', promptError);
      }
    });
  }

  copyApiSecret(): void {
    if (this.actionLoading.copyingApiSecret) {
      return; // Prevent multiple attempts
    }

    this.actionLoading.copyingApiSecret = true;
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      this.actionLoading.copyingApiSecret = false;
      // In real implementation, this would require re-authentication
      // or fetch the actual secret from backend with proper security
      this.toastService.warning('API Secret cannot be copied for security reasons. Please refer to your verification email or contact support if you need to regenerate it.');
    }, 500);
  }

  toggleApiSecretVisibility(): void {
    this.showApiSecret = !this.showApiSecret;
  }

  getUsagePercentage(): number {
    if (!this.state.apiStats) return 0;
    return ((this.state.apiStats.rateLimit - this.state.apiStats.remainingRequests) / this.state.apiStats.rateLimit) * 100;
  }

  getUsageColor(): string {
    const percentage = this.getUsagePercentage();
    if (percentage < 50) return '#10b981'; // Green
    if (percentage < 80) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  formatTimestamp(timestamp: Date | string | number): string {
    if (!timestamp) return 'Unknown';
    
    try {
      const now = new Date();
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const diff = now.getTime() - date.getTime();
      
      // If diff is negative, the date is in the future
      if (diff < 0) {
        return 'Just now';
      }
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (seconds < 60) return 'Just now';
      if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
      
      // For dates older than 30 days, show the actual date
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid date';
    }
  }

  goToApiDocs(): void {
    // Navigate to API documentation page
    this.router.navigate(['/hospital/api-docs']);
  }

  goToProfile(): void {
    // Navigate to profile management page
    // this.router.navigate(['/hospital/profile']);
    this.toastService.info('Profile management feature is coming soon! You can currently view your profile information on this dashboard.');
  }

  /**
   * Manual refresh of all dashboard data
   */
  refreshData(): void {
    if (this.actionLoading.refreshingAll) {
      return; // Prevent multiple simultaneous refreshes
    }

    this.actionLoading.refreshingAll = true;
    this.toastService.info('Refreshing dashboard data...');
    this.clearErrors();
    this.initializeDashboard();
    
    // Show success message after a delay to allow data to load
    setTimeout(() => {
      this.actionLoading.refreshingAll = false;
      if (!this.hasProfileError && !this.isLoading) {
        this.toastService.success('Dashboard data refreshed successfully!');
      } else if (this.hasProfileError) {
        this.toastService.warning('Some data could not be refreshed. Please check your connection.');
      }
    }, 3000);
  }

  /**
   * Refresh only API usage statistics
   */
  refreshStats(): void {
    if (this.state.hospital) {
      this.toastService.info('Refreshing API statistics...');
      this.state.errors.stats = null;
      this.loadApiUsageStats();
      
      // Show success message after stats load
      setTimeout(() => {
        if (!this.hasStatsError && !this.loadingStates.stats) {
          this.toastService.success('API statistics updated!');
        }
      }, 1500);
    } else {
      this.toastService.warning('Please wait for the dashboard to fully load before refreshing statistics.');
    }
  }

  /**
   * Refresh only recent API requests
   */
  refreshRequests(): void {
    if (this.state.hospital) {
      this.toastService.info('Refreshing recent requests...');
      this.state.errors.requests = null;
      this.loadRecentApiRequests();
      
      // Show success message after requests load
      setTimeout(() => {
        if (!this.hasRequestsError && !this.loadingStates.requests) {
          this.toastService.success('Recent requests updated!');
        }
      }, 1500);
    } else {
      this.toastService.warning('Please wait for the dashboard to fully load before refreshing requests.');
    }
  }

  /**
   * Setup automatic data refresh
   */
  private setupAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
      // Only auto-refresh if page is visible and hospital is authenticated
      const hospitalToken = localStorage.getItem('hospitalToken') || sessionStorage.getItem('hospitalToken');
      if (this.isPageVisible && hospitalToken && !this.isHospitalTokenExpired(hospitalToken)) {
        this.autoRefreshData();
      }
    }, this.AUTO_REFRESH_INTERVAL);
  }

  /**
   * Auto-refresh data without showing toast notifications
   */
  private autoRefreshData(): void {
    // Only refresh stats and requests, not the full profile
    if (this.state.hospital && !this.state.loading) {
      this.loadApiUsageStats();
      this.loadRecentApiRequests();
    }
  }

  /**
   * Setup page visibility listener for automatic refresh on focus
   */
  private setupVisibilityListener(): void {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange = (): void => {
    this.isPageVisible = !document.hidden;
    
    if (this.isPageVisible) {
      // Page became visible, refresh data if it's been a while
      this.onPageFocus();
    }
  };

  /**
   * Handle page focus - refresh data if needed
   */
  private onPageFocus(): void {
    // Check if hospital is still authenticated
    const hospitalToken = localStorage.getItem('hospitalToken') || sessionStorage.getItem('hospitalToken');
    if (!hospitalToken || this.isHospitalTokenExpired(hospitalToken)) {
      this.handleAuthenticationError('Session expired. Please log in again.');
      return;
    }

    // Refresh data when page becomes visible
    if (this.state.hospital && !this.state.loading) {
      this.autoRefreshData();
    }
  }

  /**
   * Check if hospital token is expired
   */
  private isHospitalTokenExpired(token: string): boolean {
    if (!token) {
      return true;
    }

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.warn('Failed to decode hospital token:', error);
      return true;
    }
  }

  /**
   * Show logout confirmation dialog
   */
  showLogoutConfirmation(): void {
    this.showLogoutConfirm = true;
  }

  /**
   * Cancel logout confirmation
   */
  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }

  /**
   * Confirm and execute logout with proper user feedback and navigation
   */
  confirmLogout(): void {
    this.showLogoutConfirm = false;
    
    if (this.actionLoading.loggingOut) {
      return; // Prevent multiple logout attempts
    }

    this.actionLoading.loggingOut = true;
    
    try {
      // Show loading feedback
      this.toastService.info('Logging out...');
      
      // Clear hospital-specific authentication data
      localStorage.removeItem('hospitalToken');
      localStorage.removeItem('hospitalData');
      sessionStorage.removeItem('hospitalToken');
      sessionStorage.removeItem('hospitalData');
      
      // Clear hospital service cache
      this.hospitalService.clearCache();
      
      // Show success feedback
      this.toastService.success('Logged out successfully. Thank you for using our service!');
      
      // Navigate to hospital login page after a brief delay
      setTimeout(() => {
        this.actionLoading.loggingOut = false;
        this.router.navigate(['/hospital/login']);
      }, 1000);
      
    } catch (error) {
      console.error('Logout error:', error);
      this.toastService.error('Error during logout. Redirecting to login page...');
      
      // Still attempt to navigate even if there was an error
      setTimeout(() => {
        this.actionLoading.loggingOut = false;
        this.router.navigate(['/hospital/login']);
      }, 1500);
    }
  }

  /**
   * Legacy logout method for backward compatibility
   */
  logout(): void {
    this.showLogoutConfirmation();
  }

  // Getter methods for template access
  get hospitalName(): string {
    return this.state.hospital?.name || this.state.hospital?.hospitalName || '';
  }

  get apiKey(): string {
    return this.state.hospital?.apiKey || '';
  }

  get apiStats(): HospitalApiStats | null {
    return this.state.apiStats;
  }

  get recentRequests(): ApiRequest[] {
    return this.state.recentRequests;
  }

  get isLoading(): boolean {
    return this.state.loading;
  }

  get hasProfileError(): boolean {
    return !!this.state.errors.profile;
  }

  get hasStatsError(): boolean {
    return !!this.state.errors.stats;
  }

  get hasRequestsError(): boolean {
    return !!this.state.errors.requests;
  }

  get profileError(): string | null {
    return this.state.errors.profile;
  }

  get statsError(): string | null {
    return this.state.errors.stats;
  }

  get requestsError(): string | null {
    return this.state.errors.requests;
  }

  /**
   * Get formatted last updated time
   */
  getLastUpdatedTime(section: 'profile' | 'stats' | 'requests'): string {
    const timestamp = this.lastUpdated[section];
    if (!timestamp) return '';
    
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return timestamp.toLocaleDateString();
  }
}
