'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const File = require('../models/File');
const Project = require('../models/Project');
const { log } = require('../services/auditService');

const UPLOAD_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../../uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (err) {
  console.warn(`Could not create uploads directory at ${UPLOAD_DIR}:`, err.message);
}

const ALLOWED_MIMETYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not allowed.`), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

exports.uploadMiddleware = upload.single('file');

// POST /api/files
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { projectId, taskId } = req.body;

    // Validate project access
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
      const isAdmin = req.user.role === 'admin';
      if (!isAdmin && !project.isMember(req.user._id)) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ success: false, message: 'Access denied to this project.' });
      }
    }

    const fileRecord = await File.create({
      originalName: req.file.originalname,
      storageName: req.file.filename,
      storagePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploader: req.user._id,
      project: projectId || null,
      task: taskId || null,
    });

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'file:uploaded', resource: 'File', resourceId: fileRecord._id, req });

    const populated = await fileRecord.populate('uploader', 'name avatar');
    res.status(201).json({ success: true, data: populated, file: populated });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};

// GET /api/files
exports.getFiles = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };
    const isAdmin = req.user.role === 'admin';

    if (projectId) {
      if (!isAdmin) {
        const project = await Project.findById(projectId);
        if (!project || !project.isMember(req.user._id)) {
          return res.status(403).json({ success: false, message: 'Access denied.' });
        }
      }
      query.project = projectId;
    } else if (!isAdmin) {
      query.uploader = req.user._id;
    }

    const [files, total] = await Promise.all([
      File.find(query)
        .populate('uploader', 'name avatar')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      File.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: files,
      files,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/files/:fileId
exports.downloadFile = async (req, res, next) => {
  try {
    const fileRecord = await File.findById(req.params.fileId);
    if (!fileRecord || fileRecord.isDeleted) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      if (fileRecord.project) {
        const project = await Project.findById(fileRecord.project);
        if (!project || !project.isMember(req.user._id)) {
          return res.status(403).json({ success: false, message: 'Access denied.' });
        }
      } else if (fileRecord.uploader.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    if (!fs.existsSync(fileRecord.storagePath)) {
      return res.status(404).json({ success: false, message: 'File not found in storage.' });
    }

    await File.findByIdAndUpdate(fileRecord._id, { $inc: { downloadCount: 1 } });
    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'file:downloaded', resource: 'File', resourceId: fileRecord._id, req });

    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
    res.setHeader('Content-Type', fileRecord.mimeType);
    fs.createReadStream(fileRecord.storagePath).pipe(res);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/files/:fileId
exports.deleteFile = async (req, res, next) => {
  try {
    const fileRecord = await File.findById(req.params.fileId);
    if (!fileRecord || fileRecord.isDeleted) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && fileRecord.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the uploader can delete this file.' });
    }

    // Soft delete
    fileRecord.isDeleted = true;
    fileRecord.deletedAt = new Date();
    await fileRecord.save();

    // Remove from disk
    if (fs.existsSync(fileRecord.storagePath)) {
      fs.unlinkSync(fileRecord.storagePath);
    }

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'file:deleted', resource: 'File', resourceId: fileRecord._id, req });

    res.json({ success: true, message: 'File deleted.' });
  } catch (err) {
    next(err);
  }
};
