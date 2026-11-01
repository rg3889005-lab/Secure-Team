'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (_) {}

const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const { Conversation, Message } = require('../src/models/Chat');

const seedData = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  const LOCAL_URI = 'mongodb://127.0.0.1:27017/secure_team_workspace';
  try {
    console.log('Connecting to MongoDB...');
    try {
      await mongoose.connect(uri, {
        dbName: 'secure_team_workspace',
        serverSelectionTimeoutMS: 5000,
      });
      console.log('Connected to MongoDB Atlas!');
    } catch (atlasErr) {
      console.warn(`Atlas connection failed (${atlasErr.message}). Falling back to local MongoDB...`);
      await mongoose.connect(LOCAL_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('Connected to local MongoDB!');
    }

    // Check if admin user exists
    let admin = await User.findOne({ email: 'admin@workspace.com' });
    if (!admin) {
      console.log('Creating Default System Administrator...');
      admin = await User.create({
        name: 'System Administrator',
        email: 'admin@workspace.com',
        password: 'AdminPassword123!',
        role: 'admin',
        isEmailVerified: true,
        department: 'Engineering',
      });
      console.log('Admin user created: admin@workspace.com / AdminPassword123!');
    } else {
      console.log('Admin user already exists.');
    }

    // Check sample project
    let project = await Project.findOne({ name: 'Core Infrastructure Overhaul' });
    if (!project) {
      console.log('Creating Sample Enterprise Project...');
      project = await Project.create({
        name: 'Core Infrastructure Overhaul',
        description: 'Complete migration of workspace communication services to high-reliability Socket.IO & MongoDB clusters.',
        owner: admin._id,
        members: [{ user: admin._id, role: 'owner' }],
        status: 'active',
        priority: 'high',
      });

      await Task.create({
        title: 'Configure Atlas Network Access and DB Users',
        description: 'Ensure IP allowlist is configured and administrative database user roles are assigned.',
        project: project._id,
        status: 'in-progress',
        priority: 'critical',
        creator: admin._id,
      });

      await Task.create({
        title: 'Deploy Real-Time Collaborative Workspace',
        description: 'Verify Socket.IO presence indicators, message threads, and permission-based routing.',
        project: project._id,
        status: 'done',
        priority: 'high',
        creator: admin._id,
      });

      console.log('Sample project and tasks created!');
    }

    // Sample General Chat Channel
    let generalChannel = await Conversation.findOne({ name: 'General Announcements' });
    if (!generalChannel) {
      generalChannel = await Conversation.create({
        name: 'General Announcements',
        isGroup: true,
        participants: [admin._id],
      });
      await Message.create({
        conversation: generalChannel._id,
        sender: admin._id,
        content: 'Welcome to the Secure Team Workspace! All systems are operational.',
      });
      console.log('General announcements channel created!');
    }

    console.log('\n===========================================');
    console.log('✅ SEEDING COMPLETE');
    console.log('Default Admin Login:');
    console.log('  Email:    admin@workspace.com');
    console.log('  Password: AdminPassword123!');
    console.log('===========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seedData();
