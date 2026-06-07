import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Incorrect credentials');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glowBg} />

      <AnimatedForm entering="animate-slide-up" onSubmit={handleSubmit} style={styles.formWrapper}>
        {/* Brand Logo */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>✨</span>
          <h1 className="gradient-text" style={styles.brandName}>Focal</h1>
        </div>

        <GlassCard padding="xl" showSheen style={styles.card}>
          <h2 style={styles.cardTitle}>Sign In</h2>
          <p style={styles.cardSubtitle}>Unlock your personal photo galleries instantly</p>

          {error && <div style={styles.errorBanner}>{error}</div>}

          <div style={styles.fields}>
            <div className="input-container">
              <label className="input-label">EMAIL ADDRESS</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.fieldIcon} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                />
              </div>
            </div>

            <div className="input-container">
              <label className="input-label">PASSWORD</label>
              <div style={styles.inputWrapper}>
                <KeyRound size={16} style={styles.fieldIcon} />
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </GlassCard>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.switchLink}>
            Create one free
          </Link>
        </p>
      </AnimatedForm>
    </div>
  );
}

// Wrapper to standard form to bind custom classes
function AnimatedForm({ children, className = '', ...props }: any) {
  return (
    <form className={`${className}`} {...props}>
      {children}
    </form>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '24px',
    position: 'relative' as const,
  },
  glowBg: {
    position: 'absolute' as const,
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none' as const,
  },
  formWrapper: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    zIndex: 1,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  brandIcon: {
    fontSize: '28px',
  },
  brandName: {
    fontSize: '28px',
    fontWeight: 900,
    letterSpacing: '-1px',
  },
  card: {
    width: '100%',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
  },
  cardSubtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    marginTop: '6px',
    marginBottom: '28px',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--error)',
    padding: '10px 16px',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  fields: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
    marginBottom: '28px',
  },
  inputWrapper: {
    position: 'relative' as const,
    width: '100%',
  },
  fieldIcon: {
    position: 'absolute' as const,
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  submitBtn: {
    width: '100%',
    height: '46px',
  },
  switchText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
  },
  switchLink: {
    color: 'var(--accent-purple)',
    fontWeight: 600,
    textDecoration: 'none',
    marginLeft: '4px',
  },
};
