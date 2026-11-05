'use strict';

const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateSecureCode,
  generateSecureToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail, sendSocialLoginReminderEmail } = require('../services/emailService');
const { log } = require('../services/auditService');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildTokens = async (user, res) => {
  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const hashedRefresh = hashToken(refreshToken);

  // Store hashed refresh token
  await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: hashedRefresh } });

  setRefreshTokenCookie(res, refreshToken);
  return accessToken;
};

// ─── Register ────────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

    // Field validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
    }

    // Generate verification code
    const code = generateSecureCode(6);
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const hasEmailConfig = Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

    // Every new registration receives USER as default role. Never allow ADMIN during registration.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      department: (department || '').trim(),
      emailVerificationCode: code,
      emailVerificationExpires: codeExpiry,
      emailVerificationLastSent: new Date(),
      isEmailVerified: true, // Direct activation for seamless onboarding
      role: 'user',
    });

    if (hasEmailConfig) {
      // Send verification email (non-blocking)
      sendVerificationEmail(normalizedEmail, name.trim(), code).catch((err) =>
        console.error('Verification email failed:', err.message)
      );
    }

    await log({ actor: user._id, actorEmail: normalizedEmail, action: 'auth:register', req });

    // IMPORTANT (Phase 2): Do not automatically log in users after normal registration.
    // Return success message so user can be redirected to the Login page.
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please sign in with your credentials.',
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCode +emailVerificationExpires +emailVerificationAttempts'
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification request.' });
    }
    if (user.isEmailVerified) {
      return res.status(200).json({ success: true, message: 'Email already verified. Please log in.' });
    }

    // Rate limit attempts
    if (user.emailVerificationAttempts >= 10) {
      return res.status(429).json({ success: false, message: 'Too many verification attempts. Request a new code.' });
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new one.' });
    }

    if (user.emailVerificationCode !== code.toUpperCase()) {
      await User.findByIdAndUpdate(user._id, { $inc: { emailVerificationAttempts: 1 } });
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    // Mark verified
    await User.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      $unset: {
        emailVerificationCode: 1,
        emailVerificationExpires: 1,
        emailVerificationAttempts: 1,
        emailVerificationLastSent: 1,
      },
    });

    await log({ actor: user._id, actorEmail: normalizedEmail, action: 'auth:email_verified', req });

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

