'use strict';

const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, requireVerified } = require('../middleware/auth');

router.use(authenticate);
router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);
router.patch('/me/password', userController.changePassword);

module.exports = router;
