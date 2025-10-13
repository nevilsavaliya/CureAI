import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminHospitalsComponent } from './admin-hospitals.component';
import { HospitalService } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';

describe('AdminHospitalsComponent', () => {
  let component: AdminHospitalsComponent;
  let fixture: ComponentFixture<AdminHospitalsComponent>;
  let mockHospitalService: jasmine.SpyObj<HospitalService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockHospitals: any[] = [
    {
      _id: '1',
      name: 'John Doe',
      email: 'john@hospital.com',
      hospitalName: 'City Hospital',
      registrationNumber: 'REG001',
      address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
      contactNumber: '+1234567890',
      emergencyContact: '+0987654321',
      specializations: ['Cardiology'],
      numberOfBeds: 100,
      facilities: ['ICU'],
      verificationStatus: 'pending' as const,
      apiAccessCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '2',
      name: 'Jane Smith',
      email: 'jane@hospital.com',
      hospitalName: 'General Hospital',
      registrationNumber: 'REG002',
      address: { street: '456 Oak Ave', city: 'Boston', state: 'MA', zipCode: '02101', country: 'USA' },
      contactNumber: '+1234567891',
      emergencyContact: '+0987654322',
      specializations: ['Neurology'],
      numberOfBeds: 150,
      facilities: ['Emergency Room'],
      verificationStatus: 'verified' as const,
      apiAccessCount: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '3',
      name: 'Bob Wilson',
      email: 'bob@hospital.com',
      hospitalName: 'Medical Center',
      registrationNumber: 'REG003',
      address: { street: '789 Pine Rd', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA' },
      contactNumber: '+1234567892',
      emergencyContact: '+0987654323',
      specializations: ['Pediatrics'],
      numberOfBeds: 80,
      facilities: ['Laboratory'],
      verificationStatus: 'rejected' as const,
      rejectionReason: 'Invalid documents',
      apiAccessCount: 0,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(async () => {
    mockHospitalService = jasmine.createSpyObj('HospitalService', [
      'getAllHospitals',
      'verifyHospital',
      'rejectHospital',
      'revokeHospitalAccess'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      declarations: [ AdminHospitalsComponent ],
      providers: [
        { provide: HospitalService, useValue: mockHospitalService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminHospitalsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hospitals on init', () => {
    mockHospitalService.getAllHospitals.and.returnValue(of({
      success: true,
      hospitals: mockHospitals
    }));
    
    fixture.detectChanges();
    
    expect(mockHospitalService.getAllHospitals).toHaveBeenCalled();
    expect(component.hospitals.length).toBe(3);
  });

  it('should handle error when loading hospitals', () => {
    const mockError = { error: { message: 'Failed to load' } };
    mockHospitalService.getAllHospitals.and.returnValue(throwError(() => mockError));
    
    fixture.detectChanges();
    
    expect(component.error).toBe('Failed to load');
    expect(mockToastService.error).toHaveBeenCalledWith('Failed to load');
  });

  it('should filter hospitals by status', () => {
    mockHospitalService.getAllHospitals.and.returnValue(of({
      success: true,
      hospitals: mockHospitals
    }));
    
    component.selectedStatus = 'pending';
    component.filterHospitals();
    
    expect(mockHospitalService.getAllHospitals).toHaveBeenCalledWith('pending', '');
  });

  it('should clear filters', () => {
    component.selectedStatus = 'pending';
    component.searchTerm = 'test';
    mockHospitalService.getAllHospitals.and.returnValue(of({
      success: true,
      hospitals: mockHospitals
    }));
    
    component.clearFilters();
    
    expect(component.selectedStatus).toBe('');
    expect(component.searchTerm).toBe('');
    expect(mockHospitalService.getAllHospitals).toHaveBeenCalledWith('', '');
  });

  it('should return correct badge class for status', () => {
    expect(component.getStatusBadgeClass('verified')).toBe('badge-verified');
    expect(component.getStatusBadgeClass('pending')).toBe('badge-pending');
    expect(component.getStatusBadgeClass('rejected')).toBe('badge-rejected');
    expect(component.getStatusBadgeClass('unknown')).toBe('badge-default');
  });

  it('should count pending hospitals correctly', () => {
    component.hospitals = mockHospitals;
    expect(component.getPendingCount()).toBe(1);
  });

  it('should count verified hospitals correctly', () => {
    component.hospitals = mockHospitals;
    expect(component.getVerifiedCount()).toBe(1);
  });

  it('should count rejected hospitals correctly', () => {
    component.hospitals = mockHospitals;
    expect(component.getRejectedCount()).toBe(1);
  });

  it('should open details modal', () => {
    const hospital = mockHospitals[0];
    
    component.viewDetails(hospital);
    
    expect(component.selectedHospital).toBe(hospital);
    expect(component.showDetailsModal).toBe(true);
  });

  it('should close details modal', () => {
    component.selectedHospital = mockHospitals[0];
    component.showDetailsModal = true;
    
    component.closeDetailsModal();
    
    expect(component.selectedHospital).toBeNull();
    expect(component.showDetailsModal).toBe(false);
  });

  it('should verify hospital successfully', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockHospitalService.verifyHospital.and.returnValue(of({ success: true }));
    mockHospitalService.getAllHospitals.and.returnValue(of({
      success: true,
      hospitals: mockHospitals
    }));
    
    component.verifyHospital('1');
    
    expect(mockHospitalService.verifyHospital).toHaveBeenCalledWith('1');
    expect(mockToastService.success).toHaveBeenCalledWith(jasmine.stringContaining('verified successfully'));
  });

  it('should not verify hospital if user cancels confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.verifyHospital('1');
    
    expect(mockHospitalService.verifyHospital).not.toHaveBeenCalled();
  });

  it('should handle verification error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const mockError = { error: { message: 'Verification failed' } };
    mockHospitalService.verifyHospital.and.returnValue(throwError(() => mockError));
    
    component.verifyHospital('1');
    
    expect(mockToastService.error).toHaveBeenCalledWith('Verification failed');
  });

  it('should open reject modal', () => {
    const hospital = mockHospitals[0];
    
    component.openRejectModal(hospital);
    
    expect(component.selectedHospital).toBe(hospital);
    expect(component.showRejectModal).toBe(true);
    expect(component.rejectionReason).toBe('');
  });

  it('should close reject modal', () => {
    component.selectedHospital = mockHospitals[0];
    component.showRejectModal = true;
    component.rejectionReason = 'Test reason';
    
    component.closeRejectModal();
    
    expect(component.selectedHospital).toBeNull();
    expect(component.showRejectModal).toBe(false);
    expect(component.rejectionReason).toBe('');
  });

  it('should reject hospital with reason', () => {
    component.selectedHospital = mockHospitals[0];
    component.rejectionReason = 'Invalid documents';
    mockHospitalService.rejectHospital.and.returnValue(of({ success: true }));
    mockHospitalService.getAllHospitals.and.returnValue(of({
      success: true,
      hospitals: mockHospitals
    }));
    
    component.confirmReject();
    
    expect(mockHospitalService.rejectHospital).toHaveBeenCalledWith('1', 'Invalid documents');
    expect(mockToastService.success).toHaveBeenCalledWith(jasmine.stringContaining('rejected successfully'));
  });

  it('should not reject hospital without reason', () => {
    component.selectedHospital = mockHospitals[0];
    component.rejectionReason = '';
    
    component.confirmReject();
    
    expect(mockHospitalService.rejectHospital).not.toHaveBeenCalled();
    expect(mockToastService.error).toHaveBeenCalledWith('Please provide a rejection reason');
  });

  it('should revoke hospital access', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockHospitalService.revokeHospitalAccess.and.returnValue(of({ success: true }));
    mockHospitalService.getAllHospitals.and.returnValue(of({
      success: true,
      hospitals: mockHospitals
    }));
    
    component.revokeAccess('2');
    
    expect(mockHospitalService.revokeHospitalAccess).toHaveBeenCalledWith('2');
    expect(mockToastService.success).toHaveBeenCalledWith(jasmine.stringContaining('revoked successfully'));
  });

  it('should format date correctly', () => {
    const date = '2024-01-15T10:30:00Z';
    const formatted = component.formatDate(date);
    expect(formatted).toContain('2024');
  });

  it('should return N/A for null date', () => {
    expect(component.formatDate('')).toBe('N/A');
  });
});
