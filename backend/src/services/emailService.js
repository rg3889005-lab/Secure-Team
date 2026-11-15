'use strict';

const nodemailer = require('nodemailer');

let transporter = null;

// Determine if a credential value is empty or an unconfigured placeholder
const isPlaceholder = (val) => {
  if (!val) return true;
  const lower = String(val).toLowerCase().trim();
  return (
    lower === '' ||
    lower.includes('your_email') ||
    lower.includes('your_app_password') ||
    lower.includes('your_email_account') ||
    lower.includes('your_email_app_password') ||
    lower.includes('your_google_app_password') ||
    lower.includes('example.com')
  );
};

// Resolve SMTP environment configuration supporting both SMTP_* and EMAIL_* conventions
const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  // Auto-detect secure mode: true for port 465 (SSL/TLS direct), false for 587 (STARTTLS)
  let secure = port === 465;
  if (process.env.SMTP_SECURE !== undefined) {
    secure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === true;
  }

  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    (user ? `"Secure-Team Workspace" <${user}>` : '"Secure-Team Workspace" <noreply@secureteam.com>');

  const isConfigured = !isPlaceholder(user) && !isPlaceholder(pass);

  return { host, port, secure, user, pass, from, isConfigured };
};

const getTransporter = () => {
  if (transporter) return transporter;

  const config = getSmtpConfig();

  if (!config.isConfigured) {
    console.warn('⚠️  [SMTP] Email credentials not configured or using placeholder values. Outbound email delivery is disabled.');
    return null;
  }

  const transportOptions = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };

  // If using Gmail SMTP, enable service shortcut if standard host
  if (config.host.toLowerCase().includes('gmail.com')) {
    transportOptions.service = 'gmail';
  }

  transporter = nodemailer.createTransport(transportOptions);
  return transporter;
};

