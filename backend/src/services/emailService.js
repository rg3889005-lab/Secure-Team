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

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
