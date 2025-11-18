import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CaseService, Case } from '../../services/case.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DashboardStats {
  totalCases: number;
  pendingCases: number;
  ongoingCases: number;
  treatedCases: number;
  averageRating: number;
  totalReviews: number;
}

interface CaseTypeData {
  condition: string;
  count: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  cases: number;
}

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  userName: string = '';
  loading: boolean = true;
  
  // Analytics Data
  stats: DashboardStats = {
    totalCases: 0,
    pendingCases: 0,
    ongoingCases: 0,
    treatedCases: 0,
    averageRating: 0,
    totalReviews: 0
  };
  
  topConditions: CaseTypeData[] = [];
  monthlyTrend: MonthlyData[] = [];
  recentCases: Case[] = [];
  
  // Case review
  showCaseReviewModal: boolean = false;
  selectedCaseForReview: Case | null = null;

  constructor(
    public authService: AuthService,
    private caseService: CaseService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name;
    }
    
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadAnalytics(): void {
    this.loading = true;
    
    this.caseService.getCases().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          const cases = response.cases;
          
          // Calculate stats
          this.stats.totalCases = cases.length;
          this.stats.pendingCases = cases.filter((c: Case) => c.status === 'pending').length;
          this.stats.ongoingCases = cases.filter((c: Case) => c.status === 'ongoing').length;
          this.stats.treatedCases = cases.filter((c: Case) => c.status === 'treated').length;
          
          // Calculate average rating
          const casesWithFeedback = cases.filter((c: Case) => c.feedback && c.feedback.rating);
          if (casesWithFeedback.length > 0) {
            const totalRating = casesWithFeedback.reduce((sum: number, c: Case) => sum + (c.feedback?.rating || 0), 0);
            this.stats.averageRating = totalRating / casesWithFeedback.length;
            this.stats.totalReviews = casesWithFeedback.length;
          }
          
          // Get top conditions
          this.calculateTopConditions(cases);
          
          // Get monthly trend
          this.calculateMonthlyTrend(cases);
          
          // Get recent cases
          this.recentCases = cases
            .sort((a: Case, b: Case) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading analytics:', error);
      }
    });
  }

  calculateTopConditions(cases: Case[]): void {
    const conditionMap = new Map<string, number>();
    
    cases.forEach((c: Case) => {
      if (c.predictedConditions && c.predictedConditions.length > 0) {
        c.predictedConditions.forEach(condition => {
          conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1);
        });
      }
    });
    
    const total = Array.from(conditionMap.values()).reduce((sum, count) => sum + count, 0);
    
    this.topConditions = Array.from(conditionMap.entries())
      .map(([condition, count]) => ({
        condition,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  calculateMonthlyTrend(cases: Case[]): void {
    const monthMap = new Map<string, number>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthMap.set(key, 0);
    }
    
    // Count cases per month
    cases.forEach((c: Case) => {
      const date = new Date(c.createdAt);
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      }
    });
    
    this.monthlyTrend = Array.from(monthMap.entries()).map(([month, cases]) => ({
      month,
      cases
    }));
  }

  openCaseReview(caseItem: Case): void {
    this.selectedCaseForReview = caseItem;
    this.showCaseReviewModal = true;
  }

  closeCaseReview(): void {
    this.showCaseReviewModal = false;
    this.selectedCaseForReview = null;
  }

  acceptCase(): void {
    if (!this.selectedCaseForReview) {
      return;
    }

    const patientName = typeof this.selectedCaseForReview.patientId === 'object' 
      ? this.selectedCaseForReview.patientId.name 
      : 'this patient';
    
    if (!confirm(`Are you sure you want to accept the consultation request from ${patientName}?`)) {
      return;
    }

    const caseId = this.selectedCaseForReview._id;
    
    this.caseService.acceptCase(caseId).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(
            'Case accepted successfully! You can now communicate with the patient.',
            'Close',
            { duration: 5000 }
          );
          this.closeCaseReview();
          
          // Reload analytics
          this.loadAnalytics();
        }
      },
      error: (error) => {
        console.error('Error accepting case:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to accept case. Please try again.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  rejectCase(): void {
    if (!this.selectedCaseForReview) {
      return;
    }

    const patientName = typeof this.selectedCaseForReview.patientId === 'object' 
      ? this.selectedCaseForReview.patientId.name 
      : 'this patient';
    
    if (!confirm(`Are you sure you want to reject the consultation request from ${patientName}?`)) {
      return;
    }

    const caseId = this.selectedCaseForReview._id;
    
    this.caseService.rejectCase(caseId).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(
            'Case rejected. The patient has been notified.',
            'Close',
            { duration: 5000 }
          );
          this.closeCaseReview();
          
          // Reload analytics
          this.loadAnalytics();
        }
      },
      error: (error) => {
        console.error('Error rejecting case:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to reject case. Please try again.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  /**
   * Helper method to get patient name from Case
   */
  getPatientName(caseItem: Case): string {
    if (typeof caseItem.patientId === 'object') {
      return caseItem.patientId.name;
    }
    return 'Unknown Patient';
  }

  /**
   * Helper method to get patient email from Case
   */
  getPatientEmail(caseItem: Case): string {
    if (typeof caseItem.patientId === 'object') {
      return caseItem.patientId.email;
    }
    return 'N/A';
  }

  /**
   * Helper method to get patient blood group from Case
   */
  getPatientBloodGroup(caseItem: Case): string | undefined {
    if (typeof caseItem.patientId === 'object') {
      return caseItem.patientId.bloodGroup;
    }
    return undefined;
  }

  /**
   * Helper method to check if patient has blood group
   */
  hasPatientBloodGroup(caseItem: Case): boolean {
    if (typeof caseItem.patientId === 'object') {
      return !!caseItem.patientId.bloodGroup;
    }
    return false;
  }

  getMaxCases(): number {
    if (this.monthlyTrend.length === 0) return 1;
    return Math.max(...this.monthlyTrend.map(d => d.cases), 1);
  }

  goToCases(): void {
    this.router.navigate(['/doctor/cases']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
