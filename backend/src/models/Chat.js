'use strict';

const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation reference is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
    attachments: [
      {
        file: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
        filename: String,
        mimetype: String,
        size: Number,
        url: String,
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

directMessageSchema.index({ conversation: 1, createdAt: -1 });
directMessageSchema.index({ sender: 1 });

const conversationSchema = new mongoose.Schema(
  {
    // For 1-to-1 Direct Messages
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // Legacy support for group/name
    name: { type: String, trim: true, maxlength: 200, default: null },
    type: { type: String, enum: ['direct', 'group'], default: 'direct' },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'DirectMessage', default: null },
    lastActivity: { type: Date, default: Date.now },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

conversationSchema.methods.isParticipant = function (userId) {
  if (!userId) return false;
  const uid = userId.toString();
  return Array.isArray(this.participants) && this.participants.some((p) => (p._id || p).toString() === uid);
};

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = {
  Conversation,
  DirectMessage,
  Message: DirectMessage, // Backward compatibility alias
};
