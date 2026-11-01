import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  FolderKanban,
  Activity,
  HardDrive,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Radio,
  FileText
} from 'lucide-react';
import { adminService } from '../../services';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalAuditLogs: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const [dashRes, logsRes] = await Promise.allSettled([
          adminService.getDashboard(),
          adminService.getAuditLogs({ limit: 5 }),
        ]);

        if (dashRes.status === 'fulfilled') {
          const d = dashRes.value.data || {};
          setStats({
            totalUsers: d.totalUsers || 0,
            activeUsers: d.activeUsers || 0,
            totalProjects: d.totalProjects || 0,
            totalAuditLogs: d.totalAuditLogs || 0,
          });
        }
        if (logsRes.status === 'fulfilled') {
          setRecentLogs(logsRes.value.data?.logs || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Admin Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
        color: '#fff',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 40px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(99, 102, 241, 0.25)',
          color: '#818cf8',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          padding: '4px 12px',
          borderRadius: 999,
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: 12
        }}>
          <Shield size={14} /> SECURITY & GOVERNANCE PORTAL
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
          Admin Control Center
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 24px 0', maxWidth: 600 }}>
          Manage user privileges, inspect real-time audit trails, broadcast security bulletins, and view enterprise operational health.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/admin/users"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--primary)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}
          >
            Manage Users <ArrowRight size={16} />
          </Link>
          <Link
            to="/admin/broadcasts"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '10px 18px',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}
          >
            <Radio size={16} /> Broadcast Announcement
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        {[
          { label: 'Registered Users', value: stats.totalUsers, icon: Users, color: '#6366f1' },
          { label: 'Active Sessions', value: stats.activeUsers, icon: Activity, color: '#10b981' },
          { label: 'Enterprise Projects', value: stats.totalProjects, icon: FolderKanban, color: '#f59e0b' },
          { label: 'Security Audit Logs', value: stats.totalAuditLogs, icon: FileText, color: '#ec4899' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius)',
                background: `${kpi.color}15`,
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {kpi.label}
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
                  {kpi.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Recent Logs & Navigation Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Audit Events */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Recent Security Audit Events
            </h3>
            <Link to="/admin/audit-logs" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Full Log History →
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No audit records recorded yet. Events will be logged automatically upon logins, permission modifications, and file operations.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--primary)'
                    }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>
                      {log.details || log.description || 'System event'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Admin Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text)' }}>
              Governance Quick Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                to="/admin/users"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                <Users size={18} color="var(--primary)" /> User Directory & Roles
              </Link>
              <Link
                to="/admin/analytics"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                <TrendingUp size={18} color="var(--success)" /> Operational Analytics
              </Link>
              <Link
                to="/admin/broadcasts"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                <Radio size={18} color="var(--warning)" /> System Bulletins
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
