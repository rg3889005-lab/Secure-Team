import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function Footer({ compact = false }) {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer style={{
        marginTop: 24,
        padding: '16px 0',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        <div>
          © {currentYear} SecureTeam Workspace. All rights reserved.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            to="/privacy"
            style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Privacy Policy
          </Link>
          <span style={{ color: 'var(--border)' }}>•</span>
          <Link
            to="/terms"
            style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Terms of Service
          </Link>
        </div>
      </footer>
    );
  }

  return (
    <footer style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      color: 'var(--text-muted)',
      marginTop: 'auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '48px 24px 28px',
      }}>
        {/* Main Footer Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 36,
          marginBottom: 40,
        }}>
          {/* Brand & Purpose */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              }}>
                <Shield size={18} />
              </div>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}>
                SecureTeam
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, margin: 0, color: 'var(--text-muted)' }}>
              Enterprise-grade collaborative workspace featuring real-time messaging, sprint tracking, role-based governance, and end-to-end security audit logging.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--success)' }}>
              <CheckCircle2 size={14} />
              <span>Google OAuth 2.0 Verified Flow</span>
            </div>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text)',
              marginBottom: 16,
            }}>
              Trust & Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
              <li>
                <Link
                  to="/privacy"
                  style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <FileText size={14} /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Lock size={14} /> Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text)',
              marginBottom: 16,
            }}>
              Workspace Access
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
              <li>
                <Link
                  to="/login"
                  style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Security Standards */}
          <div>
            <h4 style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text)',
              marginBottom: 16,
            }}>
              Security Assurances
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>🔒 TLS 1.3 / HTTPS Encryption in Transit</div>
              <div>🛡️ Bcrypt Salted Password Hashing</div>
              <div>⚡ MongoDB Atlas Encrypted Storage</div>
              <div>📋 Comprehensive Audit Log Tracing</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          fontSize: '0.825rem',
        }}>
          <div>
            © {currentYear} SecureTeam Workspace. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <Link
              to="/privacy"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
