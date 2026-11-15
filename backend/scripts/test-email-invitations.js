'use strict';

/**
 * Project Invitation Email System Verification Test Suite
 *
 * Verifies:
 * 1. Team Leader sends invitation: generates SHA-256 tokenHash and 48-hour expiration.
 * 2. Rollback protection: if SMTP dispatch fails, invitation document is rolled back (deleted) so retries are not blocked.
 * 3. Duplicate pending invitation prevention when an active invitation exists.
 * 4. Non-leader / non-owner permission denial (HTTP 403) on sending invitations.
 * 5. Resend invitation: refreshes 48-hour expiration, generates new token hash, invalidates previous token.
 * 6. Resend rate limit: enforces 60-second cooldown between resends (HTTP 429).
 * 7. Non-leader permission denial (HTTP 403) on resending invitations.
 * 8. Invitation acceptance with matching recipient email successfully adds member to project.
 * 9. Invitation acceptance by mismatched recipient email rejected (HTTP 403).
 * 10. Already accepted invitation reuse rejection (HTTP 400).
 * 11. Expired invitation acceptance rejection (HTTP 400).
 * 12. Team leader cancel invitation removes/cancels invitation.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (_) {}

const http = require('http');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt');
const emailService = require('../src/services/emailService');

// Models
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const ProjectMember = require('../src/models/ProjectMember');
const ProjectInvitation = require('../src/models/ProjectInvitation');

let server;
let port;
let baseUrl;

const users = {};
const tokens = {};
let testProject;
const results = [];

function recordResult(num, title, passed, details = '') {
  results.push({ num, title, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] Test ${num}: ${title}`);
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
  console.log('Setting up Project Invitation Test Environment...');
  console.log('----------------------------------------------------');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_team_workspace';
  await mongoose.connect(uri, { dbName: 'secure_team_workspace' });

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  const timestamp = Date.now();
  const testConfigs = [
    { key: 'leader', name: 'Leader Alice', email: `leader.alice.${timestamp}@example.com`, role: 'user' },
    { key: 'member', name: 'Member Bob', email: `member.bob.${timestamp}@example.com`, role: 'user' },
    { key: 'recipient', name: 'Recipient Charlie', email: `charlie.${timestamp}@example.com`, role: 'user' },
    { key: 'intruder', name: 'Intruder Eve', email: `eve.${timestamp}@example.com`, role: 'user' },
  ];

  for (const cfg of testConfigs) {
    const user = await User.create({
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

  testProject = await Project.create({
    name: 'Secure-Team Invite Testing Workspace',
    owner: users.leader._id,
    teamLeader: users.leader._id,
    visibility: 'private',
    description: 'Workspace for testing email invitation workflows',
    members: [
      { user: users.leader._id, role: 'owner', joinedAt: new Date() },
      { user: users.member._id, role: 'member', joinedAt: new Date() },
    ],
  });

  await ProjectMember.create([
    { project: testProject._id, user: users.leader._id, role: 'owner', permissions: ['invite', 'remove'] },
    { project: testProject._id, user: users.member._id, role: 'member', permissions: [] },
  ]);

  console.log(`Test Project created: ${testProject._id}`);
}

async function runTests() {
  console.log('\n====================================================');
  console.log('RUNNING PROJECT INVITATION TEST SUITE');
  console.log('====================================================\n');

  // Stub emailService.sendEmail so tests can simulate success and failure reliably
  const originalSendEmail = emailService.sendEmail;

  try {
    // -------------------------------------------------------------------
    // Test 1: Team Leader sends invitation (Mocked SMTP Success)
    // -------------------------------------------------------------------
    let capturedEmailOptions = null;
    emailService.sendEmail = async (opts) => {
      capturedEmailOptions = opts;
      return { success: true, messageId: 'mock-msg-123' };
    };

    const inviteRes = await request(`/api/projects/${testProject._id}/invitations`, {
      method: 'POST',
      token: tokens.leader,
      body: { email: users.recipient.email, role: 'member' },
    });

    const inviteInDb = await ProjectInvitation.findOne({ project: testProject._id, recipientEmail: users.recipient.email }).select('+tokenHash');
    const expiresDiffHours = inviteInDb ? (inviteInDb.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60) : 0;

    const pass1 = inviteRes.status === 201 &&
      inviteInDb !== null &&
      Boolean(inviteInDb.tokenHash) &&
      expiresDiffHours > 47 && expiresDiffHours <= 48 &&
      capturedEmailOptions && capturedEmailOptions.to === users.recipient.email;

    recordResult(
      1,
      'Team Leader sends invitation creates hashed token and ~48h expiry',
      pass1,
      `Status: ${inviteRes.status}, Expiry: ~${Math.round(expiresDiffHours)}h, TokenHash exists: ${!!inviteInDb?.tokenHash}`
    );

    // -------------------------------------------------------------------
    // Test 2: Duplicate pending invitation prevention
    // -------------------------------------------------------------------
    const dupRes = await request(`/api/projects/${testProject._id}/invitations`, {
      method: 'POST',
      token: tokens.leader,
      body: { email: users.recipient.email, role: 'member' },
    });

    const pass2 = (dupRes.status === 400 || dupRes.status === 409) && (dupRes.data.message || '').includes('already been sent');
    recordResult(
      2,
      'Duplicate pending invitation prevented (HTTP 409/400)',
      pass2,
      `Status: ${dupRes.status}, Message: ${dupRes.data?.message}`
    );

    // -------------------------------------------------------------------
    // Test 3: Rollback protection when email dispatch fails
    // -------------------------------------------------------------------
    emailService.sendEmail = async () => {
      return { success: false, error: 'SMTP connection failed (EAUTH)' };
    };

    const failEmail = `failed.delivery.${Date.now()}@example.com`;
    const failRes = await request(`/api/projects/${testProject._id}/invitations`, {
      method: 'POST',
      token: tokens.leader,
      body: { email: failEmail, role: 'member' },
    });

    const rollbackCheck = await ProjectInvitation.findOne({ project: testProject._id, recipientEmail: failEmail });
    const pass3 = failRes.status === 502 && rollbackCheck === null;

    recordResult(
      3,
      'Rollback on email dispatch failure deletes pending invite and returns 502',
      pass3,
      `Status: ${failRes.status}, Document deleted: ${rollbackCheck === null}`
    );

    // Restore successful email sender
    emailService.sendEmail = async (opts) => {
      capturedEmailOptions = opts;
      return { success: true, messageId: 'mock-msg-resend' };
    };

    // -------------------------------------------------------------------
    // Test 4: Non-leader / non-owner permission denial (HTTP 403)
    // -------------------------------------------------------------------
    const unauthorizedRes = await request(`/api/projects/${testProject._id}/invitations`, {
      method: 'POST',
      token: tokens.member,
      body: { email: `unauthorized.${Date.now()}@example.com`, role: 'member' },
    });

    const pass4 = unauthorizedRes.status === 403;
    recordResult(
      4,
      'Non-leader cannot send project invitations (HTTP 403)',
      pass4,
      `Status: ${unauthorizedRes.status}, Message: ${unauthorizedRes.data?.message}`
    );

    // -------------------------------------------------------------------
    // Test 5: Resend invitation refreshes token hash and 48h expiration
    // -------------------------------------------------------------------
    const originalHash = inviteInDb.tokenHash;
    const originalExpiry = inviteInDb.expiresAt;

    // Fast-forward updatedAt so rate limit doesn't block immediately for Test 5
    await ProjectInvitation.collection.updateOne(
      { _id: inviteInDb._id },
      { $set: { updatedAt: new Date(Date.now() - 65 * 1000) } }
    );

    const resendRes = await request(`/api/invitations/${inviteInDb._id}/resend`, {
      method: 'POST',
      token: tokens.leader,
    });

    const refreshedInvite = await ProjectInvitation.findById(inviteInDb._id).select('+tokenHash');
    const pass5 = resendRes.status === 200 &&
      refreshedInvite.tokenHash !== originalHash &&
      refreshedInvite.expiresAt.getTime() >= originalExpiry.getTime();

    recordResult(
      5,
      'Resend invitation generates new tokenHash and refreshes expiration',
      pass5,
      `Status: ${resendRes.status}, Hash rotated: ${refreshedInvite.tokenHash !== originalHash}`
    );

    // -------------------------------------------------------------------
    // Test 6: Resend rate limit enforces 60-second cooldown (HTTP 429)
    // -------------------------------------------------------------------
    const spamResendRes = await request(`/api/invitations/${inviteInDb._id}/resend`, {
      method: 'POST',
      token: tokens.leader,
    });

    const pass6 = spamResendRes.status === 429 && (spamResendRes.data?.message || '').includes('Please wait');
    recordResult(
      6,
      'Resend rate limit triggers HTTP 429 within 60s cooldown',
      pass6,
      `Status: ${spamResendRes.status}, Message: ${spamResendRes.data?.message}`
    );

    // -------------------------------------------------------------------
    // Test 7: Non-leader cannot resend invitation (HTTP 403)
    // -------------------------------------------------------------------
    const memberResendRes = await request(`/api/invitations/${inviteInDb._id}/resend`, {
      method: 'POST',
      token: tokens.member,
    });

    const pass7 = memberResendRes.status === 403;
    recordResult(
      7,
      'Non-leader cannot resend project invitations (HTTP 403)',
      pass7,
      `Status: ${memberResendRes.status}`
    );

    // -------------------------------------------------------------------
    // Test 8: Invitation acceptance by mismatched user email rejected (HTTP 403)
    // -------------------------------------------------------------------
    const wrongUserRes = await request(`/api/invitations/${inviteInDb._id}/accept`, {
      method: 'POST',
      token: tokens.intruder,
    });

    const pass8 = wrongUserRes.status === 403 && (
      (wrongUserRes.data?.message || '').includes('switch accounts') ||
      (wrongUserRes.data?.message || '').includes('issued to')
    );
    recordResult(
      8,
      'Acceptance rejected when logged-in user email differs from invite (HTTP 403)',
      pass8,
      `Status: ${wrongUserRes.status}, Message: ${wrongUserRes.data?.message}`
    );

    // -------------------------------------------------------------------
    // Test 9: Invitation acceptance with matching email succeeds (HTTP 200)
    // -------------------------------------------------------------------
    const acceptRes = await request(`/api/invitations/${inviteInDb._id}/accept`, {
      method: 'POST',
      token: tokens.recipient,
    });

    const updatedProject = await Project.findById(testProject._id);
    const isMemberNow = updatedProject.members.some(
      (m) => m.user.toString() === users.recipient._id.toString()
    );
    const membershipDoc = await ProjectMember.findOne({
      project: testProject._id,
      user: users.recipient._id,
    });

    const pass9 = acceptRes.status === 200 && isMemberNow && membershipDoc !== null;
    recordResult(
      9,
      'Acceptance by intended recipient succeeds and adds user to project',
      pass9,
      `Status: ${acceptRes.status}, In project.members: ${isMemberNow}, MemberDoc: ${!!membershipDoc}`
    );

    // -------------------------------------------------------------------
    // Test 10: Token reuse on already accepted invitation rejected (HTTP 400)
    // -------------------------------------------------------------------
    const reuseRes = await request(`/api/invitations/${inviteInDb._id}/accept`, {
      method: 'POST',
      token: tokens.recipient,
    });

    const pass10 = reuseRes.status === 400 && (reuseRes.data?.message || '').includes('already accepted');
    recordResult(
      10,
      'Reusing already accepted invitation rejected (HTTP 400)',
      pass10,
      `Status: ${reuseRes.status}, Message: ${reuseRes.data?.message}`
    );

    // -------------------------------------------------------------------
    // Test 11: Expired invitation acceptance rejected (HTTP 400)
    // -------------------------------------------------------------------
    const expiredInvite = await ProjectInvitation.create({
      project: testProject._id,
      recipientEmail: `expired.${Date.now()}@example.com`,
      role: 'member',
      inviter: users.leader._id,
      tokenHash: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      status: 'pending',
    });

    const expiredUser = await User.create({
      name: 'Expired Test User',
      email: expiredInvite.recipientEmail,
      password: 'TestPassword123!',
      role: 'user',
      isEmailVerified: true,
      isActive: true,
    });
    const expiredToken = generateAccessToken({ userId: expiredUser._id.toString(), role: expiredUser.role, email: expiredUser.email });

    const expiredRes = await request(`/api/invitations/${expiredInvite._id}/accept`, {
      method: 'POST',
      token: expiredToken,
    });

    const pass11 = expiredRes.status === 400 && (expiredRes.data?.message || '').includes('expired');
    recordResult(
      11,
      'Expired invitation acceptance rejected (HTTP 400)',
      pass11,
      `Status: ${expiredRes.status}, Message: ${expiredRes.data?.message}`
    );

    // -------------------------------------------------------------------
    // Test 12: Leader cancel invitation
    // -------------------------------------------------------------------
    const cancelTarget = await ProjectInvitation.create({
      project: testProject._id,
      recipientEmail: `cancel.${Date.now()}@example.com`,
      role: 'member',
      inviter: users.leader._id,
      tokenHash: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      status: 'pending',
    });

    const cancelRes = await request(`/api/invitations/${cancelTarget._id}`, {
      method: 'DELETE',
      token: tokens.leader,
    });

    const cancelCheck = await ProjectInvitation.findById(cancelTarget._id);
    const pass12 = cancelRes.status === 200 && (cancelCheck === null || cancelCheck.status === 'cancelled');

    recordResult(
      12,
      'Team leader can cancel pending invitation',
      pass12,
      `Status: ${cancelRes.status}, Record status: ${cancelCheck ? cancelCheck.status : 'deleted'}`
    );

  } finally {
    emailService.sendEmail = originalSendEmail;
  }
}

async function cleanup() {
  console.log('\nCleaning up test artifacts...');
  try {
    const userIds = Object.values(users).map((u) => u._id);
    await User.deleteMany({ _id: { $in: userIds } });
    if (testProject) {
      await Project.findByIdAndDelete(testProject._id);
      await ProjectMember.deleteMany({ project: testProject._id });
      await ProjectInvitation.deleteMany({ project: testProject._id });
    }
  } catch (err) {
    console.error('Cleanup warning:', err.message);
  } finally {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  }
}

async function main() {
  let exitCode = 0;
  try {
    await setup();
    await runTests();
  } catch (err) {
    console.error('Test Suite encountered fatal error:', err);
    exitCode = 1;
  } finally {
    await cleanup();
  }

  console.log('\n====================================================');
  console.log('TEST SUMMARY RESULTS');
  console.log('====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`Passed: ${passedCount} / ${results.length}`);

  if (passedCount === results.length && results.length > 0) {
    console.log('🎉 ALL PROJECT INVITATION TESTS PASSED!');
  } else {
    console.error('❌ SOME TESTS FAILED');
    exitCode = 1;
  }

  process.exit(exitCode);
}

main();
