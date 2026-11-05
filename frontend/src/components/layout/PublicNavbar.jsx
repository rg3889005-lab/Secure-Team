import { Link } from 'react-router-dom';
import { Shield, Sparkles, Moon, Sun, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function PublicNavbar() {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      backdropFilter: 'blur(8px)',
      width: '100%',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius)',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1rem',
          }}>
            ST
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              SecureTeam <Sparkles size={12} color="#f59e0b" />
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Enterprise Workspace
            </span>
          </div>
        </Link>

        {/* Center / Right Nav Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link
              to="/privacy"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Terms of Service
            </Link>
          </nav>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              padding: '8px 10px',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
          </button>

          {/* Auth Action */}
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--primary)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <LayoutDashboard size={15} /> Open Workspace
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                to="/login"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius)',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
