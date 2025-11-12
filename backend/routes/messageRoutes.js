const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.post('/messages', authenticate, messageController.sendMessage);
router.get('/messages/:userId', authenticate, messageController.getMessages);
router.put('/messages/:id/read', authenticate, messageController.markAsRead);
router.get('/conversations/doctor', authenticate, messageController.getDoctorConversations);

module.exports = router;
