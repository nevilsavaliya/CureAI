import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CaseService } from '../../services/case.service';
import { ToastService } from '../../services/toast.service';
import { DashboardDataService } from '../../shared/dashboard/services/dashboard-data.service';
import { DoctorDashboardData } from '../../shared/dashboard/models/dashboard.models';

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  
  // Dashboard data using shared interface
  dashboardData: DoctorDashboardData | null = null;

  constructor(
    public authService: AuthService,
    private caseService: CaseService,
    private toastService: ToastService,
    private router: Router,
    private dashboardDataService: DashboardDataService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadDashboard(): void {
    this.loading = true;
    
    this.dashboardDataService.getDoctorDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading dashboard:', error);
        this.toastService.show('Failed to load dashboard data', 'error');
      }
    });
  }

  // ============================================================================
  // Event Handlers for Shared Components
  // ============================================================================

  onAppointmentClick(appointmentId: string): void {
    this.router.navigate(['/doctor/cases', appointmentId]);
  }

  handleRequestAction(event: { requestId: string; actionType: 'approve' | 'reject' | 'info' }): void {
    switch (event.actionType) {
      case 'approve':
        this.onAcceptRequest(event.requestId);
        break;
      case 'reject':
        this.onRejectRequest(event.requestId);
        break;
      case 'info':
        this.onRequestInfo(event.requestId);
        break;
    }
  }

  onAcceptRequest(requestId: string): void {
    if (!confirm('Are you sure you want to accept this consultation request?')) {
      return;
    }

    this.caseService.acceptCase(requestId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.show(
            'Case accepted successfully! You can now communicate with the patient.',
            'success'
          );
          // Reload dashboard
          this.loadDashboard();
        }
      },
      error: (error) => {
        console.error('Error accepting case:', error);
        this.toastService.show(
          error.error?.message || 'Failed to accept case. Please try again.',
          'error'
        );
      }
    });
  }

  onRejectRequest(requestId: string): void {
    if (!confirm('Are you sure you want to reject this consultation request?')) {
      return;
    }

    this.caseService.rejectCase(requestId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.show(
            'Case rejected. The patient has been notified.',
            'success'
          );
          // Reload dashboard
          this.loadDashboard();
        }
      },
      error: (error) => {
        console.error('Error rejecting case:', error);
        this.toastService.show(
          error.error?.message || 'Failed to reject case. Please try again.',
          'error'
        );
      }
    });
  }

  onRequestInfo(requestId: string): void {
    this.router.navigate(['/doctor/cases', requestId]);
  }

  onDateClick(date: Date): void {
    console.log('Date clicked:', date);
    // Navigate to cases filtered by date
    this.router.navigate(['/doctor/cases'], { queryParams: { date: date.toISOString() } });
  }

  onMonthChange(month: number, year: number): void {
    console.log('Month changed:', month, year);
    // Could reload calendar data for the new month if needed
  }

  goToCases(): void {
    this.router.navigate(['/doctor/cases']);
  }
}
