import { useState, useEffect } from 'react';
import { Info, Download, X } from 'lucide-react';
import axios from 'axios';
import { useEvents } from '../hooks/useEvents';
import { useGallery } from '../hooks/usePhotos';
import type { GalleryPhoto } from '../hooks/usePhotos';
import { useAppStore } from '../store/useAppStore';
import GlassCard from '../components/GlassCard';
import PhotoGrid from '../components/PhotoGrid';
import { API_ENDPOINTS } from '../constants/api';

export default function PersonalGallery() {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const activeEventId = useAppStore((s) => s.activeEventId);
  const setActiveEventId = useAppStore((s) => s.setActiveEventId);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Lightbox overlay state
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [hoveredFaceId, setHoveredFaceId] = useState<number | null>(null);

  // Synchronize selection
  useEffect(() => {
    if (activeEventId) {
      setSelectedEventId(activeEventId);
    } else if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
      setActiveEventId(events[0].id);
    }
  }, [events, activeEventId]);

  const { data: photos, isLoading: photosLoading } = useGallery(selectedEventId || '');

  // Handle window resizing for responsive bounding boxes
  useEffect(() => {
    const handleResize = () => {
      const img = document.getElementById('gallery-lightbox-image') as HTMLImageElement;
      if (img) {
        setDisplaySize({
          width: img.clientWidth,
          height: img.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedPhoto]);

  // Keep selected photo data fresh if photos query updates
  useEffect(() => {
    if (selectedPhoto && photos) {
      const updated = photos.find(p => p.id === selectedPhoto.id);
      if (updated) {
        setSelectedPhoto(updated);
      }
    }
  }, [photos, selectedPhoto?.id]);

  const handleEventChange = (id: string) => {
    setSelectedEventId(id);
    setActiveEventId(id);
  };

  const handlePhotoPress = (photo: GalleryPhoto) => {
    setSelectedPhoto(photo);
  };

  const handleClosePhotoDetail = () => {
    setSelectedPhoto(null);
    setNaturalSize({ width: 0, height: 0 });
    setDisplaySize({ width: 0, height: 0 });
    setHoveredFaceId(null);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setDisplaySize({
      width: img.clientWidth,
      height: img.clientHeight,
    });
  };

  const handleDownloadAll = async () => {
    if (!selectedEventId) return;
    setDownloadingZip(true);
    try {
      const response = await axios.get(API_ENDPOINTS.GALLERY_DOWNLOAD(selectedEventId), {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `focal_gallery_${selectedEventId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download ZIP archive:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Your Personal Gallery</h2>
          <p style={styles.subtitle}>Photos matching your registered face</p>
        </div>

        {photos && photos.length > 0 && (
          <button 
            onClick={handleDownloadAll} 
            className="btn btn-accent" 
            style={{ gap: '8px' }}
            disabled={downloadingZip}
          >
            <Download size={16} />
            <span>{downloadingZip ? 'Generating ZIP...' : 'Download All'}</span>
          </button>
        )}
      </div>

      {/* Selector Slider */}
      {events && events.length > 0 && (
        <div style={styles.selectorWrapper} className="animate-fade-in">
          <span style={styles.selectorLabel}>SELECT EVENT ROOM</span>
          <div style={styles.selectorList}>
            {events.map((event) => {
              const isSelected = event.id === selectedEventId;
              return (
                <button
                  key={event.id}
                  onClick={() => handleEventChange(event.id)}
                  style={{
                    ...styles.selectorItem,
                    ...(isSelected && styles.selectorItemActive),
                  }}
                >
                  {event.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div style={styles.content}>
        {eventsLoading ? (
          <div style={styles.loaderContainer}>
            <div style={styles.spinner} />
            <span>Fetching events...</span>
          </div>
        ) : !events || events.length === 0 ? (
          <GlassCard padding="xl" style={styles.emptyCard} className="animate-fade-in">
            <span style={styles.emptyIcon}>🖼️</span>
            <h4 style={styles.emptyTitle}>No Galleries Available</h4>
            <p style={styles.emptyDesc}>
              Join an event space, register your face with clear selfies, and wait for matching to start.
            </p>
          </GlassCard>
        ) : selectedEventId && photosLoading ? (
          <div style={styles.loaderContainer}>
            <div style={styles.spinner} />
            <span>AI scanning matching photos...</span>
          </div>
        ) : photos && photos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            {/* Accuracy helper banner */}
            <div style={styles.infoBanner}>
              <Info size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>
                Focal AI verified {photos.length} {photos.length === 1 ? 'photo' : 'photos'} of you using ArcFace matching.
              </span>
            </div>

            <PhotoGrid
              photos={photos}
              onPhotoPress={(p) => handlePhotoPress(p as GalleryPhoto)}
              showConfidence={true}
              emptyMessage="No matched photos found in this event."
            />
          </div>
        ) : (
          <GlassCard padding="xl" style={styles.emptyCard} className="animate-fade-in">
            <span style={styles.emptyIcon}>🔍</span>
            <h4 style={styles.emptyTitle}>No Matches Found</h4>
            <p style={styles.emptyDesc}>
              We couldn't find any photos matching your registered face in this event room.
              Make sure you have registered your selfies, and the host has clicked "Trigger Face Matching"!
            </p>
          </GlassCard>
        )}
      </div>

      {/* Matched Photo Advanced Lightbox with Face Overlays */}
      {selectedPhoto && (
        <div style={styles.lightboxOverlay} onClick={handleClosePhotoDetail}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.lightboxBody}>
              {/* Image side */}
              <div style={styles.lightboxImageContainer}>
                <img
                  id="gallery-lightbox-image"
                  src={selectedPhoto.uri}
                  alt="Matched detail"
                  onLoad={handleImageLoad}
                  style={styles.lightboxMainImage}
                />

                {/* Bounding box overlays */}
                {naturalSize.width > 0 && displaySize.width > 0 && selectedPhoto.faces?.map((face) => {
                  const scaleX = displaySize.width / naturalSize.width;
                  const scaleY = displaySize.height / naturalSize.height;

                  const left = face.bbox_x * scaleX;
                  const top = face.bbox_y * scaleY;
                  const width = face.bbox_w * scaleX;
                  const height = face.bbox_h * scaleY;

                  const isHovered = hoveredFaceId === face.id;
                  const isSoft = face.similarity_score !== null && face.similarity_score < 0.60;
                  
                  const borderCol = face.matched_username 
                    ? isSoft 
                      ? 'var(--accent-purple)' 
                      : 'var(--accent-cyan)' 
                    : 'var(--text-muted)';
                  
                  const bgCol = face.matched_username 
                    ? isSoft 
                      ? 'rgba(168, 85, 247, 0.15)' 
                      : 'rgba(6, 182, 212, 0.15)' 
                    : 'rgba(255, 255, 255, 0.05)';

                  return (
                    <div
                      key={face.id}
                      style={{
                        position: 'absolute',
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        border: `2px ${isHovered ? 'solid' : 'dashed'} ${borderCol}`,
                        backgroundColor: bgCol,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        zIndex: isHovered ? 100 : 10,
                        transition: 'all 0.15s ease-in-out',
                        boxShadow: isHovered ? `0 0 12px ${borderCol}` : 'none',
                      }}
                      onMouseEnter={() => setHoveredFaceId(face.id)}
                      onMouseLeave={() => setHoveredFaceId(null)}
                    >
                      {/* Name tag */}
                      {(isHovered || face.matched_username) && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%) translateY(-6px)',
                          backgroundColor: 'rgba(15, 12, 25, 0.95)',
                          border: `1px solid ${borderCol}`,
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: '#fff',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 110,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                        }}>
                          <span>{face.matched_username || 'Unknown Face'}</span>
                          {face.similarity_score !== null && (
                            <span style={{ 
                              color: isSoft ? 'var(--accent-purple)' : 'var(--accent-cyan)', 
                              fontSize: '9px',
                              fontWeight: 700 
                            }}>
                              {Math.round(face.similarity_score * 100)}% {isSoft ? '(Soft)' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sidebar side */}
              <div style={styles.lightboxSidebar}>
                <h4 style={styles.sidebarTitle}>Match Verification</h4>
                
                <div style={styles.sidebarSection}>
                  <span style={styles.detailLabel}>Match Status</span>
                  <span style={{ 
                    ...styles.detailValue,
                    color: 'var(--accent-cyan)',
                    fontWeight: 'bold'
                  }}>
                    VERIFIED
                  </span>
                </div>

                <div style={styles.sidebarSection}>
                  <span style={styles.detailLabel}>Confidence Score</span>
                  <span style={{ ...styles.detailValue, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {Math.round(selectedPhoto.confidence * 100)}% Match
                  </span>
                </div>

                <div style={{ ...styles.sidebarSection, flex: 1, overflowY: 'auto' }}>
                  <span style={styles.detailLabel}>Detected People</span>
                  <div style={styles.faceListContainer}>
                    {selectedPhoto.faces && selectedPhoto.faces.length > 0 ? (
                      selectedPhoto.faces.map((face) => {
                        const isHovered = hoveredFaceId === face.id;
                        const isSoft = face.similarity_score !== null && face.similarity_score < 0.60;
                        const borderCol = face.matched_username 
                          ? isSoft 
                            ? 'var(--accent-purple)' 
                            : 'var(--accent-cyan)' 
                          : 'var(--text-muted)';
                        const bgCol = face.matched_username 
                          ? isSoft 
                            ? 'rgba(168, 85, 247, 0.08)' 
                            : 'rgba(6, 182, 212, 0.08)' 
                          : 'rgba(255, 255, 255, 0.02)';

                        return (
                          <div 
                            key={face.id}
                            style={{
                              ...styles.faceListItem,
                              backgroundColor: bgCol,
                              borderColor: isHovered ? borderCol : 'var(--glass-border)',
                              transform: isHovered ? 'translateX(4px)' : 'none',
                            }}
                            onMouseEnter={() => setHoveredFaceId(face.id)}
                            onMouseLeave={() => setHoveredFaceId(null)}
                          >
                            <div style={{
                              ...styles.faceItemColorDot,
                              backgroundColor: borderCol,
                            }} />
                            <div style={{ flex: 1 }}>
                              <span style={styles.faceItemName}>
                                {face.matched_username || 'Unknown Face'}
                              </span>
                              {face.similarity_score !== null && (
                                <span style={styles.faceItemSub}>
                                  Similarity: {Math.round(face.similarity_score * 100)}% 
                                  {isSoft ? ' (Sunglasses / Soft Match)' : ' (Strict Match)'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <span style={styles.noFacesText}>No face scans found.</span>
                    )}
                  </div>
                </div>

                <div style={styles.lightboxActionsRow}>
                  <a
                    href={selectedPhoto.uri}
                    download={`focal_match.jpg`}
                    className="btn btn-accent"
                    style={{ flex: 1, gap: '8px', justifyContent: 'center', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={handleClosePhotoDetail}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Direct close button */}
            <button onClick={handleClosePhotoDetail} style={styles.lightboxCloseBtn}>
              <X size={20} />
            </button>
          </div>
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
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  selectorWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '32px',
  },
  selectorLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    paddingLeft: '4px',
  },
  selectorList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    width: '100%',
  },
  selectorItem: {
    padding: '8px 16px',
    borderRadius: 'var(--border-radius-full)',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(255,255,255,0.01)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  selectorItemActive: {
    backgroundColor: 'var(--accent-purple)',
    borderColor: 'transparent',
    color: '#fff',
    fontWeight: 600,
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
  },
  content: {
    width: '100%',
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
  emptyCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    maxWidth: '460px',
    margin: '40px auto 0',
  },
  emptyIcon: {
    fontSize: '54px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  emptyDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '20px',
  },
  infoBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'rgba(6,182,212,0.06)',
    border: '1px solid rgba(6,182,212,0.12)',
    color: 'var(--accent-cyan)',
    fontSize: '14px',
    fontWeight: 500,
  },
  lightboxOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '24px',
    backdropFilter: 'blur(8px)',
  },
  lightboxContent: {
    position: 'relative' as const,
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column' as const,
    maxWidth: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  lightboxCloseBtn: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
    zIndex: 120,
  },
  lightboxBody: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    height: 'calc(90vh - 40px)',
    maxHeight: '750px',
    width: '90vw',
    maxWidth: '1100px',
  },
  lightboxImageContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    overflow: 'hidden',
    height: '100%',
    width: '100%',
  },
  lightboxMainImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
    userSelect: 'none' as const,
  },
  lightboxSidebar: {
    backgroundColor: 'var(--bg-secondary)',
    borderLeft: '1px solid var(--glass-border)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    height: '100%',
    overflowY: 'auto' as const,
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '20px',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  detailLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    wordBreak: 'break-all' as const,
  },
  faceListContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '6px',
  },
  faceListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--glass-border)',
    transition: 'all 0.2s ease',
  },
  faceItemColorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  faceItemName: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  faceItemSub: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  noFacesText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  lightboxActionsRow: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.03)',
  },
};
