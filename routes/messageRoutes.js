const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/send', messageController.sendMessage);
router.get('/mine', messageController.getStudentMessages);
router.get('/admin', messageController.showAdminMessages);
router.post('/reply', messageController.replyMessage);
router.put('/:id/read', messageController.markAsRead);

module.exports = router;
