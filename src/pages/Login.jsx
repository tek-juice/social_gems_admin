import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/admin';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      const data = res.data?.data;
      // Normal login
      const token = data?.jwt || data?.token || res.data?.token;
      // Temporary password login (202)
      const tempToken = data?.temporary_token;
      if (token) {
        localStorage.setItem('admin_token', token);
        navigate('/');
      } else if (tempToken) {
        localStorage.setItem('admin_token', tempToken);
        navigate('/');
      } else {
        setError('Invalid credentials');
      }
    } catch {
      setError('Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundOverlay}></div>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img 
            src="/social-gems-fn-200.png" 
            alt="Social Gems Logo" 
            style={styles.logo}
          />
          <h1 style={styles.title}>Social Gems Admin</h1>
          <p style={styles.subtitle}>Welcome back! Please sign in to continue.</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              style={{
                ...styles.input,
                ...(focusedField === 'email' ? styles.inputFocus : {}),
                ...(error ? styles.inputError : {})
              }}
              type="email"
              placeholder="admin@socialgems.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
            />
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                style={{
                  ...styles.input,
                  ...styles.passwordInput,
                  ...(focusedField === 'password' ? styles.inputFocus : {}),
                  ...(error ? styles.inputError : {})
                }}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
              />
              <button 
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>
          
          {error && (
            <div style={styles.errorContainer}>
              <span style={styles.errorIcon}>⚠️</span>
              <p style={styles.error}>{error}</p>
            </div>
          )}
          
          <button 
            style={{
              ...styles.button,
              ...(loading ? styles.buttonLoading : {})
            }} 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loadingText}>
                <span style={styles.spinner}></span>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p style={styles.footerText}>© 2026 Social Gems. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: 'linear-gradient(135deg, #734D20 0%, #F9D769 50%, #734D20 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    padding: '0'
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 80%, rgba(249, 215, 105, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(115, 77, 32, 0.2) 0%, transparent 50%)',
    pointerEvents: 'none'
  },
  card: { 
    background: 'rgba(255, 255, 255, 0.95)', 
    backdropFilter: 'blur(10px)',
    padding: '40px 32px', 
    borderRadius: '20px', 
    boxShadow: '0 25px 60px -12px rgba(115, 77, 32, 0.35), 0 8px 25px -5px rgba(0, 0, 0, 0.1)', 
    width: '420px',
    position: 'relative',
    zIndex: 10
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logo: {
    height: '80px',
    width: 'auto',
    marginBottom: '16px',
    filter: 'drop-shadow(0 4px 6px rgba(115, 77, 32, 0.2))'
  },
  title: { 
    margin: '0 0 8px 0', 
    color: '#734D20',
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: 0,
    color: '#6B7280',
    fontSize: '15px',
    fontWeight: '400'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  field: { 
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: { 
    fontWeight: '600', 
    fontSize: '14px', 
    color: '#374151'
  },
  input: { 
    width: '100%', 
    padding: '14px 16px', 
    borderRadius: '12px', 
    border: '2px solid #E5E7EB', 
    fontSize: '15px', 
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: '#F9FAFB'
  },
  inputFocus: {
    borderColor: '#F9D769',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 0 4px rgba(249, 215, 105, 0.15)'
  },
  inputError: {
    borderColor: '#EF4444'
  },
  passwordContainer: {
    position: 'relative',
    width: '100%'
  },
  passwordInput: {
    paddingRight: '50px'
  },
  passwordToggle: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s ease'
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #FECACA'
  },
  errorIcon: {
    fontSize: '16px'
  },
  error: { 
    color: '#DC2626', 
    fontSize: '14px', 
    margin: 0,
    fontWeight: '500'
  },
  button: { 
    width: '100%', 
    padding: '16px', 
    background: 'linear-gradient(135deg, #734D20 0%, #8B5A2B 100%)', 
    color: '#FFFFFF', 
    border: 'none', 
    borderRadius: '12px', 
    fontSize: '16px', 
    fontWeight: '700', 
    cursor: 'pointer', 
    marginTop: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px 0 rgba(115, 77, 32, 0.4)'
  },
  buttonLoading: {
    opacity: 0.8,
    cursor: 'not-allowed'
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '12px',
    color: '#9CA3AF',
    margin: 0
  }
};

// Add keyframes animation
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
