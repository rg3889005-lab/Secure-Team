import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success('Reset link dispatched to your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      padding: '40px',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: 24, textAlign: 'left' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius)',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <KeyRound size={24} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 8px 0' }}>
          Forgot Password?
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          No worries. Enter your registered account email and we'll send you recovery instructions.
        </p>
      </div>

      {submitted ? (
        <div style={{
          padding: '20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--success)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          marginBottom: 20
        }}>
          <strong>Check your inbox:</strong> If an account matches <b>{email}</b>, we have dispatched a password reset link. Please check your spam folder if it doesn't appear within 2 minutes.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              Account Email
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px'
            }}>
              <Mail size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.9rem',
                  color: 'var(--text)',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '12px 18px',
              borderRadius: 'var(--radius)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send Reset Instructions <ArrowRight size={18} /></>}
          </button>
        </form>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} /> Return to sign in
        </Link>
      </div>
    </div>
  );
}
