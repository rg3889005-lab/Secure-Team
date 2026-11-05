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
  AlertCircle,
  Trash2,
  ExternalLink,
  Cpu
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
    { id: 'google-oauth', label: '3. Google Sign-In & User Data Policy' },
    { id: 'how-we-use-data', label: '4. How We Use Information' },
    { id: 'data-storage-security', label: '5. Security Architecture & Controls' },
    { id: 'data-retention', label: '6. Data Retention Policy' },
    { id: 'account-deletion', label: '7. Account Deletion & User Rights' },
    { id: 'third-parties', label: '8. Third-Party Integrations' },
    { id: 'contact', label: '9. Privacy Contact Information' },
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
              maxWidth: 750,
              lineHeight: 1.6
            }}>
              This Privacy Policy explains how <strong>SecureTeam Workspace</strong> collects, uses, protects, and stores user information and third-party authentication data, including Google Sign-In data, in full compliance with the Google API Services User Data Policy.
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
              <span>Last Updated: November 2026</span>
              <span>•</span>
              <span>Public Access</span>
            </div>
          </div>

          {/* Table of Contents */}
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
              SECTIONS:
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

          {/* Main Privacy Body */}
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
                Welcome to <strong>SecureTeam Workspace</strong> ("SecureTeam", "we", "us", or "our"). SecureTeam is a secure team collaboration web application designed to facilitate team project management, sprint task tracking, real-time messaging, and role-based access control.
              </p>
              <p style={{ marginTop: 12 }}>
                This Privacy Policy is publicly accessible without login and describes our policies and practices regarding the collection, use, disclosure, storage, and protection of personal information when you access or use our web application, available at our website and associated API endpoints.
              </p>
              <p style={{ marginTop: 12 }}>
                We believe in total transparency. We only collect the minimal personal data necessary to provide our collaborative workspace services, and we never monetize, sell, or exploit your personal information.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section id="data-collected">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>2.</span> Information Collected During Registration & Login
              </h2>
              <p>
                We collect personal information directly when you register an account, log in, or interact with our workspace features:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 18 }}>
                {/* Direct Registration */}
                <div style={{ padding: 22, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserCheck size={18} color="var(--primary)" /> Direct Account Registration
                  </h3>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li><strong>Full Name:</strong> Required to identify you to other workspace team members and display your author identity on project tasks and comments.</li>
                    <li><strong>Email Address:</strong> Required as your unique login identifier, for sending password recovery links, and for critical transactional account notices.</li>
                    <li><strong>Department:</strong> Optional organizational tag (e.g., Engineering, Design, Product) to organize collaborative workspaces.</li>
                    <li><strong>Password:</strong> Encrypted using industry-standard bcrypt salted hashing (12 rounds) before storage. Plaintext passwords are never stored, logged, or visible to administrators.</li>
                  </ul>
                </div>

                {/* Workspace Content */}
                <div style={{ padding: 22, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Database size={18} color="var(--primary)" /> Workspace Content & Collaboration
                  </h3>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li><strong>Projects & Tasks:</strong> Titles, descriptions, assignments, priority levels, and due dates created within workspace boards.</li>
                    <li><strong>Real-Time Messages:</strong> Text messages, conversation threads, and presence statuses transmitted via Socket.IO.</li>
                    <li><strong>Uploaded Files:</strong> Attachments, documents, and media uploaded by team members to projects or tasks.</li>
                    <li><strong>User Profile Info:</strong> Optional profile details including job title, biography, phone number, and theme preferences.</li>
                  </ul>
                </div>

                {/* Technical Audit Data */}
                <div style={{ padding: 22, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Server size={18} color="var(--primary)" /> Technical & Audit Data
                  </h3>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li><strong>IP Address:</strong> Captured temporarily in security audit logs to protect against credential stuffing, brute force, and unauthorized access attempts.</li>
                    <li><strong>User-Agent:</strong> Browser and operating system identifiers to diagnose compatibility issues and secure session tokens.</li>
                    <li><strong>Audit Logs:</strong> Security events (such as logins, password updates, file uploads, role changes) recorded in the database to provide governance oversight.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Google Sign-In & User Data Policy */}
            <section id="google-oauth" style={{
              background: 'rgba(66, 133, 244, 0.04)',
              border: '2px solid rgba(66, 133, 244, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <svg width="26" height="26" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  3. Google Sign-In & Google API Services User Data Policy
                </h2>
              </div>

              <p>
                SecureTeam Workspace offers Google Sign-In via Google OAuth 2.0 to provide a seamless, secure authentication experience. This section explains exactly what Google user data is accessed, how it is used, and how it is protected.
              </p>

              {/* Data Accessed */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                  A. What Google Data We Access
                </h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  When you authenticate using Google, our application requests <strong>only basic OpenID Connect identity profile scopes</strong> (<code>openid</code>, <code>email</code>, <code>profile</code>). If authorized, we access only the following fields:
                </p>
                <ul style={{ paddingLeft: 22, fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Google User ID (<code>sub</code>):</strong> A unique, opaque alphanumeric string assigned by Google to identify your account across login sessions.</li>
                  <li><strong>Primary Email Address:</strong> Your verified Google account email, used to identify your account and match workspace memberships.</li>
                  <li><strong>Full Name:</strong> Your Google profile display name, used to populate your workspace member name.</li>
                  <li><strong>Profile Picture URL:</strong> Your public Google profile avatar URL, used as your workspace avatar.</li>
                </ul>
              </div>

              {/* Data NOT Accessed */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                  B. Google Data We NEVER Access
                </h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  SecureTeam Workspace <strong>does NOT</strong> request, access, read, collect, or store any sensitive or restricted Google user data:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                  fontSize: '0.85rem',
                  color: 'var(--danger)'
                }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                    ❌ No Gmail messages or inboxes
                  </div>
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                    ❌ No Google Drive files or docs
                  </div>
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                    ❌ No Google Contacts or address book
                  </div>
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                    ❌ No Google Calendar events
                  </div>
                </div>
              </div>

              {/* Purpose and Storage */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                  C. How Google Data Is Processed and Stored
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  When you sign in with Google, Google issues a signed JSON Web Token (ID token) directly to your browser. Your browser sends this credential to our backend endpoint (<code>/api/auth/google</code>), where our server validates its cryptographic signature, audience, and expiration using Google's official <code>google-auth-library</code>.
                </p>
                <p style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Upon successful server verification, we store your Google User ID, verified email, name, and profile picture URL in our encrypted MongoDB Atlas database. We never receive or store your Google password. Once authenticated, our server issues short-lived SecureTeam session tokens (JWT) to maintain your session.
                </p>
              </div>

              {/* Limited Use Disclosure */}
              <div style={{
                marginTop: 24,
                padding: '20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)' }}>
                  D. Google API Limited Use Disclosure
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text)' }}>
                  <strong>
                    SecureTeam Workspace's use and transfer of information received from Google APIs to any other app will adhere to the{' '}
                    <a
                      href="https://developers.google.com/terms/api-services-user-data-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                    >
                      Google API Services User Data Policy
                    </a>, including the Limited Use requirements.
                  </strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span><strong>No Sale of Data:</strong> We do not sell Google user data to any third parties under any circumstances.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span><strong>No Advertising:</strong> We do not use or transfer Google user data for serving advertisements, including personalized, retargeted, or interest-based ads.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span><strong>No AI Model Training:</strong> We do not use Google user data to train, retrain, or fine-tune generalized artificial intelligence (AI) or machine learning (ML) models.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span><strong>No Human Inspection:</strong> No humans read your Google data, except with your explicit affirmative consent for debugging, as required by law, or when aggregated for security incident investigations.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. How We Use Information */}
            <section id="how-we-use-data">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>4.</span> How We Use User Information
              </h2>
              <p>
                All personal information collected by SecureTeam Workspace is processed exclusively for legitimate operational purposes:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li><strong>Authentication & Access Control:</strong> Verifying your identity upon login, managing session tokens, and enforcing role-based permissions (differentiating between standard <code>user</code> and <code>admin</code> privileges).</li>
                <li><strong>Workspace Collaboration:</strong> Enabling real-time task board management, team chat channels via Socket.IO, project membership, and document sharing.</li>
                <li><strong>Security & Incident Prevention:</strong> Defending the platform against unauthorized access, credential brute-forcing, cross-site request forgery, and spam through rate limiters and audit trails.</li>
                <li><strong>Transactional Notifications:</strong> Delivering required transactional messages, including password reset verification codes, email verification tokens, and administrative service announcements.</li>
              </ul>
            </section>

            {/* 5. Security Architecture & Controls */}
            <section id="data-storage-security">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>5.</span> Technical Security Measures Implemented
              </h2>
              <p>
                SecureTeam incorporates multi-layer security protections directly into its Node.js backend and React frontend:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 18 }}>
                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    <Lock size={16} color="var(--primary)" /> TLS Encryption in Transit
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    All communications between client browsers and backend APIs are strictly encrypted using Transport Layer Security (TLS 1.2/1.3 / HTTPS) with HTTP Strict Transport Security (HSTS).
                  </p>
                </div>

                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    <Database size={16} color="var(--primary)" /> Database Encryption at Rest
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Our primary database is hosted on MongoDB Atlas with automated volume-level AES-256 storage encryption, role-based database authentication, and network isolation.
                  </p>
                </div>

                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    <Shield size={16} color="var(--primary)" /> Password Hashing (bcrypt)
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    User passwords for direct accounts are salted and hashed using bcrypt (12 rounds). Passwords can never be viewed or decrypted by workspace administrators.
                  </p>
                </div>

                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    <Cpu size={16} color="var(--primary)" /> Helmet & Rate Limiting
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Protected by Helmet HTTP security headers and Express Rate Limiters on authentication endpoints (limiting to 20 requests per 15 minutes) to block automated brute-force attacks.
                  </p>
                </div>

                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    <CheckCircle2 size={16} color="var(--primary)" /> JWT Token Rotation
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Short-lived JSON Web Tokens (15-minute expiration) manage active sessions. Long-lived refresh tokens are hashed prior to storage and rotated on each refresh.
                  </p>
                </div>

                <div style={{ padding: 18, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    <FileCheck size={16} color="var(--primary)" /> Automated Audit Logs
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Comprehensive security event logging in the <code>AuditLog</code> collection records authentication attempts, permission modifications, and administrative operations.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Data Retention Policy */}
            <section id="data-retention">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>6.</span> Data Retention Policy
              </h2>
              <p>
                We adhere to strict data minimization and retention timelines:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li><strong>Active Workspace Accounts:</strong> Your personal profile data, projects, tasks, and messages are retained for the active lifespan of your account.</li>
                <li><strong>Password Reset Tokens:</strong> Password recovery tokens automatically expire after exactly <strong>1 hour</strong> and are invalidated immediately upon use.</li>
                <li><strong>Email Verification Codes:</strong> Verification codes expire after <strong>24 hours</strong>.</li>
                <li><strong>Session Tokens:</strong> Access tokens expire after <strong>15 minutes</strong>; inactive refresh tokens are purged upon logout.</li>
                <li><strong>Security Audit Trails:</strong> Audit logs are retained to maintain workspace security, detect intrusions, and provide regulatory compliance tracing.</li>
              </ul>
            </section>

            {/* 7. Account Deletion & User Rights */}
            <section id="account-deletion" style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 30px'
            }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                <Trash2 size={20} color="var(--danger)" /> 7. Account Deletion & User Rights
              </h2>
              <p style={{ margin: '0 0 14px 0' }}>
                You have the right to access, update, export, or delete your personal data at any time.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    • How to Update Your Profile Information
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    You can view and modify your name, job title, department, bio, phone number, and avatar directly from your account settings at{' '}
                    <Link to="/profile" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      Profile Settings (/profile)
                    </Link>.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    • How to Request Complete Account Deletion
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    To permanently delete your SecureTeam Workspace account and all associated personal data:
                  </p>
                  <ol style={{ paddingLeft: 22, marginTop: 6, fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <li>Send an email to our designated privacy contact at <a href="mailto:admin@workspace.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>admin@workspace.com</a> with the subject line <strong>"Account Deletion Request"</strong> from your registered email address.</li>
                    <li>Alternatively, you can request account removal directly through your workspace administrator via the Admin Control Center.</li>
                    <li>Our team verifies the request and executes the deletion within <strong>30 days</strong>.</li>
                  </ol>
                  <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>What happens upon deletion:</strong> Your account record, name, email address, password hash, third-party provider IDs (Google/Facebook ID), and all active session tokens are permanently erased from our MongoDB database.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    • How to Revoke Google Access Instantly
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    You can also revoke SecureTeam's access to your Google account at any time without contacting us:
                  </p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Visit your{' '}
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Google Account Third-Party Permissions <ExternalLink size={13} />
                    </a>{' '}
                    page, locate <strong>SecureTeam Workspace</strong>, and click <strong>"Remove Access"</strong>.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. Third-Party Integrations */}
            <section id="third-parties">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>8.</span> Third-Party Service Providers & Subprocessors
              </h2>
              <p>
                To provide a reliable, globally accessible platform, SecureTeam partners with industry-leading infrastructure providers:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li><strong>Google Identity Services (Google LLC):</strong> Provides OAuth 2.0 authentication services for users choosing to sign in with Google.</li>
                <li><strong>MongoDB Atlas:</strong> Managed cloud database infrastructure offering encrypted storage, automated backups, and database security.</li>
                <li><strong>Vercel Inc.:</strong> High-performance serverless cloud hosting for our React frontend web application with global CDN caching.</li>
                <li><strong>Render Services Inc.:</strong> Secure cloud runtime hosting our Node.js/Express API backend.</li>
                <li><strong>Meta (Facebook Login):</strong> Provides optional social authentication verification.</li>
              </ul>
            </section>

            {/* 9. Privacy Contact Information */}
            <section id="contact" style={{
              background: 'linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-card) 100%)',
              border: '2px solid var(--primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 30px'
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                <Mail size={22} color="var(--primary)" /> 9. Privacy Contact Information
              </h2>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                If you have questions, feedback, inquiries regarding our Google OAuth data practices, or wish to submit an account deletion request, please reach out to our privacy administrator:
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
                fontSize: '0.9rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Application Name
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                    SecureTeam Workspace
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Dedicated Privacy Email
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    <a href="mailto:admin@workspace.com" style={{ color: 'var(--primary)' }}>
                      admin@workspace.com
                    </a>
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Open Source Repository
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    <a
                      href="https://github.com/rg3889005-lab/Secure-Team"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)' }}
                    >
                      github.com/rg3889005-lab/Secure-Team
                    </a>
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Response Time Commitment
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                    Within 48 business hours
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
