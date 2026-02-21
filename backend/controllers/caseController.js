const { asyncHandler, sendSuccess, sendCreated, sendForbidden } = require('../core/controllers');
const CaseService = require('../core/services/CaseService');
const CaseRepository = require('../core/repositories/CaseRepository');
const DoctorRepository = require('../core/repositories/DoctorRepository');
const PatientRepository = require('../core/repositories/PatientRepository');
const NotificationRepository = require('../core/repositories/NotificationRepository');
const NotificationService = require('../core/services/NotificationService');
const Case = require('../models/Case');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const SymptomConversation = require('../models/SymptomConversation');
const socketService = require('../services/socketService');

// Initialize repositories
const caseRepository = new CaseRepository(Case);
const doctorRepository = new DoctorRepository(Doctor);
const patientRepository = new PatientRepository(Patient);
const notificationRepository = new NotificationRepository();

// Initialize notification service
const notificationService = new NotificationService(notificationRepository);

// Initialize CaseService
const caseService = new CaseService(caseRepository, {
  doctorRepository,
  patientRepository,
  notificationService,
  socketService,
  symptomConversationModel: SymptomConversation
});

// Create new case (patient requests consultation)
exports.createCase = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const caseData = req.body;

  const createdCase = await caseService.createCase(patientId, caseData);

  return sendCreated(res, { case: createdCase }, 'Case created successfully');
});

// Get all cases for user (patient or doctor)
exports.getCases = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { status, page = 1, limit = 10 } = req.query;

  // Parse pagination parameters
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50); // Max 50 items per page

  const result = await caseService.getCasesForUser(userId, userRole, {
    status,
    page: pageNum,
    limit: limitNum
  });

  return sendSuccess(res, result, 'Cases retrieved successfully');
});

// Get case details by ID
exports.getCaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const caseData = await caseService.getCaseById(id, userId, userRole);

  return sendSuccess(res, { case: caseData }, 'Case retrieved successfully');
});

// Accept case (doctor)
exports.acceptCase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.id;
  const userRole = req.user.role;

  // Verify user is a doctor
  if (userRole !== 'doctor') {
    return sendForbidden(res, 'Only doctors can accept cases');
  }

  const updatedCase = await caseService.acceptCase(id, doctorId);

  return sendSuccess(res, { case: updatedCase }, 'Case accepted successfully');
});

// Reject case (doctor)
exports.rejectCase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.id;
  const userRole = req.user.role;

  // Verify user is a doctor
  if (userRole !== 'doctor') {
    return sendForbidden(res, 'Only doctors can reject cases');
  }

  const updatedCase = await caseService.rejectCase(id, doctorId);

  return sendSuccess(res, { case: updatedCase }, 'Case rejected successfully');
});

// Schedule video consultation for case (doctor)
exports.scheduleVideoConsultation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.id;
  const userRole = req.user.role;
  const { scheduledDate, scheduledTime } = req.body;

  // Verify user is a doctor
  if (userRole !== 'doctor') {
    return sendForbidden(res, 'Only doctors can schedule video consultations');
  }

  const videoConsultation = await caseService.scheduleVideoConsultation(id, doctorId, {
    scheduledDate,
    scheduledTime
  });

  return sendSuccess(res, { videoConsultation }, 'Video consultation scheduled successfully');
});

// Mark case as treated (doctor)
exports.markCaseAsTreated = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.id;
  const userRole = req.user.role;
  const { treatmentNotes, diagnosis, prescription } = req.body;

  // Verify user is a doctor
  if (userRole !== 'doctor') {
    return sendForbidden(res, 'Only doctors can mark cases as treated');
  }

  const updatedCase = await caseService.markCaseAsTreated(id, doctorId, {
    treatmentNotes,
    diagnosis,
    prescription
  });

  return sendSuccess(res, { case: updatedCase }, 'Case marked as treated successfully');
});

// Submit feedback for case (patient)
exports.submitFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;
  const userRole = req.user.role;
  const { rating, comment } = req.body;

  // Verify user is a patient
  if (userRole !== 'patient') {
    return sendForbidden(res, 'Only patients can submit feedback');
  }

  const updatedCase = await caseService.submitFeedback(id, patientId, {
    rating,
    comment
  });

  return sendSuccess(res, { case: updatedCase }, 'Feedback submitted successfully');
});
