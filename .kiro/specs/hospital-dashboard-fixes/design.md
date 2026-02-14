# Hospital Dashboard Fixes - Design Document

## Overview

This design addresses critical functionality issues in the hospital dashboard by implementing proper API integration, fixing authentication flows, and ensuring real-time data display. The solution focuses on creating robust service methods, proper error handling, and seamless user experience.

## Architecture

### Frontend Architecture
```
Hospital Dashboard Component
├── Hospital Service (API calls)
├── Auth Service (authentication)
├── Toast Service (notifications)
└── Router (navigation)
```

### Backend Integration Points
```
Backend API Endpoints
├── GET /api/hospitals/profile (hospital data)
├── GET /api/hospitals/api/usage-stats (API metrics)
├── GET /api/hospitals/api/recent-requests (request logs)
└── POST /api/auth/logout (session termination)
```

### Data Flow
```
Dashboard Load → Auth Check → Profile Fetch → Stats Fetch → UI Update
Logout Click → Clear Storage → Update State → Redirect
Refresh Action → Re-fetch All Data → Update Components
```

## Components and Interfaces

### 1. Hospital Service Enhancements

**New Methods:**
```typescript
interface HospitalApiStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  successRate: number;
  remainingRequests: number;
  rateLimit: number;
}

interface ApiRequest {
  patientEmail: string;
  timestamp: Date;
  status: 'success' | 'error';
  responseTime?: number;
}

// New service methods
getHospitalProfile(): Observable<HospitalResponse>
getApiUsageStats(): Observable<HospitalApiStats>
getRecentApiRequests(): Observable<ApiRequest[]>
```

**Implementation Strategy:**
- Add proper HTTP error handling with retry logic
- Implement caching for frequently accessed data
- Add loading states and error recovery mechanisms

### 2. Auth Service Fixes

**Enhanced Logout Method:**
```typescript
logout(): void {
  // Clear all authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('hospitalData');
  
  // Update authentication state
  this.currentUserSubject.next(null);
  
  // Clear any cached data
  this.clearServiceCaches();
}
```

**Session Validation:**
- Add token expiration checking
- Implement automatic logout on token expiry
- Add session refresh capabilities

### 3. Dashboard Component Redesign

**State Management:**
```typescript
interface DashboardState {
  loading: boolean;
  hospital: Hospital | null;
  apiStats: HospitalApiStats | null;
  recentRequests: ApiRequest[];
  errors: {
    profile: string | null;
    stats: string | null;
    requests: string | null;
  };
}
```

**Component Lifecycle:**
1. **OnInit**: Check authentication, load hospital profile
2. **Profile Load**: Fetch API credentials and basic info
3. **Stats Load**: Get usage statistics and performance metrics
4. **Requests Load**: Fetch recent API access logs
5. **Error Handling**: Display appropriate error states

## Data Models

### Hospital Profile Model
```typescript
interface Hospital {
  id: string;
  name: string;
  hospitalName: string;
  email: string;
  apiKey: string;
  apiSecret?: string; // Only shown on first generation
  verificationStatus: 'verified';
  apiAccessCount: number;
  lastApiAccess?: Date;
  createdAt: Date;
}
```

### API Usage Statistics Model
```typescript
interface ApiUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  successRate: number;
  remainingRequests: number;
  rateLimit: number;
  lastUpdated: Date;
}
```

### Recent Request Model
```typescript
interface ApiRequest {
  id: string;
  patientEmail: string;
  timestamp: Date;
  status: 'success' | 'error';
  responseTime?: number;
  endpoint: string;
  errorMessage?: string;
}
```

## Error Handling

### Error Categories
1. **Authentication Errors**: Token expired, invalid credentials
2. **Network Errors**: Connection timeout, server unavailable
3. **Data Errors**: Invalid response format, missing data
4. **Permission Errors**: Insufficient access rights

### Error Recovery Strategies
```typescript
interface ErrorRecovery {
  authErrors: () => void; // Redirect to login
  networkErrors: () => void; // Show retry button
  dataErrors: () => void; // Show fallback data
  permissionErrors: () => void; // Show access denied message
}
```

### User Feedback
- Toast notifications for actions (copy, refresh, logout)
- Loading spinners for data fetching
- Error messages with retry options
- Success confirmations for completed actions

## Testing Strategy

### Unit Tests
1. **Service Methods**: Test API calls, error handling, data transformation
2. **Component Logic**: Test state management, user interactions, lifecycle methods
3. **Authentication**: Test login/logout flows, token management
4. **Error Scenarios**: Test network failures, invalid responses, permission issues

### Integration Tests
1. **Dashboard Flow**: Test complete dashboard loading sequence
2. **Logout Process**: Test full logout and redirect flow
3. **Data Refresh**: Test manual and automatic data updates
4. **Error Recovery**: Test error states and recovery mechanisms

### E2E Tests
1. **Hospital Login**: Complete login to dashboard flow
2. **Dashboard Navigation**: Test all dashboard features and navigation
3. **Logout Flow**: Test logout from dashboard to login page
4. **Error Scenarios**: Test various error conditions and user recovery

## Implementation Plan

### Phase 1: Backend API Endpoints
1. Create hospital profile endpoint
2. Implement API usage statistics endpoint
3. Add recent requests logging endpoint
4. Enhance authentication middleware

### Phase 2: Frontend Service Layer
1. Fix hospital service API methods
2. Enhance auth service logout functionality
3. Add proper error handling and retry logic
4. Implement data caching strategies

### Phase 3: Dashboard Component
1. Redesign component state management
2. Implement proper loading states
3. Add comprehensive error handling
4. Enhance user feedback mechanisms

### Phase 4: Testing and Validation
1. Unit test all service methods
2. Integration test dashboard flows
3. E2E test complete user journeys
4. Performance test data loading

## Security Considerations

### Authentication Security
- Secure token storage and management
- Automatic logout on token expiry
- Session validation on sensitive operations

### API Security
- Secure API key display and copying
- Rate limiting awareness and display
- Audit logging for all API access

### Data Protection
- Secure handling of patient data references
- Proper error message sanitization
- No sensitive data in client-side logs