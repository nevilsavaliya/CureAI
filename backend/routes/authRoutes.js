const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const emailVerificationController = require('../controllers/emailVerificationController');
const { authenticate } = require('../middleware/auth');
const { validateDateOfBirth } = require('../core/middleware');

// Validation middleware for patient signup
const validatePatientSignup = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group')
];

// Validation middleware for doctor signup
const validateDoctorSignup = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
  body('degree').trim().notEmpty().withMessage('Degree is required'),
  body('speciality').isIn(['General Medicine', 'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Psychiatry', 'Internal Medicine']).withMessage('Invalid speciality'),
  body('experienceYears').isInt({ min: 0 }).withMessage('Experience years must be a positive number')
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Email Verification Routes
router.post('/send-verification-otp', emailVerificationController.sendVerificationOTP);
router.post('/verify-otp', emailVerificationController.verifyOTP);
router.post('/resend-otp', emailVerificationController.resendOTP);

// Routes
router.post('/signup/patient', validatePatientSignup, validateDateOfBirth, authController.signupPatient);
router.post('/signup/doctor', validateDoctorSignup, validateDateOfBirth, authController.signupDoctor);
router.post('/login', validateLogin, authController.login);
router.get('/verify', authenticate, authController.verify);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
