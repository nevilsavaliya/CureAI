# Case Management & Real-time Messaging System - Requirements

## Introduction

This feature implements a comprehensive case management system that allows patients to request consultations from doctors, enables doctors to accept/reject cases, provides real-time bidirectional messaging, tracks treatment status, and maintains historical records of all consultations.

## Glossary

- **Case**: A consultation request from a patient to a doctor, including all messages, treatment status, and medical history
- **Treatment Status**: The current state of a case (pending, ongoing, treated, rejected)
- **Real-time Messaging**: Instant message delivery without page refresh using WebSocket or polling
- **Notification System**: Alert mechanism for case status updates and new messages
- **Case History**: Complete record of past and present cases with all associated data

## Requirements

### Requirement 1: Patient Case Request System

**User Story:** As a patient, I want to select a doctor and request a consultation, so that I can receive medical advice for my condition

#### Acceptance Criteria

1. WHEN a patient views the doctor list, THE System SHALL display only active subscribed doctors with their specialization, degree, experience, and rating
2. WHEN a patient selects a doctor, THE System SHALL create a new case with status "pending" and send a notification to the selected doctor
3. WHEN a case is created, THE System SHALL include the patient's chatbot diagnostic data, predicted conditions, blood group, and symptoms
4. THE System SHALL prevent patients from creating duplicate pending cases with the same doctor
5. WHEN a case is created, THE System SHALL display a confirmation message to the patient with case ID

### Requirement 2: Doctor Case Acceptance/Rejection

**User Story:** As a doctor, I want to review and accept or reject patient case requests, so that I can manage my workload effectively

#### Acceptance Criteria

1. WHEN a new case request arrives, THE System SHALL display a notification icon in the doctor's dashboard header
2. WHEN a doctor clicks the notification icon, THE System SHALL display all pending case requests with patient information
3. WHEN a doctor views a pending case, THE System SHALL show patient details including symptoms, predicted conditions, blood group, and chatbot history
4. WHEN a doctor accepts a case, THE System SHALL update case status to "ongoing" and notify the patient
5. WHEN a doctor rejects a case, THE System SHALL update case status to "rejected" and notify the patient
6. WHEN a case is accepted or rejected, THE System SHALL remove it from the pending notifications list

### Requirement 3: Cases Dashboard for Patients

**User Story:** As a patient, I want to view all my past and present cases in one place, so that I can track my medical history

#### Acceptance Criteria

1. WHEN a patient clicks the "Cases" link in the header, THE System SHALL navigate to a cases dashboard page
2. THE System SHALL display a sidebar listing all cases (past and present) with doctor name, date, and status
3. WHEN a patient selects a case from the sidebar, THE System SHALL display case details including treatment status, all messages, doctor information (email, degree, specialization, rating), and consultation history
4. THE System SHALL show treatment status as "Pending", "Ongoing", or "Treated" with appropriate visual indicators
5. WHEN a case status is "Treated", THE System SHALL display a feedback form for the patient to rate and review the doctor

### Requirement 4: Cases Dashboard for Doctors

**User Story:** As a doctor, I want to view all my patient cases in one organized interface, so that I can manage treatments efficiently

#### Acceptance Criteria

1. WHEN a doctor clicks the "Cases" link in the header, THE System SHALL navigate to a cases dashboard page
2. THE System SHALL display a sidebar listing all accepted cases with patient name, date, and treatment status
3. WHEN a doctor selects a case from the sidebar, THE System SHALL display patient details including all messages, treatment status, chatbot diagnostic data, predicted conditions, blood group, and email
4. WHEN viewing an ongoing case, THE System SHALL provide an option to mark the case as "Treated"
5. WHEN a doctor marks a case as treated, THE System SHALL update the status and notify the patient to provide feedback

### Requirement 5: Real-time Bidirectional Messaging

**User Story:** As a patient or doctor, I want to send and receive messages instantly without refreshing the page, so that I can have smooth conversations

#### Acceptance Criteria

1. WHEN a user sends a message in a case, THE System SHALL deliver the message to the recipient in real-time without page refresh
2. THE System SHALL display messages in chronological order with sender name, timestamp, and message content
3. WHEN a new message arrives, THE System SHALL display it immediately in the conversation thread
4. THE System SHALL show a typing indicator when the other party is composing a message
5. THE System SHALL maintain message history and display all past messages when a case is opened
6. THE System SHALL support message delivery using WebSocket connections or polling mechanism
7. WHEN a user is offline, THE System SHALL queue messages and deliver them when the user comes online

### Requirement 6: Notification System

**User Story:** As a patient or doctor, I want to receive notifications about case status changes and new messages, so that I stay informed

#### Acceptance Criteria

1. THE System SHALL display a notification icon in the dashboard header for both patients and doctors
2. WHEN a patient's case status changes, THE System SHALL create a notification visible in the patient's notification panel
3. WHEN a doctor receives a new case request, THE System SHALL create a notification visible in the doctor's notification panel
4. THE System SHALL display notification count badge on the notification icon
5. WHEN a user clicks a notification, THE System SHALL navigate to the relevant case or action
6. THE System SHALL mark notifications as read when viewed
7. THE System SHALL show notification types: "Case Accepted", "Case Rejected", "Case Marked as Treated", "New Case Request"

### Requirement 7: Treatment Status Management

**User Story:** As a doctor, I want to update treatment status from ongoing to treated, so that I can properly close completed cases

#### Acceptance Criteria

1. WHEN viewing an ongoing case, THE System SHALL display a "Mark as Treated" button for doctors
2. WHEN a doctor clicks "Mark as Treated", THE System SHALL show a confirmation dialog
3. WHEN confirmed, THE System SHALL update the case status to "Treated" and timestamp the completion
4. THE System SHALL notify the patient that their case has been marked as treated
5. THE System SHALL trigger a feedback request to the patient after marking as treated
6. THE System SHALL prevent further status changes once a case is marked as treated

### Requirement 8: Case History and Medical Records

**User Story:** As a patient, I want to view my complete medical history including past consultations, so that I can track my health journey

#### Acceptance Criteria

1. THE System SHALL maintain a complete history of all cases for each patient
2. WHEN viewing a case, THE System SHALL display the original chatbot diagnostic data and predicted conditions
3. THE System SHALL show all consultation messages exchanged between patient and doctor
4. THE System SHALL display treatment timeline with status changes and timestamps
5. THE System SHALL allow patients to export or print their case history
6. THE System SHALL preserve case data even after treatment completion for future reference

### Requirement 9: Doctor Rating and Feedback

**User Story:** As a patient, I want to rate and provide feedback for doctors after treatment, so that I can help other patients make informed decisions

#### Acceptance Criteria

1. WHEN a case is marked as treated, THE System SHALL prompt the patient to provide feedback
2. THE System SHALL allow patients to rate doctors on a 5-star scale
3. THE System SHALL allow patients to write text feedback about their experience
4. WHEN feedback is submitted, THE System SHALL update the doctor's overall rating
5. THE System SHALL display doctor ratings on the doctor list and case details
6. THE System SHALL calculate average rating from all patient feedback

### Requirement 10: Case List and Filtering

**User Story:** As a patient or doctor, I want to filter and search through my cases, so that I can quickly find specific consultations

#### Acceptance Criteria

1. THE System SHALL provide filter options for case status (All, Pending, Ongoing, Treated, Rejected)
2. THE System SHALL allow users to search cases by doctor/patient name or date
3. THE System SHALL sort cases by date (newest first by default)
4. THE System SHALL display case count for each status category
5. THE System SHALL highlight unread messages in the case list
