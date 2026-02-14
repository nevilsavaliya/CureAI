const Case = require('../models/Case');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');

// Create new case (patient requests consultation)
exports.createCase = async (req, res) => {
  try {
    const { doctorId, symptoms, predictedConditions, chatbotHistory, conversationId } = req.body;
    const patientId = req.user.id;

    // Validate required fields
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    // Verify doctor exists and has active subscription
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.subscriptionStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Doctor subscription is not active'
      });
    }

    // Check for duplicate pending case with same doctor
    const existingCase = await Case.findOne({
      patientId,
      doctorId,
      status: 'pending'
    });

    if (existingCase) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending case with this doctor',
        caseId: existingCase._id
      });
    }

    // Get patient details for the case
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Initialize case data
    let caseData = {
      patientId,
      doctorId,
      symptoms: symptoms || [],
      predictedConditions: predictedConditions || [],
      chatbotHistory: chatbotHistory || [],
      status: 'pending'
    };

    // If conversationId is provided, populate case with conversation data
    if (conversationId) {
      const SymptomConversation = require('../models/SymptomConversation');
      const conversation = await SymptomConversation.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Symptom conversation not found'
        });
      }

      // Verify conversation belongs to the patient
      if (conversation.patientId.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Conversation does not belong to this patient'
        });
      }

      // Populate case with conversation data
      caseData.symptomConversationId = conversationId;
      
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
      
      // Mark conversation as completed
      await conversation.complete();
    }

    // Create new case
    const newCase = new Case(caseData);
    await newCase.save();

    // Create notification for doctor
    const notification = await Notification.createNotification({
      userId: doctorId,
      userType: 'doctor',
      type: 'case_request',
      title: 'New Case Request',
      message: `${patient.name} has requested a consultation`,
      caseId: newCase._id,
      relatedUserId: patientId,
      relatedUserType: 'patient'
    });

    // Broadcast notification via WebSocket
    try {
      socketService.emitNotification(doctorId, notification);
    } catch (socketError) {
      console.error('Failed to broadcast notification via WebSocket:', socketError);
    }

    // Populate case with doctor and patient details
    const populatedCase = await Case.findById(newCase._id)
      .populate('patientId', 'name email bloodGroup')
      .populate('doctorId', 'name email degree specializations rating experienceYears');

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      case: populatedCase
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create case'
    });
  }
};

// Get all cases for user (patient or doctor)
exports.getCases = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.query;

    let query = {};

    // Build query based on user role
    if (userRole === 'patient') {
      query.patientId = userId;
    } else if (userRole === 'doctor') {
      query.doctorId = userId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch cases with populated data
    const cases = await Case.find(query)
      .populate('patientId', 'name email bloodGroup')
      .populate('doctorId', 'name email degree specializations rating experienceYears')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cases.length,
      cases
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cases'
    });
  }
};

// Get case details by ID
exports.getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch case with populated data
    const caseData = await Case.findById(id)
      .populate('patientId', 'name email bloodGroup dateOfBirth gender contactNumber medicalHistory allergies')
      .populate('doctorId', 'name email degree specializations rating experienceYears clinicAddress contactNumber')
      .populate('symptomConversationId');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify user has access to this case
    const isPatient = userRole === 'patient' && caseData.patientId._id.toString() === userId;
    const isDoctor = userRole === 'doctor' && caseData.doctorId._id.toString() === userId;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this case'
      });
    }

    // Format conversation data for doctor view if conversation exists
    let formattedCase = caseData.toObject();
    
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

    res.status(200).json({
      success: true,
      case: formattedCase
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch case'
    });
  }
};

