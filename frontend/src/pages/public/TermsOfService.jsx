import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Scale,
  Users,
  Lock,
  Mail
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'eligibility', label: '2. Eligibility & Registration' },
    { id: 'authentication', label: '3. Authentication & Security' },
    { id: 'roles-rbac', label: '4. User Roles & Access Control' },
    { id: 'acceptable-use', label: '5. Acceptable Use Policy' },
    { id: 'content-assets', label: '6. User Content & Intellectual Property' },
    { id: 'governance', label: '7. Administrative Oversight & Auditing' },
    { id: 'termination', label: '8. Suspension & Termination' },
    { id: 'disclaimer', label: '9. Disclaimers & Liability' },
    { id: 'contact', label: '10. Contact Information' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <PublicNavbar />

      <main style={{ flex: 1, padding: '40px 20px 80px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
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
              <Scale size={16} /> TERMS OF SERVICE & USER AGREEMENT
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 12px 0',
              lineHeight: 1.2
            }}>
              Terms of Service
            </h1>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: '0 0 20px 0',
              maxWidth: 700,
              lineHeight: 1.6
            }}>
              Rules, responsibilities, and guidelines governing your access to and use of SecureTeam Workspace's collaborative features.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} /> Last Modified: November 2026
              </span>
              <span>•</span>
              <span>Version 1.2</span>
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

          {/* Terms Content Card */}
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

            {/* 1. Acceptance */}
            <section id="acceptance">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>1.</span> Acceptance of Terms
              </h2>
              <p>
                By creating an account, accessing, or using the <strong>SecureTeam Workspace</strong> platform ("Service"), you agree to be legally bound by these Terms of Service ("Terms") and our <Link to="/privacy" style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</Link>. If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p style={{ marginTop: 12 }}>
                These Terms apply to all visitors, registered workspace members, and administrators who access or use the platform.
              </p>
            </section>

            {/* 2. Eligibility & Registration */}
            <section id="eligibility">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>2.</span> Eligibility & Registration
              </h2>
              <p>
                To register for an account and access the workspace:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li>You must be at least 16 years of age or the age of legal majority in your jurisdiction.</li>
                <li>You agree to provide accurate, current, and complete registration information (name, valid work email, and department).</li>
                <li>You may not use disposable email addresses, impersonate any person or entity, or create accounts using automated scripts or bots.</li>
              </ul>
            </section>

            {/* 3. Authentication & Security */}
            <section id="authentication">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>3.</span> Authentication, Credentials & Security
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your workspace credentials:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li><strong>Password Protection:</strong> You must choose a strong password (minimum 8 characters with mixed casing, numbers, and symbols). You are solely responsible for any activity that occurs under your account credentials.</li>
                <li><strong>Social Authentication:</strong> When authenticating via Google or Facebook OAuth 2.0, you are responsible for maintaining the security of your underlying third-party provider account.</li>
                <li><strong>Compromise Notification:</strong> You must immediately notify your workspace administrator if you suspect any unauthorized access or security breach involving your account.</li>
              </ul>
            </section>

            {/* 4. User Roles & Access Control */}
            <section id="roles-rbac">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>4.</span> Role-Based Access Control (RBAC)
              </h2>
              <p>
                SecureTeam enforces strict role-based access control to protect organizational data:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                <div style={{ padding: 20, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>
                    Standard Member (USER)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    All regular registrations and social logins default strictly to the <code>user</code> role. Members can create and participate in projects, track tasks, participate in live team chats, and upload workspace files.
                  </p>
                </div>

                <div style={{ padding: 20, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>
                    Administrator (ADMIN)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Admins have governance oversight over workspace users, audit log inspection, broadcast announcements, user role management, and suspension capabilities.
                  </p>
                </div>
              </div>
              <p style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 500 }}>
                ⚠️ Notice: Any attempt by a user to forge, intercept, or tamper with role claims or access administrative endpoints without authorization constitutes a material violation of these Terms and will result in immediate account termination.
              </p>
            </section>

            {/* 5. Acceptable Use */}
            <section id="acceptable-use">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>5.</span> Acceptable Use Policy
              </h2>
              <p>When using SecureTeam Workspace, you agree NOT to:</p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li>Upload, transmit, or share malicious code, viruses, malware, trojans, or corrupted files.</li>
                <li>Attempt to probe, scan, or test the vulnerability of the system, network, or APIs without express written authorization.</li>
                <li>Engage in denial-of-service (DoS) attacks, flood WebSocket connections, or circumvent rate-limiting mechanisms.</li>
                <li>Upload intellectual property or content that infringes upon copyright, trademark, trade secret, or privacy rights of any party.</li>
                <li>Send unsolicited spam, harassing messages, or unlawful content in team chat channels.</li>
              </ul>
            </section>

            {/* 6. User Content */}
            <section id="content-assets">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>6.</span> User Content & Intellectual Property
              </h2>
              <p>
                You retain ownership of any intellectual property, files, project information, and messages you submit to the platform. By posting content within a workspace, you grant SecureTeam a limited, non-exclusive license to host, store, transmit, and display that content solely for the purpose of operating and providing the workspace service to you and your authorized team members.
              </p>
              <p style={{ marginTop: 12 }}>
                SecureTeam and its original codebase, interface designs, logos, and features are and remain the exclusive property of SecureTeam and its licensors.
              </p>
            </section>

            {/* 7. Administrative Oversight & Auditing */}
            <section id="governance">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>7.</span> Administrative Oversight & Audit Logging
              </h2>
              <p>
                To protect enterprise security and confidentiality, the Service maintains automated audit trails:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li>All logins, credential changes, project updates, file uploads/downloads, and security warnings are logged with actor email, timestamp, and IP address.</li>
                <li>Workspace administrators have the legitimate authority to inspect audit trails, suspend accounts suspected of compromise, or deactivate abusive users.</li>
              </ul>
            </section>

            {/* 8. Suspension & Termination */}
            <section id="termination">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>8.</span> Suspension & Termination
              </h2>
              <p>
                We reserve the right to suspend or terminate your account and access to the Service immediately, without prior notice, in the event of:
              </p>
              <ul style={{ paddingLeft: 24, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
                <li>Breach of these Terms or the Acceptable Use Policy.</li>
                <li>Conduct that causes harm, security vulnerability, or liability to other users or the platform infrastructure.</li>
                <li>Requests by authorized law enforcement or regulatory authorities.</li>
              </ul>
              <p style={{ marginTop: 12 }}>
                You may discontinue your use of the Service at any time by requesting account closure through your administrator.
              </p>
            </section>

            {/* 9. Disclaimers & Liability */}
            <section id="disclaimer">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>9.</span> Disclaimers & Limitation of Liability
              </h2>
              <p>
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE BY LAW, SECURETEAM DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p style={{ marginTop: 12 }}>
                IN NO EVENT SHALL SECURETEAM, ITS MAINTAINERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO USE) THE SERVICE.
              </p>
            </section>

            {/* 10. Contact Information */}
            <section id="contact" style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px 28px'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={20} color="var(--primary)" /> 10. Contact Us
              </h2>
              <p style={{ margin: '0 0 14px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                For inquiries regarding these Terms of Service or administrative workspace access, please reach out to:
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
