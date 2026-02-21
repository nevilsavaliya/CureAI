import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { PatientLayoutComponent } from '../../components/patient-layout/patient-layout.component';
import { PatientDashboardComponent } from '../../components/patient-dashboard/patient-dashboard.component';
import { PatientDashboardStatsComponent } from '../../components/patient-dashboard-stats/patient-dashboard-stats.component';
import { PatientChatbotComponent } from '../../components/patient-chatbot/patient-chatbot.component';
import { PatientCasesComponent } from '../../components/patient-cases/patient-cases.component';
import { PatientProfileComponent } from '../../components/patient-profile/patient-profile.component';
import { SharedModule } from '../../shared/shared.module';
import { DashboardSharedModule } from '../../shared/dashboard/dashboard-shared.module';

import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: PatientLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['patient'] },
    children: [
      { 
        path: 'dashboard', 
        component: PatientDashboardStatsComponent
      },
      { 
        path: 'chatbot', 
        component: PatientChatbotComponent
      },
      { 
        path: 'cases', 
        component: PatientCasesComponent
      },
      { 
        path: 'profile', 
        component: PatientProfileComponent
      },
      { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full' 
      }
    ]
  }
];

@NgModule({
  declarations: [
    PatientLayoutComponent,
    PatientDashboardComponent,
    PatientDashboardStatsComponent,
    PatientChatbotComponent,
    PatientCasesComponent,
    PatientProfileComponent
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
export class PatientModule { }
