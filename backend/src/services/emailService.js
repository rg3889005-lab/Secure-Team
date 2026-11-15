'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded regardless of process working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const nodemailer = require('nodemailer');

let transporter = null;
let customTransporter = null;
let lastConfigHash = null;

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
    lower.includes('your_16_char') ||
    lower.includes('example.com') ||
    lower.includes('your_gmail_api') ||
    lower.includes('your_refresh_token') ||
    lower.includes('your_client_id') ||
    lower.includes('your_client_secret')
  );
};

// Mask email addresses for safe logging and diagnostics
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? name[0] + '***' : name[0] + '***' + name[name.length - 1];
  return `${maskedName}@${domain}`;
};

// Determine which email provider to use: 'smtp' or 'gmail_api'
const getActiveProvider = () => {
  const explicit = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  if (explicit === 'gmail_api' || explicit === 'gmail-api' || explicit === 'api') {
    return 'gmail_api';
  }
  if (explicit === 'smtp') {
    return 'smtp';
  }

  // Auto-detection mode:
  // If Gmail API refresh token is configured, prefer Gmail API (essential for Render Free plan)
  const hasGmailApi = Boolean(
    (process.env.GMAIL_API_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN) &&
    !isPlaceholder(process.env.GMAIL_API_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN) &&
    (process.env.GMAIL_API_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
    !isPlaceholder(process.env.GMAIL_API_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)
  );

  if (hasGmailApi) {
    return 'gmail_api';
  }

  return 'smtp';
};

// Resolve SMTP environment configuration
const getSmtpConfig = () => {
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const rawPort = process.env.SMTP_PORT || process.env.EMAIL_PORT;
  const port = rawPort ? parseInt(rawPort, 10) : (host.toLowerCase().includes('gmail') ? 465 : 587);

  // Auto-detect secure mode: true for port 465 (SSL/TLS direct), false for 587 (STARTTLS)
  let secure = port === 465;
  const rawSecure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE : process.env.EMAIL_SECURE;
  if (rawSecure !== undefined) {
    secure = rawSecure === 'true' || rawSecure === true || rawSecure === '1';
  }

  const rawUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
  const user = rawUser.trim();

  const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
  // Strip all whitespaces (Google 16-character app passwords are often copied with spaces e.g. "abcd efgh ijkl mnop")
  const pass = rawPass.replace(/\s+/g, '');

  const userIsPlaceholder = isPlaceholder(user);
  const passIsPlaceholder = isPlaceholder(pass);
  const isConfigured = Boolean(user && pass && !userIsPlaceholder && !passIsPlaceholder);

  const missing = [];
  if (!user || userIsPlaceholder) missing.push('SMTP_USER');
  if (!pass || passIsPlaceholder) missing.push('SMTP_PASS');

  let from = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  if (!from || isPlaceholder(from)) {
    from = user ? `"Secure-Team Workspace" <${user}>` : '"Secure-Team Workspace" <noreply@secureteam.com>';
  } else if (!from.includes('<') && user) {
    from = `"${from.trim()}" <${user}>`;
  }

  return { host, port, secure, user, pass, from, isConfigured, missing };
};

// Resolve Gmail API HTTPS configuration (used for Render Free plan to bypass SMTP port blocks)
const getGmailApiConfig = () => {
  const clientId = (process.env.GMAIL_API_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GMAIL_API_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.GMAIL_API_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN || '').trim();
  const user = (process.env.GMAIL_API_USER || process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();

  const missing = [];
  if (!clientId || isPlaceholder(clientId)) missing.push('GMAIL_API_CLIENT_ID');
  if (!clientSecret || isPlaceholder(clientSecret)) missing.push('GMAIL_API_CLIENT_SECRET');
  if (!refreshToken || isPlaceholder(refreshToken)) missing.push('GMAIL_API_REFRESH_TOKEN');

  const isConfigured = missing.length === 0;

  let from = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  if (!from || isPlaceholder(from)) {
    from = user ? `"Secure-Team Workspace" <${user}>` : '"Secure-Team Workspace" <noreply@secureteam.com>';
  } else if (!from.includes('<') && user) {
    from = `"${from.trim()}" <${user}>`;
  }

  return { clientId, clientSecret, refreshToken, user, from, isConfigured, missing };
};

// Get or initialize Nodemailer SMTP transporter
const getTransporter = (forceNew = false) => {
  if (customTransporter) return customTransporter;

  const config = getSmtpConfig();
  if (!config.isConfigured) {
    transporter = null;
    return null;
  }

  const configHash = `${config.host}:${config.port}:${config.secure}:${config.user}:${config.pass}`;
  if (transporter && !forceNew && lastConfigHash === configHash) {
    return transporter;
  }

  const transportOptions = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  };

  transporter = nodemailer.createTransport(transportOptions);
  lastConfigHash = configHash;
  return transporter;
};

// Base64URL helper for Gmail API RFC 822 MIME payloads
const makeBase64Url = (str) => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Send an email via the official Gmail REST API over HTTPS port 443
// Completely bypasses Render Free plan SMTP port 25, 465, and 587 firewalls
const sendViaGmailApi = async ({ to, subject, html, text }) => {
  const config = getGmailApiConfig();
  if (!config.isConfigured) {
    const missingStr = config.missing.join(', ');
    return {
      success: false,
      skipped: true,
      provider: 'gmail_api',
      code: 'MISSING_CONFIGURATION',
      missing: config.missing,
      error: `Gmail API delivery skipped: missing configuration (${missingStr}).`,
    };
  }

  try {
    const { OAuth2Client } = require('google-auth-library');
    const oauth2Client = new OAuth2Client(config.clientId, config.clientSecret);
    oauth2Client.setCredentials({ refresh_token: config.refreshToken });

    const tokenResponse = await oauth2Client.getAccessToken();
    const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

    if (!accessToken) {
      return {
        success: false,
        provider: 'gmail_api',
        code: 'AUTH_FAILED',
        error: 'Email authentication failed. Please check the email provider configuration.',
      };
    }

    const fromAddress = config.from;
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${fromAddress}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      html || text || '',
    ];
    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = makeBase64Url(rawMessage);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody.error?.message || `HTTP ${res.status} ${res.statusText}`;
      const code = res.status === 401 || res.status === 403 ? 'AUTH_FAILED' : 'CONNECTION_FAILED';
      console.error(`❌ [Gmail API Error] [${code}] ${errMsg}`);
      return {
        success: false,
        provider: 'gmail_api',
        code,
        error: code === 'AUTH_FAILED'
          ? 'Email authentication failed. Please check the email provider configuration.'
          : 'Email service is temporarily unavailable. Please try again.',
        details: errMsg,
      };
    }

    const data = await res.json();
    console.log(`✅ [Gmail API Delivered] To: ${maskEmail(to)} | Subject: "${subject}" | MessageId: ${data.id}`);
    return {
      success: true,
      provider: 'gmail_api',
      messageId: data.id,
      threadId: data.threadId,
    };
  } catch (err) {
    console.error(`❌ [Gmail API Exception] ${err.message}`);
    const isAuth = err.message?.includes('invalid_grant') || err.message?.includes('invalid_client');
    return {
      success: false,
      provider: 'gmail_api',
      code: isAuth ? 'AUTH_FAILED' : 'CONNECTION_FAILED',
      error: isAuth
        ? 'Email authentication failed. Please check the email provider configuration.'
        : 'Email service is temporarily unavailable. Please try again.',
      details: err.message,
    };
  }
};

