import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from '../../components/login/login.component';
import { SignupComponent } from '../../components/signup/signup.component';
import { ForgotPasswordComponent } from '../../components/forgot-password/forgot-password.component';
import { VerifyOtpComponent } from '../../components/verify-otp/verify-otp.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent }
];

@NgModule({
  declarations: [
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent,
    VerifyOtpComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class AuthModule { }
