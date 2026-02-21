import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './components/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: '', 
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  { 
    path: 'patient', 
    loadChildren: () => import('./features/patient/patient.module').then(m => m.PatientModule)
  },
  { 
    path: 'doctor', 
    loadChildren: () => import('./features/doctor/doctor.module').then(m => m.DoctorModule)
  },
  { 
    path: 'hospital', 
    loadChildren: () => import('./features/hospital/hospital.module').then(m => m.HospitalModule)
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
