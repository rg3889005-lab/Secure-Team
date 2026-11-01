'use strict';

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
  const primaryUri = process.env.MONGODB_URI;

  if (primaryUri) {
    const maskedUri = primaryUri.replace(/:([^@]+)@/, ':****@');
    try {
      console.log(`Connecting to primary MongoDB URI...`);
      cachedConnection = mongoose.connect(primaryUri, {
        dbName: 'secure_team_workspace',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      const conn = await cachedConnection;
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      cachedConnection = null;
      console.warn(`⚠️ Primary MongoDB connection failed (${err.message})`);
      console.warn(`   URI: ${maskedUri}`);

      // In serverless environments, fail fast rather than trying localhost
      if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        throw err;
      }
    }
  } else if (process.env.VERCEL) {
    console.error('❌ MONGODB_URI is not set in Vercel environment variables.');
    return;
  }

  // Fallback to local MongoDB (only for local development)
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      console.log(`Attempting fallback to local MongoDB (${LOCAL_FALLBACK_URI})...`);
      cachedConnection = mongoose.connect(LOCAL_FALLBACK_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      const conn = await cachedConnection;
      console.log(`✅ Connected to local MongoDB fallback on 127.0.0.1:27017`);
      return conn;
    } catch (fallbackErr) {
      cachedConnection = null;
      console.error(`❌ Local MongoDB fallback also failed: ${fallbackErr.message}`);
    }
  }
};

module.exports = connectDB;
