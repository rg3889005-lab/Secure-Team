'use strict';

const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'team-leader', 'member', 'admin', 'viewer'],
      default: 'member',
    },
    permissions: [{ type: String }],
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name must not exceed 200 characters'],
    },
    description: { type: String, maxlength: 4000, default: '' },
    publicDescription: { type: String, maxlength: 500, default: '' },
    internalObjectives: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
      set: (v) => (Array.isArray(v) ? v.join('\n') : (typeof v === 'string' ? v : '')),
    },
    category: { type: String, trim: true, default: 'General' },
    image: { type: String, default: null },
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
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
projectSchema.index({ teamLeader: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ visibility: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text', publicDescription: 'text' });

const getUserIdString = (val) => {
  if (!val) return '';
  if (val._id) return val._id.toString();
  return val.toString();
};

// Check if a user is an active member
projectSchema.methods.isMember = function (userId) {
  if (!userId) return false;
  const uid = getUserIdString(userId);
  if (this.owner && getUserIdString(this.owner) === uid) return true;
  if (this.teamLeader && getUserIdString(this.teamLeader) === uid) return true;
  return Array.isArray(this.members) && this.members.some((m) => m.user && getUserIdString(m.user) === uid);
};

// Check if a user is an owner or team leader
projectSchema.methods.isLeader = function (userId) {
  if (!userId) return false;
  const uid = getUserIdString(userId);
  if (this.owner && getUserIdString(this.owner) === uid) return true;
  if (this.teamLeader && getUserIdString(this.teamLeader) === uid) return true;
  const member = Array.isArray(this.members) ? this.members.find((m) => m.user && getUserIdString(m.user) === uid) : null;
  return !!(member && ['owner', 'team-leader', 'admin'].includes(member.role));
};

// Check management permissions
projectSchema.methods.canManage = function (userId) {
  return this.isLeader(userId);
};

// Get member role
projectSchema.methods.getMemberRole = function (userId) {
  if (!userId) return null;
  const uid = getUserIdString(userId);
  if (this.owner && getUserIdString(this.owner) === uid) return 'owner';
  if (this.teamLeader && getUserIdString(this.teamLeader) === uid) return 'team-leader';
  const member = Array.isArray(this.members) ? this.members.find((m) => m.user && getUserIdString(m.user) === uid) : null;
  return member ? member.role : null;
};

// Public projection: returns strictly public metadata for non-members
projectSchema.methods.toPublicDTO = function () {
  return {
    _id: this._id,
    name: this.name,
    category: this.category || 'General',
    image: this.image,
    publicDescription: this.publicDescription || (this.description ? this.description.substring(0, 160) : ''),
    visibility: this.visibility,
    status: this.status,
    priority: this.priority,
    color: this.color,
    tags: this.tags,
    teamLeader: this.teamLeader
      ? {
          _id: this.teamLeader._id || this.teamLeader,
          name: this.teamLeader.name || 'Team Leader',
          avatar: this.teamLeader.avatar || null,
        }
      : null,
    memberCount: Array.isArray(this.members) ? this.members.length : 1,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Project', projectSchema);
