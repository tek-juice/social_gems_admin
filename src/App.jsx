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
import Sidebar from './components/Sidebar';
import { useAuth } from './hooks/useAuth';

function PrivateLayout({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main style={{ marginLeft: '260px', flex: 1, padding: '16px', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
}

function RoleGuard({ allow, children }) {
  const { role } = useAuth();
  const allowed = Array.isArray(allow) ? allow : [allow];
  const normalised = role?.toLowerCase();
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

        {/* Super Admin / Admin only pages */}
        <Route path="/" element={
          <PrivateLayout>
            <RoleGuard allow={['super_admin','SUPER_ADMIN','admin','ADMIN']}>
              <Dashboard />
            </RoleGuard>
          </PrivateLayout>
        } />
        <Route path="/users" element={<PrivateLayout><Users /></PrivateLayout>} />
        <Route path="/campaigns" element={<PrivateLayout><Campaigns /></PrivateLayout>} />
        <Route path="/creators" element={<PrivateLayout><Creators /></PrivateLayout>} />
        <Route path="/jobs" element={<PrivateLayout><Jobs /></PrivateLayout>} />
        <Route path="/submissions" element={<PrivateLayout><Submissions /></PrivateLayout>} />
        <Route path="/finances" element={<PrivateLayout><Finances /></PrivateLayout>} />
        <Route path="/community" element={<PrivateLayout><Community /></PrivateLayout>} />
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
