const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { authenticate } = require('../middleware/auth');

router.post('/consultations', authenticate, consultationController.scheduleConsultation);
router.get('/consultations/:role/:userId', authenticate, consultationController.getConsultations);
router.get('/consultations/:role', authenticate, consultationController.getConsultations);
router.put('/consultations/:id', authenticate, consultationController.updateConsultation);
router.post('/consultations/:id/join', authenticate, consultationController.joinConsultation);

// Public endpoint for video link access (from email)
router.get('/video/join/:consultationId', consultationController.getVideoLink);

module.exports = router;
