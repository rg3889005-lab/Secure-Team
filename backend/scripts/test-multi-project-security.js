'use strict';

/**
 * Multi-Project Collaboration Security Verification Test Suite
 *
 * Validates all 10 mandated security scenarios:
 * 1. Non-member access to private project (assert HTTP 403)
 * 2. Member of Project Alpha accessing Project Beta (assert HTTP 403)
 * 3. Manual IDOR attempt modifying projectId in API request (assert HTTP 403)
 * 4. Non-member file access denial (assert HTTP 403)
 * 5. Unauthorized project Socket.io room subscription rejection (assert socket error event)
 * 6. Non-participant access to direct messages (assert HTTP 403)
 * 7. Standard member attempting Team Leader operations (assert HTTP 403)
 * 8. Expired invitation acceptance rejection (assert HTTP 400)
 * 9. Token reuse rejection on already accepted invitation (assert HTTP 400)
 * 10. Removed member access attempt after removal (assert HTTP 403)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (_) {}

const http = require('http');
const mongoose = require('mongoose');
const { Server: SocketIO } = require('socket.io');
const { io: ClientIO } = require(path.join(__dirname, '../../frontend/node_modules/socket.io-client'));
const app = require('../src/app');
const { initializeSockets } = require('../src/sockets/socketHandler');
const { generateAccessToken } = require('../src/utils/jwt');

// Models
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const ProjectMember = require('../src/models/ProjectMember');
const ProjectInvitation = require('../src/models/ProjectInvitation');
const ProjectMessage = require('../src/models/ProjectMessage');
const { Conversation, DirectMessage } = require('../src/models/Chat');
const File = require('../src/models/File');

let server;
let ioServer;
let port;
let baseUrl;

// Test state
const users = {};
const tokens = {};
const testProjects = {};
const testConversations = {};

const results = [];

function recordResult(scenarioNum, title, passed, details = '') {
  results.push({ scenarioNum, title, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] Scenario ${scenarioNum}: ${title}`);
  if (details) console.log(`       Details: ${details}`);
}

async function request(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function setup() {
  console.log('----------------------------------------------------');
  console.log('Setting up Multi-Project Collaboration Test Environment...');
  console.log('----------------------------------------------------');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_team_workspace';
  await mongoose.connect(uri, { dbName: 'secure_team_workspace' });

  // Start HTTP and Socket.IO server on ephemeral port
  server = http.createServer(app);
  ioServer = new SocketIO(server, { cors: { origin: '*' } });
  app.set('io', ioServer);
  initializeSockets(ioServer);

  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  // Create clean test users
  const testUserConfigs = [
    { key: 'rahul', name: 'Rahul Sharma', email: `rahul.test.${Date.now()}@example.com`, role: 'user' },
    { key: 'abhishek', name: 'Abhishek Kumar', email: `abhishek.test.${Date.now()}@example.com`, role: 'user' },
    { key: 'priya', name: 'Priya Patel', email: `priya.test.${Date.now()}@example.com`, role: 'user' },
    { key: 'amit', name: 'Amit Singh', email: `amit.test.${Date.now()}@example.com`, role: 'user' },
    { key: 'ravi', name: 'Ravi Verma', email: `ravi.test.${Date.now()}@example.com`, role: 'user' },
  ];

  for (const cfg of testUserConfigs) {
    let user = await User.create({
      name: cfg.name,
      email: cfg.email,
      password: 'TestPassword123!',
      role: cfg.role,
      isEmailVerified: true,
      isActive: true,
    });
    users[cfg.key] = user;
    tokens[cfg.key] = generateAccessToken({ userId: user._id.toString(), role: user.role, email: user.email });
  }

  // Create Project Alpha (Owner & Leader: Rahul, Members: Amit)
  testProjects.alpha = await Project.create({
    name: 'Project Alpha (Confidential)',
    owner: users.rahul._id,
    teamLeader: users.rahul._id,
    visibility: 'private',
    description: 'Alpha confidential internal specifications',
    internalObjectives: ['Launch Alpha security layer', 'Zero trust architecture'],
    members: [
      { user: users.rahul._id, role: 'owner', joinedAt: new Date() },
      { user: users.amit._id, role: 'member', joinedAt: new Date() },
    ],
  });

  // Create Project Beta (Owner & Leader: Abhishek)
  testProjects.beta = await Project.create({
    name: 'Project Beta (Private)',
    owner: users.abhishek._id,
    teamLeader: users.abhishek._id,
    visibility: 'private',
    description: 'Beta secret roadmap',
    internalObjectives: ['Beta deliverable Q4'],
    members: [
      { user: users.abhishek._id, role: 'owner', joinedAt: new Date() },
    ],
  });

  console.log('Project Alpha ID:', testProjects.alpha._id.toString());
  console.log('Project Beta ID:', testProjects.beta._id.toString());
  console.log('Users initialized:', Object.keys(users).join(', '));
}

async function runTests() {
  console.log('\n====================================================');
  console.log('RUNNING 10 MANDATED SECURITY TESTS');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // Scenario 1: Non-member access to private project (assert HTTP 403)
  // --------------------------------------------------------------------------
  {
    const res = await request(`/api/projects/${testProjects.alpha._id}`, {
      token: tokens.abhishek, // Abhishek is NOT a member of Alpha
    });
    const passed = res.status === 403;
    recordResult(
      1,
      'Non-member access to private project returns HTTP 403',
      passed,
      `Status: ${res.status}, Message: ${res.data?.message || JSON.stringify(res.data)}`
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 2: Member of Project Alpha accessing Project Beta (assert HTTP 403)
  // --------------------------------------------------------------------------
  {
    const res = await request(`/api/projects/${testProjects.beta._id}`, {
      token: tokens.amit, // Amit is a member of Alpha, but NOT Beta
    });
    const passed = res.status === 403;
    recordResult(
      2,
      'Member of Project Alpha accessing Project Beta returns HTTP 403',
      passed,
      `Status: ${res.status}, Message: ${res.data?.message || JSON.stringify(res.data)}`
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 3: Manual IDOR attempt modifying projectId in API request (assert HTTP 403)
  // --------------------------------------------------------------------------
  {
    // Abhishek is not in Alpha. He crafts a request to read Alpha messages or Alpha members
    const res = await request(`/api/projects/${testProjects.alpha._id}/messages`, {
      token: tokens.abhishek,
    });
    const passed = res.status === 403;
    recordResult(
      3,
      'Manual IDOR attempt modifying projectId returns HTTP 403',
      passed,
      `Status: ${res.status}, Message: ${res.data?.message || JSON.stringify(res.data)}`
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 4: Non-member file access denial (assert HTTP 403)
  // --------------------------------------------------------------------------
  {
    // Create a private file linked to Project Alpha
    const alphaFile = await File.create({
      originalName: 'alpha_architecture_blueprint.pdf',
      storageName: 'test-alpha-file.pdf',
      storagePath: path.join(__dirname, 'dummy.pdf'),
      mimeType: 'application/pdf',
      size: 1024,
      uploader: users.rahul._id,
      project: testProjects.alpha._id,
    });

    // Abhishek (non-member) attempts to access / download this file
    const res = await request(`/api/files/${alphaFile._id}`, {
      token: tokens.abhishek,
    });
    const passed = res.status === 403;
    recordResult(
      4,
      'Non-member access to project file returns HTTP 403',
      passed,
      `Status: ${res.status}, Message: ${res.data?.message || JSON.stringify(res.data)}`
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Unauthorized project Socket.io room subscription rejection
  // --------------------------------------------------------------------------
  {
    let passed = false;
    let detailMsg = '';

    await new Promise((resolve) => {
      const clientSocket = ClientIO(baseUrl, {
        auth: { token: tokens.abhishek }, // Abhishek is not a member of Alpha
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        detailMsg = 'Timed out waiting for socket response';
        clientSocket.disconnect();
        resolve();
      }, 4000);

      clientSocket.on('connect', () => {
        // Attempt to subscribe to Alpha's room
        clientSocket.emit('project:join', { projectId: testProjects.alpha._id.toString() });
      });

      clientSocket.on('project:error', (err) => {
        clearTimeout(timeout);
        if (err.message && err.message.toLowerCase().includes('access denied')) {
          passed = true;
          detailMsg = `Socket emitted project:error with: "${err.message}"`;
        } else {
          detailMsg = `Socket error received: "${err.message}"`;
        }
        clientSocket.disconnect();
        resolve();
      });

      clientSocket.on('project:joined', () => {
        clearTimeout(timeout);
        detailMsg = 'SECURITY VIOLATION: Unauthorized socket was allowed to join project room!';
        clientSocket.disconnect();
        resolve();
      });
    });

    recordResult(
      5,
      'Unauthorized project Socket.io room subscription rejection',
      passed,
      detailMsg
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 6: Non-participant access to direct messages (assert HTTP 403)
  // --------------------------------------------------------------------------
  {
    // Create 1-to-1 conversation between Rahul and Abhishek
    const dmConv = await Conversation.create({
      participants: [users.rahul._id, users.abhishek._id],
      type: 'direct',
      unreadCounts: {
        [users.rahul._id.toString()]: 0,
        [users.abhishek._id.toString()]: 0,
      },
    });
    testConversations.rahulAbhishek = dmConv;

    // Priya (third party) attempts to fetch messages from this conversation
    const res = await request(`/api/conversations/${dmConv._id}/messages`, {
      token: tokens.priya, // Priya is NOT a participant
    });
    const passed = res.status === 403;
    recordResult(
      6,
      'Non-participant access to direct messages returns HTTP 403',
      passed,
      `Status: ${res.status}, Message: ${res.data?.message || JSON.stringify(res.data)}`
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 7: Standard member attempting Team Leader operations (assert HTTP 403)
  // --------------------------------------------------------------------------
  {
    // Amit is a standard member in Project Alpha.
    // Amit attempts to invite a new user to Project Alpha (Leader only).
    const res = await request(`/api/projects/${testProjects.alpha._id}/invitations`, {
      method: 'POST',
      token: tokens.amit,
      body: {
        email: 'attacker@example.com',
        role: 'member',
      },
    });
    const passed = res.status === 403;
    recordResult(
      7,
      'Standard member attempting Team Leader operation returns HTTP 403',
      passed,
      `Status: ${res.status}, Message: ${res.data?.message || JSON.stringify(res.data)}`
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 8: Expired invitation acceptance rejection (assert HTTP 400)
  // --------------------------------------------------------------------------
  {
    const { rawToken, tokenHash } = ProjectInvitation.generateToken();
    const expiredInvite = await ProjectInvitation.create({
      project: testProjects.alpha._id,
      inviter: users.rahul._id,
      recipientEmail: users.priya.email,
      tokenHash,
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 24 hours ago
    });

    const res = await request(`/api/invitations/${expiredInvite._id}/accept`, {
      method: 'POST',
      token: tokens.priya,
      body: { token: rawToken },
    });
    const passed = res.status === 400;
    recordResult(
      8,
      'Expired invitation acceptance rejection returns HTTP 400',
      passed,
      `Status: ${res.status}, Message: ${res.data?.message || JSON.stringify(res.data)}`
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 9: Token reuse rejection on already accepted invitation (assert HTTP 400)
  // --------------------------------------------------------------------------
  {
    const { rawToken, tokenHash } = ProjectInvitation.generateToken();
    const validInvite = await ProjectInvitation.create({
      project: testProjects.alpha._id,
      inviter: users.rahul._id,
      recipientEmail: users.priya.email,
      tokenHash,
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // First acceptance (should succeed)
    const firstRes = await request(`/api/invitations/${validInvite._id}/accept`, {
      method: 'POST',
      token: tokens.priya,
      body: { token: rawToken },
    });

    // Second acceptance (token replay attack - must be rejected with 400)
    const secondRes = await request(`/api/invitations/${validInvite._id}/accept`, {
      method: 'POST',
      token: tokens.priya,
      body: { token: rawToken },
    });

    const passed = firstRes.status === 200 && secondRes.status === 400;
    recordResult(
      9,
      'Token reuse on already accepted invitation rejected with HTTP 400',
      passed,
      `First: ${firstRes.status}, Second: ${secondRes.status} (${secondRes.data?.message})`
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 10: Removed member access attempt after removal (assert HTTP 403)
  // --------------------------------------------------------------------------
  {
    // Add Ravi as a member of Project Alpha
    await Project.findByIdAndUpdate(testProjects.alpha._id, {
      $push: { members: { user: users.ravi._id, role: 'member', joinedAt: new Date() } },
    });

    // Verify Ravi has access initially
    const beforeRemoval = await request(`/api/projects/${testProjects.alpha._id}`, {
      token: tokens.ravi,
    });

    // Team Leader (Rahul) removes Ravi from Project Alpha
    const removeRes = await request(`/api/projects/${testProjects.alpha._id}/members/${users.ravi._id}`, {
      method: 'DELETE',
      token: tokens.rahul,
    });

    // Ravi attempts to access Project Alpha after removal
    const afterRemoval = await request(`/api/projects/${testProjects.alpha._id}`, {
      token: tokens.ravi,
    });

    const passed = beforeRemoval.status === 200 && removeRes.status === 200 && afterRemoval.status === 403;
    recordResult(
      10,
      'Removed member access attempt after removal returns HTTP 403',
      passed,
      `Before: ${beforeRemoval.status}, Remove: ${removeRes.status}, After: ${afterRemoval.status}`
    );
  }
}

async function cleanup() {
  console.log('\nCleaning up test artifacts...');
  try {
    const userIds = Object.values(users).map((u) => u._id);
    const projectIds = Object.values(testProjects).map((p) => p._id);
    const convIds = Object.values(testConversations).map((c) => c._id);

    await User.deleteMany({ _id: { $in: userIds } });
    await Project.deleteMany({ _id: { $in: projectIds } });
    await ProjectMember.deleteMany({ project: { $in: projectIds } });
    await ProjectInvitation.deleteMany({ project: { $in: projectIds } });
    await ProjectMessage.deleteMany({ project: { $in: projectIds } });
    await Conversation.deleteMany({ _id: { $in: convIds } });
    await DirectMessage.deleteMany({ conversation: { $in: convIds } });
    await File.deleteMany({ project: { $in: projectIds } });
  } catch (err) {
    console.warn('Cleanup warning:', err.message);
  }

  if (server) {
    await new Promise((r) => server.close(r));
  }
  await mongoose.disconnect();
}

async function main() {
  try {
    await setup();
    await runTests();
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await cleanup();
  }

  console.log('\n====================================================');
  console.log('TEST SUMMARY RESULTS');
  console.log('====================================================');
  const allPassed = results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`Passed: ${passedCount} / ${results.length}`);

  if (allPassed && results.length === 10) {
    console.log('🎉 ALL 10 MANDATED MULTI-PROJECT COLLABORATION SECURITY TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
}

main();