// Diagnostic connection test without sending an email
const verifySmtp = async () => {
  const config = getSmtpConfig();
  if (!config.isConfigured) {
    return {
      ok: false,
      reason: 'MISSING_CREDENTIALS',
      message: 'SMTP credentials are not configured or contain default placeholder values. Set SMTP_USER and SMTP_PASS in .env.',
    };
  }

  try {
    const transport = getTransporter();
    if (!transport) {
      return { ok: false, reason: 'INIT_FAILED', message: 'Failed to initialize Nodemailer transporter.' };
    }

    await transport.verify();
    return {
      ok: true,
      message: `SMTP connection successfully verified to ${config.host}:${config.port} as ${config.user}.`,
    };
  } catch (err) {
    const code = err.code || 'UNKNOWN';
    let diagnostic = err.message;

    if (code === 'EAUTH') {
      diagnostic =
        'SMTP Authentication failed (EAUTH). For Gmail, you must use a 16-character Google App Password with 2-Step Verification enabled, not your normal account password.';
    } else if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ESOCKET') {
      diagnostic = `SMTP Connection failed to ${config.host}:${config.port} (${code}). Verify host/port and firewall access. Try port 465 with SMTP_SECURE=true.`;
    }

    console.error(`❌ [SMTP Verify Error] [${code}] ${diagnostic}`);
    return { ok: false, reason: code, message: diagnostic, error: err };
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  const config = getSmtpConfig();
  const transport = getTransporter();

  if (!transport || !config.isConfigured) {
    const errorMsg = 'Email delivery skipped: SMTP credentials not configured.';
    console.warn(`📧 [SMTP Skipped] To: ${to} | Subject: "${subject}" | Reason: Missing SMTP credentials`);
    return {
      success: false,
      skipped: true,
      error: errorMsg,
    };
  }

  try {
    // When sending via Gmail, the From address should match the authenticated account
    const fromAddress = config.from.includes('<')
      ? config.from
      : `"Secure-Team Workspace" <${config.user}>`;

    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });

    console.log(`✅ [SMTP Delivered] To: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    };
  } catch (err) {
    const code = err.code || 'UNKNOWN';
    let friendlyMessage = `SMTP delivery failed to ${to}: ${err.message}`;

    if (code === 'EAUTH') {
      friendlyMessage =
        'SMTP authentication failed. Please verify that your Gmail App Password is valid and 2-Step Verification is active.';
    } else if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED') {
      friendlyMessage = `SMTP connection timed out connecting to ${config.host}:${config.port}.`;
    }

    console.error(`❌ [SMTP Send Error] [${code}] ${friendlyMessage}`);
    return {
      success: false,
      error: friendlyMessage,
      code,
      details: err.message,
    };
  }
};

const sendVerificationEmail = async (to, name, code) => {
  return sendEmail({
    to,
    subject: 'Verify Your Email — Secure-Team Workspace',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:40px 20px;">
        <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:32px; text-align:center;">
            <h1 style="color:#fff; margin:0; font-size:24px;">Secure-Team Workspace</h1>
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
          <div style="background:#f8fafc; padding:20px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">© ${new Date().getFullYear()} Secure-Team Workspace</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

const sendPasswordResetEmail = async (to, name, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://secure-team.vercel.app';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: 'Reset Your Password — Secure-Team Workspace',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:40px 20px;">
        <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:32px; text-align:center;">
            <h1 style="color:#fff; margin:0; font-size:24px;">Secure-Team Workspace</h1>
          </div>
          <div style="padding:40px;">
            <h2 style="color:#1e293b; margin-top:0;">Password Reset Request</h2>
            <p style="color:#64748b; line-height:1.7;">Hi ${name}, we received a request to reset your password.</p>
            <a href="${resetUrl}" style="display:block; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; text-decoration:none; padding:16px 32px; border-radius:10px; font-weight:600; text-align:center; margin:24px 0;">Reset Password</a>
            <p style="color:#94a3b8; font-size:14px;">This link expires in <strong>1 hour</strong>. If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="background:#f8fafc; padding:20px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">© ${new Date().getFullYear()} Secure-Team Workspace</p>
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
    subject: 'Sign In Instructions — Secure-Team Workspace',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:40px 20px;">
        <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:32px; text-align:center;">
            <h1 style="color:#fff; margin:0; font-size:24px;">Secure-Team Workspace</h1>
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
          <div style="background:#f8fafc; padding:20px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">© ${new Date().getFullYear()} Secure-Team Workspace</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

/**
 * Sends a responsive project invitation email matching specification.
 * Email Subject: You are invited to join a project on Secure-Team!
 */
const sendProjectInvitationEmail = async ({
  to,
  inviterName,
  projectName,
  projectDescription = '',
  projectRole = 'member',
  token,
  expiresAt,
}) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://secure-team.vercel.app';
  const acceptUrl = `${frontendUrl}/invitations?token=${token}&action=accept`;
  const rejectUrl = `${frontendUrl}/invitations?token=${token}&action=reject`;

  const roleDisplay = projectRole === 'team-leader' ? 'Team Leader' : 'Team Member';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 30px 16px; color: #1e293b;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" border="0" cellspacing="0" cellpadding="0">
              
              <!-- Header Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 32px; text-align: center;">
                  <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 22px; font-weight: 800; margin-bottom: 12px;">
                    ST
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
                    Secure-Team
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.85); margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">
                    Secure Collaboration & Workspace Platform
                  </p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 36px 32px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                    Hello,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #334155;">
                    <strong style="color: #0f172a;">${inviterName || 'A Team Leader'}</strong> has invited you to join the project <strong style="color: #4f46e5;">${projectName}</strong> on <strong>Secure-Team</strong> as a <strong>${roleDisplay}</strong>.
                  </p>

                  ${
                    projectDescription
                      ? `<div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                          <p style="margin: 0; font-size: 14px; color: #475569; font-style: italic; line-height: 1.5;">"${projectDescription}"</p>
                        </div>`
                      : ''
                  }

                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Project:</td>
                        <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${projectName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Your Assigned Role:</td>
                        <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #4f46e5;">${roleDisplay}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Invited Email:</td>
                        <td align="right" style="padding: 6px 0; font-size: 14px; color: #0f172a;">${to}</td>
                      </tr>
                    </table>
                  </div>

                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #334155; text-align: center;">
                    Click the button below to review and accept the invitation:
                  </p>

                  <!-- Primary CTA Button -->
                  <div style="text-align: center; margin-bottom: 28px;">
                    <a href="${acceptUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      ACCEPT INVITATION
                    </a>
                  </div>

                  <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${rejectUrl}" style="color: #64748b; font-size: 13px; text-decoration: underline;">
                      Decline this invitation
                    </a>
                  </div>

                  <!-- Expiration & Disclaimer Box -->
                  <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                      ⏳ <strong>This invitation expires in 48 hours.</strong>
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #b45309; line-height: 1.4;">
                      If you do not have an active Secure-Team account yet, you will be prompted to sign in or create an account with <strong>${to}</strong> before joining.
                    </p>
                  </div>

                  <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                    If you were not expecting this invitation, you can safely ignore this email. No action will be taken without your explicit consent.
                  </p>

                  <p style="margin: 24px 0 0 0; font-size: 14px; color: #475569; line-height: 1.6;">
                    Regards,<br>
                    <strong>Secure-Team Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} Secure-Team Workspace. All rights reserved.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">
                    End-to-end encrypted workspace isolation and role-based access control.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return module.exports.sendEmail({
    to,
    subject: 'You are invited to join a project on Secure-Team!',
    html,
  });
};

const setTransporter = (customTransporter) => {
  transporter = customTransporter;
};

module.exports = {
  sendEmail,
  verifySmtp,
  getSmtpConfig,
  setTransporter,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSocialLoginReminderEmail,
  sendProjectInvitationEmail,
};
