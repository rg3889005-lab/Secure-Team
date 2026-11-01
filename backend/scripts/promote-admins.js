'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (_) {}
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_team_workspace';
  await mongoose.connect(uri, { dbName: 'secure_team_workspace' });
  const res = await User.updateMany(
    { email: { $in: ['rg3889005@gmail.com', 'admin@workspace.com', 'test1@gmail.com'] } },
    { $set: { role: 'admin', isEmailVerified: true, isActive: true } }
  );
  console.log('Successfully promoted admin users:', res.modifiedCount);
  const users = await User.find({ role: 'admin' }, 'email role');
  console.log('Current admins:', users);
  await mongoose.disconnect();
}

run().catch(console.error);

