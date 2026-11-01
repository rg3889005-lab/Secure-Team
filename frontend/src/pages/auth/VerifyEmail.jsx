import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MailCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { authService } from '../../services';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !code) {
      toast.error('Please enter both your email and the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyEmail({ email, code });
      toast.success('Email verified successfully! You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setResending(true);
    try {
      await authService.resendVerification({ email });
      toast.success('A new verification code has been dispatched to your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
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
      boxSizing: 'border-box',
      textAlign: 'center'
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--primary-light)',
        color: 'var(--primary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
      }}>
        <MailCheck size={28} />
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 8px 0' }}>
        Verify your email
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
        We have sent a 6-digit verification code to your email address. Enter it below to activate your account.
      </p>

      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="email"
          required
          placeholder="your.email@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '12px 14px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '0.9rem',
            color: 'var(--text)',
            outline: 'none'
          }}
        />

        <input
          type="text"
          required
          maxLength={6}
          placeholder="6-character code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
          style={{
            padding: '14px 14px',
            background: 'var(--bg-input)',
            border: '2px solid var(--primary-light)',
            borderRadius: 'var(--radius)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '0.3em',
            textAlign: 'center',
            color: 'var(--text)',
            outline: 'none'
          }}
        />

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
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify Account <ArrowRight size={18} /></>}
        </button>
      </form>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: resending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <RefreshCw size={14} className={resending ? 'animate-spin' : ''} /> Resend code
        </button>

        <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          Back to login
        </Link>
      </div>
    </div>
  );
}
