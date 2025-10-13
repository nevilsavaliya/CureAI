const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const hospitalController = require('../controllers/hospitalController');
const { authenticate, authorize } = require('../middleware/auth');
const { authenticateHospitalApi } = require('../middleware/hospitalApiAuth');
const { rateLimitHospitalApi } = require('../middleware/rateLimiter');
const { uploadHospitalDocuments, handleUploadError } = require('../middleware/upload');

// Validation middleware for hospital registration
const validateHospitalRegistration = [
  body('name').trim().notEmpty().withMessage('Contact person name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('hospitalName').trim().notEmpty().withMessage('Hospital name is required'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.zipCode').optional().trim(),
  body('address.country').optional().trim(),
  body('emergencyContact').optional().trim(),
  body('website').optional().isURL().withMessage('Please provide a valid website URL'),
  body('specializations').optional().isArray().withMessage('Specializations must be an array'),
  body('numberOfBeds').optional().isInt({ min: 0 }).withMessage('Number of beds must be a positive number'),
  body('facilities').optional().isArray().withMessage('Facilities must be an array')
];

// Validation middleware for hospital login
const validateHospitalLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation middleware for patient data API request
const validatePatientDataRequest = [
  body('apiKey').trim().notEmpty().withMessage('API Key is required'),
  body('apiSecret').trim().notEmpty().withMessage('API Secret is required')
];

// Validation middleware for profile update
const validateProfileUpdate = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('hospitalName').optional().trim().notEmpty().withMessage('Hospital name cannot be empty'),
  body('contactNumber').optional().trim().notEmpty().withMessage('Contact number cannot be empty'),
  body('website').optional().isURL().withMessage('Please provide a valid website URL'),
  body('specializations').optional().isArray().withMessage('Specializations must be an array'),
  body('numberOfBeds').optional().isInt({ min: 0 }).withMessage('Number of beds must be a positive number'),
  body('facilities').optional().isArray().withMessage('Facilities must be an array')
];

/**
 * Public Routes
 */

// POST /api/hospitals/register - Hospital Registration
router.post('/register', 
  uploadHospitalDocuments,
  handleUploadError,
  validateHospitalRegistration, 
  hospitalController.registerHospital
);

// POST /api/hospitals/login - Hospital Login
router.post('/login', validateHospitalLogin, hospitalController.loginHospital);

/**
 * API Routes (API Key + Secret Authentication)
 */

// POST /api/hospitals/api/patient-data - Get Patient Data via API
// Apply authentication first, then rate limiting, then validation
router.post('/api/patient-data', 
  authenticateHospitalApi,
  rateLimitHospitalApi,
  validatePatientDataRequest, 
  hospitalController.getPatientData
);

/**
 * Protected Routes (JWT Authentication)
 */

// GET /api/hospitals/profile - Get Hospital Profile
router.get('/profile', authenticate, authorize('hospital'), hospitalController.getProfile);

// PUT /api/hospitals/profile - Update Hospital Profile
router.put('/profile', authenticate, authorize('hospital'), validateProfileUpdate, hospitalController.updateProfile);

module.exports = router;
