const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const hospitalController = require('../controllers/hospitalController');
const { authenticate, authorize } = require('../middleware/auth');
const { authenticateHospitalApi } = require('../middleware/hospitalApiAuth');
const { rateLimitHospitalApi } = require('../middleware/rateLimiter');
const { uploadHospitalDocuments, handleUploadError } = require('../middleware/upload');
const { hospitalApiMonitoring, apiMonitoringErrorHandler } = require('../middleware/apiMonitoring');

// Validation error handling middleware
const handleValidationErrors = (req, res, next) => {
  console.log('🔍 Validation check for:', req.originalUrl);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  console.log('✅ Validation passed');
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     HospitalRegistration:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - hospitalName
 *         - registrationNumber
 *         - contactNumber
 *       properties:
 *         name:
 *           type: string
 *           description: Contact person name
 *           example: Dr. John Smith
 *         email:
 *           type: string
 *           format: email
 *           description: Hospital contact email (used for login)
 *           example: contact@cityhospital.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: Password for hospital account
 *           example: SecurePass123!
 *         hospitalName:
 *           type: string
 *           description: Official hospital name
 *           example: City General Hospital
 *         registrationNumber:
 *           type: string
 *           description: Hospital registration/license number
 *           example: REG123456
 *         contactNumber:
 *           type: string
 *           description: Hospital contact phone number
 *           example: +1234567890
 *         emergencyContact:
 *           type: string
 *           description: Emergency contact number
 *           example: +1234567899
 *         website:
 *           type: string
 *           format: uri
 *           description: Hospital website URL
 *           example: https://cityhospital.com
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *               example: 123 Main Street
 *             city:
 *               type: string
 *               example: New York
 *             state:
 *               type: string
 *               example: NY
 *             zipCode:
 *               type: string
 *               example: 10001
 *             country:
 *               type: string
 *               example: USA
 *         specializations:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Cardiology", "Neurology", "Emergency Medicine"]
 *         numberOfBeds:
 *           type: integer
 *           minimum: 0
 *           description: Total number of beds
 *           example: 250
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["ICU", "Emergency Room", "Operating Theater", "Laboratory"]
 *     
 *     HospitalLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: contact@cityhospital.com
 *         password:
 *           type: string
 *           format: password
 *           example: SecurePass123!
 *     
 *     PatientDataRequest:
 *       type: object
 *       required:
 *         - apiKey
 *         - apiSecret
 *       properties:
 *         apiKey:
 *           type: string
 *           description: Hospital API Key (format HK_[32-char-hex])
 *           example: HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *         apiSecret:
 *           type: string
 *           description: Hospital API Secret (64-char-hex)
 *           example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
 *         patientEmail:
 *           type: string
 *           format: email
 *           description: Patient email address (either email or patientId required)
 *           example: patient@example.com
 *         patientId:
 *           type: string
 *           description: Patient ID (either email or patientId required)
 *           example: 507f1f77bcf86cd799439011
 *     
 *     PatientDataResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Patient data retrieved successfully
 *         patient:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             age:
 *               type: integer
 *             bloodGroup:
 *               type: string
 *               enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *             allergies:
 *               type: array
 *               items:
 *                 type: string
 *             emergencyContact:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 relationship:
 *                   type: string
 *                 phone:
 *                   type: string
 *             chronicConditions:
 *               type: array
 *               items:
 *                 type: object
 *             currentMedications:
 *               type: array
 *               items:
 *                 type: object
 *             extractedSymptoms:
 *               type: array
 *               items:
 *                 type: object
 *             recentCases:
 *               type: array
 *               items:
 *                 type: object
 *         accessedBy:
 *           type: object
 *           properties:
 *             hospital:
 *               type: string
 *             accessTime:
 *               type: string
 *               format: date-time
 */

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
  body('specializations').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch (e) {
        return false;
      }
    }
    return Array.isArray(value);
  }).withMessage('Specializations must be an array or valid JSON array string'),
  body('numberOfBeds').optional().isInt({ min: 0 }).withMessage('Number of beds must be a positive number'),
  body('facilities').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch (e) {
        return false;
      }
    }
    return Array.isArray(value);
  }).withMessage('Facilities must be an array or valid JSON array string')
];

