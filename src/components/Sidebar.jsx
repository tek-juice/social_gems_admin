import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/campaigns', label: 'Campaigns' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  return (
    <div style={styles.sidebar}>
      <div>
        <div style={styles.logo}>
          <span style={styles.logoText}>SocialGems</span>
          <span style={styles.logoSub}>Admin</span>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <button style={styles.logout} onClick={handleLogout}>Logout</button>
    </div>
  );
}

const styles = {
  sidebar: { width: '220px', minHeight: '100vh', background: '#734D20', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 0', position: 'fixed', top: 0, left: 0 },
  logo: { padding: '0 20px 28px', borderBottom: '1px solid rgba(255,255,255,0.15)', marginBottom: '16px' },
  logoText: { display: 'block', color: '#F9D769', fontWeight: '800', fontSize: '18px' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: '12px' },
  link: { display: 'block', padding: '12px 20px', color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '14px', fontWeight: '500', borderLeft: '3px solid transparent' },
  activeLink: { color: '#F9D769', background: 'rgba(255,255,255,0.1)', borderLeft: '3px solid #F9D769' },
  logout: { margin: '0 16px', padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
};