// Send an email via Nodemailer SMTP (Port 465 SSL or 587 STARTTLS)
const sendViaSmtp = async ({ to, subject, html, text }) => {
  const config = getSmtpConfig();
  const transport = getTransporter();

  if (!transport || (!config.isConfigured && !customTransporter)) {
    const missingStr = config.missing.join(', ');
    const errorMsg = `SMTP email delivery skipped: credentials not configured (${missingStr || 'missing'}).`;
    console.warn(`📧 [SMTP Skipped] To: ${maskEmail(to)} | Subject: "${subject}" | Reason: Missing SMTP credentials (${missingStr})`);
    return {
      success: false,
      skipped: true,
      provider: 'smtp',
      code: 'MISSING_CONFIGURATION',
      missing: config.missing,
      error: errorMsg,
    };
  }

  try {
    const authUser = customTransporter?.options?.auth?.user || config.user;
    const fromAddress = config.from.includes('<') && config.from.includes('@')
      ? config.from
      : (authUser ? `"Secure-Team Workspace" <${authUser}>` : '"Secure-Team Workspace" <noreply@secureteam.com>');

    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });

    console.log(`✅ [SMTP Delivered] To: ${maskEmail(to)} | Subject: "${subject}" | MessageId: ${info.messageId}`);
    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    };
  } catch (err) {
    const code = err.code || 'UNKNOWN';
    let mappedCode = 'CONNECTION_FAILED';
    let friendlyMessage = 'Email service is temporarily unavailable. Please try again.';

    if (code === 'EAUTH' || err.responseCode === 535) {
      mappedCode = 'AUTH_FAILED';
      friendlyMessage = 'Email authentication failed. Please check the email provider configuration.';
    } else if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ESOCKET') {
      mappedCode = 'CONNECTION_FAILED';
      friendlyMessage = 'Email service is temporarily unavailable. Please try again.';
    } else if (code === 'EENVELOPE') {
      mappedCode = 'INVALID_RECIPIENT';
      friendlyMessage = `Invalid recipient email address: ${to}.`;
    }

    console.error(`❌ [SMTP Send Error] [${code}] ${err.message}`);
    return {
      success: false,
      provider: 'smtp',
      error: friendlyMessage,
      code: mappedCode,
      rawCode: code,
      details: err.message,
    };
  }
};

