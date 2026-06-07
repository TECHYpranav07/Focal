import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Key, Copy, Users, Image as ImageIcon, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useEvents, useCreateEvent, useJoinEvent } from '../hooks/useEvents';
import { useAuthContext } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';

export default function Dashboard() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: events, isLoading, refetch } = useEvents();
  const { mutateAsync: createEvent } = useCreateEvent();
  const { mutateAsync: joinEvent } = useJoinEvent();

  // Modal States
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isJoinOpen, setJoinOpen] = useState(false);
  
  // Create Form State
  const [eventName, setEventName] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [createdEvent, setCreatedEvent] = useState<{ id: string; invite_code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Join Form State
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await createEvent({ name: eventName, description: eventDesc });
      setCreatedEvent({ id: response.id, invite_code: response.invite_code });
      refetch();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdEvent) {
      navigator.clipboard.writeText(createdEvent.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length !== 6) return;
    setJoinLoading(true);
    setJoinError(null);

    try {
      const response = await joinEvent(joinCode.toUpperCase());
      setJoinOpen(false);
      setJoinCode('');
      navigate(`/event/${response.event.id}`);
    } catch (err: any) {
      setJoinError(err.response?.data?.detail || 'Failed to join event. Check the code.');
    } finally {
      setJoinLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <span className="badge" style={{ backgroundColor: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--accent-cyan)' }}>
            <Clock size={12} style={{ animation: 'spin 4s linear infinite' }} /> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="badge" style={{ backgroundColor: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)', color: 'var(--accent-purple)' }}>
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      default:
        return (
          <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success)' }}>
            <Sparkles size={12} /> Active
          </span>
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Welcome Bar */}
      <div style={styles.header}>
        <div>
          <span style={styles.greeting}>Welcome back,</span>
          <h2 style={styles.username}>{user?.username}</h2>
        </div>

        {/* Quick Actions */}
        <div style={styles.quickActions}>
          <button onClick={() => setJoinOpen(true)} className="btn btn-outline">
            <Key size={16} />
            <span>Join Event</span>
          </button>

          <button onClick={() => setCreateOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <h3 style={styles.sectionTitle}>Your Events</h3>

      {isLoading ? (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner} />
          <span>Fetching events...</span>
        </div>
      ) : events && events.length > 0 ? (
        <div style={styles.grid}>
          {events.map((event) => (
            <GlassCard
              key={event.id}
              interactive
              onClick={() => navigate(`/event/${event.id}`)}
              style={styles.card}
              className="animate-slide-up"
            >
              <div style={styles.cardHeader}>
                <h4 style={styles.cardName}>{event.name}</h4>
                {getStatusBadge(event.status)}
              </div>
              
              <p style={styles.cardDesc}>
                {event.description || 'No description provided.'}
              </p>

              <div style={styles.cardFooter}>
                <div style={styles.cardStat}>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{event.member_count} {event.member_count === 1 ? 'member' : 'members'}</span>
                </div>
                <div style={styles.cardStat}>
                  <ImageIcon size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{event.photo_count} {event.photo_count === 1 ? 'photo' : 'photos'}</span>
                </div>
              </div>

              {Number(event.host_id) === Number(user?.id) && <span style={styles.hostIndicator}>★ Host</span>}
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard padding="xl" style={styles.emptyStateCard} className="animate-fade-in">
          <span style={styles.emptyStateIcon}>🎉</span>
          <h4 style={styles.emptyStateTitle}>Host your first event</h4>
          <p style={styles.emptyStateDesc}>
            Create a shared event space, invite your friends with a code, and let Focal automatically distribute matched photos to everyone!
          </p>
          <button onClick={() => setCreateOpen(true)} className="btn btn-primary" style={{ marginTop: '16px' }}>
            <Plus size={16} /> Create Event
          </button>
        </GlassCard>
      )}

      {/* --- CREATE EVENT MODAL --- */}
      {isCreateOpen && (
        <div style={styles.modalOverlay}>
          <GlassCard padding="xl" style={styles.modalContent} className="animate-slide-up">
            {!createdEvent ? (
              <form onSubmit={handleCreateSubmit} style={styles.modalForm}>
                <h3 style={styles.modalTitle}>Host New Event</h3>
                <p style={styles.modalSubtitle}>Create a space to aggregate and sort photos</p>
                
                {createError && <div style={styles.modalError}>{createError}</div>}

                <Input
                  label="EVENT NAME"
                  placeholder="e.g. Goa Trip 2026, Birthday Reunion"
                  value={eventName}
                  onChange={(e) => {
                    setEventName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  required
                  autoFocus
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <label className="input-label">DESCRIPTION (OPTIONAL)</label>
                  <textarea
                    placeholder="Provide description..."
                    className="form-input"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                  />
                </div>

                <div style={styles.modalFooterActions}>
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="btn btn-ghost"
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createLoading || !eventName.trim()}
                  >
                    {createLoading ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={styles.successReveal}>
                <span style={styles.successRevealIcon}>🎉</span>
                <h3 style={styles.successRevealTitle}>Event Successfully Hosted!</h3>
                <p style={styles.successRevealSubtitle}>
                  Share this 6-character code with your friends to let them join
                </p>

                <div style={styles.revealCodeBox}>
                  <span style={styles.revealCodeLabel}>INVITE CODE</span>
                  <span style={styles.revealCode}>{createdEvent.invite_code}</span>
                  <button onClick={handleCopyCode} style={styles.revealCopyButton}>
                    <Copy size={14} />
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCreateOpen(false);
                    setCreatedEvent(null);
                    setEventName('');
                    setEventDesc('');
                    navigate(`/event/${createdEvent.id}`);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '46px' }}
                >
                  Enter Event Room
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* --- JOIN EVENT MODAL --- */}
      {isJoinOpen && (
        <div style={styles.modalOverlay}>
          <GlassCard padding="xl" style={styles.modalContent} className="animate-slide-up">
            <form onSubmit={handleJoinSubmit} style={styles.modalForm}>
              <h3 style={styles.modalTitle}>Join Event Room</h3>
              <p style={styles.modalSubtitle}>Enter the 6-character code shared by your friend</p>
              
              {joinError && <div style={styles.modalError}>{joinError}</div>}

              <Input
                label="INVITE CODE"
                placeholder="e.g. ABC123"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                  if (joinError) setJoinError(null);
                }}
                maxLength={6}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px', textTransform: 'uppercase' }}
              />

              <div style={styles.modalFooterActions}>
                <button
                  type="button"
                  onClick={() => { setJoinOpen(false); setJoinCode(''); }}
                  className="btn btn-ghost"
                  disabled={joinLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={joinLoading || joinCode.length !== 6}
                >
                  {joinLoading ? 'Joining...' : 'Join Event'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
  },
  greeting: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  username: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: '2px',
  },
  quickActions: {
    display: 'flex',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '20px',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '12px',
    color: 'var(--text-secondary)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255,255,255,0.05)',
    borderTopColor: 'var(--accent-purple)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  card: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    minHeight: '180px',
    border: '1px solid var(--glass-border)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  },
  cardName: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '70%',
  },
  cardDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '20px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '20px',
    height: '40px',
  },
  cardFooter: {
    display: 'flex',
    gap: '16px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.02)',
  },
  cardStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  hostIndicator: {
    position: 'absolute' as const,
    top: '-10px',
    right: '24px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--accent-purple)',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    border: '1px solid rgba(124, 58, 237, 0.25)',
    padding: '2px 8px',
    borderRadius: 'var(--border-radius-full)',
  },
  emptyStateCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    maxWidth: '500px',
    margin: '40px auto 0',
  },
  emptyStateIcon: {
    fontSize: '54px',
    marginBottom: '16px',
  },
  emptyStateTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  emptyStateDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '22px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '24px',
    backdropFilter: 'blur(8px)',
  },
  modalContent: {
    width: '100%',
    maxWidth: '440px',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    width: '100%',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
  },
  modalSubtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    marginTop: '-12px',
    marginBottom: '8px',
  },
  modalError: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: 'var(--error)',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '13px',
    textAlign: 'center' as const,
  },
  modalFooterActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  successReveal: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    width: '100%',
  },
  successRevealIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  successRevealTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  successRevealSubtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '6px',
    marginBottom: '24px',
    lineHeight: '20px',
  },
  revealCodeBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    width: '100%',
    padding: '24px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px dashed var(--glass-border)',
    borderRadius: 'var(--border-radius-lg)',
    marginBottom: '28px',
    gap: '8px',
  },
  revealCodeLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '1px',
  },
  revealCode: {
    fontSize: '36px',
    fontWeight: 800,
    color: 'var(--accent-purple)',
    letterSpacing: '4px',
  },
  revealCopyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: 'var(--border-radius-full)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    marginTop: '8px',
    transition: 'all var(--transition-fast)',
  },
};
