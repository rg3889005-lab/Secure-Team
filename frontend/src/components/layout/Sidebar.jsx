import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  FolderOpen,
  User,
  Shield,
  Users,
  FileText,
  BarChart3,
  Radio,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

export default function Sidebar() {
  const { user, isAdmin } = useAuth();
  const { connected } = useSocket();

  const userNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Team Chat', path: '/chat', icon: MessageSquare },
    { name: 'Files & Media', path: '/files', icon: FolderOpen },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  const adminNavItems = [
    { name: 'Admin Overview', path: '/admin', icon: Shield, exact: true },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Broadcasts', path: '/admin/broadcasts', icon: Radio },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
      transition: 'all 0.2s ease-in-out'
    }}>
      {/* Brand Header */}
      <div style={{
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        borderBottom: '1px solid var(--border)'
      }}>
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
          fontSize: '1rem'
        }}>
          ST
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: '0.95rem',
            fontWeight: 700,
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
      </div>

      {/* Navigation Sections */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}>
        {/* Workspace Menu */}
        <div>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-light)',
            padding: '0 12px 8px'
          }}>
            Workspace
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {userNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 12px',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Section (Conditional) */}
        {isAdmin && (
          <div>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--primary)',
              padding: '0 12px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Shield size={12} /> Administration
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '9px 12px',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      textDecoration: 'none',
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                      background: isActive ? 'var(--primary-light)' : 'transparent',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer: Live Connection Status */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: connected ? 'var(--success)' : 'var(--danger)',
            boxShadow: connected ? '0 0 8px var(--success)' : 'none',
            transition: 'all 0.3s'
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {connected ? 'Socket Connected' : 'Offline / Standby'}
          </span>
        </div>
        {connected ? (
          <Wifi size={14} color="var(--success)" />
        ) : (
          <WifiOff size={14} color="var(--text-light)" />
        )}
      </div>
    </aside>
  );
}
