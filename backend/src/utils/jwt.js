'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'secure_team_workspace_jwt_access_secret_fallback_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'secure_team_workspace_jwt_refresh_secret_fallback_key_2026';

/**
 * Generate a signed JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'secure-team-workspace',
    audience: 'stw-client',
  });
};

/**
 * Generate a signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'secure-team-workspace',
    audience: 'stw-client',
  });
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    issuer: 'secure-team-workspace',
    audience: 'stw-client',
  });
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'secure-team-workspace',
    audience: 'stw-client',
  });
};

/**
 * Hash a token for safe storage/comparison
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a cryptographically random code (for email verification, password reset)
 */
const generateSecureCode = (length = 6) => {
  const bytes = crypto.randomBytes(Math.ceil(length * 3 / 4));
  return bytes.toString('base64url').slice(0, length).toUpperCase();
};

/**
 * Generate a secure random token (longer, for password reset links)
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Set refresh token cookie
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  });
};

/**
 * Clear refresh token cookie
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateSecureCode,
  generateSecureToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
