'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (_) {}
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_team_workspace';
  await mongoose.connect(uri, { dbName: 'secure_team_workspace' });
  const res = await mongoose.connection.collection('users').updateMany(
    {},
    { $set: { isEmailVerified: true, isActive: true } }
  );
  console.log('Successfully verified users. Modified count:', res.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