// Unified sendEmail function that delegates to active provider
const sendEmail = async (params) => {
  if (customTransporter) {
    return sendViaSmtp(params);
  }

  const provider = getActiveProvider();
  if (provider === 'gmail_api') {
    return sendViaGmailApi(params);
  }
  return sendViaSmtp(params);
};

// Verify SMTP connection
const verifySmtp = async () => {
  const config = getSmtpConfig();
  if (!config.isConfigured && !customTransporter) {
    const missingStr = config.missing.join(' and ');
    return {
      ok: false,
      provider: 'smtp',
      reason: 'MISSING_CONFIGURATION',
      code: 'MISSING_CONFIGURATION',
      message: `SMTP email delivery is not configured. Missing: ${missingStr}. Set valid credentials in environment variables.`,
      missing: config.missing,
      host: config.host,
      port: config.port,
    };
  }

  try {
    const transport = getTransporter(true);
    if (!transport) {
      return {
        ok: false,
        provider: 'smtp',
        reason: 'INIT_FAILED',
        code: 'CONNECTION_FAILED',
        message: 'Failed to initialize Nodemailer transporter.',
        missing: config.missing,
      };
    }

    await transport.verify();
    const masked = maskEmail(config.user || customTransporter?.options?.auth?.user);
    return {
      ok: true,
      provider: 'smtp',
      reason: 'VERIFIED',
      message: `SMTP connection successfully verified with ${config.host}:${config.port} as ${masked}.`,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: masked,
    };
  } catch (err) {
    const code = err.code || 'UNKNOWN';
    let mappedCode = 'CONNECTION_FAILED';
    let diagnostic = err.message;

    if (code === 'EAUTH' || err.responseCode === 535) {
      mappedCode = 'AUTH_FAILED';
      diagnostic = 'Email authentication failed. Please check the email provider configuration.';
    } else if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ESOCKET') {
      mappedCode = 'CONNECTION_FAILED';
      diagnostic = `SMTP Connection failed to ${config.host}:${config.port} (${code}). Verify firewall egress, host, and port settings.`;
    }

    return {
      ok: false,
      provider: 'smtp',
      reason: mappedCode,
      code: mappedCode,
      rawCode: code,
      message: diagnostic,
      host: config.host,
      port: config.port,
    };
  }
};

