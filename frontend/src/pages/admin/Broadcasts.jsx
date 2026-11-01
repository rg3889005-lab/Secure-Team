import { useState } from 'react';
import {
  Radio,
  Send,
  AlertTriangle,
  Info,
  AlertOctagon,
  CheckCircle2,
  Loader2,
  Bell
} from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

export default function Broadcasts() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info', // 'info', 'warning', 'critical'
    targetRole: 'ALL',
    link: '',
  });
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      await adminService.sendAnnouncement(formData);
      toast.success('System announcement broadcasted to all users!');
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetRole: 'ALL',
        link: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  const getTypeColor = (type) => {
    if (type === 'critical') return 'var(--danger)';
    if (type === 'warning') return 'var(--warning)';
    return 'var(--primary)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0' }}>
          System Broadcasts & Announcements
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          Broadcast real-time push notifications, policy changes, and urgent maintenance alerts to active team sessions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Broadcast Composer */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 18px 0', color: 'var(--text)' }}>
            Compose Announcement
          </h3>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Announcement Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled Infrastructure Maintenance"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                Message Content *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide details, anticipated downtime, action items for team members..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Alert Level
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                  <option value="info">Informational</option>
                  <option value="warning">Warning / Action</option>
                  <option value="critical">Critical / Urgent</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Target Audience
                </label>
                <select
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
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
                  <option value="ALL">All Workspace Members</option>
                  <option value="manager">Managers & Admins</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Optional Action Link
              </label>
              <input
                type="text"
                placeholder="e.g. /tasks or https://status.workspace.com"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
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

            <button
              type="submit"
              disabled={sending}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending ? 0.7 : 1,
                boxShadow: 'var(--shadow-glow)',
                marginTop: 8
              }}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Dispatch Broadcast Now</>}
            </button>
          </form>
        </div>

        {/* Live Preview Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>
              Live Toast / Notification Preview
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              How this announcement appears inside recipient browsers upon broadcast:
            </p>

            <div style={{
              background: 'var(--bg)',
              border: `2px solid ${getTypeColor(formData.type)}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              display: 'flex',
              gap: 14
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius)',
                background: `${getTypeColor(formData.type)}15`,
                color: getTypeColor(formData.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bell size={20} />
              </div>

              <div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: getTypeColor(formData.type),
                  letterSpacing: '0.05em'
                }}>
                  {formData.type} announcement
                </span>
                <h4 style={{ margin: '4px 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                  {formData.title || 'Announcement Title'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {formData.message || 'The announcement message body will be displayed here in full context for all active workspace sessions.'}
                </p>
                {formData.link && (
                  <span style={{ display: 'inline-block', marginTop: 8, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Link: {formData.link}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
