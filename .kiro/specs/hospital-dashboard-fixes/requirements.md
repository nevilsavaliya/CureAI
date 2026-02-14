# Hospital Dashboard Fixes - Requirements Document

## Introduction

The hospital dashboard currently has multiple critical issues preventing proper functionality. Users cannot access performance metrics, API usage statistics are not loading, and the logout functionality is broken. This spec addresses these core issues to restore full dashboard functionality.

## Glossary

- **Hospital_Dashboard**: The main interface for verified hospitals to view API credentials, usage statistics, and manage their profile
- **API_Usage_Stats**: Real-time metrics showing API request counts, success rates, and performance data
- **Performance_Metrics**: System performance indicators including response times, rate limits, and success rates
- **Logout_Function**: Authentication termination process that clears session data and redirects to login
- **Hospital_Service**: Frontend service handling API calls to hospital-related backend endpoints
- **Auth_Service**: Frontend service managing authentication state and session management

## Requirements

### Requirement 1

**User Story:** As a hospital administrator, I want to view real-time API usage statistics on my dashboard, so that I can monitor my API consumption and performance.

#### Acceptance Criteria

1. WHEN a verified hospital accesses the dashboard, THE Hospital_Dashboard SHALL display current API usage statistics including total requests, daily requests, and remaining rate limit
2. WHEN API usage data is requested, THE Hospital_Service SHALL fetch real-time metrics from the backend API endpoint
3. WHEN the dashboard loads, THE Hospital_Dashboard SHALL show accurate success rates and average response times
4. IF API usage data fails to load, THEN THE Hospital_Dashboard SHALL display an appropriate error message and retry mechanism
5. WHEN usage statistics are displayed, THE Hospital_Dashboard SHALL update the progress bars and visual indicators correctly

### Requirement 2

**User Story:** As a hospital administrator, I want to see performance metrics for my API usage, so that I can understand the quality and reliability of my API access.

#### Acceptance Criteria

1. WHEN performance metrics are requested, THE Hospital_Service SHALL call the backend endpoint to retrieve response time data, success rates, and error counts
2. WHEN metrics are displayed, THE Hospital_Dashboard SHALL show visual indicators for rate limit usage with appropriate color coding
3. WHEN the dashboard refreshes, THE Hospital_Dashboard SHALL update all performance metrics with current data
4. IF performance data is unavailable, THEN THE Hospital_Dashboard SHALL show placeholder values and indicate data loading status
5. WHEN metrics exceed thresholds, THE Hospital_Dashboard SHALL display warning indicators for high usage or low success rates

### Requirement 3

**User Story:** As a hospital administrator, I want the logout button to work properly, so that I can securely end my session and protect my account.

#### Acceptance Criteria

1. WHEN the logout button is clicked, THE Auth_Service SHALL clear all authentication tokens from local storage
2. WHEN logout is initiated, THE Auth_Service SHALL update the authentication state to logged out
3. WHEN logout completes, THE Hospital_Dashboard SHALL redirect the user to the hospital login page
4. WHEN logout occurs, THE Auth_Service SHALL clear the current user subject and observable
5. IF logout fails, THEN THE Hospital_Dashboard SHALL display an error message and allow retry

### Requirement 4

**User Story:** As a hospital administrator, I want to access my hospital profile and API credentials, so that I can manage my account and integrate with the API.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Hospital_Service SHALL fetch the current hospital profile data from the backend
2. WHEN API credentials are displayed, THE Hospital_Dashboard SHALL show the API key and provide secure access to the API secret
3. WHEN the copy button is clicked, THE Hospital_Dashboard SHALL copy credentials to clipboard and show confirmation
4. WHEN profile data is requested, THE Hospital_Service SHALL handle authentication errors and redirect to login if needed
5. IF profile loading fails, THEN THE Hospital_Dashboard SHALL display error messages and provide refresh options

### Requirement 5

**User Story:** As a hospital administrator, I want to see recent API request logs, so that I can track which patient data has been accessed and when.

#### Acceptance Criteria

1. WHEN recent requests are displayed, THE Hospital_Service SHALL fetch the latest API access logs from the backend
2. WHEN request logs are shown, THE Hospital_Dashboard SHALL display patient email, timestamp, status, and response time
3. WHEN no requests exist, THE Hospital_Dashboard SHALL show an appropriate empty state message
4. WHEN request data updates, THE Hospital_Dashboard SHALL refresh the table with new information
5. IF request logs fail to load, THEN THE Hospital_Dashboard SHALL show error state and retry option