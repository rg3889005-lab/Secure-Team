'use strict';

const mongoose = require('mongoose');
const { Conversation, DirectMessage } = require('../models/Chat');
const User = require('../models/User');
const { log } = require('../services/auditService');

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 40));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/conversations
// Returns all 1-to-1 direct conversations of the current user
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      isArchived: false,
    })
      .populate('participants', 'name avatar email department jobTitle lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name avatar' },
      })
      .sort({ lastActivity: -1 });

    const formatted = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      ) || conv.participants[0];

      const unreadCount = (conv.unreadCounts && conv.unreadCounts.get(userId.toString())) || 0;

      return {
        _id: conv._id,
        recipient: otherParticipant,
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount,
        isBlocked: !!conv.blockedBy,
        blockedByMe: conv.blockedBy && conv.blockedBy.toString() === userId.toString(),
        createdAt: conv.createdAt,
      };
    });

    res.json({
      success: true,
      data: formatted,
      conversations: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/conversations
// Creates or retrieves a 1-to-1 direct conversation with another registered user
exports.createConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ success: false, message: 'Valid recipient ID is required.' });
    }

    const currentUserId = req.user._id.toString();
    if (recipientId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot start a direct message conversation with yourself.' });
    }

    const targetUser = await User.findById(recipientId).select('name avatar email department jobTitle lastSeen');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Recipient user not found.' });
    }

    // Check if 1-to-1 conversation already exists between these 2 users
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, recipientId], $size: 2 },
    })
      .populate('participants', 'name avatar email department jobTitle lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name avatar' },
      });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId],
        type: 'direct',
        lastActivity: new Date(),
        unreadCounts: {
          [currentUserId]: 0,
          [recipientId]: 0,
        },
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name avatar email department jobTitle lastSeen');

      await log({
        actor: req.user._id,
        actorEmail: req.user.email,
        action: 'dm:conversation_created',
        resource: 'Conversation',
        resourceId: conversation._id,
        req,
        details: { recipientId },
      });
    }

    const unreadCount = (conversation.unreadCounts && conversation.unreadCounts.get(currentUserId)) || 0;

    res.status(200).json({
      success: true,
      data: {
        _id: conversation._id,
        recipient: targetUser,
        lastMessage: conversation.lastMessage,
        lastActivity: conversation.lastActivity,
        unreadCount,
        isBlocked: !!conversation.blockedBy,
        blockedByMe: conversation.blockedBy && conversation.blockedBy.toString() === currentUserId,
        createdAt: conversation.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/conversations/:conversationId/messages
// Only the two authorized conversation participants can read the conversation
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (!conversation.isParticipant(req.user._id)) {
      await log({
        actor: req.user._id,
        actorEmail: req.user.email,
        action: 'security:unauthorized_access',
        resource: 'Conversation',
        resourceId: conversation._id,
        req,
        details: { reason: 'non_participant_dm_read_attempted' },
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not an authorized participant in this direct message conversation.',
      });
    }

    const { page, limit, skip } = getPaginationParams(req.query);

    const [messages, total] = await Promise.all([
      DirectMessage.find({ conversation: conversation._id, isDeleted: false })
        .populate('sender', 'name avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DirectMessage.countDocuments({ conversation: conversation._id, isDeleted: false }),
    ]);

    // Mark unread messages as read
    const userIdStr = req.user._id.toString();
    if (conversation.unreadCounts && conversation.unreadCounts.get(userIdStr) > 0) {
      conversation.unreadCounts.set(userIdStr, 0);
      await conversation.save();
    }

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

// POST /api/conversations/:conversationId/messages
// Sends a direct message
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (!conversation.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to send messages in this conversation.',
      });
    }

    if (conversation.blockedBy) {
      return res.status(403).json({
        success: false,
        message: 'Direct messaging in this conversation has been blocked.',
      });
    }

    const message = await DirectMessage.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: content.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    // Update conversation metadata and increment recipient's unread counter
    const currentUserId = req.user._id.toString();
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== currentUserId
    );

    const otherIdStr = otherParticipant ? otherParticipant.toString() : null;
    const currentUnread = (conversation.unreadCounts && conversation.unreadCounts.get(otherIdStr)) || 0;

    if (otherIdStr) {
      conversation.unreadCounts.set(otherIdStr, currentUnread + 1);
    }
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    const populated = await message.populate('sender', 'name avatar email');

    // Real-time Socket.io emission strictly to the dm room and other participant's personal room
    const io = req.app.get('io');
    if (io) {
      io.to(`dm:${conversation._id}`).emit('dm:message', populated);

      if (otherIdStr) {
        io.to(`user:${otherIdStr}`).emit('dm:notification', {
          conversationId: conversation._id,
          message: populated,
          sender: { name: req.user.name, avatar: req.user.avatar },
        });
      }
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/conversations/:conversationId/read
exports.markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.isParticipant(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const userIdStr = req.user._id.toString();
    if (conversation.unreadCounts) {
      conversation.unreadCounts.set(userIdStr, 0);
      await conversation.save();
    }

    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/conversations/:conversationId/unread
exports.getUnreadCount = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.isParticipant(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const userIdStr = req.user._id.toString();
    const count = (conversation.unreadCounts && conversation.unreadCounts.get(userIdStr)) || 0;

    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};
