import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../config/environment';

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.css']
})
export class DoctorProfileComponent implements OnInit {
  loading = true;
  saving = false;
  
  profile = {
    name: '',
    email: '',
    phone: '',
    degree: '',
    specialization: [] as string[],
    experienceYears: 0,
    registrationNumber: '',
    clinicAddress: '',
    about: '',
    consultationFee: 0
  };

  availableSpecializations = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'Psychiatry',
    'ENT',
    'Ophthalmology',
    'Gynecology'
  ];

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    
    this.http.get<any>(`${environment.apiUrl}/doctor/profile`).subscribe({
      next: (response) => {
        this.profile = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.toastService.show('Failed to load profile', 'error');
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    this.saving = true;
    
    this.http.put<any>(`${environment.apiUrl}/doctor/profile`, this.profile).subscribe({
      next: (response) => {
        this.saving = false;
        this.toastService.show('Profile updated successfully', 'success');
      },
      error: (error) => {
        this.saving = false;
        console.error('Error saving profile:', error);
        this.toastService.show('Failed to update profile', 'error');
      }
    });
  }

  toggleSpecialization(spec: string): void {
    const index = this.profile.specialization.indexOf(spec);
    if (index > -1) {
      this.profile.specialization.splice(index, 1);
    } else {
      this.profile.specialization.push(spec);
    }
  }

  isSpecializationSelected(spec: string): boolean {
    return this.profile.specialization.includes(spec);
  }
}
