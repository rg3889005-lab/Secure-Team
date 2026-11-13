'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const projectInvitationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviter reference is required'],
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['member', 'team-leader'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

projectInvitationSchema.index({ project: 1, recipientEmail: 1, status: 1 });
projectInvitationSchema.index({ recipientEmail: 1, status: 1 });
projectInvitationSchema.index({ tokenHash: 1 });
projectInvitationSchema.index({ expiresAt: 1 });
projectInvitationSchema.index({ createdAt: -1 });

// Helper to generate a raw random token and its stored SHA-256 hash
projectInvitationSchema.statics.generateToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};

// Helper to hash an incoming raw token
projectInvitationSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

module.exports = mongoose.model('ProjectInvitation', projectInvitationSchema);

