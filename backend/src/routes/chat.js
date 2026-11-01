'use strict';

const router = require('express').Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', chatController.getConversations);
router.post('/', chatController.createConversation);
router.get('/:conversationId/messages', chatController.getMessages);
router.get('/:conversationId/unread', chatController.getUnreadCount);

module.exports = router;
