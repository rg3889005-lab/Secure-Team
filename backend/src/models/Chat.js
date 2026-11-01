'use strict';

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
    type: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
    attachments: [
      {
        file: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
        filename: String,
        mimetype: String,
      },
    ],
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const conversationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 200, default: null },
    type: { type: String, enum: ['direct', 'group', 'project'], default: 'direct' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        lastRead: { type: Date, default: null },
      },
    ],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    lastActivity: { type: Date, default: Date.now },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ 'members.user': 1 });
conversationSchema.index({ project: 1 });
conversationSchema.index({ lastActivity: -1 });

conversationSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

module.exports = {
  Conversation: mongoose.model('Conversation', conversationSchema),
  Message: mongoose.model('Message', messageSchema),
};
