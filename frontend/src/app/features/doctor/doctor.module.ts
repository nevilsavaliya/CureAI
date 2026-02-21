import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DoctorLayoutComponent } from '../../components/doctor-layout/doctor-layout.component';
import { DoctorDashboardComponent } from '../../components/doctor-dashboard/doctor-dashboard.component';
import { DoctorCasesComponent } from '../../components/doctor-cases/doctor-cases.component';
import { DoctorPaymentComponent } from '../../components/doctor-payment/doctor-payment.component';
import { DoctorProfileComponent } from '../../components/doctor-profile/doctor-profile.component';
import { SharedModule } from '../../shared/shared.module';
import { DashboardSharedModule } from '../../shared/dashboard/dashboard-shared.module';

import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { PaymentGuard } from '../../guards/payment.guard';

const routes: Routes = [
  {
    path: '',
    component: DoctorLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['doctor'] },
    children: [
      { 
        path: 'dashboard', 
        component: DoctorDashboardComponent,
        canActivate: [PaymentGuard]
      },
      { 
        path: 'cases', 
        component: DoctorCasesComponent,
        canActivate: [PaymentGuard]
      },
      { 
        path: 'payment', 
        component: DoctorPaymentComponent
      },
      { 
        path: 'profile', 
        component: DoctorProfileComponent,
        canActivate: [PaymentGuard]
      },
      {
        path: '',
        redirectTo: 'payment',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  declarations: [
    DoctorLayoutComponent,
    DoctorDashboardComponent,
    DoctorCasesComponent,
    DoctorPaymentComponent,
    DoctorProfileComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    DashboardSharedModule
  ]
})
export class DoctorModule { }
