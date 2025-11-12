const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

router.post('/feedback', authenticate, feedbackController.submitFeedback);
router.get('/feedback/doctor/:doctorId', feedbackController.getDoctorFeedback);

module.exports = router;
