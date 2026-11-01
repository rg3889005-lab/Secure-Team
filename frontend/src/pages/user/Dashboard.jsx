import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projectService, taskService, notificationService } from '../../services';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    upcomingDeadlines: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick task modal state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projRes, taskRes] = await Promise.allSettled([
        projectService.getProjects({ limit: 4 }),
        taskService.getTasks({ limit: 6 }),
      ]);

      const rawProj = projRes.status === 'fulfilled' ? projRes.value.data : null;
      const projects = rawProj?.data || rawProj?.projects || (Array.isArray(rawProj) ? rawProj : []);

      const rawTasks = taskRes.status === 'fulfilled' ? taskRes.value.data : null;
      const tasks = rawTasks?.data || rawTasks?.tasks || (Array.isArray(rawTasks) ? rawTasks : []);

      setRecentProjects(projects);
      setRecentTasks(tasks);

      const active = tasks.filter((t) => (t.status || '').toLowerCase() !== 'done' && (t.status || '').toLowerCase() !== 'cancelled').length;
      const completed = tasks.filter((t) => (t.status || '').toLowerCase() === 'done').length;

      setStats({
        totalProjects: projects.length,
        activeTasks: active,
        completedTasks: completed,
        upcomingDeadlines: tasks.filter((t) => t.dueDate && new Date(t.dueDate) > new Date()).length,
      });
    } catch {
      // Handled via defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickCreateTask = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setQuickLoading(true);
    try {
      const res = await taskService.createTask({
        title: quickTitle,
        priority: 'medium',
        status: 'todo',
      });
      toast.success('Task created successfully!');
      setQuickTitle('');
      setRecentTasks((prev) => [res.data?.task || res.data, ...prev.slice(0, 5)]);
      setStats((s) => ({ ...s, activeTasks: s.activeTasks + 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task. (Ensure DB is connected)');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Welcome Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
        color: '#fff',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          position: 'absolute',
          right: -30,
          top: -30,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 640, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: 12,
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={13} /> SECURE WORKSPACE HUB
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Team Member'} 👋
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 24px 0',
            lineHeight: 1.5
          }}>
            Here is your workspace breakdown for today. You have {stats.activeTasks} ongoing task{stats.activeTasks === 1 ? '' : 's'} across {stats.totalProjects} project{stats.totalProjects === 1 ? '' : 's'}.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to="/projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#ffffff',
                color: '#4f46e5',
                padding: '10px 18px',
                borderRadius: 'var(--radius)',
                fontWeight: 700,
                fontSize: '0.875rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
              }}
            >
              Explore Projects <ArrowRight size={16} />
            </Link>
            <Link
              to="/tasks"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '10px 18px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                backdropFilter: 'blur(10px)'
              }}
            >
              Kanban Board
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        {[
          { label: 'Active Projects', value: stats.totalProjects, icon: FolderKanban, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
          { label: 'Tasks in Progress', value: stats.activeTasks, icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
          { label: 'Completed Tasks', value: stats.completedTasks, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
          { label: 'Upcoming Deadlines', value: stats.upcomingDeadlines, icon: Calendar, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
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
                background: kpi.bg,
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

      {/* Main Grid: Projects Overview & Quick Task Creator */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 24,
      }} className="dashboard-grid">
        {/* Left Column: Recent Projects & Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Projects Section */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderKanban size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  Active Workspace Projects
                </h3>
              </div>
              <Link to="/projects" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                View all →
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: 'var(--bg-hover)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-muted)'
              }}>
                <FolderKanban size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>No projects created yet.</p>
                <Link to="/projects" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}>
                  <Plus size={16} /> Create First Project
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {recentProjects.map((p) => (
                  <div
                    key={p._id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      background: 'var(--bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontWeight: 700,
                          background: p.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                          color: p.status === 'COMPLETED' ? 'var(--success)' : 'var(--primary)'
                        }}>
                          {p.status || 'ACTIVE'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.members?.length || 1} member{p.members?.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                        {p.name}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {p.description || 'No description provided.'}
                      </p>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>Progress</span>
                        <span>{p.progress || 0}%</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${p.progress || 0}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks List */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color="var(--success)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  Recent Tasks
                </h3>
              </div>
              <Link to="/tasks" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Open Board →
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                No tasks available. Use the quick creator on the right!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentTasks.map((t) => (
                  <div
                    key={t._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: t.priority === 'URGENT' ? 'var(--danger)' : t.priority === 'HIGH' ? 'var(--warning)' : 'var(--primary)'
                      }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                        {t.title}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-hover)',
                      color: 'var(--text-muted)',
                      fontWeight: 600
                    }}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Task Creator & Workspace Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Task Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text)' }}>
              Quick Add Task
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Instantly log a task to your workspace backlog.
            </p>
            <form onSubmit={handleQuickCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="What needs to get done?"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={quickLoading || !quickTitle.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: quickLoading || !quickTitle.trim() ? 'not-allowed' : 'pointer',
                  opacity: quickLoading || !quickTitle.trim() ? 0.6 : 1
                }}
              >
                <Plus size={16} /> Add to Board
              </button>
            </form>
          </div>

          {/* Quick Workspace Shortcuts */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text)' }}>
              Workspace Hubs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                to="/chat"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <MessageSquare size={16} color="var(--primary)" /> Team Real-time Chat
              </Link>
              <Link
                to="/files"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <FolderKanban size={16} color="var(--accent)" /> Shared Cloud Storage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
