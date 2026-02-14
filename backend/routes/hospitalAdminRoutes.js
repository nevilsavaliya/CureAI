const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const hospitalAdminController = require('../controllers/hospitalAdminController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     HospitalStatistics:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of hospitals
 *         pending:
 *           type: integer
 *           description: Number of pending hospitals
 *         verified:
 *           type: integer
 *           description: Number of verified hospitals
 *         rejected:
 *           type: integer
 *           description: Number of rejected hospitals
 *         recentRegistrations:
 *           type: integer
 *           description: Registrations in last 30 days
 */

// Validation middleware for rejection/revocation
const validateRejection = [
  body('reason').optional().trim()
];

/**
 * Admin-only Routes for Hospital Management
 * All routes require authentication and admin role
 */

/**
 * @swagger
 * /api/admin/hospitals/statistics:
 *   get:
 *     summary: Get hospital statistics
 *     description: Retrieve statistics about hospital registrations and verification status
 *     tags: [Hospital Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statistics:
 *                   $ref: '#/components/schemas/HospitalStatistics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET /api/admin/hospitals/statistics - Get hospital statistics
router.get(
  '/hospitals/statistics',
  authenticate,
  authorize('admin'),
  hospitalAdminController.getHospitalStatistics
);

/**
 * @swagger
 * /api/admin/hospitals:
 *   get:
 *     summary: Get all hospitals
 *     description: Retrieve list of all hospitals with optional status filter
 *     tags: [Hospital Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter hospitals by verification status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by hospital name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Hospitals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 hospitals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hospital'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET /api/admin/hospitals - Get all hospitals (with optional status filter)
router.get(
  '/hospitals',
  authenticate,
  authorize('admin'),
  hospitalAdminController.getAllHospitals
);

/**
 * @swagger
 * /api/admin/hospitals/{id}:
 *   get:
 *     summary: Get hospital details
 *     description: Retrieve detailed information about a specific hospital
 *     tags: [Hospital Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     responses:
 *       200:
 *         description: Hospital details retrieved successfully
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/admin/hospitals/:id - Get specific hospital details
router.get(
  '/hospitals/:id',
  authenticate,
  authorize('admin'),
  hospitalAdminController.getHospitalById
);

/**
 * @swagger
 * /api/admin/hospitals/{id}/verify:
 *   put:
 *     summary: Verify a hospital
 *     description: |
 *       Verify a hospital application and generate API credentials.
 *       
 *       **Actions performed:**
 *       - Generate unique API Key (format: HK_[32-char-hex])
 *       - Generate unique API Secret (64-char-hex)
 *       - Update hospital status to 'verified'
 *       - Send email with API credentials to hospital
 *       
 *       **Email includes:**
 *       - API Key and Secret
 *       - API documentation link
 *       - Usage instructions
 *       - Security best practices
 *     tags: [Hospital Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     responses:
 *       200:
 *         description: Hospital verified successfully
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
 *                   example: Hospital verified successfully. API credentials sent via email.
 *                 hospital:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     hospitalName:
 *                       type: string
 *                     verificationStatus:
 *                       type: string
 *                       example: verified
 *                     apiKey:
 *                       type: string
 *                       example: HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *       400:
 *         description: Hospital already verified or invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/admin/hospitals/:id/verify - Verify a hospital
router.put(
  '/hospitals/:id/verify',
  authenticate,
  authorize('admin'),
  hospitalAdminController.verifyHospital
);

/**
 * @swagger
 * /api/admin/hospitals/{id}/reject:
 *   put:
 *     summary: Reject a hospital application
 *     description: Reject a hospital application with optional reason
 *     tags: [Hospital Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: Incomplete documentation provided
 *     responses:
 *       200:
 *         description: Hospital rejected successfully
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
 *                   example: Hospital application rejected
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/admin/hospitals/:id/reject - Reject a hospital application
router.put(
  '/hospitals/:id/reject',
  authenticate,
  authorize('admin'),
  validateRejection,
  hospitalAdminController.rejectHospital
);

/**
 * @swagger
 * /api/admin/hospitals/{id}/revoke:
 *   put:
 *     summary: Revoke hospital access
 *     description: |
 *       Revoke API access for a verified hospital.
 *       
 *       **Actions performed:**
 *       - Deactivate hospital account
 *       - Invalidate API credentials
 *       - Send notification email to hospital
 *       
 *       Use this when a hospital violates terms of service or for security reasons.
 *     tags: [Hospital Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for revoking access
 *                 example: Terms of service violation
 *     responses:
 *       200:
 *         description: Hospital access revoked successfully
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
 *                   example: Hospital access revoked successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/admin/hospitals/:id/revoke - Revoke hospital access
router.put(
  '/hospitals/:id/revoke',
  authenticate,
  authorize('admin'),
  validateRejection,
  hospitalAdminController.revokeHospitalAccess
);

/**
 * @swagger
 * /api/admin/hospitals/{id}/restore:
 *   put:
 *     summary: Restore hospital access
 *     description: Restore API access for a previously revoked hospital
 *     tags: [Hospital Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     responses:
 *       200:
 *         description: Hospital access restored successfully
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
 *                   example: "Hospital access restored successfully"
 *                 hospital:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     hospitalName:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     verificationStatus:
 *                       type: string
 *                       example: "verified"
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/admin/hospitals/:id/restore - Restore hospital access
router.put(
  '/hospitals/:id/restore',
  authenticate,
  authorize('admin'),
  hospitalAdminController.restoreHospitalAccess
);

module.exports = router;
