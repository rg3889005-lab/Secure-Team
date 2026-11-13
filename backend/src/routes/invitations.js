'use strict';

const router = require('express').Router();
const invitationController = require('../controllers/invitationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/my', invitationController.getMyInvitations);
router.post('/:invitationId/accept', invitationController.acceptInvitation);
router.post('/:invitationId/reject', invitationController.rejectInvitation);
router.delete('/:invitationId', invitationController.cancelInvitation);

module.exports = router;
