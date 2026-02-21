import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardDataService } from '../../shared/dashboard/services/dashboard-data.service';
import { PatientDashboardData } from '../../shared/dashboard/models/dashboard.models';

@Component({
  selector: 'app-patient-dashboard-stats',
  templateUrl: './patient-dashboard-stats.component.html',
  styleUrls: ['./patient-dashboard-stats.component.css']
})
export class PatientDashboardStatsComponent implements OnInit {
  loading: boolean = true;
  dashboardData: PatientDashboardData | null = null;

  constructor(
    private dashboardDataService: DashboardDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    
    this.dashboardDataService.getPatientDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading dashboard:', error);
      }
    });
  }

  onAppointmentClick(appointmentId: string): void {
    this.router.navigate(['/patient/cases'], { 
      queryParams: { caseId: appointmentId } 
    });
  }

  onCalendarDateClick(date: Date): void {
    console.log('Calendar date clicked:', date);
  }

  onCalendarMonthChange(month: number, year: number): void {
    console.log('Calendar month changed:', month, year);
  }
}
