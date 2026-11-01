'use strict';

const router = require('express').Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:projectId', projectController.getProject);
router.patch('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);
router.post('/:projectId/members', projectController.addMember);
router.delete('/:projectId/members/:userId', projectController.removeMember);

module.exports = router;
