import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Campaigns from './pages/Campaigns';
import Creators from './pages/Creators';
import Jobs from './pages/Jobs';
import Sidebar from './components/Sidebar';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/users" element={<PrivateLayout><Users /></PrivateLayout>} />
        <Route path="/campaigns" element={<PrivateLayout><Campaigns /></PrivateLayout>} />
        <Route path="/creators" element={<PrivateLayout><Creators /></PrivateLayout>} />
        <Route path="/jobs" element={<PrivateLayout><Jobs /></PrivateLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
