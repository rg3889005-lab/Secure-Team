'use strict';

const mongoose = require('mongoose');
const Project = require('../models/Project');
const { Conversation } = require('../models/Chat');
const { log } = require('../services/auditService');

/**
 * Middleware: Verify that req.user is an authorized member of the project.
 * Blocks non-members with 403 Forbidden (or 404 if project does not exist).
 */
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing project ID.' });
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

    // Prompt rule: Global Admin must not automatically bypass every project's private content restrictions.
    // If Admin is a member, allow normally. If Admin is NOT a member, log access and require explicit audit or block.
    if (!isMember) {
      if (req.user.role === 'admin') {
        await log({
          actor: req.user._id,
          actorEmail: req.user.email,
          action: 'project:access_denied',
          resource: 'Project',
          resourceId: project._id,
          req,
          details: { reason: 'admin_non_member_access_attempted' },
        });
        return res.status(403).json({
          success: false,
          message: 'Access denied: Even platform administrators must be explicitly joined as project members to view private workspace data.',
        });
      }

      await log({
        actor: req.user._id,
        actorEmail: req.user.email,
        action: 'project:access_denied',
        resource: 'Project',
        resourceId: project._id,
        req,
        details: { reason: 'non_member_access_denied' },
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this private project workspace.',
      });
    }

    req.project = project;
    req.projectRole = project.getMemberRole(userId);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware: Verify that req.user is the Owner or Team Leader of the project.
 */
const requireProjectLeader = async (req, res, next) => {
  try {
    if (!req.project) {
      return requireProjectMember(req, res, () => {
        if (!req.project.isLeader(req.user._id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Team Leader or Project Owner privileges required.',
          });
        }
        next();
      });
    }

    if (!req.project.isLeader(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Team Leader or Project Owner privileges required.',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware: Verify that req.user is a participant in the 1-to-1 conversation.
 */
const requireConversationParticipant = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId || req.body.conversationId;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing conversation ID.' });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name avatar email');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (!conversation.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not an authorized participant in this direct message conversation.',
      });
    }

    req.conversation = conversation;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireProjectMember,
  requireProjectLeader,
  requireConversationParticipant,
};
