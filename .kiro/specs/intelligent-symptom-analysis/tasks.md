# Implementation Plan

- [x] 1. Create SymptomConversation data model
  - Create Mongoose schema for symptom conversations with questions, answers, and predictions
  - Add indexes for efficient querying by patientId and status
  - Implement schema validation for question types and answer formats
  - _Requirements: 1.2, 1.3, 6.1, 6.4_

- [x] 2. Implement Question Generator service
  - [x] 2.1 Create question template database with categorized questions
    - Define question templates for respiratory, cardiovascular, gastrointestinal, neurological, and musculoskeletal categories
    - Include question types (multiple_choice, yes_no, scale, text) with appropriate options
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Implement question generation logic
    - Write method to generate questions based on symptom category
    - Implement question filtering to avoid duplicates
    - Add question prioritization based on diagnostic value
    - _Requirements: 2.1, 2.5_

  - [x] 2.3 Create symptom category detection
    - Implement logic to categorize initial symptoms into appropriate medical categories
    - Add fallback to general category for unrecognized symptoms
    - _Requirements: 2.1_

- [x] 3. Build Symptom Conversation Engine service
  - [x] 3.1 Implement conversation initialization
    - Create method to start new conversation with initial symptom
    - Detect symptom category and generate first set of follow-up questions
    - Store conversation in database
    - _Requirements: 1.1, 2.1_

  - [x] 3.2 Implement answer submission and storage
    - Create method to store patient answers linked to questions
    - Update conversation state after each answer
    - Extract additional symptoms from text answers
    - _Requirements: 1.2, 6.4_

  - [x] 3.3 Implement conversation state management
    - Create method to check if enough information collected (minimum 3 answers)
    - Generate symptom profile from conversation data
    - Mark conversation as completed when prediction is generated
    - _Requirements: 1.3, 1.4_

  - [x] 3.4 Create conversation history retrieval
    - Implement method to fetch complete conversation with Q&A pairs
    - Format data for display in chronological order
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Develop Enhanced Prediction Service
  - [x] 4.1 Implement confidence score calculation
    - Create algorithm to calculate confidence based on symptom matches
    - Weight primary symptoms (40%), secondary symptoms (30%), follow-up answers (20%), duration (10%)
    - Ensure scores range from 0-100
    - _Requirements: 7.1, 7.2_

  - [x] 4.2 Enhance disease prediction with confidence
    - Modify prediction logic to analyze complete symptom profile
    - Calculate confidence for each predicted disease
    - Sort predictions by confidence score
    - _Requirements: 1.4, 7.1, 7.4_

  - [x] 4.3 Implement prediction recalculation
    - Create method to update predictions when new answers added
    - Recalculate confidence scores with additional information
    - _Requirements: 1.5, 7.3_

  - [x] 4.4 Add low confidence handling
    - Display disclaimer when all predictions below 50% confidence
    - Recommend General Medicine consultation for low confidence cases
    - _Requirements: 7.5_

- [x] 5. Create Universal Doctor Matcher service
  - [x] 5.1 Implement General Medicine category logic
    - Create method to identify General Medicine doctors
    - Ensure General Medicine doctors included in all recommendations
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 5.2 Build doctor filtering with specialization matching
    - Create query to fetch doctors matching predicted specializations OR General Medicine
    - Filter by active subscription and account status
    - _Requirements: 3.3, 4.2, 4.4_

  - [x] 5.3 Implement doctor sorting by relevance
    - Sort specialized doctors before General Medicine doctors
    - Within each group, sort by rating then experience
    - _Requirements: 3.4, 4.1_

  - [x] 5.4 Add minimum doctor guarantee
    - Implement fallback to ensure at least one doctor returned
    - Default to General Medicine doctors if no specialized doctors found
    - _Requirements: 3.5, 4.5_

- [x] 6. Update Case model and controller
  - [x] 6.1 Add symptomConversationId field to Case model
    - Add reference to SymptomConversation in Case schema
    - Add predictionConfidence array field
    - Update indexes
    - _Requirements: 6.1_

  - [x] 6.2 Modify case creation to use conversation data
    - Update createCase controller to accept conversationId
    - Populate case with conversation history and predictions
    - Store confidence scores in case record
    - _Requirements: 6.1, 6.2, 7.1_

  - [x] 6.3 Update case retrieval to include conversation
    - Modify getCaseById to populate symptom conversation
    - Format conversation data for doctor view
    - _Requirements: 6.2, 6.3_

