import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CaseService, Case } from '../../services/case.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pending-cases',
  templateUrl: './pending-cases.component.html',
  styleUrls: ['./pending-cases.component.css']
})
export class PendingCasesComponent implements OnInit, OnDestroy {
  @Output() caseSelected = new EventEmitter<Case>();
  
  pendingCases: Case[] = [];
  pendingCount: number = 0;
  showDropdown: boolean = false;
  loading: boolean = false;
  
  private socketSubscription?: Subscription;

  constructor(
    private caseService: CaseService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.loadPendingCases();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  loadPendingCases(): void {
    this.loading = true;
    this.caseService.getCases().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          // Filter for pending cases only
          this.pendingCases = response.cases.filter((c: Case) => c.status === 'pending');
          this.pendingCount = this.pendingCases.length;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading pending cases:', error);
      }
    });
  }

  setupSocketListeners(): void {
    // Listen for new case requests
    this.socketSubscription = this.socketService.onNewNotification().subscribe((notification: any) => {
      if (notification.type === 'case_request') {
        this.loadPendingCases();
      }
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadPendingCases();
    }
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  viewCaseDetails(caseItem: Case): void {
    this.caseSelected.emit(caseItem);
    this.closeDropdown();
  }

  getSymptomsPreview(symptoms: string[]): string {
    if (!symptoms || symptoms.length === 0) {
      return 'No symptoms provided';
    }
    return symptoms.slice(0, 3).join(', ') + (symptoms.length > 3 ? '...' : '');
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
}
