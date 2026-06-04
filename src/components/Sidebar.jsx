import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const adminSections = [
  {
    label: 'Workspace',
    links: [
      { to: '/', label: 'Dashboard', icon: 'DB' },
      { to: '/campaigns', label: 'Campaigns', icon: 'CP' },
      { to: '/jobs', label: 'Job Board', icon: 'JB' },
      { to: '/submissions', label: 'Submissions', icon: 'SB' },
    ],
  },
  {
    label: 'People',
    links: [
      { to: '/users', label: 'Users', icon: 'US' },
      { to: '/creators', label: 'Creators', icon: 'CR' },
      { to: '/business-verifications', label: 'Business Verification', icon: 'BV' },
    ],
  },
  {
    label: 'Operations',
    links: [
      { to: '/finances', label: 'Finances', icon: 'FN' },
      { to: '/community', label: 'Community', icon: 'CM' },
    ],
  },
];

const superAdminSection = {
  label: 'Admin',
  links: [
    { to: '/campaign-managers', label: 'Campaign Managers', icon: 'MG' },
    { to: '/pending-deletions', label: 'Pending Deletions', icon: 'PD' },
  ],
};

const managerSections = [
  {
    label: 'Workspace',
    links: [{ to: '/cm-dashboard', label: 'My Dashboard', icon: 'DB' }],
  },
];

export default function Sidebar({ collapsed = false, onToggle }) {
  const navigate = useNavigate();
  const { role, isSuperAdmin, isCampaignManager, user } = useAuth();

  const effectivelyAdmin = !role || isSuperAdmin;
  const sections = isCampaignManager
    ? managerSections
    : [...adminSections, ...(effectivelyAdmin ? [superAdminSection] : [])];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <aside style={{ ...styles.sidebar, width: collapsed ? '82px' : '236px' }}>
      <div style={styles.top}>
        <div style={{ ...styles.logo, ...(collapsed ? styles.logoCollapsed : {}) }}>
          <img src="social-gems-fn-200.png" alt="Social Gems" style={styles.logoImage} />
          {!collapsed && (
            <>
              <span style={styles.logoText}>Social Gems</span>
              <span style={styles.logoSub}>{isCampaignManager ? 'Campaign Manager' : 'Admin Panel'}</span>
              {user?.first_name && (
                <span style={styles.userName}>{user.first_name} {user.last_name}</span>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={styles.toggle}
          onClick={onToggle}
        >
          {collapsed ? '>>' : '<<'}
        </button>

        <nav style={styles.nav}>
          {sections.map((section) => (
            <div key={section.label} style={styles.section}>
              {!collapsed && <div style={styles.sectionLabel}>{section.label}</div>}
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/' || link.to === '/cm-dashboard'}
                  title={collapsed ? link.label : undefined}
                  style={({ isActive }) => ({
                    ...styles.link,
                    ...(collapsed ? styles.linkCollapsed : {}),
                    ...(isActive ? styles.activeLink : {}),
                  })}
                >
                  <span style={{ ...styles.linkIcon, ...(collapsed ? styles.linkIconCollapsed : {}) }}>
                    {link.icon}
                  </span>
                  {!collapsed && <span style={styles.linkText}>{link.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <button style={{ ...styles.logout, ...(collapsed ? styles.logoutCollapsed : {}) }} onClick={handleLogout}>
        <span style={styles.linkIcon}>LO</span>
        {!collapsed && 'Logout'}
      </button>
    </aside>
  );
}

const styles = {
  sidebar: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #6f481d 0%, #4f3518 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '18px 12px',
    position: 'fixed',
    top: 0,
    left: 0,
    boxShadow: '4px 0 22px rgba(37, 24, 10, 0.18)',
    zIndex: 100,
    transition: 'width 0.18s ease',
    overflow: 'hidden',
  },
  top: { minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 },
  logo: {
    padding: '0 8px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    marginBottom: '12px',
    textAlign: 'left',
  },
  logoCollapsed: { textAlign: 'center', padding: '0 0 14px' },
  logoImage: { height: '42px', width: 'auto', marginBottom: '8px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' },
  logoText: { display: 'block', color: '#F9D769', fontWeight: '800', fontSize: '18px', letterSpacing: '0' },
  logoSub: { color: 'rgba(255,255,255,0.64)', fontSize: '12px', marginTop: '2px', display: 'block' },
  userName: { display: 'block', color: 'rgba(255,255,255,0.88)', fontSize: '12px', marginTop: '6px', fontWeight: '600' },
  toggle: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.08)',
    color: '#F9D769',
    borderRadius: '8px',
    padding: '7px 8px',
    cursor: 'pointer',
    fontWeight: '800',
    marginBottom: '14px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto',
    overflowX: 'hidden',
    minHeight: 0,
    paddingRight: '2px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(249, 215, 105, 0.55) transparent',
  },
  section: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sectionLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: '11px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0 10px 4px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minHeight: '38px',
    padding: '8px 10px',
    color: 'rgba(255,255,255,0.82)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '650',
    borderRadius: '9px',
    border: '1px solid transparent',
    transition: 'background 0.16s ease, color 0.16s ease, border-color 0.16s ease',
  },
  linkCollapsed: { justifyContent: 'center', padding: '8px 0' },
  linkIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    width: '28px',
    height: '26px',
    borderRadius: '7px',
    fontWeight: '900',
    letterSpacing: '0',
    background: 'rgba(255,255,255,0.09)',
    color: '#F9D769',
    flex: '0 0 auto',
  },
  linkIconCollapsed: { width: '34px', height: '32px' },
  linkText: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  activeLink: {
    color: '#fff',
    background: 'rgba(249, 215, 105, 0.16)',
    borderColor: 'rgba(249, 215, 105, 0.28)',
  },
  logout: {
    flex: '0 0 auto',
    marginTop: '14px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    justifyContent: 'center',
    transition: 'all 0.16s ease',
    fontWeight: '700',
  },
  logoutCollapsed: { padding: '10px 0' },
};
