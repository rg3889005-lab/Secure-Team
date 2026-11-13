'use strict';

const router = require('express').Router();
const projectController = require('../controllers/projectController');
const invitationController = require('../controllers/invitationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Projects listing & creation
router.get('/', projectController.getProjects);
router.get('/my', projectController.getMyProjects);
router.get('/discover', projectController.getDiscoverProjects);
router.post('/', projectController.createProject);

// Single project workspace operations
router.get('/:projectId', projectController.getProject);
router.patch('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

// Member management
router.get('/:projectId/members', projectController.getMembers);
router.post('/:projectId/members', projectController.addMember);
router.patch('/:projectId/members/:userId/role', projectController.updateMemberRole);
router.delete('/:projectId/members/:userId', projectController.removeMember);

// Project room chat
router.get('/:projectId/messages', projectController.getProjectMessages);
router.post('/:projectId/messages', projectController.sendProjectMessage);

// Project invitations
router.post('/:projectId/invitations', invitationController.sendInvitation);
router.get('/:projectId/invitations', invitationController.getProjectInvitations);

module.exports = router;
