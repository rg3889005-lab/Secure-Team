'use strict';

const AuditLog = require('../models/AuditLog');

const log = async ({ actor, actorEmail, action, resource, resourceId, outcome = 'success', req, details = {} }) => {
  try {
    await AuditLog.create({
      actor: actor || null,
      actorEmail: actorEmail || null,
      action,
      resource: resource || null,
      resourceId: resourceId ? String(resourceId) : null,
      outcome,
      ip: req ? (req.ip || req.connection?.remoteAddress || null) : null,
      userAgent: req ? (req.headers?.['user-agent'] || null) : null,
      details,
    });
  } catch (err) {
    // Audit logging must not break application flow
    console.error('Audit log error:', err.message);
  }
};

module.exports = { log };
