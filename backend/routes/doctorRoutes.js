const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/doctors/match', authenticate, doctorController.matchDoctors);
router.get('/doctors/specializations', doctorController.getAllSpecializations);
router.get('/patients/records/:doctorId', authenticate, authorize('doctor'), doctorController.getPatientRecords);
router.get('/patients/:id', authenticate, doctorController.getPatientDetail);

module.exports = router;
