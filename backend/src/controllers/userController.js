'use strict';

const User = require('../models/User');
const { log } = require('../services/auditService');

// GET /api/users/me
exports.getProfile = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};

// PATCH /api/users/me
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'bio', 'jobTitle', 'department', 'phone', 'theme', 'notifications'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'user:profile_updated', req });

    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/me/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Your account uses Google Sign-In. Password change is not available.' });
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    user.refreshTokens = []; // Revoke all other sessions
    await user.save();

    await log({ actor: req.user._id, actorEmail: req.user.email, action: 'user:password_changed', req });

    res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/search?q=query
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    const query = { isActive: true, isSuspended: false };

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { jobTitle: searchRegex },
      ];
    }

    const users = await User.find(query)
      .select('name email avatar department jobTitle role lastSeen')
      .limit(Math.min(50, parseInt(limit, 10) || 20))
      .sort({ name: 1 });

    res.json({ success: true, data: users, users });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:userId/public-profile
exports.getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email avatar department jobTitle bio role lastSeen createdAt');

    if (!user || !user.isActive || user.isSuspended) {
      return res.status(404).json({ success: false, message: 'User not found or account inaccessible.' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
