import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const adminLinks = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/creators', label: 'Creators', icon: '✨' },
  { to: '/campaigns', label: 'Campaigns', icon: '📢' },
  { to: '/jobs', label: 'Job Board', icon: '💼' },
  { to: '/submissions', label: 'Submissions', icon: '📝' },
  { to: '/finances', label: 'Finances', icon: '💰' },
  { to: '/community', label: 'Community', icon: '💬' },
];

const superAdminExtra = [
  { to: '/campaign-managers', label: 'Campaign Managers', icon: '🎯' },
];

const managerLinks = [
  { to: '/cm-dashboard', label: 'My Dashboard', icon: '📊' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { isSuperAdmin, isCampaignManager, user } = useAuth();

  // If role is empty (legacy session pre-role-storage), treat as super_admin in the UI
  const effectivelyAdmin = !role || isSuperAdmin;
  const links = isCampaignManager
    ? managerLinks
    : [...adminLinks, ...(effectivelyAdmin ? superAdminExtra : [])];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <div style={styles.sidebar}>
      <div>
        <div style={styles.logo}>
          <img src="social-gems-fn-200.png" alt="Social Gems" style={styles.logoImage} />
          <span style={styles.logoText}>Social Gems</span>
          <span style={styles.logoSub}>
            {isCampaignManager ? 'Campaign Manager' : 'Admin Panel'}
          </span>
          {user?.first_name && (
            <span style={styles.userName}>{user.first_name} {user.last_name}</span>
          )}
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/cm-dashboard'}
              style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
            >
              <span style={styles.linkIcon}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <button style={styles.logout} onClick={handleLogout}>
        <span style={styles.linkIcon}>🚪</span>
        Logout
      </button>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #734D20 0%, #5C3D19 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 0',
    position: 'fixed',
    top: 0,
    left: 0,
    boxShadow: '4px 0 20px rgba(115, 77, 32, 0.15)',
    zIndex: 100
  },
  logo: {
    padding: '0 24px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '24px',
    textAlign: 'center'
  },
  logoImage: { height: '50px', width: 'auto', marginBottom: '12px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' },
  logoText: { display: 'block', color: '#F9D769', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.3px' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px', display: 'block' },
  userName: { display: 'block', color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginTop: '6px', fontWeight: '500' },
  link: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px',
    color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '15px',
    fontWeight: '500', borderLeft: '3px solid transparent', transition: 'all 0.2s ease'
  },
  linkIcon: { fontSize: '18px', width: '24px' },
  activeLink: { color: '#F9D769', background: 'rgba(255,255,255,0.1)', borderLeft: '3px solid #F9D769' },
  logout: {
    margin: '0 16px 16px', padding: '14px', background: 'rgba(255,255,255,0.1)',
    color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer',
    fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px',
    justifyContent: 'center', transition: 'all 0.2s ease', fontWeight: '500'
  },
};
