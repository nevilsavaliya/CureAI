import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AdminDashboardComponent } from '../../components/admin-dashboard/admin-dashboard.component';
import { AdminHospitalsComponent } from '../../components/admin-hospitals/admin-hospitals.component';
import { AdminUserManagementComponent } from '../../components/admin-user-management/admin-user-management.component';
import { UserRemovalModalComponent } from '../../components/user-removal-modal/user-removal-modal.component';
import { AddAdminModalComponent } from '../../components/add-admin-modal/add-admin-modal.component';
import { RemovedUsersComponent } from '../../components/removed-users/removed-users.component';
import { AuditLogsComponent } from '../../components/audit-logs/audit-logs.component';
import { SharedModule } from '../../shared/shared.module';

import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
  { 
    path: 'dashboard', 
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'hospitals', 
    component: AdminHospitalsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'users', 
    component: AdminUserManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  }
];

@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminHospitalsComponent,
    AdminUserManagementComponent,
    UserRemovalModalComponent,
    AddAdminModalComponent,
    RemovedUsersComponent,
    AuditLogsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class AdminModule { }
