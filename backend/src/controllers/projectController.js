'use strict';

const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const ProjectMessage = require('../models/ProjectMessage');
const ProjectInvitation = require('../models/ProjectInvitation');
const Task = require('../models/Task');
const User = require('../models/User');
const { log } = require('../services/auditService');

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/projects/my
// Returns all projects owned or joined by the current user
exports.getMyProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      $or: [
        { owner: userId },
        { teamLeader: userId },
        { 'members.user': userId },
      ],
      isArchived: false,
    })
      .populate('owner', 'name avatar email')
      .populate('teamLeader', 'name avatar email')
      .populate('members.user', 'name avatar email department')
      .sort({ updatedAt: -1 });

    const formatted = projects.map((p) => {
      const userRole = p.getMemberRole(userId);
      return {
        _id: p._id,
        name: p.name,
        description: p.description,
        publicDescription: p.publicDescription,
        category: p.category,
        image: p.image,
        visibility: p.visibility,
        status: p.status,
        priority: p.priority,
        color: p.color,
        tags: p.tags,
        dueDate: p.dueDate,
        owner: p.owner,
        teamLeader: p.teamLeader,
        memberCount: p.members.length,
        myRole: userRole,
        isLeader: p.isLeader(userId),
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
      };
    });

    res.json({
      success: true,
      data: formatted,
      projects: formatted,
      count: formatted.length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/discover
// Returns only basic public details for projects with visibility = 'public'
// Never exposes internal objectives, member lists, tasks, private files, or messages
exports.getDiscoverProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, category, status } = req.query;

    const query = {
      visibility: 'public',
      isArchived: false,
    };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { publicDescription: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (status && ['planning', 'active', 'on-hold', 'completed'].includes(status)) {
      query.status = status;
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('teamLeader', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(query),
    ]);

    const publicDTOs = projects.map((p) => p.toPublicDTO());

    res.json({
      success: true,
      data: publicDTOs,
      projects: publicDTOs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects
// Default query: returns user's accessible projects
exports.getProjects = async (req, res, next) => {
  return exports.getMyProjects(req, res, next);
};

// POST /api/projects
// Automatically assigns creator as Project Owner & Team Leader
exports.createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      publicDescription,
      internalObjectives,
      category = 'General',
      image = null,
      visibility = 'private',
      status = 'active',
      priority = 'medium',
      startDate = null,
      dueDate = null,
      deadline = null,
      color = '#6366f1',
      tags = [],
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Project name is required (min 2 characters).' });
    }

    const userId = req.user._id;

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      publicDescription: publicDescription ? publicDescription.trim() : '',
      internalObjectives: Array.isArray(internalObjectives) ? internalObjectives.join('\n') : (internalObjectives ? String(internalObjectives).trim() : ''),
      category: category.trim(),
      image,
      visibility: visibility === 'public' ? 'public' : 'private',
      status: status ? status.toLowerCase().replace('_', '-') : 'active',
      priority: priority ? priority.toLowerCase() : 'medium',
      startDate: startDate || null,
      dueDate: dueDate || deadline || null,
      color: color || '#6366f1',
      tags: Array.isArray(tags) ? tags : [],
      owner: userId,
      teamLeader: userId, // Creator is automatically Owner and Team Leader
      members: [
        {
          user: userId,
          role: 'owner',
          permissions: ['all'],
          joinedAt: new Date(),
        },
      ],
    });

    // Create corresponding ProjectMember record with unique compound index
    await ProjectMember.create({
      project: project._id,
      user: userId,
      role: 'owner',
      permissions: ['all'],
      status: 'active',
    });

    await log({
      actor: userId,
      actorEmail: req.user.email,
      action: 'project:created',
      resource: 'Project',
      resourceId: project._id,
      req,
      details: { name: project.name, visibility: project.visibility },
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('teamLeader', 'name avatar email')
      .populate('members.user', 'name avatar email department');

    res.status(201).json({
      success: true,
      message: 'Private project workspace created successfully.',
      data: populated,
      project: populated,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId
// Returns full workspace details for members; basic public details for non-members if visibility is public; 403/404 if private
exports.getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format.' });
    }

    const project = await Project.findById(projectId)
      .populate('owner', 'name avatar email')
      .populate('teamLeader', 'name avatar email')
      .populate('members.user', 'name avatar email department');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const userId = req.user._id.toString();
    const isMember = project.isMember(userId);

    // If user is a member, return full private workspace information
    if (isMember) {
      const myRole = project.getMemberRole(userId);
      const isLeader = project.isLeader(userId);

      return res.json({
        success: true,
        data: {
          ...project.toObject(),
          myRole,
          isLeader,
          isMember: true,
        },
      });
    }

    // User is NOT a member:
    // If project is public, return only sanitized public DTO
    if (project.visibility === 'public') {
      return res.json({
        success: true,
        data: {
          ...project.toPublicDTO(),
          isMember: false,
          isLeader: false,
        },
      });
    }

    // If project is private, reject with 403 Forbidden
    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:access_denied',
      resource: 'Project',
      resourceId: project._id,
      req,
      details: { reason: 'non_member_access_attempted_on_private_project' },
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied: You are not a member of this private project workspace.',
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId
// Only Project Owner or Team Leader can update project settings
exports.updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const userId = req.user._id.toString();
    if (!project.isLeader(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions: Only Project Owners and Team Leaders can update settings.',
      });
    }

    const allowedFields = [
      'name',
      'description',
      'publicDescription',
      'internalObjectives',
      'category',
      'image',
      'visibility',
      'status',
      'priority',
      'startDate',
      'dueDate',
      'color',
      'tags',
      'isArchived',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    // If changing team leader, verify new leader is an active project member
    if (req.body.teamLeaderId && req.body.teamLeaderId !== project.teamLeader.toString()) {
      if (project.owner.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the project owner can reassign the Team Leader role.',
        });
      }

      const targetMember = project.members.find((m) => m.user.toString() === req.body.teamLeaderId);
      if (!targetMember) {
        return res.status(400).json({
          success: false,
          message: 'Target user must be an existing member of the project to become Team Leader.',
        });
      }

      project.teamLeader = req.body.teamLeaderId;
      targetMember.role = 'team-leader';

      await ProjectMember.findOneAndUpdate(
        { project: project._id, user: req.body.teamLeaderId },
        { role: 'team-leader' }
      );
    }

    await project.save();

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:updated',
      resource: 'Project',
      resourceId: project._id,
      req,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('teamLeader', 'name avatar email')
      .populate('members.user', 'name avatar email department');

    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId
// Only Project Owner can delete a project
exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const userId = req.user._id.toString();
    if (project.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the Project Owner can permanently delete this project.',
      });
    }

    // Cascade delete project dependencies
    await Promise.all([
      Task.deleteMany({ project: project._id }),
      ProjectMember.deleteMany({ project: project._id }),
      ProjectMessage.deleteMany({ project: project._id }),
      ProjectInvitation.deleteMany({ project: project._id }),
      Project.findByIdAndDelete(project._id),
    ]);

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:deleted',
      resource: 'Project',
      resourceId: project._id,
      req,
      details: { name: project.name },
    });

    res.json({ success: true, message: 'Project and workspace assets permanently deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/members
exports.getMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members.user', 'name avatar email department');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: Member list is restricted to project members.' });
    }

    res.json({ success: true, data: project.members });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/members
