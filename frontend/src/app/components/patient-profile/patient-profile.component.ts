import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-patient-profile',
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css']
})
export class PatientProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading: boolean = false;
  user: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contactNumber: ['', Validators.required],
      age: [''],
      gender: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.user = this.authService.currentUserValue;
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name || '',
        email: this.user.email || '',
        contactNumber: this.user.contactNumber || '',
        age: this.user.age || '',
        gender: this.user.gender || '',
        address: this.user.address || ''
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    // TODO: Implement profile update API call
    setTimeout(() => {
      this.loading = false;
      this.toastService.show('Profile updated successfully!', 'success');
    }, 1000);
  }
}
