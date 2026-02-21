const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const {
  validateCaseCreation,
  validateMessageContent,
  validateCaseId,
  validateMessageId,
  validateFeedback,
  validateTreatmentData,
  validatePagination,
  validateStatusFilter,
  validateObjectId,
  sanitizeBody
} = require('../core/middleware');
const {
  rateLimitMessages,
  validateCaseAuthorization
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Apply input sanitization to all routes
router.use(sanitizeBody());

// Case management routes
router.post('/cases', 
  validateCaseAuthorization(['patient']),
  validateCaseCreation, 
  caseController.createCase
);

router.get('/cases', 
  validateStatusFilter,
  caseController.getCases
);

router.get('/cases/:id', 
  validateCaseId,
  caseController.getCaseById
);

router.put('/cases/:id/accept', 
  validateCaseAuthorization(['doctor']),
  validateCaseId,
  caseController.acceptCase
);

router.put('/cases/:id/reject', 
  validateCaseAuthorization(['doctor']),
  validateCaseId,
  caseController.rejectCase
);

router.post('/cases/:id/schedule-consultation',
  validateCaseAuthorization(['doctor']),
  validateCaseId,
  caseController.scheduleVideoConsultation
);

router.put('/cases/:id/mark-treated', 
  validateCaseAuthorization(['doctor']),
  validateCaseId,
  validateTreatmentData,
  caseController.markCaseAsTreated
);

router.post('/cases/:id/feedback', 
  validateCaseAuthorization(['patient']),
  validateCaseId,
  validateFeedback,
  caseController.submitFeedback
);

// Case messaging routes
router.post('/cases/:caseId/messages', 
  validateObjectId('caseId'),
  validateMessageContent,
  rateLimitMessages,
  messageController.sendCaseMessage
);

router.get('/cases/:caseId/messages', 
  validateObjectId('caseId'),
  validatePagination,
  messageController.getCaseMessages
);

router.put('/messages/:id/read', 
  validateMessageId,
  messageController.markCaseMessageAsRead
);

module.exports = router;
