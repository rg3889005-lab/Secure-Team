import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  User,
  Shield,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { notificationService } from '../../services';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, login, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.getNotifications({ limit: 5 }),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(listRes.data?.notifications || []);
      setUnreadCount(countRes.data?.unreadCount || 0);
    } catch {
      // Silently catch in dev
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 4)]);
      setUnreadCount((c) => c + 1);
      toast(notif.title || 'New notification', {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#0f172a',
          border: '1px solid var(--border)',
        },
      });
    };

    socket.on('notification:new', handleNewNotification);
    return () => socket.off('notification:new', handleNewNotification);
  }, [socket, isDark]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Error logging out');
    }
  };

  const handleSwitchToUser = async () => {
    try {
      setShowUserMenu(false);
      await login({ email: 'dev@workspace.com', password: 'Password123!' });
      toast.success('Switched to User Mode (Developer)');
      navigate('/dashboard');
    } catch {
      toast.error('Could not switch to user account');
    }
  };

  const handleSwitchToAdmin = async () => {
    try {
      setShowUserMenu(false);
      await login({ email: 'admin@workspace.com', password: 'admin123' });
      toast.success('Switched to Admin Mode');
      navigate('/admin');
    } catch {
      toast.error('Could not switch to admin account');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="header" style={{
      height: 'var(--header-h)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      transition: 'background 0.2s, border-color 0.2s'
    }}>
      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 440 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-hover)',
          padding: '8px 14px',
          borderRadius: 'var(--radius)',
          width: '100%',
          border: '1px solid transparent',
          transition: 'all 0.2s'
        }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search projects, tasks, files..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem',
              color: 'var(--text)',
              fontFamily: 'inherit'
            }}
          />
          <kbd style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-muted)'
          }}>⌘K</kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Quick Role Switcher Button */}
        {isAdmin ? (
          <button
            onClick={handleSwitchToUser}
            title="Switch instantly to regular user view (Developer account)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ⚡ View as User
          </button>
        ) : (
          <button
            onClick={handleSwitchToAdmin}
            title="Switch instantly to System Administrator"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ⚡ View as Admin
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            title="Notifications"
            style={{
              background: showNotifications ? 'var(--primary-light)' : 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: showNotifications ? 'var(--primary)' : 'var(--text)',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--danger)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: 18,
                height: 18,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px var(--bg-card)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 340,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 100
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-hover)'
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <CheckCircle2 size={13} /> Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                        transition: 'background 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (n.link) navigate(n.link);
                        setShowNotifications(false);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{n.title}</span>
                        {!n.read && (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                        )}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((p) => !p)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 8px',
              borderRadius: 'var(--radius)',
              transition: 'background 0.2s'
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                {user?.name || 'Workspace User'}
              </span>
              <span style={{
                fontSize: '0.7rem',
                color: user?.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: user?.role === 'admin' ? 700 : 500,
                textTransform: 'capitalize'
              }}>
                {user?.role || 'Member'}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 220,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 100,
              padding: 6
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signed in as</p>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || 'user@workspace.com'}
                </p>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setShowUserMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  transition: 'background 0.15s'
                }}
                className="dropdown-item"
              >
                <LayoutDashboard size={16} /> User Workspace
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setShowUserMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background 0.15s'
                  }}
                  className="dropdown-item"
                >
                  <Shield size={16} /> Admin Portal
                </Link>
              )}

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  transition: 'background 0.15s'
                }}
                className="dropdown-item"
              >
                <User size={16} /> My Profile
              </Link>

              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

              {isAdmin ? (
                <button
                  type="button"
                  onClick={handleSwitchToUser}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.825rem',
                    color: '#6366f1',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  ⚡ Switch to User View
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSwitchToAdmin}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.825rem',
                    color: '#f59e0b',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  ⚡ Switch to Admin View
                </button>
              )}

              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--danger)',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
