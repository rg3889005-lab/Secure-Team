'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const Project = require('../models/Project');
const ProjectMessage = require('../models/ProjectMessage');
const { Conversation, DirectMessage } = require('../models/Chat');

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

const initializeSockets = (io) => {
  // ─── Authentication Middleware ─────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required.'));
      }

      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch {
        return next(new Error('Invalid or expired token.'));
      }

      const user = await User.findById(decoded.userId).select('name avatar email role isActive isSuspended');
      if (!user || !user.isActive || user.isSuspended) {
        return next(new Error('Account not accessible.'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = { id: user._id.toString(), name: user.name, avatar: user.avatar, email: user.email };
      next();
    } catch {
      next(new Error('Authentication error.'));
    }
  });

  // ─── Connection ───────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Track presence (multi-tab safe)
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Join personal notification room
    socket.join(`user:${userId}`);

    // Broadcast online status only if first active connection
    if (onlineUsers.get(userId).size === 1) {
      socket.broadcast.emit('presence:online', { userId, user: socket.user });
    }

    // Send current online users list to newly connected socket
    const onlineList = Array.from(onlineUsers.keys());
    socket.emit('presence:list', onlineList);

    // ─── PROJECT ROOM CHAT ──────────────────────────────────────────────────

    // Join Project Room with membership verification
    socket.on('project:join', async (data) => {
      try {
        const projectId = typeof data === 'string' ? data : data?.projectId;
        if (!projectId) return;

        const project = await Project.findById(projectId);
        if (!project) {
          socket.emit('project:error', { message: 'Project not found.' });
          return;
        }

        if (!project.isMember(userId)) {
          socket.emit('project:error', { message: 'Access denied: You are not a member of this project.' });
          return;
        }

        socket.join(`project:${projectId}`);
        socket.emit('project:joined', { projectId });
      } catch (err) {
        socket.emit('project:error', { message: 'Failed to join project room.' });
      }
    });

    // Leave Project Room
    socket.on('project:leave', (data) => {
      const projectId = typeof data === 'string' ? data : data?.projectId;
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    // Send Project Room Message
    socket.on('project:message', async (data) => {
      try {
        const { projectId, content, attachments } = data || {};
        if (!projectId || !content || !content.trim()) return;

        const project = await Project.findById(projectId);
        if (!project || !project.isMember(userId)) {
          socket.emit('project:error', { message: 'Access denied: Cannot send message to this project.' });
          return;
        }

        const message = await ProjectMessage.create({
          project: project._id,
          sender: userId,
          content: content.trim(),
          attachments: Array.isArray(attachments) ? attachments : [],
          readBy: [{ user: userId, readAt: new Date() }],
        });

        const populated = await message.populate('sender', 'name avatar email');

        // Strictly broadcast ONLY to project room members
        io.to(`project:${projectId}`).emit('project:message', populated);
      } catch (err) {
        socket.emit('project:error', { message: 'Failed to send project message.' });
      }
    });

    // Project Typing Indicator (sent only to project room)
    socket.on('project:typing', (data) => {
      const projectId = typeof data === 'string' ? data : data?.projectId;
      if (projectId) {
        socket.to(`project:${projectId}`).emit('project:typing', {
          projectId,
          userId,
          user: socket.user,
        });
      }
    });

    socket.on('project:stop_typing', (data) => {
      const projectId = typeof data === 'string' ? data : data?.projectId;
      if (projectId) {
        socket.to(`project:${projectId}`).emit('project:stop_typing', {
          projectId,
          userId,
        });
      }
    });

    // Project Message Read Receipt
    socket.on('project:read', async (data) => {
      try {
        const { projectId, messageId } = data || {};
        if (projectId && messageId) {
          await ProjectMessage.findByIdAndUpdate(messageId, {
            $addToSet: { readBy: { user: userId, readAt: new Date() } },
          });
          socket.to(`project:${projectId}`).emit('project:read', { projectId, messageId, userId });
        }
      } catch {}
    });

    // ─── 1-TO-1 DIRECT MESSAGING (DM) ───────────────────────────────────────

    // Join DM Conversation Room with participant verification
    const handleJoinDM = async (data) => {
      try {
        const conversationId = typeof data === 'string' ? data : (data?.conversationId || data?.id);
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(userId)) {
          socket.emit('dm:error', { message: 'Access denied: You are not a participant in this conversation.' });
          return;
        }

        socket.join(`dm:${conversationId}`);
        socket.emit('dm:joined', { conversationId });
      } catch {
        socket.emit('dm:error', { message: 'Failed to join direct message conversation.' });
      }
    };
    socket.on('dm:join', handleJoinDM);
    socket.on('chat:join', handleJoinDM); // Legacy compatibility

    // Leave DM Room
    const handleLeaveDM = (data) => {
      const conversationId = typeof data === 'string' ? data : (data?.conversationId || data?.id);
      if (conversationId) {
        socket.leave(`dm:${conversationId}`);
      }
    };
    socket.on('dm:leave', handleLeaveDM);
    socket.on('chat:leave', handleLeaveDM); // Legacy compatibility

    // Send Direct Message
    const handleSendDM = async (data) => {
      try {
        const { conversationId, content, attachments } = data || {};
        if (!conversationId || !content || !content.trim()) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(userId)) {
          socket.emit('dm:error', { message: 'Access denied: You are not authorized to send messages here.' });
          return;
        }

        if (conversation.blockedBy) {
          socket.emit('dm:error', { message: 'Direct messaging has been blocked in this conversation.' });
          return;
        }

        const message = await DirectMessage.create({
          conversation: conversation._id,
          sender: userId,
          content: content.trim(),
          attachments: Array.isArray(attachments) ? attachments : [],
          readBy: [{ user: userId, readAt: new Date() }],
        });

        // Update conversation metadata
        const otherParticipant = conversation.participants.find(
          (p) => p.toString() !== userId
        );
        const otherIdStr = otherParticipant ? otherParticipant.toString() : null;

        if (otherIdStr && conversation.unreadCounts) {
          const currentUnread = conversation.unreadCounts.get(otherIdStr) || 0;
          conversation.unreadCounts.set(otherIdStr, currentUnread + 1);
        }
        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();
        await conversation.save();

        const populated = await message.populate('sender', 'name avatar email');

        // Strictly broadcast ONLY to the DM room and the other participant's user room
        io.to(`dm:${conversationId}`).emit('dm:message', populated);

        if (otherIdStr) {
          io.to(`user:${otherIdStr}`).emit('dm:notification', {
            conversationId: conversation._id,
            message: populated,
            sender: socket.user,
          });
        }
      } catch (err) {
        socket.emit('dm:error', { message: 'Failed to send message.' });
      }
    };
    socket.on('dm:message', handleSendDM);
    socket.on('chat:message', handleSendDM); // Legacy compatibility
    socket.on('chat:send', handleSendDM); // Legacy compatibility

    // DM Typing Indicator
    socket.on('dm:typing', (data) => {
      const convId = typeof data === 'string' ? data : data?.conversationId;
      if (convId) {
        socket.to(`dm:${convId}`).emit('dm:typing', {
          conversationId: convId,
          userId,
          user: socket.user,
        });
      }
    });

    socket.on('dm:stop_typing', (data) => {
      const convId = typeof data === 'string' ? data : data?.conversationId;
      if (convId) {
        socket.to(`dm:${convId}`).emit('dm:stop_typing', {
          conversationId: convId,
          userId,
        });
      }
    });

    // DM Read Receipt
    socket.on('dm:read', async (data) => {
      try {
        const { conversationId, messageId } = data || {};
        if (conversationId && messageId) {
          await DirectMessage.findByIdAndUpdate(messageId, {
            $addToSet: { readBy: { user: userId, readAt: new Date() } },
          });
          socket.to(`dm:${conversationId}`).emit('dm:read', { conversationId, messageId, userId });
        }
      } catch {}
    });

    // ─── Disconnection ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('presence:offline', { userId });
          User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(() => {});
        }
      }
    });
  });

  return io;
};

module.exports = { initializeSockets };
