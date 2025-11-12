const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin/metrics', authenticate, authorize('admin'), adminController.getMetrics);
router.get('/admin/users', authenticate, authorize('admin'), adminController.getUsers);
router.get('/admin/users/:id', authenticate, authorize('admin'), adminController.getUserDetail);

module.exports = router;
