import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { SubscriptionComponent } from './components/subscription/subscription.component';
import { PatientCasesComponent } from './components/patient-cases/patient-cases.component';
import { DoctorCasesComponent } from './components/doctor-cases/doctor-cases.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { PendingCasesComponent } from './components/pending-cases/pending-cases.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    PatientDashboardComponent,
    DoctorDashboardComponent,
    AdminDashboardComponent,
    ForgotPasswordComponent,
    SubscriptionComponent,
    PatientCasesComponent,
    DoctorCasesComponent,
    NotificationsComponent,
    ClickOutsideDirective,
    PendingCasesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatSnackBarModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
