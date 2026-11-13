import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  Loader2,
  X,
  Lock,
  Globe,
  Crown,
  Shield,
  ArrowRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projectService } from '../../services';
import toast from 'react-hot-toast';

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'discover'
  const [myProjects, setMyProjects] = useState([]);
  const [discoverProjects, setDiscoverProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    category: 'Engineering',
    visibility: 'private',
    description: '',
    publicDescription: '',
    internalObjectives: '',
    priority: 'medium',
    deadline: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchMyProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectService.getMyProjects();
      const list = res.data?.data || res.data?.projects || (Array.isArray(res.data) ? res.data : []);
      setMyProjects(list);
    } catch {
      // Fallback
      setMyProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDiscoverProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectService.getDiscoverProjects();
      const list = res.data?.data || res.data?.projects || (Array.isArray(res.data) ? res.data : []);
      setDiscoverProjects(list);
    } catch {
      setDiscoverProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyProjects();
    } else {
      fetchDiscoverProjects();
    }
  }, [activeTab, fetchMyProjects, fetchDiscoverProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: newProject.name.trim(),
        category: newProject.category,
        visibility: newProject.visibility,
        description: newProject.description.trim(),
        publicDescription: newProject.publicDescription.trim(),
        internalObjectives: newProject.internalObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        priority: newProject.priority || 'medium',
        dueDate: newProject.deadline || null,
        deadline: newProject.deadline || null,
      };

      const res = await projectService.createProject(payload);
      toast.success('Project workspace created! You are designated Team Leader.');
      const created = res.data?.data || res.data?.project || res.data;

      setShowModal(false);
      setNewProject({
        name: '',
        category: 'Engineering',
        visibility: 'private',
        description: '',
        publicDescription: '',
        internalObjectives: '',
        priority: 'medium',
        deadline: '',
      });

      if (created?._id) {
        navigate(`/projects/${created._id}`);
      } else {
        fetchMyProjects();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project? All workspaces and messages will be removed.')) return;
    try {
      await projectService.deleteProject(id);
      toast.success('Project deleted');
      setMyProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const currentList = activeTab === 'my' ? myProjects : discoverProjects;

  const filteredProjects = currentList.filter((p) => {
    if (!p) return false;
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.publicDescription || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || (p.category || 'General').toUpperCase() === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header and Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0' }}>
            Projects & Workspaces
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Collaborate across isolated private workspaces with dedicated team leads, role boundaries, and room chat
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            to="/invitations"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              background: 'var(--bg-card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <Inbox size={16} /> Invitations
          </Link>

          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Plus size={18} /> Create Project
          </button>
        </div>
      </div>

      {/* Tabs: My Projects vs Discover */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        gap: 8
      }}>
        <button
          onClick={() => setActiveTab('my')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'my' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'my' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'my' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <FolderKanban size={16} /> My Workspaces ({myProjects.length})
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'discover' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'discover' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'discover' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Globe size={16} /> Discover Public Projects
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        background: 'var(--bg-card)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '8px 14px',
          flex: 1,
          minWidth: 240
        }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={activeTab === 'my' ? 'Search your projects by name or objective...' : 'Search public projects by keyword...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['ALL', 'ENGINEERING', 'DESIGN', 'MARKETING', 'SECURITY', 'RESEARCH'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: categoryFilter === cat ? 'var(--primary-light)' : 'transparent',
                color: categoryFilter === cat ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: categoryFilter === cat ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading workspaces...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)'
        }}>
          <FolderKanban size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text)' }}>
            {activeTab === 'my' ? 'No projects found' : 'No public projects available'}
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem' }}>
            {activeTab === 'my'
              ? (searchTerm ? 'Try adjusting your search filters.' : 'Create your first project to lead and collaborate with team members.')
              : 'There are currently no public projects listed in the workspace directory.'}
          </p>
          {activeTab === 'my' && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredProjects.map((p) => {
            // Find role in project
            const memberObj = p.members?.find((m) => (m.user?._id || m.user) === user?._id);
            const userRole = memberObj?.role || (p.teamLeader?._id === user?._id || p.teamLeader === user?._id ? 'team-leader' : null);
            const isLeader = userRole === 'owner' || userRole === 'team-leader' || user?.role === 'admin';

            return (
              <div
                key={p._id}
                onClick={() => navigate(`/projects/${p._id}`)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontWeight: 700,
                        background: p.visibility === 'public' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: p.visibility === 'public' ? 'var(--success)' : 'var(--primary)'
                      }}>
                        {p.visibility === 'public' ? <Globe size={10} /> : <Lock size={10} />}
                        {p.visibility === 'public' ? 'Public' : 'Private'}
                      </span>

                      {userRole && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.1)',
                          color: '#f59e0b',
                          textTransform: 'uppercase'
                        }}>
                          <Crown size={10} /> {userRole}
                        </span>
                      )}
                    </div>

                    {isLeader && activeTab === 'my' && (
                      <button
                        onClick={(e) => handleDeleteProject(e, p._id)}
                        title="Delete project workspace"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-light)',
                          cursor: 'pointer',
                          padding: 4
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px 0' }}>
                    {p.name}
                  </h3>

                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    margin: '0 0 16px 0',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {p.publicDescription || p.description || 'Dedicated collaborative workspace.'}
                  </p>
                </div>

                <div>
                  {activeTab === 'my' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                        <span>Workspace Progress</span>
                        <span style={{ fontWeight: 600 }}>{p.progress || 0}%</span>
                      </div>
                      <div style={{ width: '100%', height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                        <div style={{ width: `${p.progress || 0}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} />
                      <span>{p.membersCount || p.members?.length || 1} member{(p.membersCount || p.members?.length || 1) === 1 ? '' : 's'}</span>
                    </div>

                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>
                      Open Workspace <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: 580,
            padding: '28px 32px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text)' }}>
                  Create Project Workspace
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  You will automatically be assigned as Project Owner and Team Leader
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Phoenix"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.9rem',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Product">Product</option>
                    <option value="Security">Security</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    Workspace Privacy
                  </label>
                  <select
                    value={newProject.visibility}
                    onChange={(e) => setNewProject({ ...newProject, visibility: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="private">Strictly Private (Members Only)</option>
                    <option value="public">Public Overview (Listed on Discover)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Internal Description (Confidential to members)
                </label>
                <textarea
                  rows={2}
                  placeholder="Comprehensive details, milestones, internal deliverables..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Public Summary (Visible on Discover page)
                </label>
                <input
                  type="text"
                  placeholder="One sentence description visible to all organization users..."
                  value={newProject.publicDescription}
                  onChange={(e) => setNewProject({ ...newProject, publicDescription: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Internal Objectives (One per line — confidential to members)
                </label>
                <textarea
                  rows={3}
                  placeholder="Deliver Alpha prototype&#10;Implement role-based authorization&#10;Conduct security testing"
                  value={newProject.internalObjectives}
                  onChange={(e) => setNewProject({ ...newProject, internalObjectives: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 20px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
