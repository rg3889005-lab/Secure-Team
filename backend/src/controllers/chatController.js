'use strict';

const { Conversation, Message } = require('../models/Chat');
const Project = require('../models/Project');
const User = require('../models/User');

// GET /api/conversations
exports.getConversations = async (req, res, next) => {
  try {
    let conversations = await Conversation.find({ 'members.user': req.user._id, isArchived: false })
      .populate('members.user', 'name avatar email')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    if (!conversations || conversations.length === 0) {
      let general = await Conversation.findOne({ name: 'General Team Chat' });
      if (!general) {
        general = await Conversation.create({
          type: 'group',
          name: 'General Team Chat',
          members: [{ user: req.user._id, role: 'admin' }],
        });
      } else {
        const isMember = general.members.some((m) => m.user.toString() === req.user._id.toString());
        if (!isMember) {
          general.members.push({ user: req.user._id, role: 'member' });
          await general.save();
        }
      }

      const populatedGeneral = await Conversation.findById(general._id)
        .populate('members.user', 'name avatar email')
        .populate('lastMessage');
      conversations = [populatedGeneral];
    }

    res.json({ success: true, data: conversations, conversations });
  } catch (err) {
    next(err);
  }
};

// POST /api/conversations
exports.createConversation = async (req, res, next) => {
  try {
    const { type = 'direct', name, memberIds, projectId } = req.body;

    const allMemberIds = [...new Set([req.user._id.toString(), ...(memberIds || [])])];

    if (type === 'direct' && allMemberIds.length !== 2) {
      return res.status(400).json({ success: false, message: 'Direct conversations require exactly 2 members.' });
    }

    // Check for existing direct conversation
    if (type === 'direct') {
      const existing = await Conversation.findOne({
        type: 'direct',
        'members.user': { $all: allMemberIds },
        $expr: { $eq: [{ $size: '$members' }, 2] },
      });
      if (existing) {
        return res.json({ success: true, data: existing });
      }
    }

    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project || !project.isMember(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied to this project.' });
      }
    }

    const members = allMemberIds.map((uid) => ({
      user: uid,
      role: uid === req.user._id.toString() ? 'admin' : 'member',
    }));

    const conversation = await Conversation.create({
      type,
      name: name || null,
      project: projectId || null,
      members,
    });

    const populated = await conversation.populate('members.user', 'name avatar email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/conversations/:conversationId/messages
exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    if (!conversation.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversation._id, isDeleted: false })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: conversation._id, isDeleted: false }),
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

// GET /api/conversations/:conversationId/unread
exports.getUnreadCount = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation || !conversation.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const member = conversation.members.find((m) => m.user.toString() === req.user._id.toString());
    const lastRead = member?.lastRead || new Date(0);

    const count = await Message.countDocuments({
      conversation: conversation._id,
      createdAt: { $gt: lastRead },
      sender: { $ne: req.user._id },
      isDeleted: false,
    });

    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};
