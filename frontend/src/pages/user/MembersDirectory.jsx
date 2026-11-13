import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  MessageSquare,
  Shield,
  User,
  Calendar,
  Mail,
  Loader2,
  Circle,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { userService } from '../../services';
import toast from 'react-hot-toast';

export default function MembersDirectory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Profile Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.searchUsers({ search: searchTerm.trim() });
      const list = res.data?.data || res.data?.users || (Array.isArray(res.data) ? res.data : []);
      setUsers(list);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleOpenProfile = async (targetUserId) => {
    try {
      setProfileLoading(true);
      const res = await userService.getPublicProfile(targetUserId);
      setSelectedUser(res.data?.data || res.data?.user || res.data);
    } catch (err) {
      toast.error('Failed to load profile details');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleStartDM = (targetUserId) => {
    navigate(`/messages?userId=${targetUserId}`);
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'ALL') return true;
    return (u.role || 'user').toLowerCase() === roleFilter.toLowerCase();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0' }}>
            Members Directory
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Discover and connect with team members across the organization
          </p>
        </div>
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
            placeholder="Search members by name or email..."
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

        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'ADMIN', 'USER'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: roleFilter === r ? 'var(--primary-light)' : 'transparent',
                color: roleFilter === r ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: roleFilter === r ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading members...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)'
        }}>
          <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text)' }}>No members found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Try adjusting your search query.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filteredUsers.map((u) => {
            const isMe = u._id === user?._id;
            const online = isUserOnline(u._id);

            return (
              <div
                key={u._id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem'
                      }}>
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      {online && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: 'var(--success)',
                          border: '2px solid var(--bg-card)'
                        }} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                          {u.name}
                        </h3>
                        {isMe && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                            (You)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: u.role === 'admin' ? 'var(--danger)' : 'var(--primary)',
                      textTransform: 'uppercase'
                    }}>
                      {u.role || 'user'}
                    </span>

                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: online ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-input)',
                      color: online ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  {!isMe && (
                    <button
                      onClick={() => handleStartDM(u._id)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenProfile(u._id)}
                    style={{
                      flex: isMe ? 1 : 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      background: 'var(--bg-input)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Public Profile Modal */}
      {selectedUser && (
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
            maxWidth: 400,
            padding: 28,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Member Profile
              </h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.5rem',
                margin: '0 auto 12px'
              }}>
                {selectedUser.name?.charAt(0) || 'U'}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px 0' }}>
                {selectedUser.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {selectedUser.email}
              </p>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: 14, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Organization Role:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  {selectedUser.role}
                </span>
              </div>
              {selectedUser.joinedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {new Date(selectedUser.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {selectedUser._id !== user?._id && (
              <button
                onClick={() => {
                  setSelectedUser(null);
                  handleStartDM(selectedUser._id);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <MessageSquare size={16} /> Send Direct Message
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

