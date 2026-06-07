import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Campaigns from './pages/Campaigns';
import Creators from './pages/Creators';
import Jobs from './pages/Jobs';
import Submissions from './pages/Submissions';
import Finances from './pages/Finances';
import Community from './pages/Community';
import CampaignManagerDashboard from './pages/CampaignManagerDashboard';
import CampaignManagersAdmin from './pages/CampaignManagersAdmin';
import PendingDeletions from './pages/PendingDeletions';
import BusinessVerifications from './pages/BusinessVerifications';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import { useAuth } from './hooks/useAuth';

function PrivateLayout({ children }) {
  const token = localStorage.getItem('admin_token');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div style={styles.shell}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
      <main style={{
        ...styles.main,
        marginLeft: sidebarCollapsed ? '82px' : '236px',
        width: sidebarCollapsed ? 'calc(100% - 82px)' : 'calc(100% - 236px)',
      }}>
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

function RoleGuard({ allow, children }) {
  const { role } = useAuth();
  // If role is unknown/empty (legacy session), allow through — backend will enforce auth
  if (!role) return children;
  const allowed = Array.isArray(allow) ? allow : [allow];
  const normalised = role.toLowerCase();
  if (!allowed.some(r => r.toLowerCase() === normalised)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter basename="/social_gems_admin">
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Campaign Manager home */}
        <Route path="/cm-dashboard" element={
          <PrivateLayout><CampaignManagerDashboard /></PrivateLayout>
        } />

        {/* Admin dashboard — accessible to all admin roles */}
        <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/users" element={<PrivateLayout><Users /></PrivateLayout>} />
        <Route path="/pending-deletions" element={<PrivateLayout><PendingDeletions /></PrivateLayout>} />
        <Route path="/campaigns" element={<PrivateLayout><Campaigns /></PrivateLayout>} />
        <Route path="/creators" element={<PrivateLayout><Creators /></PrivateLayout>} />
        <Route path="/jobs" element={<PrivateLayout><Jobs /></PrivateLayout>} />
        <Route path="/business-verifications" element={<PrivateLayout><BusinessVerifications /></PrivateLayout>} />
        <Route path="/submissions" element={<PrivateLayout><Submissions /></PrivateLayout>} />
        <Route path="/finances" element={<PrivateLayout><Finances /></PrivateLayout>} />
        <Route path="/community" element={<PrivateLayout><Community /></PrivateLayout>} />
        <Route path="/settings" element={<PrivateLayout><Settings /></PrivateLayout>} />
        <Route path="/campaign-managers" element={
          <PrivateLayout>
            <RoleGuard allow={['super_admin','SUPER_ADMIN']}>
              <CampaignManagersAdmin />
            </RoleGuard>
          </PrivateLayout>
        } />

        <Route path="*" element={<RoleDefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

function RoleDefaultRedirect() {
  const { isCampaignManager } = useAuth();
  return <Navigate to={isCampaignManager ? '/cm-dashboard' : '/'} replace />;
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
    width: '100%',
    overflowX: 'hidden',
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: '24px 24px 28px',
    transition: 'margin-left 0.18s ease, width 0.18s ease',
  },
  content: {
    width: '100%',
    minWidth: 0,
  },
};