// Direct add (for Leaders)
exports.addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { userId, role = 'member' } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (!project.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions: Leader privileges required.' });
    }

    if (project.isMember(userId)) {
      return res.status(409).json({ success: false, message: 'User is already a member of this project.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const newRole = role === 'team-leader' ? 'team-leader' : 'member';

    project.members.push({ user: userId, role: newRole, joinedAt: new Date() });
    await project.save();

    await ProjectMember.create({
      project: project._id,
      user: userId,
      role: newRole,
      status: 'active',
    });

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:member_added',
      resource: 'Project',
      resourceId: project._id,
      req,
      details: { addedUser: userId, role: newRole },
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('teamLeader', 'name avatar email')
      .populate('members.user', 'name avatar email department');

    res.json({ success: true, message: 'Member added to project.', data: populated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId/members/:userId/role
// Update member role (e.g. promote to team-leader or demote to member)
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    if (!['team-leader', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be team-leader or member.' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    // Only owner can promote/demote leaders
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can modify team leader roles.' });
    }

    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot modify project owner role.' });
    }

    const member = project.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in project.' });
    }

    member.role = role;
    if (role === 'team-leader') {
      project.teamLeader = userId;
    }
    await project.save();

    await ProjectMember.findOneAndUpdate(
      { project: project._id, user: userId },
      { role }
    );

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:member_role_changed',
      resource: 'Project',
      resourceId: project._id,
      req,
      details: { targetUser: userId, newRole: role },
    });

    res.json({ success: true, message: `Member role updated to ${role}.` });
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

    const currentUserId = req.user._id.toString();
    const isSelfRemoval = currentUserId === userId;
    const isLeader = project.isLeader(currentUserId);

    if (!isLeader && !isSelfRemoval) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to remove members.' });
    }

    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    if (project.teamLeader.toString() === userId) {
      project.teamLeader = project.owner; // Fall back to owner
    }
    await project.save();

    await ProjectMember.findOneAndDelete({ project: project._id, user: userId });

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:member_removed',
      resource: 'Project',
      resourceId: project._id,
      req,
      details: { removedUser: userId, isSelfRemoval },
    });

    res.json({ success: true, message: isSelfRemoval ? 'You have left the project.' : 'Member removed from project.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/messages
// Project room chat messages (strictly member-only)
exports.getProjectMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: Project chat is strictly member-only.' });
    }

    const { page, limit, skip } = getPaginationParams(req.query);

    const [messages, total] = await Promise.all([
      ProjectMessage.find({ project: project._id, isDeleted: false })
        .populate('sender', 'name avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProjectMessage.countDocuments({ project: project._id, isDeleted: false }),
    ]);

    const formatted = messages.reverse();

    res.json({
      success: true,
      data: formatted,
      messages: formatted,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/messages
// Sends message into project room
exports.sendProjectMessage = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot send message to a project you are not a member of.' });
    }

    const message = await ProjectMessage.create({
      project: project._id,
      sender: req.user._id,
      content: content.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    const populated = await message.populate('sender', 'name avatar email');

    // Emit in real-time to the project room ONLY
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project._id}`).emit('project:message', populated);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