// ─── Resend Verification ──────────────────────────────────────────────────────

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationLastSent +emailVerificationAttempts'
    );

    // Generic response to avoid email enumeration
    if (!user || user.isEmailVerified) {
      return res.json({ success: true, message: 'If this email is registered and unverified, a new code has been sent.' });
    }

    // Rate limit: 60 seconds between sends
    if (user.emailVerificationLastSent) {
      const elapsed = Date.now() - user.emailVerificationLastSent.getTime();
      if (elapsed < 60000) {
        return res.status(429).json({ success: false, message: 'Please wait before requesting another code.' });
      }
    }

    const code = generateSecureCode(6);
    await User.findByIdAndUpdate(user._id, {
      emailVerificationCode: code,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
      emailVerificationAttempts: 0,
      emailVerificationLastSent: new Date(),
    });

    sendVerificationEmail(normalizedEmail, user.name, code).catch((err) =>
      console.error('Resend email failed:', err.message)
    );

    res.json({ success: true, message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let normalizedEmail = (email || '').toLowerCase().trim();
    if (normalizedEmail === 'admin') {
      normalizedEmail = 'admin@workspace.com';
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshTokens');

    const isValidPassword = user ? await user.comparePassword(password) : false;

    // Generic failure message to prevent account enumeration
    if (!user || !isValidPassword) {
      await log({
        actorEmail: normalizedEmail,
        action: 'auth:login_failed',
        outcome: 'failure',
        req,
        details: { reason: 'invalid_credentials' },
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const accessToken = await buildTokens(user, res);

    await log({ actor: user._id, actorEmail: normalizedEmail, action: 'auth:login', req });

    res.json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Google Sign-In ───────────────────────────────────────────────────────────

exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      return res.status(503).json({ success: false, message: 'Google Sign-In is not configured on this server.' });
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
    }

    const payload = ticket.getPayload();
    if (!payload.email_verified) {
      return res.status(400).json({ success: false, message: 'Google account email is not verified.' });
    }

    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ googleId }).select('+refreshTokens');

    if (!user) {
      // Try to find by email — only link if provider is local and no password set (safe linking)
      const existingByEmail = await User.findOne({ email: normalizedEmail });

      if (existingByEmail) {
        if (existingByEmail.authProvider === 'local' && existingByEmail.password) {
          // Do NOT auto-link — require the user to log in with password first
          return res.status(409).json({
            success: false,
            message: 'An account with this email already exists. Please sign in with your password.',
          });
        }
        // Link if no password exists
        user = await User.findByIdAndUpdate(
          existingByEmail._id,
          { googleId, authProvider: 'google', avatar: picture, isEmailVerified: true },
          { new: true }
        ).select('+refreshTokens');
      } else {
        // Create new account
        user = await User.create({
          name,
          email: normalizedEmail,
          googleId,
          authProvider: 'google',
          avatar: picture,
          isEmailVerified: true,
          role: 'user',
        });
        user = await User.findById(user._id).select('+refreshTokens');
      }
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    const accessToken = await buildTokens(user, res);
    await log({ actor: user._id, actorEmail: normalizedEmail, action: 'auth:google_login', req });

    res.json({ success: true, message: 'Google login successful.', accessToken, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// ─── Facebook Sign-In ─────────────────────────────────────────────────────────

exports.facebookLogin = async (req, res, next) => {
  try {
    const { accessToken, userID } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Facebook access token is required.' });
    }

    // Server-side validation via Facebook Graph API
    const fbUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`;
    const fbRes = await fetch(fbUrl);
    const fbData = await fbRes.json();

    if (fbData.error || !fbData.id) {
      return res.status(401).json({
        success: false,
        message: fbData.error?.message || 'Invalid or expired Facebook credential.',
      });
    }

    // Verify userID matches if provided
    if (userID && fbData.id !== userID) {
      return res.status(401).json({ success: false, message: 'Facebook user ID mismatch.' });
    }

    const facebookId = fbData.id;
    const name = fbData.name || 'Facebook User';
    const email = fbData.email ? fbData.email.toLowerCase().trim() : null;
    const avatar = fbData.picture?.data?.url || null;

    let user = await User.findOne({ facebookId }).select('+refreshTokens');

    if (!user) {
      if (email) {
        const existingByEmail = await User.findOne({ email });
        if (existingByEmail) {
          if (existingByEmail.authProvider === 'local' && existingByEmail.password) {
            // Require user to sign in with password first to safely link
            return res.status(409).json({
              success: false,
              message: 'An account with this email already exists. Please sign in with your password to link your Facebook account.',
            });
          }
          user = await User.findByIdAndUpdate(
            existingByEmail._id,
            { facebookId, authProvider: 'facebook', avatar: avatar || existingByEmail.avatar, isEmailVerified: true },
            { returnDocument: 'after' }
          ).select('+refreshTokens');
        } else {
          // Create new user account with USER as default role (never admin)
          user = await User.create({
            name,
            email,
            facebookId,
            authProvider: 'facebook',
            avatar,
            isEmailVerified: true,
            role: 'user',
          });
          user = await User.findById(user._id).select('+refreshTokens');
        }
      } else {
        // Fallback for Facebook accounts registered without an email
        const fallbackEmail = `fb_${facebookId}@workspace.local`;
        user = await User.create({
          name,
          email: fallbackEmail,
          facebookId,
          authProvider: 'facebook',
          avatar,
          isEmailVerified: true,
          role: 'user',
        });
        user = await User.findById(user._id).select('+refreshTokens');
      }
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    const jwtToken = await buildTokens(user, res);
    await log({ actor: user._id, actorEmail: user.email, action: 'auth:facebook_login', req });

    res.json({
      success: true,
      message: 'Facebook login successful.',
      accessToken: jwtToken,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.', code: 'NO_REFRESH' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.', code: 'REFRESH_INVALID' });
    }

    const hashed = hashToken(token);
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(hashed)) {
      // Possible reuse — revoke all tokens (reuse detection)
      if (user) {
        await User.findByIdAndUpdate(user._id, { refreshTokens: [] });
      }
      clearRefreshTokenCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh token reuse detected. Please log in again.', code: 'REFRESH_REUSE' });
    }

    if (!user.isActive || user.isSuspended) {
      clearRefreshTokenCookie(res);
      return res.status(403).json({ success: false, message: 'Account is not accessible.' });
    }

    // Rotate: remove old, issue new
    await User.findByIdAndUpdate(user._id, { $pull: { refreshTokens: hashed } });

    const payload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    const newHashed = hashToken(newRefreshToken);

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: newHashed } });
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const hashed = hashToken(token);
      if (req.user) {
        await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: hashed } });
      }
    }
    clearRefreshTokenCookie(res);
    if (req.user) {
      await log({ actor: req.user._id, actorEmail: req.user.email, action: 'auth:logout', req });
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password +passwordResetAttempts');

    // Generic response regardless of whether account exists to prevent account enumeration
    const genericResponse = { success: true, message: 'If this email is registered, recovery instructions have been sent.' };

    if (!user || !user.isActive) {
      return res.json(genericResponse);
    }

    // Rate limit: 5 resets per hour
    if (user.passwordResetAttempts >= 5) {
      return res.json(genericResponse);
    }

    // Google / Facebook accounts without a local password (Phase 6 requirement)
    if (user.authProvider !== 'local' && !user.password) {
      sendSocialLoginReminderEmail(normalizedEmail, user.name, user.authProvider).catch((err) =>
        console.error('Social reminder email failed:', err.message)
      );
      await log({ actor: user._id, actorEmail: normalizedEmail, action: 'auth:password_reset_requested', req });
      return res.json(genericResponse);
    }

    const token = generateSecureToken();
    const hashed = hashToken(token);

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashed,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      $inc: { passwordResetAttempts: 1 },
    });

    sendPasswordResetEmail(normalizedEmail, user.name, token).catch((err) =>
      console.error('Password reset email failed:', err.message)
    );

    await log({ actor: user._id, actorEmail: normalizedEmail, action: 'auth:password_reset_requested', req });

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const hashed = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetAttempts = 0;
    user.refreshTokens = []; // Revoke all active sessions
    await user.save();

    clearRefreshTokenCookie(res);
    await log({ actor: user._id, actorEmail: user.email, action: 'auth:password_reset_completed', req });

    res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};
