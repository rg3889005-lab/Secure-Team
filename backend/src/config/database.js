'use strict';

const mongoose = require('mongoose');
const dns = require('dns');

// Force use of Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

let isConnected = false;
let isConnecting = false;
let listenersInitialized = false;

const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/secure_team_workspace';

const initListeners = () => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('⚠️  MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('✅ MongoDB reconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB error: ${err.message}`);
  });
};

const connectDB = async () => {
  if (isConnected || isConnecting) return;

  const primaryUri = process.env.MONGODB_URI;
  initListeners();

  // Try Primary URI (Atlas or specified)
  if (primaryUri) {
    const maskedUri = primaryUri.replace(/:([^@]+)@/, ':****@');
    try {
      isConnecting = true;
      console.log(`Connecting to primary MongoDB URI...`);
      const conn = await mongoose.connect(primaryUri, {
        dbName: 'secure_team_workspace',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      });

      isConnected = true;
      isConnecting = false;
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);
      return;
    } catch (err) {
      console.warn(`⚠️ Primary MongoDB connection failed (${err.message})`);
      console.warn(`   URI: ${maskedUri}`);
    }
  }

  // Fallback to local MongoDB if available
  try {
    console.log(`Attempting fallback to local MongoDB (${LOCAL_FALLBACK_URI})...`);
    const conn = await mongoose.connect(LOCAL_FALLBACK_URI, {
      serverSelectionTimeoutMS: 3000,
      family: 4,
    });
    isConnected = true;
    isConnecting = false;
    console.log(`✅ Connected to local MongoDB fallback on 127.0.0.1:27017`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   (When your Atlas credentials are confirmed, update MONGODB_URI in backend/.env)`);
    return;
  } catch (fallbackErr) {
    isConnected = false;
    isConnecting = false;
    console.error(`❌ Local MongoDB fallback also failed: ${fallbackErr.message}`);
    console.log('   Retrying connection in 15 seconds...');
    setTimeout(connectDB, 15000);
  }
};

module.exports = connectDB;
