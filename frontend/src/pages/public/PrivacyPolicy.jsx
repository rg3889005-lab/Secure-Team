import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  Server,
  FileCheck,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'introduction', label: '1. Introduction' },
    { id: 'data-collected', label: '2. Information We Collect' },
    { id: 'google-data', label: '3. Google OAuth & Authentication Data' },
    { id: 'how-we-use-data', label: '4. How We Use Information' },
    { id: 'data-storage-security', label: '5. Storage & Security Measures' },
    { id: 'retention', label: '6. Data Retention Policy' },
    { id: 'account-management', label: '7. Account Management & Rights' },
    { id: 'third-parties', label: '8. Third-Party Service Providers' },
    { id: 'contact', label: '9. Contact Information' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <PublicNavbar />

      <main style={{ flex: 1, padding: '40px 20px 80px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #0f172a 100%)',
            color: '#fff',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 36px',
            marginBottom: 36,
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(99, 102, 241, 0.25)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginBottom: 16
            }}>
              <Shield size={16} /> PRIVACY & DATA GOVERNANCE
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 12px 0',
              lineHeight: 1.2
            }}>
              Privacy Policy
            </h1>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: '0 0 20px 0',
              maxWidth: 700,
              lineHeight: 1.6
            }}>
              How SecureTeam Workspace collects, uses, protects, and handles your personal details, workspace content, and third-party authentication data.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} /> Effective Date: November 2026
              </span>
              <span>•</span>
              <span>Version 1.2</span>
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 40,
            padding: '16px 20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', alignSelf: 'center', marginRight: 8 }}>
              TABLE OF CONTENTS:
            </span>
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-hover)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.background = 'var(--primary-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }}
              >
                {sec.label}
              </a>
            ))}
          </div>

          {/* Policy Content Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 40px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: 48,
            lineHeight: 1.7,
            color: 'var(--text)',
            fontSize: '0.95rem'
          }}>

            {/* 1. Introduction */}
            <section id="introduction">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>1.</span> Introduction
              </h2>
              <p>
                Welcome to <strong>SecureTeam Workspace</strong> ("SecureTeam", "we", "us", or "our"). SecureTeam is a collaborative enterprise workspace web application providing real-time team messaging, project and sprint management, file storage, and role-based access governance.
              </p>
              <p style={{ marginTop: 12 }}>
                This Privacy Policy outlines our standards and practices regarding the collection, processing, storage, transfer, and safeguarding of personal information when you access or use our platform, accessible via our web application and associated endpoints. By registering an account, authenticating via Google or Facebook, or using our workspace tools, you acknowledge the terms described in this policy.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section id="data-collected">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>2.</span> Information We Collect
              </h2>
              <p>
                We only collect data that is strictly necessary to deliver, operate, secure, and improve the SecureTeam collaboration platform:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 18 }}>
                <div style={{ padding: 20, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserCheck size={18} color="var(--primary)" /> Direct Account Registration
                  </h3>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <li><strong>Full Name:</strong> To identify you to team members.</li>
                    <li><strong>Work Email:</strong> For login credentials and notifications.</li>
                    <li><strong>Department:</strong> To organize workspace teams.</li>
                    <li><strong>Hashed Password:</strong> Cryptographically salted and hashed using bcrypt (12 rounds). Plaintext passwords are never stored or logged.</li>
                  </ul>
                </div>

                <div style={{ padding: 20, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Database size={18} color="var(--primary)" /> Workspace Content & Media
                  </h3>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <li><strong>Projects & Tasks:</strong> Boards, assignments, priorities, and deadlines.</li>
                    <li><strong>Team Messaging:</strong> Messages transmitted in real-time channels via Socket.IO.</li>
                    <li><strong>Uploaded Files:</strong> Documents, images, and attachments uploaded to projects.</li>
                    <li><strong>Profile Customization:</strong> Optional job titles, phone numbers, and biographies.</li>
                  </ul>
                </div>

                <div style={{ padding: 20, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Server size={18} color="var(--primary)" /> System & Security Audit Logs
                  </h3>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <li><strong>Network & Client Identifiers:</strong> IP address and browser User-Agent header.</li>
                    <li><strong>Access Timestamps:</strong> Login times, last active timestamps, and session durations.</li>
                    <li><strong>Security Audit Trails:</strong> Authentication events, role modifications, and administrative operations tracked for workspace compliance.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Google OAuth & Authentication Data */}
            <section id="google-data" style={{
              background: 'rgba(66, 133, 244, 0.04)',
              border: '1px solid rgba(66, 133, 244, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  3. Google Authentication & User Data Protection
                </h2>
              </div>

              <p>
                When you choose to sign up or log in using your Google account via Google Identity Services (OAuth 2.0), we strictly adhere to the <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements.
              </p>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    • Scopes Requested
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    We request only basic OpenID Connect profile scopes: <code>openid</code>, <code>email</code>, and <code>profile</code>. We <strong>do not</strong> request, access, read, or modify your Google Drive files, Gmail inboxes, Google Calendar schedules, Google Contacts, or device history.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    • Data Received & Stored
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Upon server-side cryptographic token validation using Google's official verification libraries, we receive:
                  </p>
                  <ul style={{ paddingLeft: 24, marginTop: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <li><strong>Google User ID (sub):</strong> A unique, non-sensitive identifier used to match returning logins.</li>
                    <li><strong>Verified Email Address:</strong> To establish your workspace account identity.</li>
                    <li><strong>Display Name:</strong> To populate your workspace profile name.</li>
                    <li><strong>Profile Picture URL:</strong> Used as your workspace avatar.</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    • Strict No-Sale & No-Advertising Commitment
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Google user data is used <strong>exclusively</strong> for account authentication and user session management within SecureTeam. We <strong>never sell, lease, trade, or transfer</strong> Google user data to third parties, advertising networks, data brokers, or external AI model training pipelines.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    • Role Assignment Safeguards
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Google authentication unconditionally assigns the standard <code>user</code> role to newly created accounts. Administrative privileges cannot be obtained or escalated through Google OAuth.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. How We Use Information */}
            <section id="how-we-use-data">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>4.</span> How We Use Your Information
              </h2>
              <p>We process the information collected under lawful bases and operational necessities:</p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li><strong>Session & Authentication Management:</strong> To verify your credentials, issue signed JSON Web Tokens (JWT), maintain authenticated sessions, and prevent unauthorized account access.</li>
                <li><strong>Collaboration Tools:</strong> To facilitate live channel messaging via Socket.IO, assign tasks, update project boards, and share workspace files among designated team members.</li>
                <li><strong>Security & Threat Prevention:</strong> To monitor system integrity, defend against brute-force attacks via rate limiters, investigate unauthorized attempts, and maintain auditable logs.</li>
                <li><strong>Transactional Notifications:</strong> To deliver essential transactional emails such as password reset tokens, email verification codes, and administrative bulletins.</li>
              </ul>
            </section>

            {/* 5. Storage & Security Measures */}
            <section id="data-storage-security">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>5.</span> Storage & Security Architecture
              </h2>
              <p>
                Security is foundational to SecureTeam. We employ comprehensive physical, technical, and administrative measures:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 16 }}>
                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                    <Lock size={16} color="var(--primary)" /> Encryption in Transit
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    All HTTP traffic and WebSocket connections are encrypted using Transport Layer Security (TLS 1.2/1.3 / HTTPS).
                  </div>
                </div>

                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                    <Database size={16} color="var(--primary)" /> Database Protection at Rest
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Data is stored on MongoDB Atlas with volume-level encryption (AES-256) and strict IP access controls.
                  </div>
                </div>

                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                    <CheckCircle2 size={16} color="var(--primary)" /> Token Rotation & Hashing
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Access tokens expire in 15 minutes. Long-lived refresh tokens are hashed before storage and rotated upon refresh.
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Data Retention Policy */}
            <section id="retention">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>6.</span> Data Retention Policy
              </h2>
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes set out in this Privacy Policy:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li><strong>Active Accounts:</strong> User profile information and uploaded workspace assets are retained for the lifetime of your active account.</li>
                <li><strong>Transient Tokens:</strong> Password reset tokens automatically expire after 1 hour; email verification codes expire after 24 hours.</li>
                <li><strong>Audit Records:</strong> Security and access audit logs are retained for governance, intrusion detection, and regulatory compliance.</li>
                <li><strong>Account Deletion:</strong> When an account is removed by an administrator or upon verified user request, associated personal data is removed from active database indices.</li>
              </ul>
            </section>

            {/* 7. Account Management & Rights */}
            <section id="account-management">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>7.</span> Account Management & User Rights
              </h2>
              <p>
                You retain full control over your personal information within the workspace:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li><strong>Review and Edit Profile:</strong> You can inspect and modify your name, job title, department, bio, phone number, and avatar at any time via the <Link to="/profile" style={{ color: 'var(--primary)', fontWeight: 600 }}>Profile Settings</Link> page.</li>
                <li><strong>Password Management:</strong> You can change your password at any time via your account settings, or initiate recovery via the <Link to="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 600 }}>Forgot Password</Link> flow.</li>
                <li><strong>Social Login Revocation:</strong> You can disconnect or revoke SecureTeam's access at any time through your Google Account Security settings or Facebook App Settings.</li>
                <li><strong>Account Deletion or Export:</strong> To request account deletion or a copy of your uploaded assets, contact your workspace administrator or reach out via our contact channels.</li>
              </ul>
            </section>

            {/* 8. Third-Party Service Providers */}
            <section id="third-parties">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>8.</span> Third-Party Service Providers
              </h2>
              <p>
                We rely on established enterprise infrastructure partners to host and operate our application:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li><strong>Google Identity Services:</strong> Provides secure OAuth 2.0 authentication endpoints.</li>
                <li><strong>Facebook Login (Meta):</strong> Provides social authentication verification.</li>
                <li><strong>MongoDB Atlas:</strong> Secure cloud database cluster hosting with encrypted storage.</li>
                <li><strong>Vercel & Render:</strong> Modern cloud hosting providers powering our frontend and backend APIs.</li>
                <li><strong>Nodemailer / SMTP:</strong> Transactional mail delivery for password resets and security verification.</li>
              </ul>
            </section>

            {/* 9. Contact Information */}
            <section id="contact" style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px 28px'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={20} color="var(--primary)" /> 9. Contact Us
              </h2>
              <p style={{ margin: '0 0 14px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                If you have questions, feedback, or data privacy requests regarding this Privacy Policy or SecureTeam Workspace's data practices, please contact us:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                <div><strong>Application:</strong> SecureTeam Workspace</div>
                <div><strong>Administrator Contact:</strong> <a href="mailto:admin@workspace.com" style={{ color: 'var(--primary)' }}>admin@workspace.com</a></div>
                <div><strong>GitHub Project:</strong> <a href="https://github.com/rg3889005-lab/Secure-Team" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>https://github.com/rg3889005-lab/Secure-Team</a></div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