// Verify Gmail API connection
const verifyGmailApi = async () => {
  const config = getGmailApiConfig();
  if (!config.isConfigured) {
    const missingStr = config.missing.join(' and ');
    return {
      ok: false,
      provider: 'gmail_api',
      reason: 'MISSING_CONFIGURATION',
      code: 'MISSING_CONFIGURATION',
      message: `Gmail API configuration missing. Required: ${missingStr}.`,
      missing: config.missing,
    };
  }

  try {
    const { OAuth2Client } = require('google-auth-library');
    const oauth2Client = new OAuth2Client(config.clientId, config.clientSecret);
    oauth2Client.setCredentials({ refresh_token: config.refreshToken });

    const tokenResponse = await oauth2Client.getAccessToken();
    const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

    if (!token) {
      return {
        ok: false,
        provider: 'gmail_api',
        reason: 'AUTH_FAILED',
        code: 'AUTH_FAILED',
        message: 'Email authentication failed. Please check the email provider configuration.',
      };
    }

    return {
      ok: true,
      provider: 'gmail_api',
      reason: 'VERIFIED',
      message: `Gmail API connection verified successfully via HTTPS port 443 as ${maskEmail(config.user)}.`,
      user: maskEmail(config.user),
    };
  } catch (err) {
    const isAuth = err.message?.includes('invalid_grant') || err.message?.includes('invalid_client');
    return {
      ok: false,
      provider: 'gmail_api',
      reason: isAuth ? 'AUTH_FAILED' : 'CONNECTION_FAILED',
      code: isAuth ? 'AUTH_FAILED' : 'CONNECTION_FAILED',
      message: isAuth
        ? 'Email authentication failed. Please check the email provider configuration.'
        : `Email service is temporarily unavailable: ${err.message}`,
    };
  }
};

// Unified verification that verifies active provider
const verifyEmailService = async () => {
  if (customTransporter) {
    return verifySmtp();
  }

  const provider = getActiveProvider();
  if (provider === 'gmail_api') {
    return verifyGmailApi();
  }
  return verifySmtp();
};

const isEmailConfigured = () => {
  if (customTransporter) return true;
  const provider = getActiveProvider();
  if (provider === 'gmail_api') {
    return getGmailApiConfig().isConfigured;
  }
  return getSmtpConfig().isConfigured;
};

const getEmailServiceStatus = () => {
  const provider = getActiveProvider();
  if (provider === 'gmail_api') {
    const config = getGmailApiConfig();
    return {
      configured: config.isConfigured,
      provider: 'gmail_api',
      transport: 'HTTPS (Port 443 - Render Free compatible)',
      user: config.user ? maskEmail(config.user) : null,
      from: config.from,
      missing: config.missing,
    };
  }

  const config = getSmtpConfig();
  return {
    configured: config.isConfigured,
    provider: 'smtp',
    transport: `SMTP (${config.host}:${config.port}, secure=${config.secure})`,
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user ? maskEmail(config.user) : null,
    from: config.from,
    missing: config.missing,
  };
};

