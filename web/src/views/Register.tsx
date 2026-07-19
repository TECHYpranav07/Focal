import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, User as UserIcon, ArrowRight, Sparkles, Image, ShieldCheck } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Choose another username/email.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Branding Side (Desktop only) */}
      <div className="auth-brand-side">
        <div style={styles.brandOverlay} />
        <div style={styles.brandContent}>
          <div style={styles.logoBadge}>
            <span style={styles.logoEmoji}>📸</span>
            <span style={styles.logoText}>Focal AI</span>
          </div>
          
          <div style={styles.heroTextSection}>
            <h1 style={styles.heroTitle}>
              Your Event Photos, <br />
              <span style={{ color: 'var(--accent-amber)' }}>Sorted Instantly.</span>
            </h1>
            <p style={styles.heroDescription}>
              Upload group photos and let our state-of-the-art face recognition deliver personalized galleries directly to each of your guests. Secure, private, and automated.
            </p>
          </div>

          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <div style={styles.featureIconWrapper}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={styles.featureTitle}>ArcFace & RetinaFace</h3>
                <p style={styles.featureDesc}>Industry-standard recognition models with high accuracy.</p>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIconWrapper}>
                <Image size={18} />
              </div>
              <div>
                <h3 style={styles.featureTitle}>Clothing-Boosted Matching</h3>
                <p style={styles.featureDesc}>Smart torso clothing signatures helper logic for tricky group angles.</p>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIconWrapper}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 style={styles.featureTitle}>Privacy First</h3>
                <p style={styles.featureDesc}>Secure, auth-gated endpoints protect files from unauthorized access.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Register Form Side */}
      <div className="auth-form-side">
        <div className="auth-mobile-logo">
          <span style={{ fontSize: '24px' }}>✨</span>
          <h1 className="gradient-text" style={{ fontSize: '24px', fontWeight: 800 }}>Focal</h1>
        </div>

        <div style={styles.formCenterWrapper}>
          <GlassCard padding="xl" style={styles.card}>
            <h2 style={styles.cardTitle}>Create Account</h2>
            <p style={styles.cardSubtitle}>Start distributing your group photos automatically</p>

            {error && <div style={styles.errorBanner}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fields}>
                <div className="input-container">
                  <label className="input-label">USERNAME</label>
                  <div style={styles.inputWrapper}>
                    <UserIcon size={16} style={styles.fieldIcon} />
                    <input
                      type="text"
                      placeholder="Choose a username"
                      className="form-input"
                      style={{ paddingLeft: '44px' }}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Create a password (min 6 chars)"
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

                <div className="input-container">
                  <label className="input-label">CONFIRM PASSWORD</label>
                  <div style={styles.inputWrapper}>
                    <KeyRound size={16} style={styles.fieldIcon} />
                    <input
                      type="password"
                      placeholder="Re-enter your password"
                      className="form-input"
                      style={{ paddingLeft: '44px' }}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
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
                {loading ? 'Creating Account...' : 'Get Started'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          </GlassCard>

          <p style={styles.switchText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.switchLink}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  brandOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, transparent 100%)',
    pointerEvents: 'none' as const,
  },
  brandContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  logoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--border-radius-full)',
    padding: '6px 14px',
    width: 'fit-content',
  },
  logoEmoji: {
    fontSize: '16px',
  },
  logoText: {
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '-0.3px',
    color: 'var(--text-primary)',
  },
  heroTextSection: {
    marginTop: '40px',
    marginBottom: '40px',
  },
  heroTitle: {
    fontSize: '44px',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-1.5px',
    color: 'var(--text-primary)',
  },
  heroDescription: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginTop: '16px',
    maxWidth: '480px',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  featureItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  featureIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    color: 'var(--accent-amber)',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  featureDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  formCenterWrapper: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(21, 29, 48, 0.4)',
    border: '1px solid var(--card-border)',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
  },
  cardSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    marginTop: '4px',
    marginBottom: '24px',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--error)',
    padding: '10px 14px',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  fields: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '24px',
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
    height: '42px',
  },
  switchText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
  },
  switchLink: {
    color: 'var(--accent-amber)',
    fontWeight: 600,
    textDecoration: 'none',
    marginLeft: '4px',
  },
};
