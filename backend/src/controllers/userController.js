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
