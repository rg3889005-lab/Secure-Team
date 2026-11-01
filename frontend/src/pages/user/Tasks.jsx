import { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Columns3,
  List as ListIcon,
  MessageSquare,
  Calendar,
  Clock,
  Trash2,
  X,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { taskService, projectService } from '../../services';
import toast from 'react-hot-toast';

const STATUS_COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#6366f1' },
  { id: 'in-progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'review', label: 'In Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

  // New Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    projectId: '',
    dueDate: '',
  });
  const [creating, setCreating] = useState(false);

  // Task Details Drawer / Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await taskService.getTasks();
      const list = res.data?.data || res.data?.tasks || (Array.isArray(res.data) ? res.data : []);
      setTasks(list);
    } catch {
      // Empty fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    projectService.getProjects().then((res) => {
      const list = res.data?.data || res.data?.projects || (Array.isArray(res.data) ? res.data : []);
      setProjects(list);
    }).catch(() => {});
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || '',
        status: (newTask.status || 'todo').toLowerCase(),
        priority: (newTask.priority || 'medium').toLowerCase(),
        dueDate: newTask.dueDate || null,
        projectId: newTask.projectId || undefined,
      };
      const res = await taskService.createTask(payload);
      toast.success('Task created successfully');
      const created = res.data?.data || res.data?.task || res.data;
      if (created && created._id) {
        setTasks((prev) => [created, ...prev.filter((t) => t._id !== created._id)]);
      }
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      await taskService.updateTask(taskId, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task removed');
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      if (selectedTask?._id === taskId) setSelectedTask(null);
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    setCommenting(true);
    try {
      const res = await taskService.addComment(selectedTask._id, newComment);
      const updatedComments = res.data?.comments || [
        ...(selectedTask.comments || []),
        { content: newComment, createdAt: new Date() },
      ];

      setSelectedTask((prev) => ({ ...prev, comments: updatedComments }));
      setTasks((prev) =>
        prev.map((t) => (t._id === selectedTask._id ? { ...t, comments: updatedComments } : t))
      );
      setNewComment('');
      toast.success('Comment added');
    } catch (err) {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0' }}>
            Task Board
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Prioritize workflows, sprint backlogs, and track completion states
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* View Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 2
          }}>
            <button
              onClick={() => setViewMode('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'board' ? 'var(--primary-light)' : 'transparent',
                color: viewMode === 'board' ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Columns3 size={15} /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'list' ? 'var(--primary-light)' : 'transparent',
                color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ListIcon size={15} /> List
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
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
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '10px 16px',
        maxWidth: 400
      }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search board tasks..."
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

      {/* Board View */}
      {viewMode === 'board' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 16
        }}>
          {STATUS_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => (t.status || 'todo').toLowerCase().replace('_', '-') === col.id);
            return (
              <div
                key={col.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 260px)',
                  minHeight: 400
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                      {col.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'var(--bg-hover)',
                    color: 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: 999
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards Container */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  {colTasks.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 10px',
                      color: 'var(--text-light)',
                      fontSize: '0.8rem',
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius)'
                    }}>
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t._id}
                        onClick={() => setSelectedTask(t)}
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                            background: t.priority?.toLowerCase() === 'urgent' || t.priority?.toLowerCase() === 'critical' ? 'rgba(239,68,68,0.1)' : t.priority?.toLowerCase() === 'high' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                            color: t.priority?.toLowerCase() === 'urgent' || t.priority?.toLowerCase() === 'critical' ? 'var(--danger)' : t.priority?.toLowerCase() === 'high' ? 'var(--warning)' : 'var(--primary)'
                          }}>
                            {t.priority}
                          </span>

                          {/* Quick move dropdown */}
                          <select
                            value={(t.status || 'todo').toLowerCase().replace('_', '-')}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(t._id, e.target.value)}
                            style={{
                              fontSize: '0.7rem',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-muted)',
                              borderRadius: 4,
                              padding: '1px 4px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </div>

                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                          {t.title}
                        </h4>

                        {t.description && (
                          <p style={{
                            margin: 0,
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {t.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MessageSquare size={13} />
                            <span>{t.comments?.length || 0}</span>
                          </div>

                          {t.dueDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={13} />
                              <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          {filteredTasks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Task</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Priority</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Due Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedTask(t)}>
                    <td style={{ padding: '14px 16px', color: 'var(--text)', fontWeight: 600 }}>{t.title}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={t.status || 'TODO'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(t._id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-hover)',
                          color: 'var(--text)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="REVIEW">Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: t.priority === 'URGENT' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                        color: t.priority === 'URGENT' ? 'var(--danger)' : 'var(--primary)'
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(t._id);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
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
            padding: '32px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)'
                }}>
                  {selectedTask.status}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--text)' }}>
                  {selectedTask.title}
                </h3>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
              {selectedTask.description || 'No additional details provided.'}
            </p>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px 0' }}>
                Activity & Comments ({selectedTask.comments?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedTask.comments?.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>No comments yet.</p>
                ) : (
                  selectedTask.comments?.map((c, i) => (
                    <div key={i} style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text)' }}>{c.content}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.85rem',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={commenting || !newComment.trim()}
                style={{
                  padding: '10px 16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
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
            maxWidth: 500,
            padding: '32px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Add New Task
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement user authentication flows"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Task context, acceptance criteria, notes..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.9rem',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Project
                </label>
                <select
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
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
                >
                  <option value="">Default Workspace</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
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
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    Initial Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
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
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  {creating ? 'Adding...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
