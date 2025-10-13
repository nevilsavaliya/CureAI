import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { PatientCasesComponent } from './components/patient-cases/patient-cases.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { DoctorCasesComponent } from './components/doctor-cases/doctor-cases.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminHospitalsComponent } from './components/admin-hospitals/admin-hospitals.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { SubscriptionComponent } from './components/subscription/subscription.component';
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component';
import { HospitalRegisterComponent } from './components/hospital-register/hospital-register.component';
import { HospitalLoginComponent } from './components/hospital-login/hospital-login.component';
import { HospitalDashboardComponent } from './components/hospital-dashboard/hospital-dashboard.component';
import { HospitalApiDocsComponent } from './components/hospital-api-docs/hospital-api-docs.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
import { HospitalGuard } from './guards/hospital.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'hospital/register', component: HospitalRegisterComponent },
  { path: 'hospital/login', component: HospitalLoginComponent },
  { 
    path: 'hospital/dashboard', 
    component: HospitalDashboardComponent,
    canActivate: [HospitalGuard]
  },
  { 
    path: 'hospital/api-docs', 
    component: HospitalApiDocsComponent,
    canActivate: [HospitalGuard]
  },
  // TODO: Create HospitalProfileComponent before uncommenting this route
  // { 
  //   path: 'hospital/profile', 
  //   component: HospitalProfileComponent,
  //   canActivate: [AuthGuard, RoleGuard],
  //   data: { roles: ['hospital'] }
  // },
  { 
    path: 'subscription', 
    component: SubscriptionComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['doctor'] }
  },
  { 
    path: 'patient/dashboard', 
    component: PatientDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['patient'] }
  },
  { 
    path: 'patient/cases', 
    component: PatientCasesComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['patient'] }
  },
  { 
    path: 'doctor/dashboard', 
    component: DoctorDashboardComponent,
    canActivate: [AuthGuard, RoleGuard, SubscriptionGuard],
    data: { roles: ['doctor'] }
  },
  { 
    path: 'doctor/cases', 
    component: DoctorCasesComponent,
    canActivate: [AuthGuard, RoleGuard, SubscriptionGuard],
    data: { roles: ['doctor'] }
  },
  { 
    path: 'admin/dashboard', 
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'admin/hospitals', 
    component: AdminHospitalsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
