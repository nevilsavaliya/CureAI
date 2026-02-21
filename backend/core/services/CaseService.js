const BaseService = require('./BaseService');
const { ValidationError, NotFoundError, AuthorizationError } = require('../errors');

/**
 * Case Service
 * Handles case management business logic
 */
class CaseService extends BaseService {
  /**
   * @param {CaseRepository} caseRepository - Case repository instance
   * @param {Object} dependencies - Service dependencies {doctorRepository, patientRepository, notificationService, socketService}
   */
  constructor(caseRepository, dependencies = {}) {
    super(caseRepository);
    this.doctorRepository = dependencies.doctorRepository;
    this.patientRepository = dependencies.patientRepository;
    this.notificationService = dependencies.notificationService;
    this.socketService = dependencies.socketService;
    this.symptomConversationModel = dependencies.symptomConversationModel;
  }

  /**
   * Create new case
   * @param {string} patientId - Patient ID
   * @param {Object} caseData - Case data
   * @returns {Promise<Object>} Created case
   */
  async createCase(patientId, caseData) {
    try {
      const { doctorId, symptoms, predictedConditions, chatbotHistory, conversationId } = caseData;

      // Validate required fields
      if (!doctorId) {
        throw new ValidationError('Doctor ID is required');
      }

      // Verify doctor exists and has active subscription
      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        throw new NotFoundError('Doctor not found');
      }

      if (doctor.subscriptionStatus !== 'active') {
        throw new ValidationError('Doctor subscription is not active');
      }

      // Check for duplicate pending case with same doctor
      const existingCase = await this.repository.findOne({
        patientId,
        doctorId,
        status: 'pending'
      });

      if (existingCase) {
        throw new ValidationError('You already have a pending case with this doctor');
      }

      // Get patient details
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Initialize case data
      let newCaseData = {
        patientId,
        doctorId,
        symptoms: symptoms || [],
        predictedConditions: predictedConditions || [],
        chatbotHistory: chatbotHistory || [],
        status: 'pending'
      };

      // If conversationId is provided, populate case with conversation data
      if (conversationId && this.symptomConversationModel) {
        const conversation = await this.symptomConversationModel.findById(conversationId);

        if (!conversation) {
          throw new NotFoundError('Symptom conversation not found');
        }

        // Verify conversation belongs to the patient
        if (conversation.patientId.toString() !== patientId) {
          throw new AuthorizationError('Access denied. Conversation does not belong to this patient');
        }

        // Populate case with conversation data
        newCaseData = this._populateCaseFromConversation(newCaseData, conversation);

        // Mark conversation as completed
        await conversation.complete();
      }

      // Create case
      const createdCase = await this.repository.create(newCaseData);

      // Create notification for doctor
      if (this.notificationService) {
        try {
          const notification = await this.notificationService.createNotification({
            userId: doctorId,
            userType: 'doctor',
            type: 'case_request',
            title: 'New Case Request',
            message: `${patient.name} has requested a consultation`,
            caseId: createdCase._id,
            relatedUserId: patientId,
            relatedUserType: 'patient'
          });

          // Broadcast notification via WebSocket
          if (this.socketService) {
            this.socketService.emitNotification(doctorId, notification);
          }
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      // Return populated case
      return await this.repository.findById(createdCase._id, {
        populate: [
          { path: 'patientId', select: 'name email bloodGroup' },
          { path: 'doctorId', select: 'name email degree specializations rating experienceYears' }
        ]
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get cases for user (patient or doctor)
   * @param {string} userId - User ID
   * @param {string} userRole - User role (patient or doctor)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated list of cases
   */
  async getCasesForUser(userId, userRole, filters = {}) {
    try {
      if (!userId || !userRole) {
        throw new ValidationError('User ID and role are required');
      }

      let query = {};

      // Build query based on user role
      if (userRole === 'patient') {
        query.patientId = userId;
      } else if (userRole === 'doctor') {
        query.doctorId = userId;
      } else {
        throw new ValidationError('Invalid user role');
      }

      // Add status filter if provided
      if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
      }

      // Extract pagination parameters
      const page = filters.page || 1;
      const limit = filters.limit || 10;

      // Use repository pagination method
      const result = await this.repository.paginate(query, page, limit, {
        populate: [
          { path: 'patientId', select: 'name email bloodGroup' },
          { path: 'doctorId', select: 'name email degree specializations rating experienceYears' }
        ],
        sort: { createdAt: -1 },
        lean: false // Keep as false to preserve case methods
      });

      return {
        cases: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get case by ID with access control
   * @param {string} caseId - Case ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Object>} Case details
   */
  async getCaseById(caseId, userId, userRole) {
    try {
      if (!caseId) {
        throw new ValidationError('Case ID is required');
      }

      // Fetch case with populated data
      const caseData = await this.repository.findById(caseId, {
        populate: [
          { path: 'patientId', select: 'name email bloodGroup dateOfBirth gender contactNumber medicalHistory allergies' },
          { path: 'doctorId', select: 'name email degree specializations rating experienceYears clinicAddress contactNumber' },
          { path: 'symptomConversationId' }
        ]
      });

      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      // Verify user has access to this case
      const isPatient = userRole === 'patient' && caseData.patientId._id.toString() === userId;
      const isDoctor = userRole === 'doctor' && caseData.doctorId._id.toString() === userId;

      if (!isPatient && !isDoctor) {
        throw new AuthorizationError('Access denied. You do not have permission to view this case');
      }

      // Format conversation data if exists
      return this._formatCaseWithConversation(caseData);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Accept case (doctor only)
   * @param {string} caseId - Case ID
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Updated case
   */
  async acceptCase(caseId, doctorId) {
    try {
      // Fetch case (use lean: false to get Mongoose document with methods)
      const caseData = await this.repository.findById(caseId, { lean: false });
      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      // Verify doctor owns this case
      if (caseData.doctorId.toString() !== doctorId) {
        throw new AuthorizationError('Access denied. You are not authorized to accept this case');
      }

      // Verify case is in pending status
      if (caseData.status !== 'pending') {
        throw new ValidationError(`Cannot accept case with status: ${caseData.status}`);
      }

      // Accept the case
      await caseData.accept();

      // Get patient and doctor details for notification
      const patient = await this.patientRepository.findById(caseData.patientId);
      const doctor = await this.doctorRepository.findById(doctorId);

      // Create notification for patient
      if (this.notificationService) {
        try {
          const notification = await this.notificationService.createNotification({
            userId: caseData.patientId,
            userType: 'patient',
            type: 'case_accepted',
            title: 'Case Accepted',
            message: `Dr. ${doctor.name} has accepted your consultation request`,
            caseId: caseData._id,
            relatedUserId: doctorId,
            relatedUserType: 'doctor'
          });

          // Broadcast notification and case update via WebSocket
          if (this.socketService) {
            this.socketService.emitNotification(caseData.patientId, notification);
            this.socketService.emitCaseUpdated(caseId, {
              status: 'ongoing',
              acceptedAt: caseData.acceptedAt
            });
          }
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      // Return updated case
      return await this.repository.findById(caseId, {
        populate: [
          { path: 'patientId', select: 'name email bloodGroup' },
          { path: 'doctorId', select: 'name email degree specializations rating experienceYears' }
        ]
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Reject case (doctor only)
   * @param {string} caseId - Case ID
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Updated case
   */
  async rejectCase(caseId, doctorId) {
    try {
      // Fetch case (use lean: false to get Mongoose document with methods)
      const caseData = await this.repository.findById(caseId, { lean: false });
      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      // Verify doctor owns this case
      if (caseData.doctorId.toString() !== doctorId) {
        throw new AuthorizationError('Access denied. You are not authorized to reject this case');
      }

      // Verify case is in pending status
      if (caseData.status !== 'pending') {
        throw new ValidationError(`Cannot reject case with status: ${caseData.status}`);
      }

      // Reject the case
      await caseData.reject();

      // Get patient and doctor details for notification
      const patient = await this.patientRepository.findById(caseData.patientId);
      const doctor = await this.doctorRepository.findById(doctorId);

      // Create notification for patient
      if (this.notificationService) {
        try {
          const notification = await this.notificationService.createNotification({
            userId: caseData.patientId,
            userType: 'patient',
            type: 'case_rejected',
            title: 'Case Rejected',
            message: `Dr. ${doctor.name} has declined your consultation request`,
            caseId: caseData._id,
            relatedUserId: doctorId,
            relatedUserType: 'doctor'
          });

          // Broadcast notification and case update via WebSocket
          if (this.socketService) {
            this.socketService.emitNotification(caseData.patientId, notification);
            this.socketService.emitCaseUpdated(caseId, {
              status: 'rejected',
              rejectedAt: caseData.rejectedAt
            });
          }
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      // Return updated case
      return await this.repository.findById(caseId, {
        populate: [
          { path: 'patientId', select: 'name email bloodGroup' },
          { path: 'doctorId', select: 'name email degree specializations rating experienceYears' }
        ]
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Schedule video consultation (doctor only)
   * @param {string} caseId - Case ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} scheduleData - Schedule data {scheduledDate, scheduledTime}
   * @returns {Promise<Object>} Video consultation details
   */
  async scheduleVideoConsultation(caseId, doctorId, scheduleData) {
    try {
      const { scheduledDate, scheduledTime } = scheduleData;

      // Validate required fields
      if (!scheduledDate || !scheduledTime) {
        throw new ValidationError('Scheduled date and time are required');
      }

      // Fetch case (use lean: false to get Mongoose document with methods)
      const caseData = await this.repository.findById(caseId, { lean: false });
      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      // Verify doctor owns this case
      if (caseData.doctorId.toString() !== doctorId) {
        throw new AuthorizationError('Access denied. You are not authorized to schedule consultation for this case');
      }

      // Verify case is in ongoing status
      if (caseData.status !== 'ongoing') {
        throw new ValidationError(`Cannot schedule consultation for case with status: ${caseData.status}`);
      }

      // Generate video link using video service
      const videoService = require('../../services/videoService');
      const { roomId, videoLink } = videoService.generateVideoRoom(`case-${caseId}`);

      // Store video consultation details in case
      caseData.videoConsultation = {
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        videoLink,
        roomId,
        status: 'scheduled'
      };
      await caseData.save();

      // Get patient and doctor details for email
      const patient = await this.patientRepository.findById(caseData.patientId);
      const doctor = await this.doctorRepository.findById(doctorId);

      // Send consultation emails
      try {
        const emailService = require('../../services/emailService');

        const consultationDetails = {
          consultationId: caseId,
          doctorName: doctor.name,
          patientName: patient.name,
          date: scheduledDate,
          time: scheduledTime,
          videoLink: videoLink
        };

        await emailService.sendConsultationEmail(patient.email, consultationDetails, 'patient');
        await emailService.sendConsultationEmail(doctor.email, consultationDetails, 'doctor');
      } catch (emailError) {
        console.error('Error sending consultation emails:', emailError);
      }

      // Create notification for patient
      if (this.notificationService) {
        try {
          const notification = await this.notificationService.createNotification({
            userId: caseData.patientId,
            userType: 'patient',
            type: 'video_consultation_scheduled',
            title: 'Video Consultation Scheduled',
            message: `Dr. ${doctor.name} has scheduled a video consultation on ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}`,
            caseId: caseData._id,
            relatedUserId: doctorId,
            relatedUserType: 'doctor'
          });

          // Broadcast notification via WebSocket
          if (this.socketService) {
            this.socketService.emitNotification(caseData.patientId, notification);
            this.socketService.emitCaseUpdated(caseId, {
              videoConsultation: caseData.videoConsultation
            });
          }
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      return caseData.videoConsultation;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark case as treated (doctor only)
   * @param {string} caseId - Case ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} treatmentData - Treatment data {treatmentNotes, diagnosis, prescription}
   * @returns {Promise<Object>} Updated case
   */
  async markCaseAsTreated(caseId, doctorId, treatmentData) {
    try {
      const { treatmentNotes, diagnosis, prescription } = treatmentData;

      // Fetch case (use lean: false to get Mongoose document with methods)
      const caseData = await this.repository.findById(caseId, { lean: false });
      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      // Verify doctor owns this case
      if (caseData.doctorId.toString() !== doctorId) {
        throw new AuthorizationError('Access denied. You are not authorized to update this case');
      }

      // Verify case is in ongoing status
      if (caseData.status !== 'ongoing') {
        throw new ValidationError(`Cannot mark case as treated with status: ${caseData.status}. Case must be in ongoing status.`);
      }

      // Update treatment information if provided
      if (treatmentNotes) caseData.treatmentNotes = treatmentNotes;
      if (diagnosis) caseData.diagnosis = diagnosis;
      if (prescription) caseData.prescription = prescription;

      // Mark case as treated
      await caseData.markAsTreated();

      // Get patient and doctor details for notification
      const patient = await this.patientRepository.findById(caseData.patientId);
      const doctor = await this.doctorRepository.findById(doctorId);

      // Create notification for patient
      if (this.notificationService) {
        try {
          const notification = await this.notificationService.createNotification({
            userId: caseData.patientId,
            userType: 'patient',
            type: 'case_treated',
            title: 'Treatment Completed',
            message: `Dr. ${doctor.name} has marked your case as treated. Please provide feedback`,
            caseId: caseData._id,
            relatedUserId: doctorId,
            relatedUserType: 'doctor'
          });

          // Broadcast notification and case update via WebSocket
          if (this.socketService) {
            this.socketService.emitNotification(caseData.patientId, notification);
            this.socketService.emitCaseUpdated(caseId, {
              status: 'treated',
              treatedAt: caseData.treatedAt,
              treatmentNotes: caseData.treatmentNotes,
              diagnosis: caseData.diagnosis,
              prescription: caseData.prescription
            });
          }
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      // Return updated case
      return await this.repository.findById(caseId, {
        populate: [
          { path: 'patientId', select: 'name email bloodGroup' },
          { path: 'doctorId', select: 'name email degree specializations rating experienceYears' }
        ]
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Submit feedback for case (patient only)
   * @param {string} caseId - Case ID
   * @param {string} patientId - Patient ID
   * @param {Object} feedbackData - Feedback data {rating, comment}
   * @returns {Promise<Object>} Updated case
   */
  async submitFeedback(caseId, patientId, feedbackData) {
    try {
      const { rating, comment } = feedbackData;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5 stars');
      }

      // Fetch case (use lean: false to get Mongoose document with methods)
      const caseData = await this.repository.findById(caseId, { lean: false });
      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      // Verify patient owns this case
      if (caseData.patientId.toString() !== patientId) {
        throw new AuthorizationError('Access denied. You are not authorized to provide feedback for this case');
      }

      // Verify case is treated
      if (caseData.status !== 'treated') {
        throw new ValidationError('Feedback can only be submitted for treated cases');
      }

      // Check if feedback already exists
      if (caseData.feedback && caseData.feedback.rating) {
        throw new ValidationError('Feedback has already been submitted for this case. Feedback cannot be modified to preserve case integrity.');
      }

      // Add feedback to case
      await caseData.addFeedback(rating, comment || '');

      // Update doctor's average rating
      const doctor = await this.doctorRepository.findById(caseData.doctorId);
      if (doctor) {
        await this.doctorRepository.updateRating(caseData.doctorId, rating);

        // Create notification for doctor
        if (this.notificationService) {
          try {
            const patient = await this.patientRepository.findById(patientId);
            const notification = await this.notificationService.createNotification({
              userId: caseData.doctorId,
              userType: 'doctor',
              type: 'feedback_received',
              title: 'New Feedback Received',
              message: `${patient.name} has provided feedback (${rating} stars)`,
              caseId: caseData._id,
              relatedUserId: patientId,
              relatedUserType: 'patient'
            });

            // Broadcast notification via WebSocket
            if (this.socketService) {
              this.socketService.emitNotification(caseData.doctorId, notification);
            }
          } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
          }
        }
      }

      // Return updated case
      return await this.repository.findById(caseId, {
        populate: [
          { path: 'patientId', select: 'name email bloodGroup' },
          { path: 'doctorId', select: 'name email degree specializations rating experienceYears totalReviews' }
        ]
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Populate case data from symptom conversation
   * @private
   */
  _populateCaseFromConversation(caseData, conversation) {
    caseData.symptomConversationId = conversation._id;

    // Extract symptoms from conversation
    const conversationSymptoms = [conversation.initialSymptom, ...conversation.extractedSymptoms];
    caseData.symptoms = [...new Set([...caseData.symptoms, ...conversationSymptoms])];

    // Extract predicted conditions from conversation predictions
    if (conversation.predictions && conversation.predictions.length > 0) {
      const conversationConditions = conversation.predictions.map(p => p.disease);
      caseData.predictedConditions = [...new Set([...caseData.predictedConditions, ...conversationConditions])];

      // Store confidence scores
      caseData.predictionConfidence = conversation.predictions.map(p => ({
        condition: p.disease,
        confidence: p.confidence
      }));
    }

    // Convert conversation history to chatbot history format
    const conversationHistory = conversation.questions.map(question => {
      const answer = conversation.answers.find(a => a.questionId === question.questionId);
      return {
        question: question.questionText,
        answer: answer ? answer.answer : 'Not answered',
        timestamp: answer ? answer.answeredAt : question.askedAt
      };
    });

    // Merge with existing chatbot history
    caseData.chatbotHistory = [...caseData.chatbotHistory, ...conversationHistory];

    return caseData;
  }

  /**
   * Format case with conversation data
   * @private
   */
  _formatCaseWithConversation(caseData) {
    const formattedCase = caseData.toObject ? caseData.toObject() : caseData;

    if (caseData.symptomConversationId) {
      const conversation = caseData.symptomConversationId;

      // Format conversation history in chronological order
      const conversationHistory = conversation.questions.map(question => {
        const answer = conversation.answers.find(a => a.questionId === question.questionId);
        return {
          questionId: question.questionId,
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options,
          askedAt: question.askedAt,
          answer: answer ? answer.answer : null,
          answeredAt: answer ? answer.answeredAt : null
        };
      }).sort((a, b) => new Date(a.askedAt) - new Date(b.askedAt));

      // Add formatted conversation data
      formattedCase.symptomConversation = {
        conversationId: conversation._id,
        initialSymptom: conversation.initialSymptom,
        symptomCategory: conversation.symptomCategory,
        conversationHistory,
        extractedSymptoms: conversation.extractedSymptoms,
        predictions: conversation.predictions,
        recommendedDoctors: conversation.recommendedDoctors,
        status: conversation.status,
        createdAt: conversation.createdAt,
        completedAt: conversation.completedAt
      };

      // Remove the raw populated data
      delete formattedCase.symptomConversationId;
    }

    return formattedCase;
  }

  /**
   * Get entity name for error messages
   * @returns {string} Entity name
   */
  getEntityName() {
    return 'Case';
  }
}

module.exports = CaseService;
