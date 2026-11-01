'use strict';

const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { log } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, status, priority } = req.query;

    const isAdmin = req.user.role === 'admin';

    const query = isAdmin ? {} : {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    };

    if (search) {
      query.$text = { $search: search };
    }
    if (status && ['planning','active','on-hold','completed','archived'].includes(status)) {
      query.status = status;
    }
    if (priority && ['low','medium','high','critical','urgent'].includes(priority.toLowerCase())) {
      query.priority = priority.toLowerCase();
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name avatar email')
        .populate('members.user', 'name avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: projects,
      projects,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, startDate, dueDate, deadline, color, tags } = req.body;

    const project = await Project.create({
      name,
      description,
      status: status ? status.toLowerCase().replace('_', '-') : 'active',
      priority: priority ? priority.toLowerCase() : 'medium',
      startDate: startDate || null,
      dueDate: dueDate || deadline || null,
      color: color || '#6366f1',
      tags: tags || [],
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner', joinedAt: new Date() }],
    });

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'project:created', resource: 'Project', resourceId: project._id, req });

    const populated = await project.populate('owner', 'name avatar email');
    res.status(201).json({ success: true, data: populated, project: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !project.canManage(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to update this project.' });
    }

    const allowed = ['name', 'description', 'status', 'priority', 'startDate', 'dueDate', 'color', 'tags', 'isArchived'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });
    await project.save();

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'project:updated', resource: 'Project', resourceId: project._id, req });

    const populated = await project.populate([
      { path: 'owner', select: 'name avatar email' },
      { path: 'members.user', select: 'name avatar email' },
    ]);
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete this project.' });
    }

    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'project:deleted', resource: 'Project', resourceId: project._id, req });

    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/members
exports.addMember = async (req, res, next) => {
  try {
    const { userId, role = 'member' } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !project.canManage(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }

    if (project.isMember(userId)) {
      return res.status(409).json({ success: false, message: 'User is already a member.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

    project.members.push({ user: userId, role, joinedAt: new Date() });
    await project.save();

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'project:member_added', resource: 'Project', resourceId: project._id, req, details: { addedUser: userId } });

    res.json({ success: true, message: 'Member added.', data: project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/members/:userId
exports.removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !project.canManage(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }

    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'project:member_removed', resource: 'Project', resourceId: project._id, req, details: { removedUser: userId } });

    res.json({ success: true, message: 'Member removed.' });
  } catch (err) {
    next(err);
  }
};
