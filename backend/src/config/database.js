'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const dns = require('dns');

// Safely set DNS servers (can fail with EBADFLAGS in serverless environments)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (_) {
  // Ignored in restricted environments like AWS Lambda / Vercel
}

let cachedConnection = null;
let listenersInitialized = false;

const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/secure_team_workspace';

/**
 * Never print credentials in logs.
 * Masks 100% of the password and removes query parameter secrets.
 */
const maskMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '<empty>';
  try {
    const schemeMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)(.+)$/);
    if (!schemeMatch) return 'mongodb://****:****@<hidden>';
    const [ , scheme, body ] = schemeMatch;
    const lastAtIndex = body.lastIndexOf('@');
    if (lastAtIndex === -1) return `${scheme}<no-auth-host>`;

    const hostPart = body.substring(lastAtIndex + 1).split('?')[0];
    const authPart = body.substring(0, lastAtIndex);
    const colonIndex = authPart.indexOf(':');
    const username = colonIndex !== -1 ? authPart.substring(0, colonIndex) : authPart;
    return `${scheme}${username}:****@${hostPart}`;
  } catch (_) {
    return 'mongodb://****:****@<hidden>';
  }
};

/**
 * Safely URL-encodes special characters in the password segment of a MongoDB URI
 * without double-encoding existing percent-encoded sequences.
 */
const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return uri;
  try {
    const schemeMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)(.+)$/);
    if (!schemeMatch) return uri;

    const [ , scheme, body ] = schemeMatch;
    const lastAtIndex = body.lastIndexOf('@');
    if (lastAtIndex === -1) return uri; // No user/password auth in URI

    const authPart = body.substring(0, lastAtIndex);
    const hostPart = body.substring(lastAtIndex + 1);

    const colonIndex = authPart.indexOf(':');
    if (colonIndex === -1) return uri; // No password

    const rawUser = authPart.substring(0, colonIndex);
    const rawPass = authPart.substring(colonIndex + 1);

    let decodedUser, decodedPass;
    try { decodedUser = decodeURIComponent(rawUser); } catch (_) { decodedUser = rawUser; }
    try { decodedPass = decodeURIComponent(rawPass); } catch (_) { decodedPass = rawPass; }

    const safeUser = encodeURIComponent(decodedUser);
    const safePass = encodeURIComponent(decodedPass);

    return `${scheme}${safeUser}:${safePass}@${hostPart}`;
  } catch (_) {
    return uri;
  }
};

const ensureAdminSeed = async () => {
  try {
    const User = require('../models/User');
    const admin = await User.findOne({ email: 'admin@workspace.com' });
    if (!admin) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@workspace.com',
        password: 'AdminPassword123!',
        role: 'admin',
        isEmailVerified: true,
        department: 'Engineering',
      });
      console.log('✅ Default administrator seeded: admin@workspace.com / AdminPassword123!');
    }
  } catch (err) {
    console.warn('Admin auto-seed error:', err.message);
  }
};

const initListeners = () => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  mongoose.connection.on('disconnected', () => {
    cachedConnection = null;
    console.warn('⚠️  MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB error: ${err.message}`);
  });
};

const connectDB = async () => {
  // Return immediately if already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is in progress, reuse the pending promise
  if (mongoose.connection.readyState === 2 && cachedConnection) {
    return cachedConnection;
  }

  initListeners();

  // Read environment variable with common cloud provider aliases
  const rawUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URL;

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (rawUri) {
    const sanitizedUri = sanitizeMongoUri(rawUri.trim());
    const maskedUri = maskMongoUri(sanitizedUri);

    try {
      console.log(`Connecting to MongoDB Atlas (${maskedUri})...`);

      const options = {
        dbName: 'secure_team_workspace',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      // Ensure Atlas authenticates against admin database if not explicitly set in URI
      if (!sanitizedUri.includes('authSource=')) {
        options.authSource = 'admin';
      }

      cachedConnection = mongoose.connect(sanitizedUri, options);

      const conn = await cachedConnection;
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      ensureAdminSeed().catch(() => {});
      return conn;
    } catch (err) {
      cachedConnection = null;
      console.warn(`⚠️ Primary MongoDB connection failed (${err.message})`);
      console.warn(`   Target: ${maskedUri}`);

      // In production or cloud deployments (Render, Vercel, AWS), fail immediately without localhost fallback
      if (isProduction) {
        throw err;
      }
    }
  } else if (isProduction) {
    console.error('❌ MONGODB_URI is not configured in production environment variables.');
    return;
  }

  // Local MongoDB fallback — strictly disabled in production
  if (!isProduction) {
    try {
      console.log(`Attempting fallback to local MongoDB (${LOCAL_FALLBACK_URI})...`);
      cachedConnection = mongoose.connect(LOCAL_FALLBACK_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      const conn = await cachedConnection;
      console.log(`✅ Connected to local MongoDB fallback on 127.0.0.1:27017`);
      ensureAdminSeed().catch(() => {});
      return conn;
    } catch (fallbackErr) {
      cachedConnection = null;
      console.error(`❌ Local MongoDB fallback also failed: ${fallbackErr.message}`);
    }
  }
};

module.exports = connectDB;
