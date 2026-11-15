import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import SEO from '../components/common/SEO';

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile navigation drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile navigation drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', width: '100%' }}>
      <SEO noindex={true} title="SecureTeam Workspace" />

      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileNavOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close navigation"
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') setMobileNavOpen(false);
          }}
        />
      )}

      {/* Sidebar (Desktop sticky & Mobile off-canvas drawer) */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Workspace Layout */}
      <div
        className="app-main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
          transition: 'margin 0.2s ease-in-out',
        }}
      >
        <Navbar onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)} />
        <main
          className="app-page-container"
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 1600,
            margin: '0 auto',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, width: '100%' }}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
          <Footer compact={true} />
        </main>
      </div>
    </div>
  );
}
