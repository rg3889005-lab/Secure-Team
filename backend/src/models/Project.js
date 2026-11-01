'use strict';

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name must not exceed 200 characters'],
    },
    description: { type: String, maxlength: 2000, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
      default: 'planning',
      set: (v) => (v ? v.toLowerCase().replace('_', '-') : 'planning'),
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'urgent'],
      default: 'medium',
      set: (v) => (v ? v.toLowerCase() : 'medium'),
    },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    color: { type: String, default: '#6366f1' },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text' });

// Check if user is a member
projectSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

// Get member role
projectSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Check if user can manage (owner or project admin)
projectSchema.methods.canManage = function (userId) {
  if (this.owner.toString() === userId.toString()) return true;
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member && ['owner', 'admin'].includes(member.role);
};

module.exports = mongoose.model('Project', projectSchema);
