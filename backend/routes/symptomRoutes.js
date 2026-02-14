const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptomController');
const { authenticate, authorize } = require('../middleware/auth');

// Legacy symptom endpoints
router.post('/symptoms', authenticate, authorize('patient'), symptomController.submitSymptom);
router.get('/symptoms/patient/:patientId', authenticate, symptomController.getSymptoms);
router.get('/predictions/:patientId', authenticate, symptomController.getPredictions);

// Symptom conversation endpoints
router.post('/symptoms/conversation', authenticate, authorize('patient'), symptomController.startConversation);
router.post('/symptoms/conversation/:id/answer', authenticate, authorize('patient'), symptomController.submitAnswer);
router.get('/symptoms/conversation/:id/prediction', authenticate, symptomController.getPrediction);
router.get('/symptoms/conversation/:id', authenticate, symptomController.getConversationHistory);

module.exports = router;
