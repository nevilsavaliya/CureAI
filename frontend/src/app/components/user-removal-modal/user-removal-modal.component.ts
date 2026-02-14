import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  isRootAdmin?: boolean;
}

interface ActiveProcess {
  type: string;
  count: number;
  description: string;
  severity: 'warning' | 'critical';
}

@Component({
  selector: 'app-user-removal-modal',
  templateUrl: './user-removal-modal.component.html',
  styleUrls: ['./user-removal-modal.component.css']
})
export class UserRemovalModalComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() user: User | null = null;
  @Input() users: User[] = []; // For bulk removal
  @Input() isBulkRemoval: boolean = false;
  @Output() confirmed = new EventEmitter<{ reason: string }>();
  @Output() cancelled = new EventEmitter<void>();

  // Form data
  confirmationText: string = '';
  reason: string = '';
  
  // State
  loading: boolean = false;
  error: string = '';
  currentStep: number = 1; // 1: Warning, 2: Confirmation, 3: Processing
  
  // Active processes and warnings
  activeProcesses: ActiveProcess[] = [];
  hasActiveProcesses: boolean = false;
  hasCriticalProcesses: boolean = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    if (this.isVisible) {
      this.initializeModal();
    }
  }

  ngOnChanges(): void {
    if (this.isVisible) {
      this.initializeModal();
    }
  }

  private initializeModal(): void {
    this.resetForm();
    this.checkActiveProcesses();
  }

  private resetForm(): void {
    this.confirmationText = '';
    this.reason = '';
    this.error = '';
    this.currentStep = 1;
    this.loading = false;
    this.activeProcesses = [];
    this.hasActiveProcesses = false;
    this.hasCriticalProcesses = false;
  }

  private checkActiveProcesses(): void {
    if (this.isBulkRemoval) {
      this.checkBulkActiveProcesses();
    } else if (this.user) {
      this.checkSingleUserActiveProcesses();
    }
  }

  private checkSingleUserActiveProcesses(): void {
    if (!this.user) return;

    this.activeProcesses = [];

    // Check based on user role
    switch (this.user.role) {
      case 'doctor':
        this.checkDoctorActiveProcesses();
        break;
      case 'patient':
        this.checkPatientActiveProcesses();
        break;
      case 'hospital':
        this.checkHospitalActiveProcesses();
        break;
      case 'admin':
        this.checkAdminActiveProcesses();
        break;
    }

    this.hasActiveProcesses = this.activeProcesses.length > 0;
    this.hasCriticalProcesses = this.activeProcesses.some(p => p.severity === 'critical');
  }

  private checkBulkActiveProcesses(): void {
    // For bulk removal, check all users
    this.activeProcesses = [];
    
    const doctorCount = this.users.filter(u => u.role === 'doctor').length;
    const patientCount = this.users.filter(u => u.role === 'patient').length;
    const hospitalCount = this.users.filter(u => u.role === 'hospital').length;
    const adminCount = this.users.filter(u => u.role === 'admin').length;

    if (doctorCount > 0) {
      this.activeProcesses.push({
        type: 'consultations',
        count: doctorCount * 2, // Estimated active consultations
        description: `${doctorCount} doctors may have active consultations`,
        severity: 'critical'
      });
    }

    if (patientCount > 0) {
      this.activeProcesses.push({
        type: 'cases',
        count: patientCount,
        description: `${patientCount} patients may have ongoing cases`,
        severity: 'warning'
      });
    }

    if (hospitalCount > 0) {
      this.activeProcesses.push({
        type: 'hospital_operations',
        count: hospitalCount,
        description: `${hospitalCount} hospitals may have active operations`,
        severity: 'critical'
      });
    }

    if (adminCount > 0) {
      this.activeProcesses.push({
        type: 'admin_sessions',
        count: adminCount,
        description: `${adminCount} admins may have active sessions`,
        severity: 'warning'
      });
    }

    this.hasActiveProcesses = this.activeProcesses.length > 0;
    this.hasCriticalProcesses = this.activeProcesses.some(p => p.severity === 'critical');
  }

  private checkDoctorActiveProcesses(): void {
    // Mock data - in real implementation, this would call the backend
    const mockActiveConsultations = Math.floor(Math.random() * 5);
    const mockPendingCases = Math.floor(Math.random() * 10);

    if (mockActiveConsultations > 0) {
      this.activeProcesses.push({
        type: 'consultations',
        count: mockActiveConsultations,
        description: 'Active video consultations',
        severity: 'critical'
      });
    }

    if (mockPendingCases > 0) {
      this.activeProcesses.push({
        type: 'cases',
        count: mockPendingCases,
        description: 'Pending case reviews',
        severity: 'warning'
      });
    }
  }

  private checkPatientActiveProcesses(): void {
    // Mock data - in real implementation, this would call the backend
    const mockActiveCases = Math.floor(Math.random() * 3);
    const mockPendingPayments = Math.floor(Math.random() * 2);

    if (mockActiveCases > 0) {
      this.activeProcesses.push({
        type: 'cases',
        count: mockActiveCases,
        description: 'Active medical cases',
        severity: 'warning'
      });
    }

    if (mockPendingPayments > 0) {
      this.activeProcesses.push({
        type: 'payments',
        count: mockPendingPayments,
        description: 'Pending payments',
        severity: 'critical'
      });
    }
  }

  private checkHospitalActiveProcesses(): void {
    // Mock data - in real implementation, this would call the backend
    const mockActiveDoctors = Math.floor(Math.random() * 20) + 5;
    const mockActivePatients = Math.floor(Math.random() * 50) + 10;
    const mockApiCalls = Math.floor(Math.random() * 1000) + 100;

    this.activeProcesses.push({
      type: 'doctors',
      count: mockActiveDoctors,
      description: 'Associated doctors',
      severity: 'critical'
    });

    this.activeProcesses.push({
      type: 'patients',
      count: mockActivePatients,
      description: 'Associated patients',
      severity: 'critical'
    });

    if (mockApiCalls > 0) {
      this.activeProcesses.push({
        type: 'api_usage',
        count: mockApiCalls,
        description: 'Daily API calls',
        severity: 'warning'
      });
    }
  }

  private checkAdminActiveProcesses(): void {
    // Mock data - in real implementation, this would call the backend
    const mockActiveSessions = Math.floor(Math.random() * 3);
    const mockRecentActions = Math.floor(Math.random() * 10);

    if (mockActiveSessions > 0) {
      this.activeProcesses.push({
        type: 'sessions',
        count: mockActiveSessions,
        description: 'Active admin sessions',
        severity: 'warning'
      });
    }

    if (mockRecentActions > 0) {
      this.activeProcesses.push({
        type: 'recent_actions',
        count: mockRecentActions,
        description: 'Recent administrative actions',
        severity: 'warning'
      });
    }
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep === 1) {
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
    }
  }

  // Validation
  isConfirmationValid(): boolean {
    return this.confirmationText.toUpperCase() === 'CONFIRM';
  }

  canProceed(): boolean {
    if (this.currentStep === 1) {
      return true; // Can always proceed from warning step
    }
    if (this.currentStep === 2) {
      return this.isConfirmationValid() && this.reason.trim().length > 0;
    }
    return false;
  }

  // Actions
  confirmRemoval(): void {
    if (!this.canProceed()) {
      return;
    }

    this.currentStep = 3;
    this.loading = true;
    this.error = '';

    // Emit confirmation with reason
    this.confirmed.emit({
      reason: this.reason.trim()
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  // Utility methods
  getUserDisplayName(): string {
    if (this.isBulkRemoval) {
      return `${this.users.length} users`;
    }
    return this.user?.name || 'Unknown User';
  }

  getUserDisplayEmail(): string {
    if (this.isBulkRemoval) {
      return `${this.users.length} selected users`;
    }
    return this.user?.email || '';
  }

  getRemovalImpactSeverity(): 'low' | 'medium' | 'high' {
    if (this.hasCriticalProcesses) {
      return 'high';
    }
    if (this.hasActiveProcesses) {
      return 'medium';
    }
    return 'low';
  }

  getRemovalImpactText(): string {
    const severity = this.getRemovalImpactSeverity();
    
    switch (severity) {
      case 'high':
        return 'High Impact - Critical processes will be affected';
      case 'medium':
        return 'Medium Impact - Some processes may be affected';
      case 'low':
        return 'Low Impact - Minimal effect on system operations';
      default:
        return 'Impact assessment unavailable';
    }
  }

  getRemovalImpactClass(): string {
    const severity = this.getRemovalImpactSeverity();
    return `impact-${severity}`;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string | Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  }

  getUserRoleBadgeClass(role: string): string {
    switch (role) {
      case 'patient': return 'badge-patient';
      case 'doctor': return 'badge-doctor';
      case 'hospital': return 'badge-hospital';
      case 'admin': return 'badge-admin';
      default: return 'badge-default';
    }
  }

  getProcessSeverityClass(severity: string): string {
    return `process-${severity}`;
  }

  getProcessIcon(type: string): string {
    switch (type) {
      case 'consultations': return 'fas fa-video';
      case 'cases': return 'fas fa-file-medical';
      case 'payments': return 'fas fa-credit-card';
      case 'doctors': return 'fas fa-user-md';
      case 'patients': return 'fas fa-user-injured';
      case 'api_usage': return 'fas fa-code';
      case 'sessions': return 'fas fa-desktop';
      case 'recent_actions': return 'fas fa-history';
      case 'hospital_operations': return 'fas fa-hospital';
      case 'admin_sessions': return 'fas fa-user-shield';
      default: return 'fas fa-exclamation-triangle';
    }
  }
}