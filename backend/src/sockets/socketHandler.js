'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { Conversation, Message } = require('../models/Chat');

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
    } catch (err) {
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

    // Broadcast online status only if first connection
    if (onlineUsers.get(userId).size === 1) {
      socket.broadcast.emit('presence:online', { userId, user: socket.user });
    }

    // Send current online users to the newly connected socket
    const onlineList = Array.from(onlineUsers.keys());
    socket.emit('presence:list', onlineList);

    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // ─── Join Conversation Room ─────────────────────────────────────────────
    const handleJoinConversation = async (data) => {
      try {
        const conversationId = typeof data === 'string' ? data : data?.conversationId;
        if (!conversationId) return;
        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join conversation.' });
      }
    };
    socket.on('conversation:join', handleJoinConversation);
    socket.on('chat:join', handleJoinConversation);

    // ─── Leave Conversation Room ────────────────────────────────────────────
    const handleLeaveConversation = (data) => {
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    };
    socket.on('conversation:leave', handleLeaveConversation);
    socket.on('chat:leave', handleLeaveConversation);

    // ─── Join Project Room ──────────────────────────────────────────────────
    socket.on('project:join', async (projectId) => {
      try {
        const Project = require('../models/Project');
        const project = await Project.findById(projectId);
        if (!project) return;
        const isAdmin = socket.userRole === 'admin';
        if (!isAdmin && !project.isMember(userId)) {
          socket.emit('error', { message: 'Not a member of this project.' });
          return;
        }
        socket.join(`project:${projectId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join project room.' });
      }
    });

    // ─── Send Message ───────────────────────────────────────────────────────
    const handleSendMessage = async (data) => {
      try {
        const { conversationId, content } = data || {};

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          return;
        }

        let targetConvId = conversationId;
        let conversation = null;
        if (targetConvId && targetConvId !== 'general-channel') {
          conversation = await Conversation.findById(targetConvId);
        }

        if (!conversation) {
          conversation = await Conversation.findOne({ name: 'General Team Chat' });
          if (!conversation) {
            conversation = await Conversation.create({
              type: 'group',
              name: 'General Team Chat',
              members: [{ user: userId, role: 'member' }],
            });
          }
          targetConvId = conversation._id.toString();
        }

        // Auto-join membership
        const isMember = conversation.members.some((m) => m.user.toString() === userId.toString());
        if (!isMember) {
          conversation.members.push({ user: userId, role: 'member' });
          await conversation.save();
        }

        // Persist message
        const message = await Message.create({
          conversation: conversation._id,
          sender: userId,
          content: content.trim(),
          type: 'text',
        });

        await Conversation.findByIdAndUpdate(conversation._id, {
          lastMessage: message._id,
          lastActivity: new Date(),
        });

        const populated = await message.populate('sender', 'name avatar email');

        // Emit to conversation room and broadcast
        io.to(`conversation:${conversation._id}`).emit('chat:message', populated);
        socket.emit('chat:message', populated);
        socket.broadcast.emit('chat:message', populated);
      } catch (err) {
        console.error('Socket chat error:', err.message);
      }
    };

    socket.on('chat:send', handleSendMessage);
    socket.on('chat:message', handleSendMessage);

    // ─── Typing Indicator ───────────────────────────────────────────────────
    socket.on('chat:typing', (data) => {
      const convId = typeof data === 'string' ? data : data?.conversationId;
      socket.broadcast.emit('chat:typing', {
        userId,
        conversationId: convId,
        user: socket.user,
        isTyping: true,
      });
    });

    socket.on('chat:stop_typing', (data) => {
      const convId = typeof data === 'string' ? data : data?.conversationId;
      socket.broadcast.emit('chat:stop_typing', {
        userId,
        conversationId: convId,
      });
    });

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Mark offline only when last connection closes
          io.emit('presence:offline', { userId });
          // Update lastSeen
          User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(() => {});
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.user?.name} (${socket.id})`);
    });
  });

  return io;
};

module.exports = { initializeSockets };
