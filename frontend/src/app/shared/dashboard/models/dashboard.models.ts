/**
 * Dashboard Models and Interfaces
 * 
 * This file contains all TypeScript interfaces for the unified dashboard component system.
 * These interfaces are role-agnostic and can be used for both doctor and patient dashboards.
 */

// ============================================================================
// Stat Card Interfaces
// ============================================================================

export interface StatCardConfig {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  loading?: boolean;
}

// ============================================================================
// Appointment List Interfaces
// ============================================================================

export interface AppointmentListConfig {
  title: string;
  appointments: AppointmentItem[];
  showSeeAll?: boolean;
  emptyMessage?: string;
  loading?: boolean;
}

export interface AppointmentItem {
  id: string;
  avatar?: string;
  name: string;
  subtitle: string;  // diagnosis/reason
  time: string;      // "12:30 PM" or "On Going"
  status?: 'ongoing' | 'upcoming' | 'completed';
  onClick?: () => void;
}

// ============================================================================
// Chart Interfaces
// ============================================================================

export interface ChartConfig {
  title: string;
  data: ChartDataItem[];
  type: 'donut' | 'pie' | 'bar';
  legend?: boolean;
  colors?: string[];
}

export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

// ============================================================================
// User Details Panel Interfaces
// ============================================================================

export interface UserDetailsPanelConfig {
  title: string;
  user: UserDetails;
  actions?: ActionButton[];
  sections?: DetailSection[];
}

export interface UserDetails {
  avatar?: string;
  name: string;
  subtitle: string;  // reason for visit / specialization
  demographics?: DemographicInfo[];
  tags?: Tag[];
}

export interface DemographicInfo {
  label: string;
  value: string;
}

export interface Tag {
  text: string;
  color: 'primary' | 'warning' | 'danger' | 'success' | 'info';
}

export interface ActionButton {
  icon: string;
  label: string;
  onClick: () => void;
}

export interface DetailSection {
  title: string;
  content: string | string[];
}

// ============================================================================
// Request List Interfaces
// ============================================================================

export interface RequestListConfig {
  title: string;
  requests: RequestItem[];
  showSeeAll?: boolean;
  emptyMessage?: string;
  loading?: boolean;
}

export interface RequestItem {
  id: string;
  avatar?: string;
  name: string;
  subtitle: string;
  actions: RequestAction[];
}

export interface RequestAction {
  icon: string;
  type: 'approve' | 'reject' | 'info';
  onClick: (id: string) => void;
}

// ============================================================================
// Calendar Widget Interfaces
// ============================================================================

export interface CalendarConfig {
  currentDate: Date;
  highlightedDates?: Date[];
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onMonthChange?: (month: number, year: number) => void;
}

export interface CalendarEvent {
  date: Date;
  title: string;
  color?: string;
}

// ============================================================================
// Review Metrics Interfaces
// ============================================================================

export interface ReviewMetricsConfig {
  title: string;
  metrics: ReviewMetric[];
}

export interface ReviewMetric {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

// ============================================================================
// Dashboard Layout Interfaces
// ============================================================================

export interface DashboardLayoutConfig {
  columns: number;  // 1, 2, 3, or 4
  gap: 'small' | 'medium' | 'large';
  responsive?: boolean;
}

// ============================================================================
// Composite Dashboard Data Interfaces
// ============================================================================

export interface DashboardData {
  stats: StatCardConfig[];
  appointments?: AppointmentListConfig;
  chart?: ChartConfig;
  userDetails?: UserDetailsPanelConfig;
  requests?: RequestListConfig;
  calendar?: CalendarConfig;
  reviews?: ReviewMetricsConfig;
}

export interface DoctorDashboardData extends DashboardData {
  patientSummary: ChartConfig;
  todayAppointments: AppointmentListConfig;
  nextPatient: UserDetailsPanelConfig;
  appointmentRequests: RequestListConfig;
  patientReviews: ReviewMetricsConfig;
}

export interface PatientDashboardData extends DashboardData {
  upcomingAppointments: AppointmentListConfig;
  doctorDetails?: UserDetailsPanelConfig;
  medicalHistory?: DetailSection[];
}
