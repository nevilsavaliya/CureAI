import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class HospitalGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check for hospital authentication (separate from regular auth)
    const hospitalToken = localStorage.getItem('hospitalToken') || sessionStorage.getItem('hospitalToken');
    const hospitalDataStr = localStorage.getItem('hospitalData') || sessionStorage.getItem('hospitalData');
    
    console.log('🔍 HospitalGuard checking authentication:', {
      hasToken: !!hospitalToken,
      hasData: !!hospitalDataStr,
      route: state.url
    });
    
    // Check if hospital is authenticated
    if (!hospitalToken || !hospitalDataStr) {
      console.log('❌ No hospital token or data found, redirecting to login');
      // Not logged in, redirect to hospital login
      this.router.navigate(['/hospital/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    try {
      const hospitalData = JSON.parse(hospitalDataStr);
      console.log('✅ Hospital data found:', {
        name: hospitalData.hospitalName || hospitalData.name,
        email: hospitalData.email,
        status: hospitalData.verificationStatus || hospitalData.status
      });
      
      // Debug: Log the entire hospital data object to see all fields
      console.log('🔍 Full hospital data object:', hospitalData);
      console.log('🔍 Available fields:', Object.keys(hospitalData));
      console.log('🔍 verificationStatus field:', hospitalData.verificationStatus);
      console.log('🔍 status field:', hospitalData.status);
      
      // Get verification status from either field (for backward compatibility)
      const verificationStatus = hospitalData.verificationStatus || hospitalData.status;
      
      // Check verification status
      if (verificationStatus === 'pending') {
        console.log('❌ Hospital pending verification');
        // Hospital is pending verification
        this.router.navigate(['/hospital/pending-verification']);
        return false;
      }
      
      if (verificationStatus === 'rejected') {
        console.log('❌ Hospital rejected');
        // Hospital was rejected
        this.router.navigate(['/hospital/rejected']);
        return false;
      }
      
      // Hospital is verified, allow access
      if (verificationStatus === 'verified') {
        console.log('✅ Hospital verified, allowing access');
        return true;
      }
      
      console.log('❌ Unknown verification status:', verificationStatus);
      
    } catch (error) {
      console.log('❌ Error parsing hospital data:', error);
    }

    // If verification status is not found or invalid, redirect to login
    console.log('❌ Redirecting to hospital login');
    this.router.navigate(['/hospital/login']);
    return false;
  }

  private redirectToDashboard(role: string): void {
    switch (role) {
      case 'patient':
        this.router.navigate(['/patient/dashboard']);
        break;
      case 'doctor':
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
