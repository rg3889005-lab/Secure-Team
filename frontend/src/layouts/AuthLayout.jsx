import { Outlet, Link } from 'react-router-dom';
import { Shield, Sparkles, Moon, Sun, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function AuthLayout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Theme toggle in top right */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 50 }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: 10,
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>
      </div>

      {/* Left Feature Showcase Banner (hidden on small screens) */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
        color: '#ffffff',
        padding: '60px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }} className="auth-banner">
        {/* Decorative blur circles */}
        <div style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.25)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: -60,
          right: -60,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.25)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />

        {/* Top Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 1 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius)',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.2rem'
          }}>
            <Shield size={22} />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            SecureTeam Workspace
          </span>
        </div>

        {/* Middle Value Proposition */}
        <div style={{ maxWidth: 480, zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: 20,
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <Sparkles size={14} color="#38bdf8" /> Real-time Enterprise Collaboration
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: 16
          }}>
            Next-generation workspace for high-velocity teams.
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6,
            marginBottom: 32
          }}>
            Role-based security, live channels, Kanban sprint tracking, audit logging, and asset governance in one unified hub.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Enterprise-grade JWT auth with token rotation',
              'Real-time Socket.IO chat, presence & mentions',
              'Comprehensive Admin Control Center & audit logs',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: '#e2e8f0' }}>
                <CheckCircle size={18} color="#34d399" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Status */}
        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', zIndex: 1 }}>
          © {new Date().getFullYear()} SecureTeam Workspace. Protected by End-to-End Encryption.
        </div>
      </div>

      {/* Right Form Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