// Accept case (doctor)
exports.acceptCase = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const userRole = req.user.role;

    // Verify user is a doctor
    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can accept cases'
      });
    }

    // Fetch case
    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify doctor owns this case
    if (caseData.doctorId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to accept this case'
      });
    }

    // Verify case is in pending status
    if (caseData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept case with status: ${caseData.status}`
      });
    }

    // Accept the case
    await caseData.accept();

    // Get patient details for notification
    const patient = await Patient.findById(caseData.patientId);
    const doctor = await Doctor.findById(doctorId);

    // Create notification for patient
    const notification = await Notification.createNotification({
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
    try {
      socketService.emitNotification(caseData.patientId, notification);
      socketService.emitCaseUpdated(id, {
        status: 'ongoing',
        acceptedAt: caseData.acceptedAt
      });
    } catch (socketError) {
      console.error('Failed to broadcast via WebSocket:', socketError);
    }

    // Populate and return updated case
    const updatedCase = await Case.findById(id)
      .populate('patientId', 'name email bloodGroup')
      .populate('doctorId', 'name email degree specializations rating experienceYears');

    res.status(200).json({
      success: true,
      message: 'Case accepted successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('Error accepting case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept case'
    });
  }
};

// Reject case (doctor)
exports.rejectCase = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const userRole = req.user.role;

    // Verify user is a doctor
    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can reject cases'
      });
    }

    // Fetch case
    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify doctor owns this case
    if (caseData.doctorId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to reject this case'
      });
    }

    // Verify case is in pending status
    if (caseData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject case with status: ${caseData.status}`
      });
    }

    // Reject the case
    await caseData.reject();

    // Get patient and doctor details for notification
    const patient = await Patient.findById(caseData.patientId);
    const doctor = await Doctor.findById(doctorId);

    // Create notification for patient
    const notification = await Notification.createNotification({
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
    try {
      socketService.emitNotification(caseData.patientId, notification);
      socketService.emitCaseUpdated(id, {
        status: 'rejected',
        rejectedAt: caseData.rejectedAt
      });
    } catch (socketError) {
      console.error('Failed to broadcast via WebSocket:', socketError);
    }

    // Populate and return updated case
    const updatedCase = await Case.findById(id)
      .populate('patientId', 'name email bloodGroup')
      .populate('doctorId', 'name email degree specializations rating experienceYears');

    res.status(200).json({
      success: true,
      message: 'Case rejected successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('Error rejecting case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject case'
    });
  }
};

// Schedule video consultation for case (doctor)
exports.scheduleVideoConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const userRole = req.user.role;
    const { scheduledDate, scheduledTime } = req.body;

    // Verify user is a doctor
    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can schedule video consultations'
      });
    }

    // Validate required fields
    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date and time are required'
      });
    }

    // Fetch case
    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify doctor owns this case
    if (caseData.doctorId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to schedule consultation for this case'
      });
    }

    // Verify case is in ongoing status
    if (caseData.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: `Cannot schedule consultation for case with status: ${caseData.status}`
      });
    }

    // Generate video link using video service
    const videoService = require('../services/videoService');
    const { roomId, videoLink } = videoService.generateVideoRoom(`case-${id}`);

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
    const patient = await Patient.findById(caseData.patientId);
    const doctor = await Doctor.findById(doctorId);

    // Send consultation emails
    try {
      const emailService = require('../services/emailService');
      
      const consultationDetails = {
        consultationId: id,
        doctorName: doctor.name,
        patientName: patient.name,
        date: scheduledDate,
        time: scheduledTime,
        videoLink: videoLink
      };

      console.log('📧 Sending consultation emails...');
      console.log('Patient email:', patient.email);
      console.log('Doctor email:', doctor.email);
      console.log('Video link:', videoLink);

      // Send email to patient
      await emailService.sendConsultationEmail(patient.email, consultationDetails, 'patient');
      console.log('✅ Patient email sent successfully');
      
      // Send email to doctor
      await emailService.sendConsultationEmail(doctor.email, consultationDetails, 'doctor');
      console.log('✅ Doctor email sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending consultation emails:', emailError);
      console.error('Email error details:', emailError.message);
      // Don't fail the request if email fails
    }

    // Create notification for patient
    const notification = await Notification.createNotification({
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
    try {
      socketService.emitNotification(caseData.patientId, notification);
      socketService.emitCaseUpdated(id, {
        videoConsultation: caseData.videoConsultation
      });
    } catch (socketError) {
      console.error('Failed to broadcast via WebSocket:', socketError);
    }

    res.status(200).json({
      success: true,
      message: 'Video consultation scheduled successfully',
      videoConsultation: caseData.videoConsultation
    });
  } catch (error) {
    console.error('Error scheduling video consultation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule video consultation'
    });
  }
};

