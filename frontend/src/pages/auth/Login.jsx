import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState(location.state?.successNotice || '');

  useEffect(() => {
    if (location.state?.registeredEmail && !successNotice) {
      setSuccessNotice('Account registered successfully! Please enter your password to sign in.');
    }
  }, [location.state, successNotice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };
      const user = await login(payload);
      toast.success(`Welcome back, ${user.name || 'User'}!`);

      // Role-based redirection: Never trust client roles, server returns verified role
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
      toast.error(msg);
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
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          margin: '0 0 8px 0'
        }}>
          Sign in to your account
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          Enter your credentials to access your secure workspace
        </p>
      </div>

      {successNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--success)',
          borderRadius: 'var(--radius)',
          color: 'var(--success)',
          fontSize: '0.85rem',
          marginBottom: 20
        }}>
          <CheckCircle2 size={18} />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius)',
          color: 'var(--danger)',
          fontSize: '0.85rem',
          marginBottom: 20
        }}>
          {errorMsg}
        </div>
      )}

      {/* Social Logins */}
      <div style={{ marginBottom: 18 }}>
        <SocialAuthButtons actionText="Sign in" />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Email Address
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            transition: 'border-color 0.2s'
          }}>
            <Mail size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
              Password
            </label>
            <Link
              to="/forgot-password"
              style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
            >
              Forgot password?
            </Link>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            transition: 'border-color 0.2s'
          }}>
            <Lock size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
            boxShadow: 'var(--shadow-glow)',
            marginTop: 6,
            transition: 'all 0.2s'
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div style={{
        marginTop: 28,
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        paddingTop: 20
      }}>
        Don't have an account yet?{' '}
        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
          Create account
        </Link>
      </div>
    </div>
  );
}
