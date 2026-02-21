import { Injectable } from '@angular/core';
import {
  StatCardConfig,
  AppointmentListConfig,
  AppointmentItem,
  UserDetailsPanelConfig,
  UserDetails,
  ChartConfig,
  ChartDataItem,
  DemographicInfo,
  Tag,
  ActionButton,
  DetailSection
} from '../models/dashboard.models';

/**
 * Dashboard Configuration Service
 * 
 * Provides role-specific configurations for dashboard components.
 * This service transforms raw data into component-ready configurations
 * based on the user's role (doctor or patient).
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardConfigService {

  constructor() {}

  /**
   * Get role-specific statistics card configurations
   * @param role - User role ('doctor' or 'patient')
   * @param data - Optional data object containing stats values
   * @returns Array of StatCardConfig objects
   */
  getStatsConfig(role: 'doctor' | 'patient', data?: any): StatCardConfig[] {
    if (role === 'doctor') {
      return this.getDoctorStatsConfig(data);
    } else {
      return this.getPatientStatsConfig(data);
    }
  }

  /**
   * Get role-specific appointment list configuration
   * @param role - User role ('doctor' or 'patient')
   * @param data - Array of case/appointment data
   * @returns AppointmentListConfig object
   */
  getAppointmentListConfig(role: 'doctor' | 'patient', data: any[]): AppointmentListConfig {
    if (role === 'doctor') {
      return this.getDoctorAppointmentListConfig(data);
    } else {
      return this.getPatientAppointmentListConfig(data);
    }
  }

  /**
   * Get role-specific user details panel configuration
   * @param role - User role ('doctor' or 'patient')
   * @param user - User data object
   * @returns UserDetailsPanelConfig object
   */
  getUserDetailsPanelConfig(role: 'doctor' | 'patient', user: any): UserDetailsPanelConfig {
    if (role === 'doctor') {
      return this.getPatientDetailsPanelConfig(user);
    } else {
      return this.getDoctorDetailsPanelConfig(user);
    }
  }

  /**
   * Get role-specific chart configuration
   * @param role - User role ('doctor' or 'patient')
   * @param data - Chart data object
   * @returns ChartConfig object
   */
  getChartConfig(role: 'doctor' | 'patient', data: any): ChartConfig {
    if (role === 'doctor') {
      return this.getPatientSummaryChartConfig(data);
    } else {
      return this.getPatientHealthChartConfig(data);
    }
  }

  // ============================================================================
  // Private Helper Methods - Doctor Role
  // ============================================================================

  /**
   * Get statistics configuration for doctor dashboard
   */
  private getDoctorStatsConfig(data?: any): StatCardConfig[] {
    const today = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    return [
      {
        title: 'Total Patients',
        value: data?.totalPatients || '0',
        subtitle: 'All time',
        icon: 'users',
        color: 'primary',
        trend: data?.patientTrend ? {
          value: data.patientTrend,
          direction: data.patientTrend > 0 ? 'up' : 'down'
        } : undefined
      },
      {
        title: "Today's Patients",
        value: data?.todayPatients || '0',
        subtitle: today,
        icon: 'user-check',
        color: 'success'
      },
      {
        title: "Today's Appointments",
        value: data?.todayAppointments || '0',
        subtitle: today,
        icon: 'calendar',
        color: 'info'
      }
    ];
  }

  /**
   * Get appointment list configuration for doctor dashboard
   */
  private getDoctorAppointmentListConfig(cases: any[]): AppointmentListConfig {
    const appointments = this.transformCasesToAppointments(cases, 'doctor');

    return {
      title: "Today's Appointments",
      appointments,
      showSeeAll: true,
      emptyMessage: 'No appointments scheduled for today',
      loading: false
    };
  }

  /**
   * Get patient details panel configuration for doctor dashboard
   */
  private getPatientDetailsPanelConfig(patient: any): UserDetailsPanelConfig {
    if (!patient) {
      return this.getEmptyUserDetailsConfig('Next Patient');
    }

    const demographics: DemographicInfo[] = [];
    const tags: Tag[] = [];

    // Build demographics
    if (patient.dateOfBirth) {
      demographics.push({
        label: 'Date of Birth',
        value: this.formatDate(patient.dateOfBirth)
      });
    }
    if (patient.sex || patient.gender) {
      demographics.push({
        label: 'Sex',
        value: patient.sex || patient.gender
      });
    }
    if (patient.weight) {
      demographics.push({
        label: 'Weight',
        value: `${patient.weight} kg`
      });
    }
    if (patient.lastAppointment) {
      demographics.push({
        label: 'Last Appointment',
        value: this.formatDate(patient.lastAppointment)
      });
    }
    if (patient.height) {
      demographics.push({
        label: 'Height',
        value: `${patient.height} cm`
      });
    }
    if (patient.registeredAt || patient.createdAt) {
      demographics.push({
        label: 'Registration Date',
        value: this.formatDate(patient.registeredAt || patient.createdAt)
      });
    }

    // Build medical history tags
    if (patient.medicalHistory && Array.isArray(patient.medicalHistory)) {
      patient.medicalHistory.forEach((condition: string) => {
        tags.push({
          text: condition,
          color: this.getConditionColor(condition)
        });
      });
    }

    // Build action buttons
    const actions: ActionButton[] = [
      {
        icon: 'phone',
        label: 'Call',
        onClick: () => console.log('Call patient')
      },
      {
        icon: 'file-text',
        label: 'Documents',
        onClick: () => console.log('View documents')
      },
      {
        icon: 'message-circle',
        label: 'Chat',
        onClick: () => console.log('Open chat')
      }
    ];

    // Build sections
    const sections: DetailSection[] = [];
    if (patient.lastPrescriptions && patient.lastPrescriptions.length > 0) {
      sections.push({
        title: 'Last Prescriptions',
        content: patient.lastPrescriptions
      });
    }

    return {
      title: 'Next Patient',
      user: {
        avatar: patient.avatar || patient.profilePicture,
        name: patient.name,
        subtitle: patient.reasonForVisit || patient.chiefComplaint || 'General Consultation',
        demographics,
        tags
      },
      actions,
      sections
    };
  }

  /**
   * Get patient summary chart configuration for doctor dashboard
   */
  private getPatientSummaryChartConfig(data: any): ChartConfig {
    const chartData: ChartDataItem[] = [
      {
        label: 'New Patients',
        value: data?.newPatients || 0,
        color: '#4F46E5'
      },
      {
        label: 'Old Patients',
        value: data?.oldPatients || 0,
        color: '#10B981'
      },
      {
        label: 'Total Patients',
        value: data?.totalPatients || 0,
        color: '#F59E0B'
      }
    ];

    return {
      title: 'Patient Summary',
      data: chartData,
      type: 'donut',
      legend: true,
      colors: ['#4F46E5', '#10B981', '#F59E0B']
    };
  }

  // ============================================================================
  // Private Helper Methods - Patient Role
  // ============================================================================

  /**
   * Get statistics configuration for patient dashboard
   */
  private getPatientStatsConfig(data?: any): StatCardConfig[] {
    return [
      {
        title: 'Total Consultations',
        value: data?.totalConsultations || '0',
        subtitle: 'All time',
        icon: 'activity',
        color: 'primary'
      },
      {
        title: 'Upcoming Appointments',
        value: data?.upcomingAppointments || '0',
        subtitle: 'Scheduled',
        icon: 'calendar',
        color: 'info'
      },
      {
        title: 'Active Prescriptions',
        value: data?.activePrescriptions || '0',
        subtitle: 'Current',
        icon: 'file-text',
        color: 'success'
      }
    ];
  }

  /**
   * Get appointment list configuration for patient dashboard
   */
  private getPatientAppointmentListConfig(cases: any[]): AppointmentListConfig {
    const appointments = this.transformCasesToAppointments(cases, 'patient');

    return {
      title: 'Upcoming Appointments',
      appointments,
      showSeeAll: true,
      emptyMessage: 'No upcoming appointments',
      loading: false
    };
  }

  /**
   * Get doctor details panel configuration for patient dashboard
   */
  private getDoctorDetailsPanelConfig(doctor: any): UserDetailsPanelConfig {
    if (!doctor) {
      return this.getEmptyUserDetailsConfig('Your Doctor');
    }

    const demographics: DemographicInfo[] = [];

    // Build demographics
    if (doctor.speciality || doctor.specialization) {
      demographics.push({
        label: 'Specialization',
        value: doctor.speciality || doctor.specialization
      });
    }
    if (doctor.degree) {
      demographics.push({
        label: 'Degree',
        value: doctor.degree
      });
    }
    if (doctor.experienceYears) {
      demographics.push({
        label: 'Experience',
        value: `${doctor.experienceYears} years`
      });
    }
    if (doctor.rating) {
      demographics.push({
        label: 'Rating',
        value: `${doctor.rating} / 5`
      });
    }

    // Build action buttons
    const actions: ActionButton[] = [
      {
        icon: 'phone',
        label: 'Call',
        onClick: () => console.log('Call doctor')
      },
      {
        icon: 'message-circle',
        label: 'Chat',
        onClick: () => console.log('Open chat')
      }
    ];

    return {
      title: 'Your Doctor',
      user: {
        avatar: doctor.avatar || doctor.profilePicture,
        name: doctor.name,
        subtitle: doctor.speciality || doctor.specialization || 'General Practitioner',
        demographics
      },
      actions
    };
  }

  /**
   * Get health chart configuration for patient dashboard
   */
  private getPatientHealthChartConfig(data: any): ChartConfig {
    const chartData: ChartDataItem[] = [
      {
        label: 'Completed',
        value: data?.completedConsultations || 0,
        color: '#10B981'
      },
      {
        label: 'Ongoing',
        value: data?.ongoingConsultations || 0,
        color: '#F59E0B'
      },
      {
        label: 'Pending',
        value: data?.pendingConsultations || 0,
        color: '#3B82F6'
      }
    ];

    return {
      title: 'Consultation Status',
      data: chartData,
      type: 'donut',
      legend: true,
      colors: ['#10B981', '#F59E0B', '#3B82F6']
    };
  }

  // ============================================================================
  // Private Utility Methods
  // ============================================================================

  /**
   * Transform case data to appointment items based on role
   */
  private transformCasesToAppointments(cases: any[], role: 'doctor' | 'patient'): AppointmentItem[] {
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

  /**
   * Extract patient information from case object
   */
  private extractPatientFromCase(caseItem: any): { avatar?: string; name: string } {
    const patient = typeof caseItem.patientId === 'object' ? caseItem.patientId : null;
    return {
      avatar: patient?.avatar || patient?.profilePicture,
      name: patient?.name || 'Unknown Patient'
    };
  }

  /**
   * Extract doctor information from case object
   */
  private extractDoctorFromCase(caseItem: any): { avatar?: string; name: string } {
    const doctor = caseItem.doctorId;
    return {
      avatar: doctor?.avatar || doctor?.profilePicture,
      name: doctor?.name || 'Unknown Doctor'
    };
  }

  /**
   * Get appointment subtitle based on role
   */
  private getAppointmentSubtitle(caseItem: any, role: 'doctor' | 'patient'): string {
    if (role === 'doctor') {
      // For doctors, show the patient's chief complaint or predicted conditions
      if (caseItem.chiefComplaint) {
        return caseItem.chiefComplaint;
      }
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
      return doctor?.speciality || doctor?.specialization || 'General Practitioner';
    }
  }

  /**
   * Get appointment time display
   */
  private getAppointmentTime(caseItem: any): string {
    if (caseItem.status === 'ongoing') {
      return 'On Going';
    }

    if (caseItem.scheduledTime) {
      return this.formatTime(caseItem.scheduledTime);
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
   * Format date to readable string
   */
  private formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
   * Get color for medical condition tag
   */
  private getConditionColor(condition: string): 'primary' | 'warning' | 'danger' | 'success' | 'info' {
    const lowerCondition = condition.toLowerCase();
    
    // Critical conditions
    if (lowerCondition.includes('heart') || lowerCondition.includes('cardiac') || 
        lowerCondition.includes('stroke') || lowerCondition.includes('cancer')) {
      return 'danger';
    }
    
    // Warning conditions
    if (lowerCondition.includes('diabetes') || lowerCondition.includes('hypertension') || 
        lowerCondition.includes('asthma') || lowerCondition.includes('chronic')) {
      return 'warning';
    }
    
    // Acute conditions
    if (lowerCondition.includes('fever') || lowerCondition.includes('infection') || 
        lowerCondition.includes('flu') || lowerCondition.includes('cold')) {
      return 'info';
    }
    
    // Default
    return 'primary';
  }

  /**
   * Get empty user details configuration
   */
  private getEmptyUserDetailsConfig(title: string): UserDetailsPanelConfig {
    return {
      title,
      user: {
        name: 'No information available',
        subtitle: 'N/A',
        demographics: []
      }
    };
  }
}
