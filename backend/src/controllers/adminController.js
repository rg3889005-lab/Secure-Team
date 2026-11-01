'use strict';

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { log } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers, verifiedUsers, activeUsers, suspendedUsers,
      totalProjects, activeProjects, completedProjects,
      totalTasks, doneTasks, inProgressTasks,
      overdueTasks,
      recentUsers, recentProjects,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ isActive: true, isSuspended: false }),
      User.countDocuments({ isSuspended: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Project.countDocuments({ status: 'completed' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'done' }),
      Task.countDocuments({ status: 'in-progress' }),
      Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $nin: ['done', 'cancelled'] } }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt avatar isEmailVerified'),
      Project.find().sort({ createdAt: -1 }).limit(5).populate('owner', 'name avatar').select('name status priority owner createdAt'),
    ]);

    // Task status breakdown
    const taskStatusBreakdown = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Users created per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers, verifiedUsers, activeUsers, suspendedUsers,
          totalProjects, activeProjects, completedProjects,
          totalTasks, doneTasks, inProgressTasks, overdueTasks,
        },
        taskStatusBreakdown,
        userGrowth,
        recentUsers,
        recentProjects,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { search, role, status } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role && ['user', 'admin'].includes(role)) query.role = role;
    if (status === 'active') { query.isActive = true; query.isSuspended = false; }
    if (status === 'suspended') query.isSuspended = true;
    if (status === 'inactive') query.isActive = false;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    const safeUsers = users.map((u) => u.toSafeObject());
    res.json({
      success: true,
      data: safeUsers,
      users: safeUsers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:userId
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [projects, tasks] = await Promise.all([
      Project.find({ 'members.user': user._id }).select('name status').limit(10),
      Task.find({ assignee: user._id }).select('title status priority').limit(10),
    ]);

    res.json({ success: true, data: { user: user.toSafeObject(), projects, tasks } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:userId/role
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role.' });
    }

    const prevRole = user.role;
    user.role = role;
    await user.save();

    await log({
      actor: req.user._id, actorEmail: req.user.email, action: 'user:role_changed',
      resource: 'User', resourceId: user._id, req,
      details: { from: prevRole, to: role },
    });

    res.json({ success: true, message: `User role changed to ${role}.`, data: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:userId/suspend
exports.suspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot suspend your own account.' });
    }

    user.isSuspended = true;
    user.suspensionReason = reason || null;
    user.refreshTokens = []; // Revoke all sessions
    await user.save();

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'user:suspended', resource: 'User', resourceId: user._id, req, details: { reason } });

    await createNotification({
      recipient: user._id,
      actor: req.user._id,
      type: 'account:suspended',
      title: 'Account Suspended',
      message: reason || 'Your account has been suspended by an administrator.',
      link: null,
    }, req.app.get('io'));

    res.json({ success: true, message: 'User suspended.', data: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:userId/activate
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isSuspended: false, suspensionReason: null, isActive: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'user:activated', resource: 'User', resourceId: user._id, req });

    res.json({ success: true, message: 'User activated.', data: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/projects
exports.getProjects = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find()
        .populate('owner', 'name avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(),
    ]);

    res.json({ success: true, data: projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const skip = (page - 1) * limit;
    const { action, outcome } = req.query;

    const query = {};
    if (action) query.action = action;
    if (outcome && ['success', 'failure'].includes(outcome)) query.outcome = outcome;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [projectsByStatus, tasksByStatus, tasksByPriority, projectGrowth, taskGrowth] = await Promise.all([
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Project.aggregate([
        { $match: { createdAt: { $gte: ninetyDaysAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      Task.aggregate([
        { $match: { createdAt: { $gte: ninetyDaysAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
    ]);

    res.json({ success: true, data: { projectsByStatus, tasksByStatus, tasksByPriority, projectGrowth, taskGrowth } });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/notifications/announce
exports.sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message, link } = req.body;
    const users = await User.find({ isActive: true, isSuspended: false }).select('_id');

    const io = req.app.get('io');
    for (const user of users) {
      await createNotification({ recipient: user._id, actor: req.user._id, type: 'admin:announcement', title, message, link }, io);
    }

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'admin:announcement_sent', req, details: { title, recipientCount: users.length } });

    res.json({ success: true, message: `Announcement sent to ${users.length} users.` });
  } catch (err) {
    next(err);
  }
};
