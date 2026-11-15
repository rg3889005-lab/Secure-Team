import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  FolderKanban,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { invitationService } from '../../services';
import toast from 'react-hot-toast';

export default function ProjectInvitations() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Check URL query parameters for direct email action: ?token=xyz&action=accept/reject
  const urlToken = searchParams.get('token');
  const urlAction = searchParams.get('action');

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invitationService.getMyInvitations();
      const list = res.data?.data || res.data?.invitations || (Array.isArray(res.data) ? res.data : []);
      setInvitations(list);
    } catch {
      toast.error('Failed to load project invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Handle URL token direct execution
  useEffect(() => {
    if (!urlToken || !urlAction) return;

    const handleDirectAction = async () => {
      try {
        if (urlAction === 'accept') {
          toast.loading('Accepting invitation...', { id: 'invite-action' });
          const res = await invitationService.acceptInvitation('token', { token: urlToken });
          toast.success(res.data?.message || 'Invitation accepted! Welcome to the team.', { id: 'invite-action' });
          const projectId = res.data?.data?.projectId || res.data?.projectId;
          if (projectId) {
            navigate(`/projects/${projectId}`);
          } else {
            navigate('/projects');
          }
        } else if (urlAction === 'reject') {
          toast.loading('Declining invitation...', { id: 'invite-action' });
          const res = await invitationService.rejectInvitation('token', { token: urlToken });
          toast.success(res.data?.message || 'Invitation declined.', { id: 'invite-action' });
          fetchInvitations();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to process invitation link.', { id: 'invite-action' });
      }
    };

    handleDirectAction();
  }, [urlToken, urlAction, navigate, fetchInvitations]);

  const handleAccept = async (invite) => {
    setProcessingId(invite._id);
    try {
      const res = await invitationService.acceptInvitation(invite._id);
      toast.success(res.data?.message || `Joined "${invite.project?.name}"!`);
      const projectId = invite.project?._id || invite.project;
      if (projectId) {
        navigate(`/projects/${projectId}`);
      } else {
        fetchInvitations();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
      fetchInvitations();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (inviteId) => {
    setProcessingId(inviteId);
    try {
      const res = await invitationService.rejectInvitation(inviteId);
      toast.success(res.data?.message || 'Invitation declined');
      setInvitations((prev) => prev.filter((i) => i._id !== inviteId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Project Invitations
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'var(--primary-light)',
              color: 'var(--primary)'
            }}>
              {invitations.length} Pending
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Review and respond to invitations sent by project owners and team leaders
          </p>
        </div>

        <button
          onClick={fetchInvitations}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Invitations List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Checking pending project invitations...</p>
        </div>
      ) : invitations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Mail size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
            No Pending Invitations
          </h3>
          <p style={{ fontSize: '0.875rem', margin: '0 0 20px 0', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
            You do not have any pending workspace invitations right now. When a team leader invites you to collaborate on a project, it will appear here.
          </p>
          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              background: 'var(--primary)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            <FolderKanban size={16} /> Explore Projects
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {invitations.map((invite) => {
            const project = invite.project || {};
            const inviter = invite.inviter || invite.invitedBy || {};
            const isProcessing = processingId === invite._id;
            const expiresDate = invite.expiresAt ? new Date(invite.expiresAt) : null;
            const isExpired = expiresDate && expiresDate < new Date();

            return (
              <div
                key={invite._id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 'min(100%, 240px)' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius)',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    {project.name ? project.name.slice(0, 2).toUpperCase() : 'PR'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                        {project.name || 'Private Project Workspace'}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--primary)',
                        textTransform: 'uppercase'
                      }}>
                        Role: {invite.role || 'member'}
                      </span>
                      {project.category && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'var(--bg-input)'
                        }}>
                          {project.category}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                      {project.publicDescription || project.description || 'You have been invited to collaborate in this project workspace.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>
                        Invited by <strong style={{ color: 'var(--text)' }}>{inviter.name || 'Team Leader'}</strong>
                      </span>
                      {expiresDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isExpired ? 'var(--danger)' : 'var(--text-muted)' }}>
                          <Clock size={13} />
                          {isExpired ? 'Expired' : `Expires ${expiresDate.toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', width: 'auto' }}>
                  <button
                    onClick={() => handleReject(invite._id)}
                    disabled={isProcessing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 16px',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 44
                    }}
                  >
                    <XCircle size={16} /> Decline
                  </button>

                  <button
                    onClick={() => handleAccept(invite)}
                    disabled={isProcessing || isExpired}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 18px',
                      background: isExpired ? 'var(--text-light)' : 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: isExpired ? 'not-allowed' : 'pointer',
                      boxShadow: isExpired ? 'none' : 'var(--shadow-glow)',
                      minHeight: 44
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Accept & Join
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

