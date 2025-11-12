# Requirements Document

## Introduction

This document defines the requirements for a healthcare platform MVP that enables patients to input symptoms, receive static disease predictions, connect with appropriate doctors, and provides role-based access for patients, doctors, and administrators. The system focuses on core functionality that can be implemented within a 2-hour timeframe, representing approximately 40% of the complete platform.

## Glossary

- **Healthcare Platform**: The web-based system that connects patients with doctors through symptom analysis and specialist matching
- **Patient User**: A registered user seeking medical consultation through symptom input
- **Doctor User**: A registered medical professional available for consultations with defined specializations
- **Admin User**: A system administrator with access to user management and platform monitoring
- **Chatbot Interface**: The conversational interface where Patient Users input symptoms in a chat-like format
- **Static Prediction Engine**: A hardcoded disease prediction system that returns predefined results based on symptom patterns
- **Specialist Matching**: The process of recommending Doctor Users based on predicted disease categories
- **User Role**: The access level assigned to each user (Patient, Doctor, or Admin)
- **Subscription**: A paid access tier that Doctor Users must purchase to access the platform features
- **Consultation Session**: A scheduled appointment between Patient User and Doctor User including video call capability
- **Messaging System**: The in-platform communication channel between Patient Users and Doctor Users
- **Feedback System**: The post-consultation rating and review mechanism for both Patient Users and Doctor Users

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a new user, I want to register as either a patient or doctor with role-specific fields, so that I can access appropriate features of the platform

#### Acceptance Criteria

1. WHEN a new user accesses the signup page, THE Healthcare Platform SHALL display common fields for name, date of birth, email, password, and confirm password
2. WHEN a user selects patient role, THE Healthcare Platform SHALL display additional field for blood group
3. WHEN a user selects doctor role, THE Healthcare Platform SHALL display additional fields for degree, speciality, and years of experience
4. WHEN a user submits registration details, THE Healthcare Platform SHALL validate that password and confirm password match
5. WHEN a doctor completes signup, THE Healthcare Platform SHALL redirect to mandatory subscription payment page
6. WHEN a patient completes signup, THE Healthcare Platform SHALL create account and redirect to patient dashboard
7. WHEN a user submits valid login credentials, THE Healthcare Platform SHALL authenticate the user and grant access to role-specific dashboard
8. WHEN admin credentials (admin@gmail.com / admin@123) are submitted, THE Healthcare Platform SHALL grant access to admin dashboard
9. THE Healthcare Platform SHALL store patient data in patients collection, doctor data in doctors collection, and admin data in admins collection
10. THE Healthcare Platform SHALL encrypt user passwords before storing them in the database

### Requirement 2: Patient Profile Management

**User Story:** As a Patient User, I want to create and update my medical profile with personal and medical history information, so that doctors can access my background during consultations

#### Acceptance Criteria

1. WHEN a Patient User accesses their profile page, THE Healthcare Platform SHALL display editable fields for name, age, gender, contact information, and medical history
2. WHEN a Patient User submits updated profile information, THE Healthcare Platform SHALL validate the data and save changes to the database
3. THE Healthcare Platform SHALL require Patient Users to provide age and gender as mandatory fields
4. WHEN a Patient User saves medical history, THE Healthcare Platform SHALL store the information with timestamp for tracking updates

### Requirement 3: Chatbot Symptom Input Interface

**User Story:** As a Patient User, I want to interact with a chatbot to enter my symptoms, so that I can describe my health concerns in a conversational manner

#### Acceptance Criteria

1. WHEN a Patient User logs in successfully, THE Healthcare Platform SHALL redirect to the chatbot interface page
2. THE Healthcare Platform SHALL display a chat-style interface where Patient Users can type symptom descriptions
3. WHEN a Patient User submits a symptom message, THE Healthcare Platform SHALL display the message in the chat history
4. THE Healthcare Platform SHALL accept symptom input as a single text entry for the MVP implementation
5. WHEN a Patient User submits symptoms, THE Healthcare Platform SHALL save the symptom text with timestamp and patient identifier

### Requirement 4: Static Disease Prediction

**User Story:** As a Patient User, I want to receive a ranked list of probable diseases based on my symptoms, so that I understand potential health conditions and can seek appropriate medical care

#### Acceptance Criteria

1. WHEN a Patient User submits symptoms, THE Healthcare Platform SHALL process the input through the Static Prediction Engine
2. THE Healthcare Platform SHALL return a ranked list of up to 5 probable diseases with confidence scores
3. WHEN displaying prediction results, THE Healthcare Platform SHALL show disease name, confidence score as percentage, and brief description
4. THE Healthcare Platform SHALL rank diseases in descending order by confidence score
5. WHERE symptom patterns match predefined rules, THE Healthcare Platform SHALL return corresponding disease predictions from the static dataset

