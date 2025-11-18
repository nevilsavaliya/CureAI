import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { PatientCasesComponent } from './components/patient-cases/patient-cases.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { DoctorCasesComponent } from './components/doctor-cases/doctor-cases.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { SubscriptionComponent } from './components/subscription/subscription.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { SubscriptionGuard } from './guards/subscription.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
