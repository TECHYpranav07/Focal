import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Image, LayoutGrid } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>✨</span>
          <span className="gradient-text" style={styles.logoText}>Focal</span>
        </Link>

        {/* Navigation Links */}
        <nav style={styles.nav}>
          <Link
            to="/"
            style={{
              ...styles.navLink,
              ...(isActive('/') && styles.navLinkActive),
            }}
          >
            <LayoutGrid size={16} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/gallery"
            style={{
              ...styles.navLink,
              ...(isActive('/gallery') && styles.navLinkActive),
            }}
          >
            <Image size={16} />
            <span>Galleries</span>
          </Link>
        </nav>

        {/* User profile / Log out */}
        <div style={styles.userSection}>
          <div style={styles.profileBadge}>
            <div style={styles.avatar}>
              {user.username[0].toUpperCase()}
            </div>
            <span style={styles.username}>{user.username}</span>
          </div>

          <button onClick={handleLogout} style={styles.logoutButton} title="Sign Out">
            <LogOut size={16} />
            <span style={styles.logoutText}>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(7, 7, 10, 0.8)',
    borderBottom: '1px solid var(--glass-border)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 24px',
    height: '70px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: '20px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: 'var(--border-radius-full)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  },
  navLinkActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: 'var(--border-radius-full)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border)',
  },
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    border: '1px solid rgba(124, 58, 237, 0.3)',
    color: 'var(--accent-purple)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
  },
  username: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  },
  logoutText: {
    display: 'inline',
  },
};
