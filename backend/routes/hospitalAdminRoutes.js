const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const hospitalAdminController = require('../controllers/hospitalAdminController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation middleware for rejection/revocation
const validateRejection = [
  body('reason').optional().trim()
];

/**
 * Admin-only Routes for Hospital Management
 * All routes require authentication and admin role
 */

// GET /api/admin/hospitals/statistics - Get hospital statistics
router.get(
  '/hospitals/statistics',
  authenticate,
  authorize('admin'),
  hospitalAdminController.getHospitalStatistics
);

// GET /api/admin/hospitals - Get all hospitals (with optional status filter)
router.get(
  '/hospitals',
  authenticate,
  authorize('admin'),
  hospitalAdminController.getAllHospitals
);

// GET /api/admin/hospitals/:id - Get specific hospital details
router.get(
  '/hospitals/:id',
  authenticate,
  authorize('admin'),
  hospitalAdminController.getHospitalById
);

// PUT /api/admin/hospitals/:id/verify - Verify a hospital
router.put(
  '/hospitals/:id/verify',
  authenticate,
  authorize('admin'),
  hospitalAdminController.verifyHospital
);

// PUT /api/admin/hospitals/:id/reject - Reject a hospital application
router.put(
  '/hospitals/:id/reject',
  authenticate,
  authorize('admin'),
  validateRejection,
  hospitalAdminController.rejectHospital
);

// PUT /api/admin/hospitals/:id/revoke - Revoke hospital access
router.put(
  '/hospitals/:id/revoke',
  authenticate,
  authorize('admin'),
  validateRejection,
  hospitalAdminController.revokeHospitalAccess
);

module.exports = router;
