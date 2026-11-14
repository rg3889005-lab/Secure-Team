import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function SocialAuthButtons({ actionText = 'Continue' }) {
  const { googleLogin, facebookLogin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const googleBtnRef = useRef(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // Initialize Facebook SDK script if configured
  useEffect(() => {
    if (!facebookAppId || facebookAppId === 'YOUR_FACEBOOK_APP_ID') return;

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.FB) {
          window.FB.init({
            appId: facebookAppId,
            cookie: true,
            xfbml: true,
            version: 'v19.0',
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [facebookAppId]);

  const handleGoogleSuccess = useCallback(async (credential) => {
    try {
      setGoogleLoading(true);
      const user = await googleLogin(credential);
      toast.success(`Welcome, ${user.name || 'User'}!`);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign-in failed. Please try again.';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin, navigate]);

  // Render official Google Identity Services button (opens native OAuth popup reliably)
  const renderGoogleButton = useCallback(() => {
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID') return;
    if (!window.google?.accounts?.id || !googleBtnRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response?.credential) {
            handleGoogleSuccess(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      // Calculate width to match container (clamped between 220px and 400px per Google GSI guidelines)
      const containerW = googleBtnRef.current.parentElement?.offsetWidth || googleBtnRef.current.offsetWidth || 380;
      const clampedWidth = Math.min(Math.max(containerW, 220), 400);

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: actionText === 'Sign Up' ? 'signup_with' : 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: clampedWidth,
      });

      setIsGsiLoaded(true);

      // Optional silent One Tap prompt for returning signed-in users
      window.google.accounts.id.prompt(() => {});
    } catch (err) {
      console.warn('Google Identity Services render warning:', err);
    }
  }, [googleClientId, isDark, actionText, handleGoogleSuccess]);

  // Setup Google Identity Services listener
  useEffect(() => {
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID') return;

    let active = true;

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          if (active) renderGoogleButton();
        }
      }, 100);

      const timeoutId = setTimeout(() => clearInterval(checkInterval), 6000);

      return () => {
        active = false;
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
      };
    }

    const handleResize = () => {
      if (active) renderGoogleButton();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      active = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [googleClientId, renderGoogleButton]);

  const handleGoogleFallbackClick = () => {
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
      toast.error('Google Sign-In is not configured yet. Please configure VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    if (!window.google?.accounts?.id) {
      toast.error('Google Sign-In is initializing. Please try again in a moment.');
      return;
    }

    renderGoogleButton();
  };

  const handleFacebookClick = () => {
    if (!facebookAppId || facebookAppId === 'YOUR_FACEBOOK_APP_ID') {
      toast.error('Facebook Sign-In is not configured yet. Please configure VITE_FACEBOOK_APP_ID.');
      return;
    }

    if (!window.FB) {
      toast.error('Facebook SDK is still loading. Please try again in a moment.');
      return;
    }

    setFacebookLoading(true);
    try {
      window.FB.login(
        async (response) => {
          if (response.authResponse) {
            try {
              const user = await facebookLogin({
                accessToken: response.authResponse.accessToken,
                userID: response.authResponse.userID,
              });
              toast.success(`Welcome, ${user.name || 'User'}!`);
              if (user.role === 'admin') {
                navigate('/admin', { replace: true });
              } else {
                navigate('/dashboard', { replace: true });
              }
            } catch (err) {
              const msg = err.response?.data?.message || 'Facebook sign-in failed.';
              toast.error(msg);
            } finally {
              setFacebookLoading(false);
            }
          } else {
            setFacebookLoading(false);
            toast('Facebook sign-in was cancelled.', { icon: 'ℹ️' });
          }
        },
        { scope: 'public_profile,email' }
      );
    } catch (err) {
      setFacebookLoading(false);
      toast.error('Failed to trigger Facebook authentication.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {/* Google Button Section */}
      <div style={{ width: '100%', minHeight: 44, position: 'relative' }}>
        {googleLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              height: 44,
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxSizing: 'border-box',
            }}
          >
            <Loader2 size={18} className="animate-spin" color="var(--primary)" />
            <span>Signing in with Google...</span>
          </div>
        ) : (
          <>
            {/* Official Google Identity Services Rendered Button */}
            <div
              ref={googleBtnRef}
              style={{
                display: isGsiLoaded ? 'flex' : 'none',
                justifyContent: 'center',
                width: '100%',
                minHeight: 44,
              }}
            />

            {/* Fallback while script initializes or if client ID unconfigured */}
            {!isGsiLoaded && (
              <button
                type="button"
                onClick={handleGoogleFallbackClick}
                disabled={googleLoading || facebookLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: googleLoading || facebookLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{actionText} with Google</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Facebook Button */}
      <button
        type="button"
        onClick={handleFacebookClick}
        disabled={googleLoading || facebookLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          width: '100%',
          padding: '11px 16px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: googleLoading || facebookLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
        }}
      >
        {facebookLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        <span>{actionText} with Facebook</span>
      </button>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: '12px 0 6px',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-light)',
            fontWeight: 600,
          }}
        >
          Or continue with email
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
    </div>
  );
}
