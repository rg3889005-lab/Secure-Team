'use strict';

const router = require('express').Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', chatController.getConversations);
router.post('/', chatController.createConversation);
router.get('/:conversationId/messages', chatController.getMessages);
router.post('/:conversationId/messages', chatController.sendMessage);
router.patch('/:conversationId/read', chatController.markAsRead);
router.get('/:conversationId/unread', chatController.getUnreadCount);

module.exports = router;
