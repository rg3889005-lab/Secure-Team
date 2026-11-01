'use strict';

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorEmail: { type: String, default: null },
    action: {
      type: String,
      required: true,
      enum: [
        'auth:register',
        'auth:login',
        'auth:login_failed',
        'auth:logout',
        'auth:email_verified',
        'auth:password_reset_requested',
        'auth:password_reset_completed',
        'auth:google_login',
        'user:role_changed',
        'user:suspended',
        'user:activated',
        'user:deleted',
        'user:profile_updated',
        'user:password_changed',
        'project:created',
        'project:updated',
        'project:deleted',
        'project:member_added',
        'project:member_removed',
        'task:created',
        'task:updated',
        'task:deleted',
        'task:assigned',
        'task:status_changed',
        'file:uploaded',
        'file:downloaded',
        'file:deleted',
        'admin:settings_changed',
        'admin:announcement_sent',
        'security:unauthorized_access',
        'security:rate_limit_hit',
      ],
    },
    resource: { type: String, default: null },
    resourceId: { type: String, default: null },
    outcome: { type: String, enum: ['success', 'failure'], default: 'success' },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
