import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  MessageSquare,
  CheckSquare,
  FolderOpen,
  Settings,
  Shield,
  Crown,
  Lock,
  Globe,
  Plus,
  Send,
  UserPlus,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  FileText,
  Clock,
  ArrowLeft,
  Upload,
  Download,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { projectService, taskService, fileService, invitationService } from '../../services';
import toast from 'react-hot-toast';

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isPublicOnly, setIsPublicOnly] = useState(false);

  // Chat tab state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const chatScrollRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Tasks tab state
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  // Files tab state
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Members / Invite state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);

  // Settings tab state
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    visibility: 'private',
    description: '',
    publicDescription: '',
    internalObjectives: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Determine user's role in this project
  const currentMember = project?.members?.find(
    (m) => (m.user?._id || m.user) === user?._id
  );
  const userProjectRole = currentMember?.role || (project?.teamLeader?._id === user?._id || project?.teamLeader === user?._id ? 'team-leader' : null);
  const isLeaderOrOwner = userProjectRole === 'owner' || userProjectRole === 'team-leader' || user?.role === 'admin';
  const isMember = Boolean(currentMember || isLeaderOrOwner || project?.isMember);

  // Fetch project details
  const fetchProjectDetails = useCallback(async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      setIsPublicOnly(false);

      const res = await projectService.getProject(projectId);
      const data = res.data?.data || res.data?.project || res.data;
      setProject(data);

      if (data) {
        setEditForm({
          name: data.name || '',
          category: data.category || '',
          visibility: data.visibility || 'private',
          description: data.description || '',
          publicDescription: data.publicDescription || '',
          internalObjectives: Array.isArray(data.internalObjectives)
            ? data.internalObjectives.join('\n')
            : (data.internalObjectives || ''),
        });
      }

      // Check if response is sanitized public DTO
      if (data.isPublicDTO || !data.members) {
        setIsPublicOnly(true);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
      } else if (err.response?.status === 404) {
        toast.error('Project not found');
        navigate('/projects');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Load project messages for Chat tab
  const fetchMessages = useCallback(async () => {
    if (!projectId || isPublicOnly || accessDenied) return;
    try {
      const res = await projectService.getProjectMessages(projectId);
      const list = res.data?.data || res.data?.messages || (Array.isArray(res.data) ? res.data : []);
      setMessages(list);
    } catch {}
  }, [projectId, isPublicOnly, accessDenied]);

  // Load project tasks
  const fetchTasks = useCallback(async () => {
    if (!projectId || isPublicOnly || accessDenied) return;
    try {
      setLoadingTasks(true);
      const res = await taskService.getTasks({ project: projectId });
      const list = res.data?.data || res.data?.tasks || (Array.isArray(res.data) ? res.data : []);
      setTasks(list);
    } catch {}
    finally {
      setLoadingTasks(false);
    }
  }, [projectId, isPublicOnly, accessDenied]);

  // Load project files
  const fetchFiles = useCallback(async () => {
    if (!projectId || isPublicOnly || accessDenied) return;
    try {
      setLoadingFiles(true);
      const res = await fileService.getFiles({ project: projectId });
      const list = res.data?.data || res.data?.files || (Array.isArray(res.data) ? res.data : []);
      setFiles(list);
    } catch {}
    finally {
      setLoadingFiles(false);
    }
  }, [projectId, isPublicOnly, accessDenied]);

  // Load pending invites (for leaders)
  const fetchPendingInvites = useCallback(async () => {
    if (!isLeaderOrOwner || isPublicOnly || accessDenied) return;
    try {
      const res = await projectService.getProjectInvitations(projectId);
      const list = res.data?.data || res.data?.invitations || (Array.isArray(res.data) ? res.data : []);
      setPendingInvites(list);
    } catch {}
  }, [projectId, isLeaderOrOwner, isPublicOnly, accessDenied]);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchMessages();
    } else if (activeTab === 'tasks') {
      fetchTasks();
    } else if (activeTab === 'files') {
      fetchFiles();
    } else if (activeTab === 'members') {
      fetchPendingInvites();
    }
  }, [activeTab, fetchMessages, fetchTasks, fetchFiles, fetchPendingInvites]);

  // Socket.io Real-Time Room Chat for Project
  useEffect(() => {
    if (!socket || !projectId || isPublicOnly || accessDenied) return;

    // Join isolated project room
    socket.emit('project:join', { projectId });

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    };

    const handleTyping = ({ userId: tUserId, user: tUser }) => {
      if (tUserId !== user?._id) {
        setTypingUsers((prev) => new Set([...prev, tUser?.name || 'Someone']));
      }
    };

    const handleStopTyping = ({ userId: tUserId }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        // Clear when stopped
        return new Set();
      });
    };

    socket.on('project:message', handleNewMessage);
    socket.on('project:typing', handleTyping);
    socket.on('project:stop_typing', handleStopTyping);

    return () => {
      socket.emit('project:leave', { projectId });
      socket.off('project:message', handleNewMessage);
      socket.off('project:typing', handleTyping);
      socket.off('project:stop_typing', handleStopTyping);
    };
  }, [socket, projectId, isPublicOnly, accessDenied, user?._id]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Project Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingMsg) return;

    const content = chatInput.trim();
    setChatInput('');
    setSendingMsg(true);

    try {
      // Send via HTTP (also persists and broadcasts via socket room)
      const res = await projectService.sendProjectMessage(projectId, { content });
      const createdMsg = res.data?.data || res.data?.message;
      if (createdMsg && (!socket || !socket.connected)) {
        setMessages((prev) => [...prev, createdMsg]);
      }
    } catch (err) {
      toast.error('Failed to send message');
      setChatInput(content);
    } finally {
      setSendingMsg(false);
      if (socket) {
        socket.emit('project:stop_typing', { projectId });
      }
    }
  };

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
    if (socket) {
      socket.emit('project:typing', { projectId });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit('project:stop_typing', { projectId });
      }, 2000);
    }
  };

  // Invite Member via Email
  const handleSendInvite = async (e) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error('A valid recipient email address is required.');
      return;
    }

    setSendingInvite(true);
    try {
      const res = await projectService.sendInvitation(projectId, {
        email: cleanEmail,
        role: inviteRole,
      });
      toast.success(res.data?.message || `Invitation email sent successfully to ${cleanEmail}!`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      fetchPendingInvites();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to send invitation. Please check your email configuration or try again.';
      toast.error(msg);
    } finally {
      setSendingInvite(false);
    }
  };

  // Resend Project Invitation
  const handleResendInvite = async (invitationId, recipientEmail) => {
    setResendingInviteId(invitationId);
    try {
      const res = await invitationService.resendInvitation(invitationId);
      toast.success(res.data?.message || `Invitation email resent successfully to ${recipientEmail}!`);
      fetchPendingInvites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation. Please try again.');
    } finally {
      setResendingInviteId(null);
    }
  };

  // Cancel Pending Invitation
  const handleCancelInvite = async (invitationId, recipientEmail) => {
    if (!window.confirm(`Are you sure you want to cancel the pending invitation for ${recipientEmail}?`)) return;
    try {
      const res = await invitationService.cancelInvitation(invitationId);
      toast.success(res.data?.message || 'Invitation cancelled.');
      fetchPendingInvites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invitation.');
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || 'this user'} from the project?`)) return;

    try {
      await projectService.removeMember(projectId, memberUserId);
      toast.success('Member removed');
      fetchProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Update Member Role
  const handleUpdateRole = async (memberUserId, newRole) => {
    try {
      await projectService.updateMemberRole(projectId, memberUserId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update member role');
    }
  };

  // Create Project Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await taskService.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        project: projectId,
        priority: newTaskPriority,
      });
      toast.success('Task created');
      setShowTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  // Upload Project File
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project', projectId);
      await fileService.uploadFile(formData);
      toast.success('File uploaded successfully');
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        visibility: editForm.visibility,
        description: editForm.description.trim(),
        publicDescription: editForm.publicDescription.trim(),
        internalObjectives: editForm.internalObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await projectService.updateProject(projectId, payload);
      toast.success('Project settings saved successfully');
      fetchProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (!window.confirm('CRITICAL: Are you sure you want to permanently delete this project workspace and all its data?')) return;
    try {
      await projectService.deleteProject(projectId);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <p>Loading project workspace...</p>
      </div>
    );
  }

  // HTTP 403 Forbidden Access Denied Screen
  if (accessDenied) {
    return (
      <div style={{
        maxWidth: 600,
        margin: '60px auto',
        padding: 40,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 10px 0' }}>
          Access Denied (403 Forbidden)
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          This is a private project workspace. You are not a member of this project, and internal discussions, files, and milestones are strictly restricted to authorized team members.
        </p>
        <Link
          to="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} /> Return to Projects
        </Link>
      </div>
    );
  }

  // Non-member viewing a Public Project (Public Project Overview Only)
  if (isPublicOnly) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/projects')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={16} /> Back to Projects
          </button>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 32,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)'
            }}>
              <Globe size={12} /> Public Project Listing
            </span>
            {project.category && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: 4, background: 'var(--bg-input)' }}>
                {project.category}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 12px 0' }}>
            {project.name}
          </h1>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            {project.publicDescription || project.description || 'No public summary provided for this project.'}
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            marginBottom: 24
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              {project.teamLeader?.name?.charAt(0) || 'L'}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Team Leader</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                {project.teamLeader?.name || 'Project Leader'}
              </div>
            </div>
          </div>

          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius)',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <Lock size={20} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text)' }}>
                Private Workspace Active
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                You are viewing the basic public details of this project. Internal objectives, task assignments, confidential documents, and room chat discussions are strictly isolated to invited team members.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Member View: Full Workspace
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: project.visibility === 'public' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                color: project.visibility === 'public' ? 'var(--success)' : 'var(--primary)'
              }}>
                {project.visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                {project.visibility === 'public' ? 'Public Project' : 'Private Workspace'}
              </span>

              {userProjectRole && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  textTransform: 'uppercase'
                }}>
                  <Crown size={11} /> Role: {userProjectRole}
                </span>
              )}

              {project.category && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 4, background: 'var(--bg-input)' }}>
                  {project.category}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0' }}>
              {project.name}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, maxWidth: 680 }}>
              {project.description || project.publicDescription || 'Active collaborative workspace'}
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isLeaderOrOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <UserPlus size={16} /> Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 6,
          marginTop: 24,
          borderTop: '1px solid var(--border)',
          paddingTop: 16,
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: FolderKanban },
            { id: 'members', label: `Members (${project.members?.length || 1})`, icon: Users },
            { id: 'chat', label: 'Project Chat', icon: MessageSquare },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'files', label: 'Files & Media', icon: FolderOpen },
            ...(isLeaderOrOwner ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Internal Objectives Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="var(--primary)" /> Internal Objectives (Private)
            </h3>
            {Array.isArray(project.internalObjectives) && project.internalObjectives.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {project.internalObjectives.map((obj, i) => (
                  <li key={i} style={{ lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--text)' }}>{obj}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                No private objectives added yet. Team leaders can configure them in Project Settings.
              </p>
            )}
          </div>

          {/* Detailed Info Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Project Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Team Leader</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {project.teamLeader?.name || 'Assigned'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Category</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {project.category || 'General'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Visibility</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {project.visibility === 'public' ? 'Public' : 'Strictly Private'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Created At</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {project.publicDescription && (
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Public Summary (Visible to non-members)
                </span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  {project.publicDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Members */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Active Members ({project.members?.length || 0})
              </h3>
              {isLeaderOrOwner && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Invite
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {project.members?.map((m) => {
                const mUser = m.user || {};
                const mRole = m.role || 'member';
                const isLeaderRole = mRole === 'owner' || mRole === 'team-leader';
                const isMe = mUser._id === user?._id;

                return (
                  <div
                    key={mUser._id || m._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}>
                        {mUser.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                            {mUser.name} {isMe && '(You)'}
                          </span>
                          {isLeaderRole && (
                            <Crown size={14} color="#f59e0b" />
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {mUser.email}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Role selection for Leaders */}
                      {isLeaderOrOwner && !isMe ? (
                        <select
                          value={mRole}
                          onChange={(e) => handleUpdateRole(mUser._id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            color: 'var(--text)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="member">Member</option>
                          <option value="team-leader">Team Leader</option>
                        </select>
                      ) : (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: isLeaderRole ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                          color: isLeaderRole ? '#f59e0b' : 'var(--primary)',
                          textTransform: 'uppercase'
                        }}>
                          {mRole}
                        </span>
                      )}

                      {/* Remove member button */}
                      {isLeaderOrOwner && !isMe && (
                        <button
                          onClick={() => handleRemoveMember(mUser._id, mUser.name)}
                          title="Remove from project"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: 6,
                            borderRadius: 4
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Invitations list for Team Leaders */}
          {isLeaderOrOwner && pendingInvites.length > 0 && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Pending Invitations ({pendingInvites.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Invitations expire after 48 hours
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingInvites.map((inv) => {
                  const isExpired = inv.expiresAt && new Date(inv.expiresAt) < new Date();
                  const isResending = resendingInviteId === inv._id;

                  return (
                    <div
                      key={inv._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{inv.recipientEmail}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: inv.role === 'team-leader' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-hover)',
                            color: inv.role === 'team-leader' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}>
                            {inv.role === 'team-leader' ? 'Team Leader' : 'Member'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isExpired ? 'var(--danger)' : '#f59e0b', fontWeight: 500 }}>
                          {isExpired ? 'Expired' : 'Awaiting Acceptance (48h Token)'}
                        </div>
                      </div>

                      {/* Action buttons: Resend & Cancel */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleResendInvite(inv._id, inv.recipientEmail)}
                          disabled={isResending}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--primary)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: isResending ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Resend invitation email with a fresh 48-hour secure token"
                        >
                          {isResending ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RefreshCw size={13} />
                          )}
                          <span>{isResending ? 'Sending...' : 'Resend Email'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelInvite(inv._id, inv.recipientEmail)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--danger)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Cancel this invitation"
                        >
                          <XCircle size={13} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Project Chat (Strict Room Isolation) */}
      {activeTab === 'chat' && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          height: 600,
          overflow: 'hidden'
        }}>
          {/* Chat Room Banner */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-input)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                Private Project Room Chat
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Messages broadcast strictly to project members only
            </span>
          </div>

          {/* Messages Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No messages yet in this project workspace.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Start the conversation with your team!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const sender = msg.sender || {};
                const isMe = sender._id === user?._id;

                return (
                  <div
                    key={msg._id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span style={{ fontWeight: 600, color: isMe ? 'var(--primary)' : 'var(--text)' }}>
                        {sender.name || 'Team Member'}
                      </span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div style={{
                      maxWidth: '75%',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius)',
                      background: isMe ? 'var(--primary)' : 'var(--bg-input)',
                      color: isMe ? '#fff' : 'var(--text)',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      boxShadow: 'var(--shadow-sm)',
                      wordBreak: 'break-word'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Typing Indicator */}
          {typingUsers.size > 0 && (
            <div style={{ padding: '4px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {Array.from(typingUsers).join(', ')} is typing...
            </div>
          )}

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: 16,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 10,
              background: 'var(--bg-card)'
            }}
          >
            <input
              type="text"
              placeholder="Send a private message to the project room..."
              value={chatInput}
              onChange={handleChatInputChange}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={sendingMsg || !chatInput.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                opacity: chatInput.trim() ? 1 : 0.6
              }}
            >
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Tasks */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Project Tasks ({tasks.length})
            </h3>
            <button
              onClick={() => setShowTaskModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> New Task
            </button>
          </div>

          {loadingTasks ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p>Loading project tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)'
            }}>
              <CheckSquare size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No tasks in this workspace yet. Create tasks to track deliverable progress.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map((t) => (
                <div
                  key={t._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
                      {t.title}
                    </h4>
                    {t.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        {t.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: t.status === 'DONE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: t.status === 'DONE' ? 'var(--success)' : 'var(--primary)'
                    }}>
                      {t.status || 'TODO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Files */}
      {activeTab === 'files' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Project Documents & Files ({files.length})
            </h3>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Upload File
              </button>
            </div>
          </div>

          {loadingFiles ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p>Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)'
            }}>
              <FolderOpen size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No files uploaded to this project workspace yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {files.map((f) => (
                <div
                  key={f._id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={24} color="var(--primary)" />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {f.originalName || f.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(f.size / 1024).toFixed(1)} KB • {new Date(f.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Settings (Team Leader / Owner Only) */}
      {activeTab === 'settings' && isLeaderOrOwner && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          maxWidth: 700
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 20px 0' }}>
            Project Workspace Settings
          </h3>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Project Name
              </label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
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
                  <option value="General">General</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Security">Security</option>
                  <option value="Research">Research</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Workspace Visibility
                </label>
                <select
                  value={editForm.visibility}
                  onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
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
                  <option value="private">Strictly Private (Members only)</option>
                  <option value="public">Public Overview (Listed on Discover)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Full Internal Description (Members Only)
              </label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Public Summary (Visible on Discover tab to non-members)
              </label>
              <textarea
                rows={2}
                value={editForm.publicDescription}
                onChange={(e) => setEditForm({ ...editForm, publicDescription: e.target.value })}
                placeholder="High-level summary without revealing confidential internal data..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Internal Objectives (One per line — confidential to members)
              </label>
              <textarea
                rows={4}
                value={editForm.internalObjectives}
                onChange={(e) => setEditForm({ ...editForm, internalObjectives: e.target.value })}
                placeholder="Deliver Alpha release by Q3&#10;Implement end-to-end encryption&#10;Security audit signoff"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="submit"
                disabled={savingSettings}
                style={{
                  padding: '10px 22px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {savingSettings ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div style={{
            marginTop: 36,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--danger)', fontSize: '0.95rem' }}>
                Delete Project Workspace
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Permanently delete this project, all member associations, room messages, and tasks.
              </p>
            </div>
            <button
              onClick={handleDeleteProject}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={16} /> Delete Project
            </button>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
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
            maxWidth: 440,
            padding: 28,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Invite Team Member
              </h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  User Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Role in Project
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
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
                  <option value="member">Member (Read & Collaborate)</option>
                  <option value="team-leader">Team Leader (Manage Members & Settings)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
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
                  disabled={sendingInvite}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 18px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {sendingInvite ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {sendingInvite ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
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
            maxWidth: 440,
            padding: 28,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Add Project Task
              </h3>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design authentication workflow"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
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
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details, acceptance criteria..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  style={{
                    padding: '8px 14px',
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
                  style={{
                    padding: '8px 16px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

