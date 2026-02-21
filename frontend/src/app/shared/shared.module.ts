import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NotificationsComponent } from '../components/notifications/notifications.component';
import { ClickOutsideDirective } from '../directives/click-outside.directive';
import { LoadingSpinnerComponent } from '../components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../components/error-display/error-display.component';
import { SkeletonLoaderComponent } from '../components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { LogoComponent } from '../components/logo/logo.component';
import { ProgressIndicatorComponent } from '../components/progress-indicator/progress-indicator.component';
import { ToastComponent } from '../components/toast/toast.component';
import { AvatarComponent } from './components/avatar/avatar.component';
import { MobileNavComponent } from '../components/mobile-nav/mobile-nav.component';
import { HamburgerButtonComponent } from '../components/hamburger-button/hamburger-button.component';

@NgModule({
  declarations: [
    NotificationsComponent,
    ClickOutsideDirective,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    StatCardComponent,
    LogoComponent,
    ProgressIndicatorComponent,
    ToastComponent,
    MobileNavComponent,
    HamburgerButtonComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    AvatarComponent
  ],
  exports: [
    NotificationsComponent,
    ClickOutsideDirective,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    StatCardComponent,
    LogoComponent,
    ProgressIndicatorComponent,
    ToastComponent,
    AvatarComponent,
    MobileNavComponent,
    HamburgerButtonComponent
  ]
})
export class SharedModule { }
