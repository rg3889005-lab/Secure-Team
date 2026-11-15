'use strict';

const router = require('express').Router();
const invitationController = require('../controllers/invitationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// SMTP configuration & diagnostic endpoints
router.get('/smtp/status', invitationController.getSmtpStatus);
router.post('/smtp/verify', invitationController.testSmtpConnection);

router.get('/my', invitationController.getMyInvitations);
router.post('/:invitationId/accept', invitationController.acceptInvitation);
router.post('/:invitationId/reject', invitationController.rejectInvitation);
router.post('/:invitationId/resend', invitationController.resendInvitation);
router.delete('/:invitationId', invitationController.cancelInvitation);

module.exports = router;