// Mark case as treated (doctor)
exports.markCaseAsTreated = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const userRole = req.user.role;
    const { treatmentNotes, diagnosis, prescription } = req.body;

    // Verify user is a doctor
    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can mark cases as treated'
      });
    }

    // Fetch case
    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify doctor owns this case
    if (caseData.doctorId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to update this case'
      });
    }

    // Verify case is in ongoing status
    // Once treated, cases become read-only to preserve complete medical history
    if (caseData.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark case as treated with status: ${caseData.status}. Case must be in ongoing status.`
      });
    }

    // Update treatment information if provided
    if (treatmentNotes) caseData.treatmentNotes = treatmentNotes;
    if (diagnosis) caseData.diagnosis = diagnosis;
    if (prescription) caseData.prescription = prescription;

    // Mark case as treated
    await caseData.markAsTreated();

    // Get patient and doctor details for notification
    const patient = await Patient.findById(caseData.patientId);
    const doctor = await Doctor.findById(doctorId);

    // Create notification for patient (feedback request)
    const notification = await Notification.createNotification({
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
    try {
      socketService.emitNotification(caseData.patientId, notification);
      socketService.emitCaseUpdated(id, {
        status: 'treated',
        treatedAt: caseData.treatedAt,
        treatmentNotes: caseData.treatmentNotes,
        diagnosis: caseData.diagnosis,
        prescription: caseData.prescription
      });
    } catch (socketError) {
      console.error('Failed to broadcast via WebSocket:', socketError);
    }

    // Populate and return updated case
    const updatedCase = await Case.findById(id)
      .populate('patientId', 'name email bloodGroup')
      .populate('doctorId', 'name email degree specializations rating experienceYears');

    res.status(200).json({
      success: true,
      message: 'Case marked as treated successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('Error marking case as treated:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark case as treated'
    });
  }
};

// Submit feedback for case (patient)
exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;
    const userRole = req.user.role;
    const { rating, comment } = req.body;

    // Verify user is a patient
    if (userRole !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can submit feedback'
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5 stars'
      });
    }

    // Fetch case
    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify patient owns this case
    if (caseData.patientId.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to provide feedback for this case'
      });
    }

    // Verify case is treated
    if (caseData.status !== 'treated') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for treated cases'
      });
    }

    // Check if feedback already exists - preserve original feedback, no modifications allowed
    if (caseData.feedback && caseData.feedback.rating) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this case. Feedback cannot be modified to preserve case integrity.'
      });
    }

    // Add feedback to case
    await caseData.addFeedback(rating, comment || '');

    // Update doctor's average rating
    const doctor = await Doctor.findById(caseData.doctorId);
    if (doctor) {
      // Calculate new average rating
      const totalRating = (doctor.rating * doctor.totalReviews) + rating;
      const newTotalReviews = doctor.totalReviews + 1;
      const newAverageRating = totalRating / newTotalReviews;

      doctor.rating = Math.round(newAverageRating * 10) / 10; // Round to 1 decimal
      doctor.totalReviews = newTotalReviews;
      await doctor.save();

      // Create notification for doctor
      const patient = await Patient.findById(patientId);
      const notification = await Notification.createNotification({
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
      try {
        socketService.emitNotification(caseData.doctorId, notification);
      } catch (socketError) {
        console.error('Failed to broadcast notification via WebSocket:', socketError);
      }
    }

    // Populate and return updated case
    const updatedCase = await Case.findById(id)
      .populate('patientId', 'name email bloodGroup')
      .populate('doctorId', 'name email degree specializations rating experienceYears totalReviews');

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit feedback'
    });
  }
};
