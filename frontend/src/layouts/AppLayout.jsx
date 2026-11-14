import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import SEO from '../components/common/SEO';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <SEO noindex={true} title="SecureTeam Workspace" />
      <Sidebar />
      <div style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        transition: 'margin 0.2s ease-in-out'
      }}>
        <Navbar />
        <main style={{
          flex: 1,
          padding: '24px 32px',
          maxWidth: 1600,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1 }}>
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