/**
 * Sends a professional responsive Secure-Team project invitation email.
 * Includes logo, inviter name, project name, description, role, CTA button, expiration, and direct link.
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
  const roleBadgeBg = projectRole === 'team-leader' ? '#fef3c7' : '#e0e7ff';
  const roleBadgeColor = projectRole === 'team-leader' ? '#b45309' : '#4338ca';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Invitation — Secure-Team Workspace</title>
      <style>
        @media only screen and (max-width: 600px) {
          .email-card { width: 100% !important; border-radius: 12px !important; }
          .email-cta-btn { width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 12px; color: #1e293b; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table role="presentation" class="email-card" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" border="0" cellspacing="0" cellpadding="0">
              
              <!-- Header Banner with Secure-Team Branding -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 32px; text-align: center;">
                  <div style="display: inline-block; width: 50px; height: 50px; line-height: 50px; border-radius: 14px; background: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 22px; font-weight: 800; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                    ST
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
                    Secure-Team
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.88); margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">
                    Secure Multi-Project Collaboration Platform
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
                    <strong style="color: #0f172a;">${inviterName || 'A Team Leader'}</strong> has invited you to collaborate on the project <strong style="color: #4f46e5;">${projectName}</strong> on <strong>Secure-Team</strong> as a <span style="background-color: ${roleBadgeBg}; color: ${roleBadgeColor}; padding: 3px 8px; border-radius: 6px; font-size: 13px; font-weight: 700;">${roleDisplay}</span>.
                  </p>

                  ${
                    projectDescription
                      ? `<div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                          <p style="margin: 0; font-size: 14px; color: #475569; font-style: italic; line-height: 1.5;">"${projectDescription}"</p>
                        </div>`
                      : ''
                  }

                  <!-- Project Details Box -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Project Name:</td>
                        <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${projectName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Assigned Role:</td>
                        <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 700; color: ${roleBadgeColor};">${roleDisplay}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Invited Email:</td>
                        <td align="right" style="padding: 6px 0; font-size: 14px; color: #0f172a; font-family: monospace;">${to}</td>
                      </tr>
                    </table>
                  </div>

                  <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; text-align: center;">
                    Click the button below to join the private project workspace:
                  </p>

                  <!-- Primary CTA Button -->
                  <div style="text-align: center; margin-bottom: 28px;">
                    <a href="${acceptUrl}" class="email-cta-btn" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      ACCEPT INVITATION
                    </a>
                  </div>

                  <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${rejectUrl}" style="color: #64748b; font-size: 13px; text-decoration: underline;">
                      Decline this invitation
                    </a>
                  </div>

                  <!-- Direct Link Fallback Box -->
                  <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px; word-break: break-all;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                      Button not working? Copy and paste this URL into your browser:
                    </p>
                    <a href="${acceptUrl}" style="font-size: 12px; color: #4f46e5; text-decoration: underline;">
                      ${acceptUrl}
                    </a>
                  </div>

                  <!-- Expiration & Disclaimer Box -->
                  <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                      ⏳ <strong>This invitation expires in 48 hours.</strong>
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #b45309; line-height: 1.4;">
                      If you do not have an active Secure-Team account yet, you will be prompted to sign in or register with <strong>${to}</strong> before accessing the project workspace.
                    </p>
                  </div>

                  <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                    If you were not expecting this invitation, you can safely ignore this email. No workspace access is granted without your explicit acceptance.
                  </p>

                  <p style="margin: 24px 0 0 0; font-size: 14px; color: #475569; line-height: 1.6;">
                    Regards,<br>
                    <strong>Secure-Team Collaboration</strong>
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
                    End-to-end workspace data isolation, cryptographic invitations, and role-based access control.
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

  return sendEmail({
    to,
    subject: 'You are invited to join a project on Secure-Team!',
    html,
  });
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

const setTransporter = (transportInstance) => {
  customTransporter = transportInstance;
  transporter = transportInstance;
};

const resetTransporter = () => {
  customTransporter = null;
  transporter = null;
  lastConfigHash = null;
};

module.exports = {
  sendEmail,
  verifyEmailService,
  verifySmtp,
  getSmtpConfig,
  getGmailApiConfig,
  getEmailServiceStatus,
  getSmtpStatus: getEmailServiceStatus, // backward compatible alias
  getActiveProvider,
  isEmailConfigured,
  setTransporter,
  resetTransporter,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSocialLoginReminderEmail,
  sendProjectInvitationEmail,
};