### Requirement 5: Doctor Profile and Specialization

**User Story:** As a Doctor User, I want to create and manage my professional profile with specialization details, so that patients can find me based on their medical needs

#### Acceptance Criteria

1. WHEN a Doctor User accesses their profile page, THE Healthcare Platform SHALL display editable fields for name, specialization, qualifications, experience years, and contact information
2. THE Healthcare Platform SHALL provide predefined specialization options including General Medicine, Cardiology, Neurology, Orthopedics, Dermatology, Pediatrics, Psychiatry
3. WHEN a Doctor User submits profile updates, THE Healthcare Platform SHALL validate and save the information to the database
4. THE Healthcare Platform SHALL require Doctor Users to select at least one specialization
5. WHEN a Doctor User profile is saved, THE Healthcare Platform SHALL make the profile visible to the specialist matching system

### Requirement 6: Specialist Matching and Recommendation with Contact Details

**User Story:** As a Patient User, I want to receive recommendations for suitable registered specialists based on my predicted diseases, so that I can message them for consultation

#### Acceptance Criteria

1. WHEN the Static Prediction Engine returns disease predictions, THE Healthcare Platform SHALL display the predicted disease name below the chatbot conversation
2. THE Healthcare Platform SHALL map each disease to relevant medical specializations
3. THE Healthcare Platform SHALL query the doctors collection for registered Doctor Users with active subscriptions matching the required specializations
4. WHEN displaying doctor recommendations, THE Healthcare Platform SHALL show only registered doctors with doctor name, specialization, degree, years of experience, and qualifications
5. THE Healthcare Platform SHALL display all matching registered doctors in a list format below the disease prediction with message buttons
6. THE Healthcare Platform SHALL exclude any fake or unregistered doctor profiles from recommendations

### Requirement 7: Doctor Subscription System

**User Story:** As a Doctor User, I want to purchase a mandatory subscription to access the platform, so that I can receive patient consultations and use platform features

#### Acceptance Criteria

1. WHEN a Doctor User completes signup, THE Healthcare Platform SHALL redirect to the mandatory subscription payment page
2. THE Healthcare Platform SHALL display subscription plan at 30 rupees per month with payment integration
3. WHEN a Doctor User initiates payment, THE Healthcare Platform SHALL integrate with payment gateway to process UPI payment to 9909232769@superyes
4. WHEN payment is successful, THE Healthcare Platform SHALL activate the doctor account and grant access to doctor dashboard
5. THE Healthcare Platform SHALL prevent doctor access to dashboard features until subscription payment is completed
6. THE Healthcare Platform SHALL store subscription status, payment date, and expiry date in doctors collection

### Requirement 8: Doctor Dashboard and Patient Records

**User Story:** As a Doctor User, I want to view patients who have completed chatbot diagnostics and messaged me, so that I can review their cases and offer consultations

#### Acceptance Criteria

1. WHEN a Doctor User with active subscription accesses their dashboard, THE Healthcare Platform SHALL display messages received from Patient Users
2. WHEN a Patient User completes chatbot diagnosis and sends a message to a doctor, THE Healthcare Platform SHALL add that patient to the doctor patient list
3. THE Healthcare Platform SHALL show patient name, symptoms, predicted disease, and message timestamp for each patient in the list
4. WHEN a Doctor User views a patient record, THE Healthcare Platform SHALL display detailed patient information including full symptom description, disease predictions, and blood group
5. THE Healthcare Platform SHALL display only registered Doctor Users in patient-facing doctor recommendations
6. THE Healthcare Platform SHALL show consultation booking interface on doctor dashboard for each patient conversation

### Requirement 9: Patient-Doctor Messaging System

**User Story:** As a Patient User, I want to send messages to doctors, so that I can discuss my condition and receive medical guidance

#### Acceptance Criteria

1. WHEN a Patient User views recommended doctors after chatbot diagnosis, THE Healthcare Platform SHALL display a message button for each doctor
2. WHEN a Patient User sends a message to a Doctor User, THE Healthcare Platform SHALL save the message with sender, recipient, timestamp, and content
3. WHEN a Doctor User logs in, THE Healthcare Platform SHALL display all messages received from Patient Users on the dashboard
4. THE Healthcare Platform SHALL provide a messaging interface where Patient Users and Doctor Users can exchange text messages
5. THE Healthcare Platform SHALL display message history in chronological order for each conversation
6. THE Healthcare Platform SHALL only allow Patient Users to initiate conversations with registered Doctor Users

### Requirement 10: Consultation Scheduling

**User Story:** As a Doctor User, I want to schedule video consultation appointments with patients, so that we can conduct remote medical consultations

