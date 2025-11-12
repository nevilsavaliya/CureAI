const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptomController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/symptoms', authenticate, authorize('patient'), symptomController.submitSymptom);
router.get('/symptoms/patient/:patientId', authenticate, symptomController.getSymptoms);
router.get('/predictions/:patientId', authenticate, symptomController.getPredictions);

module.exports = router;
