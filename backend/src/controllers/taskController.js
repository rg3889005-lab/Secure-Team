'use strict';

const Task = require('../models/Task');
const Project = require('../models/Project');
const { log } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];

// GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { projectId, assignee, status, priority, search, sort = '-createdAt', overdue } = req.query;

    const query = {};
    const isAdmin = req.user.role === 'admin';

    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
      if (!isAdmin && !project.isMember(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      query.project = projectId;
    } else if (!isAdmin) {
      // Non-admins see tasks in their projects, assigned to them, or created by them
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
      }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      query.$or = [
        { project: { $in: projectIds } },
        { assignee: req.user._id },
        { creator: req.user._id }
      ];
    }

    if (assignee) query.assignee = assignee;
    if (status && ['todo','in-progress','review','done','cancelled'].includes(status)) query.status = status;
    if (priority && ['low','medium','high','critical','urgent'].includes(priority.toLowerCase())) {
      query.priority = priority.toLowerCase();
    }
    if (search) query.$text = { $search: search };
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['done', 'cancelled'] };
    }

    // Validate sort
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? -1 : 1;
    const safeSort = ALLOWED_SORT_FIELDS.includes(sortField) ? { [sortField]: sortDir } : { createdAt: -1 };

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('project', 'name color')
        .populate('creator', 'name avatar')
        .populate('assignee', 'name avatar email')
        .sort(safeSort)
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tasks,
      tasks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate, tags } = req.body;

    let targetProjectId = projectId;
    if (targetProjectId) {
      const project = await Project.findById(targetProjectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

      const isAdmin = req.user.role === 'admin';
      if (!isAdmin && !project.isMember(req.user._id)) {
        return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
      }

      // Validate assignee is project member
      if (assigneeId && !isAdmin && !project.isMember(assigneeId)) {
        return res.status(400).json({ success: false, message: 'Assignee must be a project member.' });
      }
    } else {
      let defaultProject = await Project.findOne({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
      });
      if (!defaultProject) {
        defaultProject = await Project.findOne();
      }
      if (!defaultProject) {
        defaultProject = await Project.create({
          name: 'General Workspace',
          description: 'Default team collaboration workspace',
          owner: req.user._id,
          members: [{ user: req.user._id, role: 'owner' }],
        });
      }
      targetProjectId = defaultProject._id;
    }

    const task = await Task.create({
      title,
      description,
      project: targetProjectId,
      creator: req.user._id,
      assignee: assigneeId || null,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
    });

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'task:created', resource: 'Task', resourceId: task._id, req });

    // Notify assignee if different from creator
    if (assigneeId && assigneeId.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: assigneeId,
        actor: req.user._id,
        type: 'task:assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you: "${title}"`,
        link: `/user/projects/${projectId}`,
        metadata: { taskId: task._id, projectId },
      }, req.app.get('io'));
    }

    const populated = await task.populate([
      { path: 'project', select: 'name color' },
      { path: 'creator', select: 'name avatar' },
      { path: 'assignee', select: 'name avatar email' },
    ]);

    res.status(201).json({ success: true, data: populated, task: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:taskId
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('project', 'name color')
      .populate('creator', 'name avatar')
      .populate('assignee', 'name avatar email')
      .populate('comments.author', 'name avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const project = await Project.findById(task.project);
      if (!project || !project.isMember(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:taskId
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const project = await Project.findById(task.project);
      if (!project || !project.isMember(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'tags', 'isArchived'];
    const prevStatus = task.status;
    const prevAssignee = task.assignee?.toString();

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    // Handle assignee change
    if (req.body.assigneeId !== undefined) {
      task.assignee = req.body.assigneeId || null;
    }

    await task.save();

    const actions = [];
    if (prevStatus !== task.status) actions.push('task:status_changed');
    if (prevAssignee !== task.assignee?.toString()) actions.push('task:assigned');

    for (const action of actions) {
      await log({ actor: req.user._id, actorEmail: req.user.email, action, resource: 'Task', resourceId: task._id, req });
    }
    if (!actions.length) {
      await log({ actor: req.user._id, actorEmail: req.user.email, action: 'task:updated', resource: 'Task', resourceId: task._id, req });
    }

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.project}`).emit('task:updated', { taskId: task._id });
    }

    // Notify new assignee
    if (req.body.assigneeId && req.body.assigneeId !== prevAssignee && req.body.assigneeId !== req.user._id.toString()) {
      await createNotification({
        recipient: req.body.assigneeId,
        actor: req.user._id,
        type: 'task:assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you a task: "${task.title}"`,
        link: `/user/projects/${task.project}`,
        metadata: { taskId: task._id },
      }, io);
    }

    const populated = await task.populate([
      { path: 'project', select: 'name color' },
      { path: 'creator', select: 'name avatar' },
      { path: 'assignee', select: 'name avatar email' },
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:taskId
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const project = await Project.findById(task.project);
      if (!project || (!project.canManage(req.user._id) && task.creator.toString() !== req.user._id.toString())) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions to delete this task.' });
      }
    }

    await Task.findByIdAndDelete(task._id);
    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'task:deleted', resource: 'Task', resourceId: task._id, req });

    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks/:taskId/comments
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const project = await Project.findById(task.project);
      if (!project || !project.isMember(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    task.comments.push({ author: req.user._id, content, createdAt: new Date(), updatedAt: new Date() });
    await task.save();

    const populated = await task.populate('comments.author', 'name avatar');
    const newComment = populated.comments[populated.comments.length - 1];

    res.status(201).json({ success: true, data: newComment });
  } catch (err) {
    next(err);
  }
};