#### Acceptance Criteria

1. WHEN a Doctor User views patient messages on dashboard, THE Healthcare Platform SHALL provide a book consultation button for each patient conversation
2. WHEN a Doctor User clicks book consultation, THE Healthcare Platform SHALL display a scheduling interface with date and time selection
3. WHEN a Doctor User confirms consultation booking, THE Healthcare Platform SHALL create a consultation session with patient identifier, doctor identifier, scheduled date, and scheduled time
4. THE Healthcare Platform SHALL generate a unique video call link for the consultation session
5. WHEN consultation is booked, THE Healthcare Platform SHALL send email notifications with video call link to both patient email and doctor email
6. THE Healthcare Platform SHALL display upcoming consultations on doctor dashboard
7. THE Healthcare Platform SHALL remove patient-side consultation scheduling interface

### Requirement 11: Web-Based Video Consultation

**User Story:** As a Patient User and Doctor User, I want to conduct video consultations through emailed links, so that I can have remote medical consultations

#### Acceptance Criteria

1. WHEN a Doctor User books a consultation, THE Healthcare Platform SHALL generate a unique video call link using web-based video service
2. THE Healthcare Platform SHALL send the video call link via email to both Patient User and Doctor User
3. WHEN a user clicks the video call link from email, THE Healthcare Platform SHALL launch a web-based video call interface
4. THE Healthcare Platform SHALL enable two-way video and audio communication between Patient User and Doctor User
5. THE Healthcare Platform SHALL provide controls for muting audio, disabling video, and ending the call
6. WHEN either user ends the call, THE Healthcare Platform SHALL close the video interface and mark the consultation as completed
7. THE Healthcare Platform SHALL display active and upcoming consultations on doctor dashboard with join call buttons

### Requirement 12: Post-Consultation Feedback System

**User Story:** As a Patient User and Doctor User, I want to provide feedback after consultations, so that the platform can maintain quality and help other users make informed decisions

#### Acceptance Criteria

1. WHEN a consultation session is marked as completed, THE Healthcare Platform SHALL prompt both Patient User and Doctor User to provide feedback
2. THE Healthcare Platform SHALL display a feedback form with rating scale from 1 to 5 stars and optional text comment
3. WHEN a user submits feedback, THE Healthcare Platform SHALL save the rating, comment, consultation identifier, and user identifier
4. THE Healthcare Platform SHALL require feedback submission from both Patient User and Doctor User before closing the consultation workflow
5. THE Healthcare Platform SHALL display average ratings on Doctor User profiles based on collected patient feedback

### Requirement 13: Admin User Management

**User Story:** As an Admin User, I want to view and manage all registered patients and doctors, so that I can maintain the platform and ensure data quality

#### Acceptance Criteria

1. WHEN an Admin User accesses the user management page, THE Healthcare Platform SHALL display separate lists for Patient Users and Doctor Users
2. THE Healthcare Platform SHALL show user details including name, email, registration date, and account status for each user
3. WHEN an Admin User searches for a user by name or email, THE Healthcare Platform SHALL filter the user list to match the search criteria
4. THE Healthcare Platform SHALL allow Admin Users to view detailed profiles for any Patient User or Doctor User
5. WHEN an Admin User views user details, THE Healthcare Platform SHALL display complete profile information and activity history

### Requirement 14: Admin Platform Metrics

**User Story:** As an Admin User, I want to view basic platform statistics and metrics, so that I can monitor system usage and growth

#### Acceptance Criteria

1. WHEN an Admin User accesses the dashboard, THE Healthcare Platform SHALL display total counts for registered patients, registered doctors, and symptom submissions
2. THE Healthcare Platform SHALL calculate and display the total number of disease predictions generated
3. THE Healthcare Platform SHALL show the count of active users who logged in within the last 7 days
4. THE Healthcare Platform SHALL display metrics with automatic refresh when the dashboard page is loaded
5. THE Healthcare Platform SHALL present metrics in a clear visual format with labels and numerical values

### Requirement 15: Role-Based Access Control

**User Story:** As a system user, I want access restricted based on my assigned role, so that sensitive information is protected and users only see relevant features

#### Acceptance Criteria

1. WHEN a Patient User attempts to access doctor or admin features, THE Healthcare Platform SHALL deny access and redirect to patient dashboard
2. WHEN a Doctor User attempts to access admin features, THE Healthcare Platform SHALL deny access and redirect to doctor dashboard
3. WHEN an Admin User accesses the platform, THE Healthcare Platform SHALL grant access to all user management and monitoring features
4. THE Healthcare Platform SHALL verify user role on every protected page request
5. IF a user attempts unauthorized access, THEN THE Healthcare Platform SHALL log the attempt and display an access denied message
