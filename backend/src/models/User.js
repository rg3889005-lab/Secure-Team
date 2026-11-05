'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, default: null },

    // Email verification
    emailVerificationCode: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    emailVerificationAttempts: { type: Number, default: 0, select: false },
    emailVerificationLastSent: { type: Date, select: false },

    // Password reset
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordResetAttempts: { type: Number, default: 0, select: false },

    // Social OAuth
    googleId: { type: String, sparse: true, unique: true },
    facebookId: { type: String, sparse: true, unique: true },
    authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },

    // Refresh tokens (hashed)
    refreshTokens: { type: [String], select: false, default: [] },

    // Profile
    bio: { type: String, maxlength: 500, default: '' },
    jobTitle: { type: String, maxlength: 100, default: '' },
    department: { type: String, maxlength: 100, default: '' },
    phone: { type: String, maxlength: 20, default: '' },

    // Preferences
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },

    lastSeen: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Sanitize output — never leak sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.emailVerificationCode;
  delete obj.emailVerificationExpires;
  delete obj.emailVerificationAttempts;
  delete obj.emailVerificationLastSent;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.passwordResetAttempts;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