- [x] 7. Create API endpoints for symptom conversation
  - [x] 7.1 Create POST /api/symptoms/conversation endpoint
    - Accept initial symptom and create new conversation
    - Return conversation ID and first set of follow-up questions
    - _Requirements: 1.1, 2.1_

  - [x] 7.2 Create POST /api/symptoms/conversation/:id/answer endpoint
    - Accept answer for specific question
    - Return next questions or completion status
    - _Requirements: 1.2, 1.3_

  - [x] 7.3 Create GET /api/symptoms/conversation/:id/prediction endpoint
    - Generate predictions with confidence scores
    - Return recommended doctors (specialized + General Medicine)
    - _Requirements: 1.4, 3.2, 3.3, 7.1_

  - [x] 7.4 Create GET /api/symptoms/conversation/:id endpoint
    - Return complete conversation history
    - Include questions, answers, and predictions
    - _Requirements: 6.1, 6.2_

- [x] 8. Update doctor recommendation endpoint
  - [x] 8.1 Modify GET /api/doctors/recommended endpoint
    - Integrate Universal Doctor Matcher service
    - Include General Medicine doctors in all responses
    - Add relevance scoring to response
    - _Requirements: 3.2, 3.3, 3.4, 4.1_

  - [x] 8.2 Add specialization filter parameter
    - Accept specialization array in query params
    - Always append General Medicine to filter
    - _Requirements: 3.2, 4.4_

- [x] 9. Create database cleanup script
  - [x] 9.1 Implement cleanup utility
    - Create script to remove messages and conversations
    - Add options for selective cleanup (messages, conversations, cases)
    - Implement dry-run mode for testing
    - _Requirements: 5.1, 5.4_

  - [x] 9.2 Add data preservation logic
    - Preserve user accounts, doctor profiles, hospital data
    - Preserve admin accounts and system configuration
    - Clear extracted symptoms from patient records
    - _Requirements: 5.2, 5.3_

  - [x] 9.3 Implement logging and confirmation
    - Log all cleanup operations with timestamps
    - Display affected record counts
    - Require confirmation before execution
    - _Requirements: 5.4, 5.5_

  - [x] 9.4 Create cleanup command
    - Add npm script to run cleanup utility
    - Document usage and options in README
    - _Requirements: 5.1_

- [x] 10. Update frontend components
  - [x] 10.1 Create symptom conversation UI component
    - Build interface to display follow-up questions
    - Implement answer input forms (multiple choice, yes/no, scale, text)
    - Show progress indicator (questions answered / total)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 10.2 Update prediction display with confidence
    - Show confidence percentage for each predicted condition
    - Display confidence as visual indicator (progress bar or badge)
    - Show disclaimer for low confidence predictions
    - _Requirements: 7.1, 7.4, 7.5_

  - [x] 10.3 Enhance doctor list to show General Medicine
    - Add badge or indicator for General Medicine doctors
    - Group doctors by specialization type (specialized vs general)
    - Update sorting to show specialized doctors first
    - _Requirements: 3.2, 3.4, 4.1_

  - [x] 10.4 Update case view to show conversation history
    - Display complete Q&A transcript in case details
    - Show confidence scores for predictions
    - Format conversation in chronological order
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. Integration and end-to-end testing
  - [x] 11.1 Test complete symptom conversation flow
    - Test conversation initialization with various symptoms
    - Verify follow-up questions are contextual and relevant
    - Test answer submission and state management
    - _Requirements: 1.1, 1.2, 1.3, 2.1_

  - [x] 11.2 Test prediction generation with confidence
    - Verify confidence scores calculated correctly
    - Test with various symptom combinations
    - Verify low confidence disclaimer appears
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [x] 11.3 Test doctor recommendations
    - Verify General Medicine doctors always included
    - Test specialization filtering
    - Verify doctor sorting by relevance
    - _Requirements: 3.2, 3.3, 3.4, 4.1_

  - [x] 11.4 Test case creation with conversation
    - Create case from completed conversation
    - Verify conversation data stored in case
    - Test doctor view of conversation history
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 11.5 Test database cleanup script
    - Run cleanup in dry-run mode
    - Verify data preservation
    - Execute actual cleanup and verify results
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
