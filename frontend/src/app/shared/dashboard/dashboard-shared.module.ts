/**
 * Dashboard Shared Module
 * 
 * This module contains all reusable dashboard components that can be shared
 * between doctor and patient dashboards. It provides a unified component system
 * with consistent UI/UX across different user roles.
 * 
 * Components included:
 * - appointment-list: Show appointments with patient/doctor info
 * - appointment-list-item: Individual appointment item display
 * - summary-chart: Donut/pie chart visualizations
 * - user-details-panel: Display detailed user information
 * - request-list: Show appointment requests with actions
 * - request-list-item: Individual request item display
 * - calendar-widget: Monthly calendar with event markers
 * - review-metrics: Rating distribution with progress bars (standalone)
 * - dashboard-layout: Responsive grid layout system
 * 
 * Services included:
 * - DashboardConfigService: Provides role-specific configurations
 * - DashboardDataService: Abstracts data fetching for dashboards
 * 
 * Note: StatCardComponent is in the main SharedModule and can be used
 * by importing SharedModule alongside DashboardSharedModule.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Dashboard Components
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { AppointmentListItemComponent } from './components/appointment-list-item/appointment-list-item.component';
import { SummaryChartComponent } from './components/summary-chart/summary-chart.component';
import { UserDetailsPanelComponent } from './components/user-details-panel/user-details-panel.component';
import { RequestListComponent } from './components/request-list/request-list.component';
import { RequestListItemComponent } from './components/request-list-item/request-list-item.component';
import { CalendarWidgetComponent } from './components/calendar-widget/calendar-widget.component';
import { ReviewMetricsComponent } from './components/review-metrics/review-metrics.component';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';

// Dashboard Services
import { DashboardConfigService } from './services/dashboard-config.service';
import { DashboardDataService } from './services/dashboard-data.service';

/**
 * DashboardSharedModule
 * 
 * Provides all dashboard components and services for use in feature modules.
 * Import this module in any feature module that needs dashboard functionality.
 * 
 * Usage:
 * ```typescript
 * import { DashboardSharedModule } from './shared/dashboard/dashboard-shared.module';
 * 
 * @NgModule({
 *   imports: [
 *     DashboardSharedModule,
 *     SharedModule // For StatCardComponent and other shared components
 *   ]
 * })
 * export class FeatureModule { }
 * ```
 */
@NgModule({
  declarations: [
    // Regular components (not standalone)
    AppointmentListComponent,
    AppointmentListItemComponent,
    SummaryChartComponent,
    UserDetailsPanelComponent,
    RequestListComponent,
    RequestListItemComponent,
    CalendarWidgetComponent,
    DashboardLayoutComponent,
  ],
  imports: [
    // Angular modules
    CommonModule,
    FormsModule,
    RouterModule,
    
    // Standalone components
    ReviewMetricsComponent,
  ],
  exports: [
    // Export all dashboard components for use in other modules
    AppointmentListComponent,
    AppointmentListItemComponent,
    SummaryChartComponent,
    UserDetailsPanelComponent,
    RequestListComponent,
    RequestListItemComponent,
    CalendarWidgetComponent,
    ReviewMetricsComponent,
    DashboardLayoutComponent,
  ],
  providers: [
    // Dashboard services are provided at root level via @Injectable({ providedIn: 'root' })
    // but can also be provided here if needed for specific module scope
    DashboardConfigService,
    DashboardDataService,
  ]
})
export class DashboardSharedModule { }
