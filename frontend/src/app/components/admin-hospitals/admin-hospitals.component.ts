import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-hospitals',
  templateUrl: './admin-hospitals.component.html',
  styleUrls: ['./admin-hospitals.component.css']
})
export class AdminHospitalsComponent implements OnInit {
  hospitals: any[] = [];
  filteredHospitals: any[] = [];
  loading: boolean = false;
  error: string = '';
  
  // Filters
  selectedStatus: string = '';
  searchTerm: string = '';
  
  // Modal state
  showDetailsModal: boolean = false;
  selectedHospital: any = null;
  showRejectModal: boolean = false;
  rejectionReason: string = '';
  
  // Action loading states
  verifyingId: string | null = null;
  rejectingId: string | null = null;
  revokingId: string | null = null;

  constructor(
    private router: Router,
    private hospitalService: HospitalService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadHospitals();
  }

  goBackToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  loadHospitals(): void {
    this.loading = true;
    this.error = '';
    
    this.hospitalService.getAllHospitals(this.selectedStatus, this.searchTerm).subscribe({
      next: (response) => {
        if (response.success) {
          this.hospitals = response.hospitals || [];
          this.filteredHospitals = this.hospitals;
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load hospitals';
        this.loading = false;
        this.toastService.error(this.error);
      }
    });
  }

  filterHospitals(): void {
    this.loadHospitals();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.searchTerm = '';
    this.loadHospitals();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'verified':
        return 'badge-verified';
      case 'pending':
        return 'badge-pending';
      case 'rejected':
        return 'badge-rejected';
      default:
        return 'badge-default';
    }
  }

  getPendingCount(): number {
    return this.hospitals.filter(h => h.verificationStatus === 'pending').length;
  }

  getVerifiedCount(): number {
    return this.hospitals.filter(h => h.verificationStatus === 'verified').length;
  }

  getRejectedCount(): number {
    return this.hospitals.filter(h => h.verificationStatus === 'rejected').length;
  }

  viewDetails(hospital: any): void {
    this.selectedHospital = hospital;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedHospital = null;
  }

  verifyHospital(hospitalId: string): void {
    if (!confirm('Are you sure you want to verify this hospital? API credentials will be generated and sent via email.')) {
      return;
    }

    this.verifyingId = hospitalId;
    
    this.hospitalService.verifyHospital(hospitalId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Hospital verified successfully! API credentials sent via email.');
          this.loadHospitals();
          if (this.showDetailsModal && this.selectedHospital?._id === hospitalId) {
            this.closeDetailsModal();
          }
        }
        this.verifyingId = null;
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Failed to verify hospital');
        this.verifyingId = null;
      }
    });
  }

  openRejectModal(hospital: any): void {
    this.selectedHospital = hospital;
    this.showRejectModal = true;
    this.rejectionReason = '';
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedHospital = null;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.rejectionReason.trim()) {
      this.toastService.error('Please provide a rejection reason');
      return;
    }

    this.rejectingId = this.selectedHospital._id;
    
    this.hospitalService.rejectHospital(this.selectedHospital._id, this.rejectionReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Hospital rejected successfully');
          this.loadHospitals();
          this.closeRejectModal();
          if (this.showDetailsModal) {
            this.closeDetailsModal();
          }
        }
        this.rejectingId = null;
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Failed to reject hospital');
        this.rejectingId = null;
      }
    });
  }

  revokeAccess(hospitalId: string): void {
    if (!confirm('Are you sure you want to revoke access for this hospital? Their API credentials will be deactivated.')) {
      return;
    }

    this.revokingId = hospitalId;
    
    this.hospitalService.revokeHospitalAccess(hospitalId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Hospital access revoked successfully');
          this.loadHospitals();
          if (this.showDetailsModal && this.selectedHospital?._id === hospitalId) {
            this.closeDetailsModal();
          }
        }
        this.revokingId = null;
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Failed to revoke access');
        this.revokingId = null;
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatDocumentType(type: string): string {
    if (!type) return 'Document';
    
    const typeMap: { [key: string]: string } = {
      'registration_certificate': 'Registration Certificate',
      'license': 'Medical License',
      'accreditation': 'Accreditation Certificate',
      'other': 'Other Document'
    };
    
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