// Validation middleware for hospital login
const validateHospitalLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation middleware for patient data API request
const validatePatientDataRequest = [
  body('apiKey').trim().notEmpty().withMessage('API Key is required'),
  body('apiSecret').trim().notEmpty().withMessage('API Secret is required'),
  body().custom((value, { req }) => {
    const { patientEmail, patientId } = req.body;
    if (!patientEmail && !patientId) {
      throw new Error('Either patientEmail or patientId is required');
    }
    if (patientEmail && !patientEmail.includes('@')) {
      throw new Error('Invalid email format');
    }
    return true;
  })
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

/**
 * @swagger
 * /api/hospitals/register:
 *   post:
 *     summary: Register a new hospital
 *     description: Register a hospital with complete details and documents. The hospital will be in 'pending' status until verified by admin.
 *     tags: [Hospital]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - hospitalName
 *               - registrationNumber
 *               - contactNumber
 *             properties:
 *               name:
 *                 type: string
 *                 description: Contact person name
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               hospitalName:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               website:
 *                 type: string
 *               address[street]:
 *                 type: string
 *               address[city]:
 *                 type: string
 *               address[state]:
 *                 type: string
 *               address[zipCode]:
 *                 type: string
 *               address[country]:
 *                 type: string
 *               specializations:
 *                 type: string
 *                 description: JSON array of specializations
 *               numberOfBeds:
 *                 type: integer
 *               facilities:
 *                 type: string
 *                 description: JSON array of facilities
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Hospital documents (registration certificate, license, etc.)
 *     responses:
 *       201:
 *         description: Hospital registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Hospital registered successfully. Your application is pending admin verification.
 *                 hospital:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     hospitalName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     verificationStatus:
 *                       type: string
 *                       example: pending
 *                     documentsUploaded:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/hospitals/register - Hospital Registration
router.post('/register', 
  (req, res, next) => {
    console.log('🚀 Hospital registration route hit:', req.method, req.originalUrl);
    next();
  },
  uploadHospitalDocuments,
  handleUploadError,
  validateHospitalRegistration,
  handleValidationErrors,
  hospitalController.registerHospital
);

/**
 * @swagger
 * /api/hospitals/login:
 *   post:
 *     summary: Hospital login
 *     description: Authenticate hospital with email and password. Only verified hospitals can login successfully.
 *     tags: [Hospital]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HospitalLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 hospital:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     hospitalName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     apiKey:
 *                       type: string
 *                     verificationStatus:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Hospital not verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Your hospital account is pending. Please wait for admin verification.
 *                 verificationStatus:
 *                   type: string
 *                   example: pending
 */
// POST /api/hospitals/login - Hospital Login
router.post('/login', 
  (req, res, next) => {
    console.log('🚀 Hospital login route hit:', {
      method: req.method,
      url: req.originalUrl,
      body: { email: req.body.email, hasPassword: !!req.body.password },
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    });
    next();
  },
  validateHospitalLogin, 
  handleValidationErrors, 
  (req, res, next) => {
    console.log('✅ Validation passed, calling controller...');
    next();
  },
  hospitalController.loginHospital
);

/**
 * API Routes (API Key + Secret Authentication)
 */

/**
 * @swagger
 * /api/hospitals/api/patient-data:
 *   post:
 *     summary: Get patient medical data (Hospital API)
 *     description: |
 *       Retrieve comprehensive patient medical data for emergency situations.
 *       
 *       **Authentication:** Requires valid API Key and Secret (provided after hospital verification)
 *       
 *       **Rate Limit:** 100 requests per hour per hospital
 *       
 *       **Data Returned:**
 *       - Basic patient information (name, age, blood group, contact)
 *       - Emergency contact details
 *       - Medical history (chronic conditions, allergies, medications)
 *       - Past surgeries and vaccinations
 *       - Extracted symptoms from chat history
 *       - Vital signs history
 *       - Lab results
 *       - Recent medical cases
 *       
 *       **Security:** All API access is logged for audit purposes.
 *     tags: [Hospital API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientDataRequest'
 *     responses:
 *       200:
 *         description: Patient data retrieved successfully
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *             description: Request limit per hour
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *             description: Remaining requests in current window
 *           X-RateLimit-Reset:
 *             schema:
 *               type: integer
 *             description: Time when rate limit resets (Unix timestamp)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PatientDataResponse'
 *       400:
 *         description: Invalid request (missing patient identifier)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid API credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid API credentials
 *       403:
 *         description: Hospital not verified or inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Hospital is not verified or has been deactivated
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/hospitals/api/patient-data - Get Patient Data via API
// Apply monitoring, authentication, rate limiting, then validation
router.post('/api/patient-data', 
  ...hospitalApiMonitoring,
  authenticateHospitalApi,
  rateLimitHospitalApi,
  validatePatientDataRequest,
  handleValidationErrors,
  hospitalController.getPatientData
);

// Error handling middleware is applied in server.js

/**
 * Protected Routes (JWT Authentication)
 */

/**
 * @swagger
 * /api/hospitals/profile:
 *   get:
 *     summary: Get hospital profile
 *     description: Retrieve the authenticated hospital's profile information
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hospital profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 hospital:
 *                   $ref: '#/components/schemas/Hospital'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/hospitals/profile - Get Hospital Profile
router.get('/profile', authenticate, authorize('hospital'), hospitalController.getProfile);

/**
 * @swagger
 * /api/hospitals/profile:
 *   put:
 *     summary: Update hospital profile
 *     description: Update the authenticated hospital's profile information
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               hospitalName:
 *                 type: string
 *               address:
 *                 type: object
 *               contactNumber:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               website:
 *                 type: string
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               numberOfBeds:
 *                 type: integer
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Hospital profile updated successfully
 *                 hospital:
 *                   $ref: '#/components/schemas/Hospital'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/hospitals/profile - Update Hospital Profile
router.put('/profile', authenticate, authorize('hospital'), validateProfileUpdate, hospitalController.updateProfile);

/**
 * @swagger
 * /api/hospitals/api/usage-stats:
 *   get:
 *     summary: Get API usage statistics
 *     description: Retrieve real-time API usage statistics for the authenticated hospital
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API usage statistics retrieved successfully
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalRequests:
 *                       type: integer
 *                       description: Total API requests made
 *                       example: 150
 *                     requestsToday:
 *                       type: integer
 *                       description: API requests made today
 *                       example: 25
 *                     requestsThisWeek:
 *                       type: integer
 *                       description: API requests made this week
 *                       example: 75
 *                     requestsThisMonth:
 *                       type: integer
 *                       description: API requests made this month
 *                       example: 150
 *                     averageResponseTime:
 *                       type: number
 *                       description: Average response time in milliseconds
 *                       example: 245
 *                     successRate:
 *                       type: number
 *                       description: Success rate percentage
 *                       example: 98.5
 *                     remainingRequests:
 *                       type: integer
 *                       description: Remaining requests for today
 *                       example: 975
 *                     rateLimit:
 *                       type: integer
 *                       description: Daily rate limit
 *                       example: 1000
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                       description: When statistics were last updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/hospitals/api/usage-stats - Get API Usage Statistics
router.get('/api/usage-stats', authenticate, authorize('hospital'), hospitalController.getApiUsageStats);

/**
 * @swagger
 * /api/hospitals/api/recent-requests:
 *   get:
 *     summary: Get recent API requests
 *     description: Retrieve paginated list of recent API requests made by the authenticated hospital
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of requests per page
 *     responses:
 *       200:
 *         description: Recent API requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recent API requests retrieved successfully
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique request identifier
 *                       patientEmail:
 *                         type: string
 *                         description: Patient email accessed
 *                         example: patient@example.com
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: When the request was made
 *                       status:
 *                         type: string
 *                         enum: [success, error]
 *                         description: Request status
 *                       responseTime:
 *                         type: number
 *                         description: Response time in milliseconds
 *                         example: 245
 *                       endpoint:
 *                         type: string
 *                         description: API endpoint accessed
 *                         example: /api/hospitals/api/patient-data
 *                       method:
 *                         type: string
 *                         description: HTTP method used
 *                         example: POST
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalRequests:
 *                       type: integer
 *                       example: 45
 *                     requestsPerPage:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/hospitals/api/recent-requests - Get Recent API Requests
router.get('/api/recent-requests', authenticate, authorize('hospital'), hospitalController.getRecentApiRequests);

module.exports = router;
