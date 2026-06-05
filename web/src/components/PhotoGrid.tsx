import { ImageIcon } from 'lucide-react';
import GlassCard from './GlassCard';

export interface PhotoItem {
  id: string;
  uri: string;
  thumbnail_url?: string;
  confidence?: number;
}

interface PhotoGridProps {
  photos: PhotoItem[];
  onPhotoPress?: (photo: PhotoItem, index: number) => void;
  showConfidence?: boolean;
  emptyMessage?: string;
}

export default function PhotoGrid({
  photos,
  onPhotoPress,
  showConfidence = false,
  emptyMessage = 'No photos yet',
}: PhotoGridProps) {
  const getBadgeColor = (confidence: number) => {
    const percent = Math.round(confidence * 100);
    if (percent >= 90) return { text: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.2)' };
    if (percent >= 70) return { text: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.15)' };
    if (percent >= 50) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.2)' };
    return { text: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.2)' };
  };

  if (photos.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIconWrapper}>
          <ImageIcon size={32} style={{ color: 'var(--text-muted)' }} />
        </div>
        <p style={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {photos.map((photo, index) => {
        const hasConfidence = showConfidence && photo.confidence !== undefined;
        const badge = hasConfidence ? getBadgeColor(photo.confidence!) : null;
        
        return (
          <GlassCard
            key={photo.id}
            padding="none"
            interactive
            onClick={() => onPhotoPress?.(photo, index)}
            style={styles.gridItem}
            className="animate-fade-in"
          >
            <img
              src={photo.thumbnail_url || photo.uri}
              alt="Event Photo"
              style={styles.gridImage}
              loading="lazy"
            />
            
            {/* Confidence Badge Overlay */}
            {hasConfidence && badge && (
              <div
                style={{
                  ...styles.badge,
                  backgroundColor: badge.bg,
                  borderColor: badge.border,
                  color: badge.text,
                }}
              >
                <div style={{ ...styles.badgeDot, backgroundColor: badge.text }} />
                <span>{Math.round(photo.confidence! * 100)}% Match</span>
              </div>
            )}

            {/* Subtle hover gradient bottom overlay */}
            <div style={styles.hoverOverlay} />
          </GlassCard>
        );
      })}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    width: '100%',
  },
  gridItem: {
    height: '200px',
    overflow: 'hidden',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--border-radius-md)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transition: 'transform var(--transition-normal)',
  },
  badge: {
    position: 'absolute' as const,
    top: '12px',
    left: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--border-radius-full)',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid transparent',
    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(4px)',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  hoverOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
    pointerEvents: 'none' as const,
    opacity: 0,
    transition: 'opacity var(--transition-fast)',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center' as const,
    background: 'rgba(255,255,255,0.01)',
    border: '1px dashed var(--glass-border)',
    borderRadius: 'var(--border-radius-lg)',
  },
  emptyIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
  },
};
