'use strict';

const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const ProjectInvitation = require('../models/ProjectInvitation');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { log } = require('../services/auditService');

// POST /api/projects/:projectId/invitations
// Team leader sends email invitation to join the project
exports.sendInvitation = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const assignedRole = role === 'team-leader' ? 'team-leader' : 'member';

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Only project leaders (owner or team leader) can invite members
    if (!project.isLeader(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions: Only Team Leaders or Project Owners can invite members.',
      });
    }

    // Check if user is already an active member of this project
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && project.isMember(existingUser._id)) {
      return res.status(409).json({
        success: false,
        message: 'This user is already an active member of this project.',
      });
    }

    // Check for existing pending, unexpired invitation
    const pendingInvite = await ProjectInvitation.findOne({
      project: project._id,
      recipientEmail: normalizedEmail,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (pendingInvite) {
      return res.status(409).json({
        success: false,
        message: 'A pending invitation has already been sent to this email address.',
      });
    }

    // Generate cryptographic token and hash (expires in 48 hours per spec)
    const { rawToken, tokenHash } = ProjectInvitation.generateToken();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = await ProjectInvitation.create({
      project: project._id,
      inviter: req.user._id,
      recipientEmail: normalizedEmail,
      recipientUser: existingUser ? existingUser._id : null,
      tokenHash,
      role: assignedRole,
      status: 'pending',
      expiresAt,
    });

    // Send email invitation through Nodemailer
    const emailResult = await emailService.sendProjectInvitationEmail({
      to: normalizedEmail,
      inviterName: req.user.name,
      projectName: project.name,
      projectDescription: project.description || '',
      projectRole: assignedRole,
      token: rawToken,
      expiresAt,
    });

    // If email delivery failed, roll back the newly created invitation record
    // to preserve database and email state consistency, and allow immediate retry
    if (!emailResult.success) {
      await ProjectInvitation.findByIdAndDelete(invitation._id);
      console.error(`[ProjectInvitation] Email dispatch failed for ${normalizedEmail}: ${emailResult.error}`);

      const code = emailResult.code;
      let userFriendlyMessage = 'Email service is temporarily unavailable. Please try again.';

      if (code === 'MISSING_CONFIGURATION' || code === 'MISSING_CREDENTIALS' || emailResult.skipped) {
        userFriendlyMessage = 'Email service is not configured. Please contact the administrator.';
      } else if (code === 'AUTH_FAILED' || code === 'EAUTH') {
        userFriendlyMessage = 'Email authentication failed. Please check the email provider configuration.';
      } else if (code === 'CONNECTION_FAILED' || code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ESOCKET') {
        userFriendlyMessage = 'Email service is temporarily unavailable. Please try again.';
      }

      return res.status(502).json({
        success: false,
        message: userFriendlyMessage,
        code: code || 'SEND_FAILED',
        provider: emailResult.provider || 'unknown',
        missing: emailResult.missing || [],
        details: process.env.NODE_ENV !== 'production' ? emailResult.error : undefined,
      });
    }

    // Notify registered recipient via real-time Socket.io and in-app Notification if account exists
    if (existingUser) {
      const io = req.app.get('io');
      await createNotification(
        {
          recipient: existingUser._id,
          actor: req.user._id,
          type: 'project:invited',
          title: 'Project Invitation',
          message: `${req.user.name} invited you to join "${project.name}" as a ${assignedRole}.`,
          link: `/invitations`,
        },
        io
      );

      if (io) {
        io.to(`user:${existingUser._id}`).emit('invitation:new', {
          _id: invitation._id,
          project: { _id: project._id, name: project.name },
          inviter: { name: req.user.name, avatar: req.user.avatar },
          role: assignedRole,
          expiresAt,
        });
      }
    }

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:invitation_sent',
      resource: 'ProjectInvitation',
      resourceId: invitation._id,
      req,
      details: { projectId: project._id, recipientEmail: normalizedEmail, role: assignedRole },
    });

    res.status(201).json({
      success: true,
      message: 'Project invitation email sent successfully!',
      data: {
        _id: invitation._id,
        recipientEmail: normalizedEmail,
        role: assignedRole,
        expiresAt,
        status: 'pending',
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/invitations/:invitationId/resend
// Team Leader resends invitation email with a fresh secure token & refreshed 48-hour expiration
exports.resendInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const invitation = await ProjectInvitation.findById(invitationId).populate('project');
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    const project = invitation.project;
    if (!project) {
      return res.status(404).json({ success: false, message: 'Associated project no longer exists.' });
    }

    // Only project leaders can resend invitations
    if (!project.isLeader(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions: Only Team Leaders or Project Owners can resend invitations.',
      });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been accepted and cannot be resent.',
      });
    }

    if (invitation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This invitation was cancelled. Please send a new invitation instead.',
      });
    }

    // Anti-spam rate limiting: at least 60 seconds between resends
    const timeSinceLastUpdate = Date.now() - new Date(invitation.updatedAt).getTime();
    if (timeSinceLastUpdate < 60000) {
      const waitSeconds = Math.ceil((60000 - timeSinceLastUpdate) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before resending another invitation to this recipient.`,
      });
    }

    // Generate fresh secure token (invalidates previous token)
    const { rawToken, tokenHash } = ProjectInvitation.generateToken();
    const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // fresh 48 hours

    // Send new invitation email through Nodemailer
    const emailResult = await emailService.sendProjectInvitationEmail({
      to: invitation.recipientEmail,
      inviterName: req.user.name,
      projectName: project.name,
      projectDescription: project.description || '',
      projectRole: invitation.role,
      token: rawToken,
      expiresAt: newExpiresAt,
    });

    if (!emailResult.success) {
      console.error(`[ProjectInvitation] Resend email failed for ${invitation.recipientEmail}: ${emailResult.error}`);
      const code = emailResult.code;
      let userFriendlyMessage = 'Email service is temporarily unavailable. Please try again.';

      if (code === 'MISSING_CONFIGURATION' || code === 'MISSING_CREDENTIALS' || emailResult.skipped) {
        userFriendlyMessage = 'Email service is not configured. Please contact the administrator.';
      } else if (code === 'AUTH_FAILED' || code === 'EAUTH') {
        userFriendlyMessage = 'Email authentication failed. Please check the email provider configuration.';
      } else if (code === 'CONNECTION_FAILED' || code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ESOCKET') {
        userFriendlyMessage = 'Email service is temporarily unavailable. Please try again.';
      }

      return res.status(502).json({
        success: false,
        message: userFriendlyMessage,
        code: code || 'SEND_FAILED',
        provider: emailResult.provider || 'unknown',
        missing: emailResult.missing || [],
        details: process.env.NODE_ENV !== 'production' ? emailResult.error : undefined,
      });
    }

    // Update invitation with new token and refreshed expiration
    invitation.tokenHash = tokenHash;
    invitation.expiresAt = newExpiresAt;
    invitation.status = 'pending';
    invitation.inviter = req.user._id;
    await invitation.save();

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:invitation_resent',
      resource: 'ProjectInvitation',
      resourceId: invitation._id,
      req,
      details: { projectId: project._id, recipientEmail: invitation.recipientEmail },
    });

    res.json({
      success: true,
      message: 'Project invitation email sent successfully!',
      data: {
        _id: invitation._id,
        recipientEmail: invitation.recipientEmail,
        role: invitation.role,
        expiresAt: newExpiresAt,
        status: 'pending',
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/invitations/my
// Returns all pending invitations for the authenticated user's email
exports.getMyInvitations = async (req, res, next) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();

    const invitations = await ProjectInvitation.find({
      recipientEmail: userEmail,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('project', 'name category image visibility description')
      .populate('inviter', 'name avatar email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invitations,
      count: invitations.length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/invitations
// Returns all invitations for a project (for Team Leaders/Owners)
exports.getProjectInvitations = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (!project.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: Leader privileges required.' });
    }

    const invitations = await ProjectInvitation.find({ project: project._id })
      .populate('inviter', 'name avatar email')
      .populate('recipientUser', 'name avatar email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invitations });
  } catch (err) {
    next(err);
  }
};

// POST /api/invitations/:invitationId/accept
exports.acceptInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const { token } = req.body;

    let invitation;
    if (token) {
      const tokenHash = ProjectInvitation.hashToken(token);
      invitation = await ProjectInvitation.findOne({ tokenHash });
    } else if (mongoose.isValidObjectId(invitationId)) {
      invitation = await ProjectInvitation.findById(invitationId);
    }

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found or invalid token.' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation is already ${invitation.status} and cannot be accepted again.`,
      });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ success: false, message: 'This invitation has expired. Please ask the team leader to resend it.' });
    }

    // Security requirement: Ensure authenticated user matches invitation recipient email
    const userEmail = req.user.email.toLowerCase().trim();
    if (userEmail !== invitation.recipientEmail.toLowerCase().trim()) {
      return res.status(403).json({
        success: false,
        message: `This invitation was issued to ${invitation.recipientEmail}. You are logged in as ${userEmail}. Please switch accounts to accept this invitation.`,
      });
    }

    const project = await Project.findById(invitation.project);
    if (!project) {
      return res.status(404).json({ success: false, message: 'The invited project no longer exists.' });
    }

    // If not already in members, add member
    if (!project.isMember(req.user._id)) {
      project.members.push({
        user: req.user._id,
        role: invitation.role,
        joinedAt: new Date(),
      });

      if (invitation.role === 'team-leader') {
        project.teamLeader = req.user._id;
      }

      await project.save();

      await ProjectMember.findOneAndUpdate(
        { project: project._id, user: req.user._id },
        {
          project: project._id,
          user: req.user._id,
          role: invitation.role,
          status: 'active',
          joinedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    invitation.status = 'accepted';
    invitation.recipientUser = req.user._id;
    invitation.respondedAt = new Date();
    await invitation.save();

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:invitation_accepted',
      resource: 'ProjectInvitation',
      resourceId: invitation._id,
      req,
      details: { projectId: project._id, role: invitation.role },
    });

    // Notify Project Owner / Team Leader
    const io = req.app.get('io');
    await createNotification(
      {
        recipient: project.owner,
        actor: req.user._id,
        type: 'project:member_joined',
        title: 'Invitation Accepted',
        message: `${req.user.name} accepted the invitation and joined "${project.name}".`,
        link: `/projects/${project._id}`,
      },
      io
    );

    if (io) {
      io.to(`project:${project._id}`).emit('project:updated', {
        projectId: project._id,
        type: 'member_joined',
        member: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar, role: invitation.role },
      });
    }

    res.json({
      success: true,
      message: `You have successfully joined "${project.name}".`,
      data: { projectId: project._id },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/invitations/:invitationId/reject
exports.rejectInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const { token } = req.body;

    let invitation;
    if (token) {
      const tokenHash = ProjectInvitation.hashToken(token);
      invitation = await ProjectInvitation.findOne({ tokenHash });
    } else if (mongoose.isValidObjectId(invitationId)) {
      invitation = await ProjectInvitation.findById(invitationId);
    }

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    const userEmail = req.user.email.toLowerCase().trim();
    if (userEmail !== invitation.recipientEmail.toLowerCase().trim()) {
      return res.status(403).json({ success: false, message: 'Access denied: Email mismatch.' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Invitation is already ${invitation.status}.` });
    }

    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    await invitation.save();

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:invitation_rejected',
      resource: 'ProjectInvitation',
      resourceId: invitation._id,
      req,
    });

    res.json({ success: true, message: 'Invitation declined.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/invitations/:invitationId
// Team Leader cancels pending invitation
exports.cancelInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const invitation = await ProjectInvitation.findById(invitationId).populate('project');

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    const project = invitation.project;
    if (!project || !project.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: Only Team Leaders can cancel invitations.' });
    }

    invitation.status = 'cancelled';
    await invitation.save();

    await log({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'project:invitation_cancelled',
      resource: 'ProjectInvitation',
      resourceId: invitation._id,
      req,
    });

    res.json({ success: true, message: 'Invitation cancelled.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/invitations/smtp/status
// Diagnostic endpoint to check if email service is configured without exposing secrets
exports.getSmtpStatus = async (req, res) => {
  const status = emailService.getEmailServiceStatus();
  res.json({ success: true, status });
};

// POST /api/invitations/smtp/verify
// Diagnostic endpoint to test live email service connectivity
exports.testSmtpConnection = async (req, res) => {
  const result = await emailService.verifyEmailService();
  res.status(result.ok ? 200 : 502).json({
    success: result.ok,
    ...result,
  });
};
