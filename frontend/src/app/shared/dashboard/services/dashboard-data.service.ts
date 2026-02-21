import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CaseService, Case } from '../../../services/case.service';
import { DoctorService } from '../../../services/doctor.service';
import { AuthService } from '../../../services/auth.service';
import { DashboardConfigService } from './dashboard-config.service';
import {
  DoctorDashboardData,
  PatientDashboardData,
  AppointmentItem,
  RequestListConfig,
  RequestItem,
  ReviewMetricsConfig,
  CalendarConfig
} from '../models/dashboard.models';

/**
 * Dashboard Data Service
 * 
 * Abstracts data fetching and transformation for dashboard components.
 * Provides role-specific dashboard data by combining data from multiple services.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {

  constructor(
    private caseService: CaseService,
    private doctorService: DoctorService,
    private authService: AuthService,
    private configService: DashboardConfigService
  ) {}

  /**
   * Get complete dashboard data for doctor role
   * @returns Observable<DoctorDashboardData>
   */
  getDoctorDashboardData(): Observable<DoctorDashboardData> {
    return this.caseService.getCases().pipe(
      map((response: any) => {
        const cases = response.cases || response.data || response || [];
        return this.transformToDoctorDashboard(cases);
      }),
      catchError((error) => {
        console.error('Error loading doctor dashboard data:', error);
        return of(this.getDefaultDoctorDashboardData());
      })
    );
  }

  /**
   * Get complete dashboard data for patient role
   * @returns Observable<PatientDashboardData>
   */
  getPatientDashboardData(): Observable<PatientDashboardData> {
    return this.caseService.getCases().pipe(
      map((response: any) => {
        const cases = response.cases || response.data || response || [];
        return this.transformToPatientDashboard(cases);
      }),
      catchError((error) => {
        console.error('Error loading patient dashboard data:', error);
        return of(this.getDefaultPatientDashboardData());
      })
    );
  }

  /**
   * Transform cases data to doctor dashboard format
   * @param cases - Array of case objects
   * @returns DoctorDashboardData
   */
  private transformToDoctorDashboard(cases: Case[]): DoctorDashboardData {
    // Calculate statistics
    const stats = this.calculateDoctorStats(cases);
    
    // Get today's appointments
    const todayAppointments = this.getTodayAppointments(cases, 'doctor');
    
    // Get pending requests
    const appointmentRequests = this.getPendingRequests(cases);
    
    // Get next patient
    const nextPatient = this.getNextPatient(cases);
    
    // Get patient summary chart data
    const patientSummary = this.getPatientSummaryChart(cases);
    
    // Get patient reviews
    const patientReviews = this.getPatientReviews(cases);
    
    // Get calendar configuration
    const calendar = this.getCalendarConfig(cases);

    return {
      stats: this.configService.getStatsConfig('doctor', stats),
      patientSummary,
      todayAppointments: this.configService.getAppointmentListConfig('doctor', todayAppointments),
      nextPatient,
      appointmentRequests,
      patientReviews,
      calendar
    };
  }

  /**
   * Transform cases data to patient dashboard format
   * @param cases - Array of case objects
   * @returns PatientDashboardData
   */
  private transformToPatientDashboard(cases: Case[]): PatientDashboardData {
    // Calculate statistics
    const stats = this.calculatePatientStats(cases);
    
    // Get upcoming appointments
    const upcomingCases = this.getUpcomingAppointments(cases);
    
    // Get doctor details from most recent case
    const doctorDetails = this.getDoctorDetails(cases);
    
    // Get chart data
    const chart = this.configService.getChartConfig('patient', {
      completedConsultations: this.countByStatus(cases, 'treated'),
      ongoingConsultations: this.countByStatus(cases, 'ongoing'),
      pendingConsultations: this.countByStatus(cases, 'pending')
    });
    
    // Get calendar configuration
    const calendar = this.getCalendarConfig(cases);
    
    // Get medical history from cases
    const medicalHistory = this.extractMedicalHistory(cases);

    return {
      stats: this.configService.getStatsConfig('patient', stats),
      upcomingAppointments: this.configService.getAppointmentListConfig('patient', upcomingCases),
      doctorDetails,
      chart,
      calendar,
      medicalHistory
    };
  }

  /**
   * Transform cases to appointment items based on role
   * @param cases - Array of case objects
   * @param role - User role ('doctor' or 'patient')
   * @returns Array of AppointmentItem
   */
  transformCasesToAppointments(cases: Case[], role: 'doctor' | 'patient'): AppointmentItem[] {
    if (!cases || !Array.isArray(cases)) {
      return [];
    }

    return cases.map(caseItem => {
      const isDoctor = role === 'doctor';
      const user = isDoctor ? this.extractPatientFromCase(caseItem) : this.extractDoctorFromCase(caseItem);

      return {
        id: caseItem._id,
        avatar: user.avatar,
        name: user.name,
        subtitle: this.getAppointmentSubtitle(caseItem, role),
        time: this.getAppointmentTime(caseItem),
        status: this.mapCaseStatusToAppointmentStatus(caseItem.status),
        onClick: () => console.log('Navigate to case:', caseItem._id)
      };
    });
  }

  // ============================================================================
  // Private Helper Methods - Doctor Dashboard
  // ============================================================================

  /**
   * Calculate statistics for doctor dashboard
   */
  private calculateDoctorStats(cases: Case[]): any {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCases = cases.filter(c => {
      const caseDate = new Date(c.createdAt);
      caseDate.setHours(0, 0, 0, 0);
      return caseDate.getTime() === today.getTime();
    });

    // Get unique patients
    const uniquePatients = new Set(
      cases.map(c => typeof c.patientId === 'object' ? c.patientId._id : c.patientId)
    );

    return {
      totalPatients: uniquePatients.size,
      todayPatients: new Set(
        todayCases.map(c => typeof c.patientId === 'object' ? c.patientId._id : c.patientId)
      ).size,
      todayAppointments: todayCases.length
    };
  }

  /**
   * Get today's appointments for doctor
   */
  private getTodayAppointments(cases: Case[], role: 'doctor' | 'patient'): Case[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return cases.filter(c => {
      if (c.status === 'rejected') return false;
      
      const caseDate = new Date(c.createdAt);
      caseDate.setHours(0, 0, 0, 0);
      return caseDate.getTime() === today.getTime();
    }).slice(0, 5); // Limit to 5 appointments
  }

  /**
   * Get pending appointment requests
   */
  private getPendingRequests(cases: Case[]): RequestListConfig {
    const pendingCases = cases.filter(c => c.status === 'pending').slice(0, 3);

    const requests: RequestItem[] = pendingCases.map(caseItem => {
      const patient = this.extractPatientFromCase(caseItem);
      
      return {
        id: caseItem._id,
        avatar: patient.avatar,
        name: patient.name,
        subtitle: caseItem.predictedConditions?.[0] || caseItem.symptoms?.join(', ') || 'General Consultation',
        actions: [
          {
            icon: 'check',
            type: 'approve' as const,
            onClick: (id: string) => console.log('Approve request:', id)
          },
          {
            icon: 'x',
            type: 'reject' as const,
            onClick: (id: string) => console.log('Reject request:', id)
          },
          {
            icon: 'info',
            type: 'info' as const,
            onClick: (id: string) => console.log('View request details:', id)
          }
        ]
      };
    });

    return {
      title: 'Appointment Requests',
      requests,
      showSeeAll: true,
      emptyMessage: 'No pending requests',
      loading: false
    };
  }

  /**
   * Get next patient details
   */
  private getNextPatient(cases: Case[]): any {
    // Find the next ongoing or upcoming appointment
    const nextCase = cases.find(c => c.status === 'ongoing' || c.status === 'pending');
    
    if (!nextCase || typeof nextCase.patientId !== 'object') {
      return this.configService.getUserDetailsPanelConfig('doctor', null);
    }

    const patient = {
      ...nextCase.patientId,
      reasonForVisit: nextCase.predictedConditions?.[0] || nextCase.symptoms?.join(', '),
      medicalHistory: nextCase.predictedConditions || []
    };

    return this.configService.getUserDetailsPanelConfig('doctor', patient);
  }

  /**
   * Get patient summary chart data
   */
  private getPatientSummaryChart(cases: Case[]): any {
    // Calculate new vs old patients (simplified logic)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCases = cases.filter(c => new Date(c.createdAt) > thirtyDaysAgo);
    const olderCases = cases.filter(c => new Date(c.createdAt) <= thirtyDaysAgo);

    const uniqueRecentPatients = new Set(
      recentCases.map(c => typeof c.patientId === 'object' ? c.patientId._id : c.patientId)
    );
    const uniqueOlderPatients = new Set(
      olderCases.map(c => typeof c.patientId === 'object' ? c.patientId._id : c.patientId)
    );

    return this.configService.getChartConfig('doctor', {
      newPatients: uniqueRecentPatients.size,
      oldPatients: uniqueOlderPatients.size,
      totalPatients: uniqueRecentPatients.size + uniqueOlderPatients.size
    });
  }

  /**
   * Get patient reviews metrics
   */
  private getPatientReviews(cases: Case[]): ReviewMetricsConfig {
    const casesWithFeedback = cases.filter(c => c.feedback && c.feedback.rating);
    
    if (casesWithFeedback.length === 0) {
      return {
        title: 'Patient Reviews',
        metrics: [
          { label: 'Excellent (5)', value: 0, maxValue: 1, color: '#10B981' },
          { label: 'Great (4)', value: 0, maxValue: 1, color: '#3B82F6' },
          { label: 'Good (3)', value: 0, maxValue: 1, color: '#F59E0B' },
          { label: 'Average (2-1)', value: 0, maxValue: 1, color: '#EF4444' }
        ]
      };
    }

    const ratingCounts = {
      excellent: casesWithFeedback.filter(c => c.feedback!.rating === 5).length,
      great: casesWithFeedback.filter(c => c.feedback!.rating === 4).length,
      good: casesWithFeedback.filter(c => c.feedback!.rating === 3).length,
      average: casesWithFeedback.filter(c => c.feedback!.rating <= 2).length
    };

    const total = casesWithFeedback.length;

    return {
      title: 'Patient Reviews',
      metrics: [
        { label: 'Excellent (5)', value: ratingCounts.excellent, maxValue: total, color: '#10B981' },
        { label: 'Great (4)', value: ratingCounts.great, maxValue: total, color: '#3B82F6' },
        { label: 'Good (3)', value: ratingCounts.good, maxValue: total, color: '#F59E0B' },
        { label: 'Average (2-1)', value: ratingCounts.average, maxValue: total, color: '#EF4444' }
      ]
    };
  }

  // ============================================================================
  // Private Helper Methods - Patient Dashboard
  // ============================================================================

  /**
   * Calculate statistics for patient dashboard
   */
  private calculatePatientStats(cases: Case[]): any {
    const treatedCases = cases.filter(c => c.status === 'treated');
    const upcomingCases = cases.filter(c => c.status === 'ongoing' || c.status === 'pending');

    return {
      totalConsultations: cases.length,
      upcomingAppointments: upcomingCases.length,
      activePrescriptions: treatedCases.length // Simplified - would need prescription data
    };
  }

  /**
   * Get upcoming appointments for patient
   */
  private getUpcomingAppointments(cases: Case[]): Case[] {
    return cases
      .filter(c => c.status === 'ongoing' || c.status === 'pending')
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      })
      .slice(0, 5); // Limit to 5 appointments
  }

  /**
   * Get doctor details from most recent case
   */
  private getDoctorDetails(cases: Case[]): any {
    const recentCase = cases.find(c => c.doctorId && (c.status === 'ongoing' || c.status === 'pending'));
    
    if (!recentCase || !recentCase.doctorId) {
      return undefined;
    }

    return this.configService.getUserDetailsPanelConfig('patient', recentCase.doctorId);
  }

  /**
   * Extract medical history from cases
   */
  private extractMedicalHistory(cases: Case[]): any[] {
    const treatedCases = cases.filter(c => c.status === 'treated');
    
    return treatedCases.map(c => ({
      title: c.predictedConditions?.[0] || 'Consultation',
      content: [
        `Date: ${new Date(c.treatedAt || c.createdAt).toLocaleDateString()}`,
        `Symptoms: ${c.symptoms?.join(', ') || 'N/A'}`,
        `Doctor: ${c.doctorId?.name || 'N/A'}`
      ]
    }));
  }

  // ============================================================================
  // Private Utility Methods
  // ============================================================================

  /**
   * Extract patient information from case object
   */
  private extractPatientFromCase(caseItem: Case): { avatar?: string; name: string } {
    const patient = typeof caseItem.patientId === 'object' ? caseItem.patientId : null;
    return {
      avatar: undefined, // Patient interface doesn't have avatar/profilePicture
      name: patient?.name || 'Unknown Patient'
    };
  }

  /**
   * Extract doctor information from case object
   */
  private extractDoctorFromCase(caseItem: Case): { avatar?: string; name: string } {
    const doctor = caseItem.doctorId;
    return {
      avatar: undefined, // Doctor interface doesn't have avatar/profilePicture
      name: doctor?.name || 'Unknown Doctor'
    };
  }

  /**
   * Get appointment subtitle based on role
   */
  private getAppointmentSubtitle(caseItem: Case, role: 'doctor' | 'patient'): string {
    if (role === 'doctor') {
      // For doctors, show the patient's chief complaint or predicted conditions
      if (caseItem.predictedConditions && caseItem.predictedConditions.length > 0) {
        return caseItem.predictedConditions[0];
      }
      if (caseItem.symptoms && caseItem.symptoms.length > 0) {
        return caseItem.symptoms.join(', ');
      }
      return 'General Consultation';
    } else {
      // For patients, show the doctor's specialization
      const doctor = caseItem.doctorId;
      return doctor?.speciality || 'General Practitioner';
    }
  }

  /**
   * Get appointment time display
   */
  private getAppointmentTime(caseItem: Case): string {
    if (caseItem.status === 'ongoing') {
      return 'On Going';
    }

    if (caseItem.acceptedAt) {
      return this.formatTime(caseItem.acceptedAt);
    }

    if (caseItem.createdAt) {
      return this.formatTime(caseItem.createdAt);
    }

    return 'Not scheduled';
  }

  /**
   * Map case status to appointment status
   */
  private mapCaseStatusToAppointmentStatus(status: string): 'ongoing' | 'upcoming' | 'completed' {
    switch (status) {
      case 'ongoing':
        return 'ongoing';
      case 'treated':
        return 'completed';
      case 'pending':
      case 'accepted':
        return 'upcoming';
      default:
        return 'upcoming';
    }
  }

  /**
   * Format time to readable string
   */
  private formatTime(time: string | Date): string {
    if (!time) return 'N/A';
    
    const timeObj = typeof time === 'string' ? new Date(time) : time;
    return timeObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get calendar configuration with case dates
   */
  private getCalendarConfig(cases: Case[]): CalendarConfig {
    const highlightedDates = cases
      .filter(c => c.acceptedAt || c.createdAt)
      .map(c => new Date(c.acceptedAt || c.createdAt));

    return {
      currentDate: new Date(),
      highlightedDates,
      events: cases.map(c => ({
        date: new Date(c.acceptedAt || c.createdAt),
        title: typeof c.patientId === 'object' ? c.patientId.name : 'Appointment',
        color: this.getEventColor(c.status)
      }))
    };
  }

  /**
   * Get event color based on case status
   */
  private getEventColor(status: string): string {
    switch (status) {
      case 'ongoing':
        return '#F59E0B';
      case 'treated':
        return '#10B981';
      case 'pending':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  }

  /**
   * Count cases by status
   */
  private countByStatus(cases: Case[], status: string): number {
    return cases.filter(c => c.status === status).length;
  }

  // ============================================================================
  // Default Data Methods
  // ============================================================================

  /**
   * Get default doctor dashboard data (fallback)
   */
  private getDefaultDoctorDashboardData(): DoctorDashboardData {
    return {
      stats: this.configService.getStatsConfig('doctor', {
        totalPatients: 0,
        todayPatients: 0,
        todayAppointments: 0
      }),
      patientSummary: this.configService.getChartConfig('doctor', {
        newPatients: 0,
        oldPatients: 0,
        totalPatients: 0
      }),
      todayAppointments: {
        title: "Today's Appointments",
        appointments: [],
        showSeeAll: true,
        emptyMessage: 'No appointments scheduled for today',
        loading: false
      },
      nextPatient: this.configService.getUserDetailsPanelConfig('doctor', null),
      appointmentRequests: {
        title: 'Appointment Requests',
        requests: [],
        showSeeAll: true,
        emptyMessage: 'No pending requests',
        loading: false
      },
      patientReviews: {
        title: 'Patient Reviews',
        metrics: [
          { label: 'Excellent (5)', value: 0, maxValue: 1, color: '#10B981' },
          { label: 'Great (4)', value: 0, maxValue: 1, color: '#3B82F6' },
          { label: 'Good (3)', value: 0, maxValue: 1, color: '#F59E0B' },
          { label: 'Average (2-1)', value: 0, maxValue: 1, color: '#EF4444' }
        ]
      },
      calendar: {
        currentDate: new Date(),
        highlightedDates: [],
        events: []
      }
    };
  }

  /**
   * Get default patient dashboard data (fallback)
   */
  private getDefaultPatientDashboardData(): PatientDashboardData {
    return {
      stats: this.configService.getStatsConfig('patient', {
        totalConsultations: 0,
        upcomingAppointments: 0,
        activePrescriptions: 0
      }),
      upcomingAppointments: {
        title: 'Upcoming Appointments',
        appointments: [],
        showSeeAll: true,
        emptyMessage: 'No upcoming appointments',
        loading: false
      },
      chart: this.configService.getChartConfig('patient', {
        completedConsultations: 0,
        ongoingConsultations: 0,
        pendingConsultations: 0
      }),
      calendar: {
        currentDate: new Date(),
        highlightedDates: [],
        events: []
      },
      medicalHistory: []
    };
  }
}
