import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { HospitalRegisterComponent } from '../../components/hospital-register/hospital-register.component';
import { HospitalLoginComponent } from '../../components/hospital-login/hospital-login.component';
import { HospitalDashboardComponent } from '../../components/hospital-dashboard/hospital-dashboard.component';
import { SharedModule } from '../../shared/shared.module';

import { HospitalGuard } from '../../guards/hospital.guard';

const routes: Routes = [
  { path: 'register', component: HospitalRegisterComponent },
  { path: 'login', component: HospitalLoginComponent },
  { 
    path: 'dashboard', 
    component: HospitalDashboardComponent,
    canActivate: [HospitalGuard]
  }
];

@NgModule({
  declarations: [
    HospitalRegisterComponent,
    HospitalLoginComponent,
    HospitalDashboardComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class HospitalModule { }
