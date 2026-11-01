'use strict';

const router = require('express').Router();
const fileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/', fileController.uploadMiddleware, fileController.uploadFile);
router.get('/', fileController.getFiles);
router.get('/:fileId', fileController.downloadFile);
router.delete('/:fileId', fileController.deleteFile);

module.exports = router;
