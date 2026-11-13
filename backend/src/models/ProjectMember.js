'use strict';

const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    role: {
      type: String,
      enum: ['owner', 'team-leader', 'member'],
      default: 'member',
    },
    permissions: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['active', 'suspended', 'left'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index ensuring each user can only have one membership record per project
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });
projectMemberSchema.index({ user: 1, status: 1 });
projectMemberSchema.index({ project: 1, role: 1 });

module.exports = mongoose.model('ProjectMember', projectMemberSchema);
