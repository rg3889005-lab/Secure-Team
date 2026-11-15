import { Link, Navigate } from 'react-router-dom';
import {
  Shield,
  FolderKanban,
  MessageSquare,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  ShieldCheck,
  Activity,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import SEO from '../../components/common/SEO';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();

  // If already authenticated, redirect seamlessly to the workspace dashboard
  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <SEO
        title="Secure Team – Secure Collaboration and Team Management Platform"
        description="Secure Team is a collaboration platform designed to help teams communicate, organize projects, manage collaboration, and work together securely."
        canonicalUrl="https://secure-team.vercel.app/"
        noindex={false}
      />

      <PublicNavbar />

      <main style={{ flex: 1 }}>
        {/* ─── Hero Section ────────────────────────────────────────────────────────── */}
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: 'clamp(50px, 8vw, 80px) clamp(16px, 4vw, 24px)',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg) 100%)',
          }}
        >
          {/* Subtle Background Glow Circles */}
          <div
            style={{
              position: 'absolute',
              top: '-15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 800,
              height: 450,
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(50px)',
            }}
          />

          <div
            style={{
              maxWidth: 1040,
              margin: '0 auto',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 999,
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--primary)',
                marginBottom: 24,
              }}
            >
              <Sparkles size={15} color="#f59e0b" />
              <span>Enterprise-Grade Collaboration & Security</span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: '0 0 20px',
              }}
            >
              Secure Collaboration Built for{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Modern Teams
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                maxWidth: 780,
                margin: '0 auto 36px',
              }}
            >
              Secure Team is a collaboration platform designed to help teams communicate, organize projects, manage
              collaboration, and work together securely with private workspaces, role-based access control, and complete
              audit trails.
            </p>

            {/* CTA Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 44,
              }}
            >
              <Link
                to="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-glow)',
                  transition: 'all 0.2s ease',
                }}
              >
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '14px 28px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                Sign In to Workspace
              </Link>
            </div>

            {/* Trust Points */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 28,
                flexWrap: 'wrap',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>100% Workspace Data Isolation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>Google OAuth 2.0 Verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>Real-Time WebSocket Sync</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>Full Audit Traceability</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Platform Features Grid ─────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(50px, 8vw, 80px) clamp(16px, 4vw, 24px)', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 56px' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                margin: '0 0 14px',
              }}
            >
              Everything Your Team Needs to Deliver Securely
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Engineered with privacy-first principles to keep project messages, tasks, files, and memberships strictly
              isolated between teams.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 24,
            }}
          >
            {/* Feature 1 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FolderKanban size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Private Multi-Project Workspaces
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Create independent project spaces with dedicated leadership, objective tracking, and strictly isolated
                membership boundaries. Prevent cross-project data leaks.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Real-Time Project & Direct Messaging
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                High-performance real-time chat powered by Socket.io. Includes project room messaging, direct 1-on-1 chats,
                typing indicators, and secure attachments.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Sprint & Kanban Task Management
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Organize deliverables across flexible status workflows (To Do, In Progress, Review, Done) with priority
                tags, assigned members, and real-time updates.
              </p>
            </div>

            {/* Feature 4 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius)',
                  background: 'rgba(168, 85, 247, 0.1)',
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Role-Based Access Governance
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Granular project roles (Owner, Team Leader, Member) enforce fine-tuned access. Backend authorization
                middleware rigorously rejects IDOR attempts.
              </p>
            </div>

            {/* Feature 5 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius)',
                  background: 'rgba(6, 182, 212, 0.1)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Cryptographic Email Invitations
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Invite team members via automated Nodemailer workflows. Invitation tokens are securely hashed, bound to
                recipient emails, and automatically expire.
              </p>
            </div>

            {/* Feature 6 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Immutable Audit Trails
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Complete visibility into administrative actions, role updates, authentication events, and membership
                changes with exportable audit logs and IP tracing.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Security Architecture Highlights ───────────────────────────────────── */}
        <section
          style={{
            padding: 'clamp(40px, 6vw, 70px) clamp(16px, 4vw, 24px)',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 12,
              }}
            >
              <Lock size={15} /> Security Architecture
            </div>
            <h2
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                margin: '0 0 32px',
              }}
            >
              Zero Trust at Every Layer
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: 20,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                  TLS 1.3 Encryption
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  All network traffic in transit is strictly encrypted using TLS 1.3 HTTPS standards.
                </p>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                  Bcrypt Salt Hashing
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Passphrases are salted with 12 rounds of bcrypt before entering database storage.
                </p>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                  Helmet & Rate Limiting
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Defends against XSS, clickjacking, and brute force attacks with automated IP throttles.
                </p>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                  Encrypted Atlas DB
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Production database storage is encrypted at rest using enterprise AES-256 keys.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Bottom CTA Banner ──────────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(50px, 8vw, 80px) clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
          <div
            style={{
              maxWidth: 800,
              margin: '0 auto',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-xl)',
              padding: 'clamp(28px, 6vw, 48px) clamp(16px, 4vw, 32px)',
            }}
          >
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                margin: '0 0 14px',
              }}
            >
              Ready to Upgrade Your Team Workspace?
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                maxWidth: 580,
                margin: '0 auto 28px',
              }}
            >
              Launch your private project rooms, invite collaborators, and protect your workflows with enterprise-grade
              governance today.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                Create Free Account <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
