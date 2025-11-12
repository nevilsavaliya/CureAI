const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate, authorize } = require('../middleware/auth');

// Patient profile routes
router.post('/patients/profile', authenticate, authorize('patient'), profileController.savePatientProfile);
router.put('/patients/profile/:id', authenticate, authorize('patient'), profileController.savePatientProfile);

// Doctor profile routes
router.post('/doctors/profile', authenticate, authorize('doctor'), profileController.saveDoctorProfile);
router.put('/doctors/profile/:id', authenticate, authorize('doctor'), profileController.saveDoctorProfile);

// Get profile (auto-detect based on role)
router.get('/profiles/:userId', authenticate, profileController.getProfile);
router.get('/profiles', authenticate, profileController.getProfile);

module.exports = router;
