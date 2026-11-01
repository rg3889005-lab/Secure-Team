'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authenticate request using JWT access token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid authentication token.', code: 'TOKEN_INVALID' });
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account is suspended. Contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Administrator access required.' });
  }
  next();
};

/**
 * Require email verification (if policy enforces it)
 */
const requireVerified = (req, res, next) => {
  if (req.user && !req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email address.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireVerified };
