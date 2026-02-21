const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { validatePagination } = require('../middleware/paginationMiddleware');

// All routes require authentication
router.use(authenticate);

// Notification routes
router.get('/notifications', validatePagination({ maxLimit: 50 }), notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);

module.exports = router;
