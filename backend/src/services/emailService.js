'use strict';

const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email credentials not configured. Email delivery disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn(`📧 [Email skipped] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });

  console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  return info;
};

const sendVerificationEmail = async (to, name, code) => {
  return sendEmail({
    to,
    subject: 'Verify Your Email — Secure Team Workspace',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:40px 20px;">
        <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:32px; text-align:center;">
            <h1 style="color:#fff; margin:0; font-size:24px;">Secure Team Workspace</h1>
          </div>
          <div style="padding:40px;">
            <h2 style="color:#1e293b; margin-top:0;">Hello, ${name}!</h2>
            <p style="color:#64748b; line-height:1.7;">Please verify your email address to activate your account.</p>
            <div style="background:#f1f5f9; border-radius:12px; padding:24px; text-align:center; margin:24px 0;">
              <p style="color:#64748b; margin:0 0 8px; font-size:14px;">Your verification code:</p>
              <span style="font-size:36px; font-weight:700; letter-spacing:8px; color:#6366f1;">${code}</span>
            </div>
            <p style="color:#94a3b8; font-size:14px;">This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
          </div>
          <div style="background:#f8fafc; padding:20px; text-align:center;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">© ${new Date().getFullYear()} Secure Team Workspace</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

const sendPasswordResetEmail = async (to, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: 'Reset Your Password — Secure Team Workspace',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:40px 20px;">
        <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:32px; text-align:center;">
            <h1 style="color:#fff; margin:0; font-size:24px;">Secure Team Workspace</h1>
          </div>
          <div style="padding:40px;">
            <h2 style="color:#1e293b; margin-top:0;">Password Reset Request</h2>
            <p style="color:#64748b; line-height:1.7;">Hi ${name}, we received a request to reset your password.</p>
            <a href="${resetUrl}" style="display:block; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; text-decoration:none; padding:16px 32px; border-radius:10px; font-weight:600; text-align:center; margin:24px 0;">Reset Password</a>
            <p style="color:#94a3b8; font-size:14px;">This link expires in <strong>1 hour</strong>. If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="background:#f8fafc; padding:20px; text-align:center;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">© ${new Date().getFullYear()} Secure Team Workspace</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

const sendSocialLoginReminderEmail = async (to, name, provider) => {
  const providerName = provider === 'facebook' ? 'Facebook' : 'Google';
  return sendEmail({
    to,
    subject: 'Sign In Instructions — Secure Team Workspace',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:40px 20px;">
        <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:32px; text-align:center;">
            <h1 style="color:#fff; margin:0; font-size:24px;">Secure Team Workspace</h1>
          </div>
          <div style="padding:40px;">
            <h2 style="color:#1e293b; margin-top:0;">Password Reset Request</h2>
            <p style="color:#64748b; line-height:1.7;">Hi ${name}, we received a request to recover your account.</p>
            <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:16px 20px; border-radius:8px; margin:20px 0;">
              <p style="color:#1e40af; margin:0; font-size:15px; font-weight:600;">Your account is authenticated via ${providerName} Sign-In.</p>
              <p style="color:#1e3a8a; margin:6px 0 0; font-size:14px; line-height:1.5;">Because you sign in with ${providerName}, your account does not have a separate local password. Please use the <strong>Continue with ${providerName}</strong> option on the sign in page to access your workspace.</p>
            </div>
            <p style="color:#94a3b8; font-size:14px;">If you did not make this request, you can safely ignore this email.</p>
          </div>
          <div style="background:#f8fafc; padding:20px; text-align:center;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">© ${new Date().getFullYear()} Secure Team Workspace</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

const sendProjectInvitationEmail = async ({ to, inviterName, projectName, projectRole, token, expiresAt }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const acceptUrl = `${frontendUrl}/invitations?token=${token}&action=accept`;
  const rejectUrl = `${frontendUrl}/invitations?token=${token}&action=reject`;
  const formattedExpiry = new Date(expiresAt).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return sendEmail({
    to,
    subject: `Invitation to join project "${projectName}" on SecureTeam`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', -apple-system, sans-serif; background:#f8fafc; margin:0; padding:40px 20px;">
        <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:36px; text-align:center;">
            <div style="display:inline-block; width:44px; height:44px; line-height:44px; border-radius:12px; background:rgba(255,255,255,0.2); color:#fff; font-size:20px; font-weight:800; margin-bottom:12px;">ST</div>
            <h1 style="color:#fff; margin:0; font-size:24px; font-weight:800; letter-spacing:-0.02em;">SecureTeam Workspace</h1>
            <p style="color:rgba(255,255,255,0.85); margin:6px 0 0; font-size:14px;">Project Collaboration Invitation</p>
          </div>
          <div style="padding:36px 32px;">
            <h2 style="color:#0f172a; margin-top:0; font-size:20px;">You've been invited!</h2>
            <p style="color:#475569; line-height:1.6; font-size:15px;">
              <strong>${inviterName}</strong> has invited you to join the private workspace for <strong>${projectName}</strong> as a <strong>${projectRole === 'team-leader' ? 'Team Leader' : 'Team Member'}</strong>.
            </p>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:24px 0;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#64748b; font-size:13px;">Project Name:</span>
                <strong style="color:#0f172a; font-size:14px;">${projectName}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#64748b; font-size:13px;">Assigned Role:</span>
                <span style="background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:6px; font-weight:600; font-size:12px; text-transform:capitalize;">${projectRole}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#64748b; font-size:13px;">Expires On:</span>
                <span style="color:#ef4444; font-size:13px; font-weight:500;">${formattedExpiry}</span>
              </div>
            </div>

            <div style="text-align:center; margin:32px 0;">
              <a href="${acceptUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:14px 28px; border-radius:10px; font-weight:700; font-size:15px; margin:0 8px 12px; box-shadow:0 4px 14px rgba(79,70,229,0.35);">Accept Invitation</a>
              <a href="${rejectUrl}" style="display:inline-block; background:#f1f5f9; color:#475569; text-decoration:none; padding:14px 24px; border-radius:10px; font-weight:600; font-size:15px; margin:0 8px 12px; border:1px solid #cbd5e1;">Decline</a>
            </div>

            <p style="color:#94a3b8; font-size:13px; line-height:1.5; text-align:center; margin:0;">
              This invitation was sent securely to ${to}. If you do not have an account yet, you will be prompted to sign up with this email before joining.
            </p>
          </div>
          <div style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px; text-align:center;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">© ${new Date().getFullYear()} SecureTeam Workspace. Protected by End-to-End Encryption.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSocialLoginReminderEmail,
  sendProjectInvitationEmail,
};
