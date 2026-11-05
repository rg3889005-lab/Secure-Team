import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
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
            <Outlet />
          </div>
          <Footer compact={true} />
        </main>
      </div>
    </div>
  );
}
