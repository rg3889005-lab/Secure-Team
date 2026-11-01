'use strict';

const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserById);
router.patch('/users/:userId/role', adminController.changeUserRole);
router.patch('/users/:userId/suspend', adminController.suspendUser);
router.patch('/users/:userId/activate', adminController.activateUser);
router.get('/projects', adminController.getProjects);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/analytics', adminController.getAnalytics);
router.post('/notifications/announce', adminController.sendAnnouncement);

module.exports = router;
