import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Share2, Users, ImageIcon, Camera, Sparkles, Activity, AlertCircle, CheckCircle, Clock, Download, X } from 'lucide-react';
import { useEventDetail, useProcessingStatus, useStartProcessing } from '../hooks/useEvents';
import { useUploadPhotos, useEventPhotos } from '../hooks/usePhotos';
import type { EventPhoto } from '../hooks/usePhotos';
import { useAuthContext } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import Dropzone from '../components/Dropzone';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'photos' | 'upload-photos' | 'upload-selfies'>('photos');
  
  // File upload state caches
  const [photosFiles, setPhotosFiles] = useState<File[]>([]);
  const [selfiesFiles, setSelfiesFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  // Queries
  const { data: event, isLoading: eventLoading, refetch: refetchEvent } = useEventDetail(id || '');
  const { data: procStatus, refetch: refetchStatus } = useProcessingStatus(id || '', !!id);
  const { mutateAsync: startProcessing, isPending: processPending } = useStartProcessing();
  const { mutateAsync: uploadPhotos } = useUploadPhotos(id || '');
  const { data: photos, isLoading: photosLoading, refetch: refetchPhotos } = useEventPhotos(id || '');

  // Lightbox overlay state
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [hoveredFaceId, setHoveredFaceId] = useState<number | null>(null);

  const handleCopyCode = () => {
    if (event) {
      navigator.clipboard.writeText(event.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = () => {
    if (event) {
      navigator.share?.({
        title: `Join my FaceSort Event: ${event.name}`,
        text: `Use invite code: ${event.invite_code} to join this event!`,
        url: window.location.origin,
      }).catch(console.error);
    }
  };

  const handleAddPhotosFiles = (selected: File[]) => {
    setPhotosFiles((prev) => [...prev, ...selected]);
  };

  const handleRemovePhotosFile = (index: number) => {
    setPhotosFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSelfiesFiles = (selected: File[]) => {
    setSelfiesFiles((prev) => [...prev, ...selected]);
  };

  const handleRemoveSelfiesFile = (index: number) => {
    setSelfiesFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerUpload = async (mode: 'photos' | 'selfies') => {
    const files = mode === 'selfies' ? selfiesFiles : photosFiles;
    if (files.length === 0) return;
    setUploadLoading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      await uploadPhotos({
        files,
        mode,
        onProgress: (p) => setUploadProgress(p),
      });
      // Clear cache on success
      if (mode === 'selfies') setSelfiesFiles([]);
      else setPhotosFiles([]);
      
      refetchEvent();
      refetchPhotos();
      setActiveTab('photos');
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload images. Check file dimensions.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleStartSort = async () => {
    if (!id) return;
    try {
      await startProcessing(id);
      refetchEvent();
      refetchStatus();
      refetchPhotos();
    } catch (err) {
      console.error(err);
    }
  };

  // Sync refetch when status updates to completed or failed
  useEffect(() => {
    if (procStatus?.status === 'completed' || procStatus?.status === 'failed') {
      refetchEvent();
      refetchPhotos();
    }
  }, [procStatus?.status]);

  // Handle window resizing for responsive bounding boxes
  useEffect(() => {
    const handleResize = () => {
      const img = document.getElementById('lightbox-target-image') as HTMLImageElement;
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

  const handleOpenPhotoDetail = (photo: EventPhoto) => {
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

  const handleViewGallery = () => {
    navigate('/gallery');
  };

  // Status mapping
  const currentStatus = useMemo(() => {
    return procStatus?.status || event?.status || 'pending';
  }, [procStatus, event]);

  const currentProgress = useMemo(() => {
    return procStatus?.progress || 0;
  }, [procStatus]);

  const isHost = useMemo(() => {
    if (!event || !user) return false;
    return Number(event.host.id) === Number(user.id);
  }, [event, user]);

  if (eventLoading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <span>Loading event details...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={styles.errorScreen}>
        <AlertCircle size={48} style={{ color: 'var(--error)' }} />
        <h3>Event not found</h3>
        <p>It may have been deleted or the URL is invalid.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '12px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back and actions row */}
      <div style={styles.navRow}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <button onClick={handleShare} style={styles.shareBadge}>
          <Share2 size={14} />
          <span>Share Room</span>
        </button>
      </div>

      {/* Main Info */}
      <div style={styles.eventHeader}>
        <div style={{ flex: 1 }}>
          <h2 style={styles.eventName}>{event.name}</h2>
          {event.description && <p style={styles.eventDesc}>{event.description}</p>}
        </div>

        {/* Invite code badge */}
        <button onClick={handleCopyCode} style={styles.codeBadge} title="Copy code">
          <span style={styles.codeLabel}>INVITE CODE</span>
          <span style={styles.codeText}>{event.invite_code}</span>
          <span style={styles.copyIcon}>{copiedCode ? '✅' : '📋'}</span>
        </button>
      </div>

      {/* Double Column Grid */}
      <div style={styles.layout}>
        {/* LEFT COLUMN: Pipeline details & member status */}
        <div style={styles.sidebar}>
          {/* AI Pipeline Glasscard */}
          <GlassCard padding="lg" style={styles.statusCard}>
            <h4 style={styles.sidebarTitle}>Focal AI Pipeline</h4>
            
            {/* Real-time indicator bar */}
            <div style={styles.indicatorContainer}>
              {currentStatus === 'processing' ? (
                <div style={styles.indicatorState}>
                  <div style={{ ...styles.indicatorIcon, color: 'var(--accent-cyan)', backgroundColor: 'rgba(6,182,212,0.1)' }}>
                    <Activity size={20} style={{ animation: 'pulse 1.5s infinite' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.indicatorTitle}>AI Face Matching...</span>
                    <span style={styles.indicatorPercent}>{currentProgress}% Done</span>
                    <div style={styles.indicatorBarBg}>
                      <div style={{ ...styles.indicatorBarFill, width: `${currentProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : currentStatus === 'completed' ? (
                <div style={styles.indicatorState}>
                  <div style={{ ...styles.indicatorIcon, color: 'var(--accent-purple)', backgroundColor: 'rgba(168,85,247,0.1)' }}>
                    <CheckCircle size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.indicatorTitle}>Sorting Completed!</span>
                    <span style={styles.indicatorDesc}>All matches calculated successfully.</span>
                  </div>
                </div>
              ) : currentStatus === 'failed' ? (
                <div style={styles.indicatorState}>
                  <div style={{ ...styles.indicatorIcon, color: 'var(--error)', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                    <AlertCircle size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.indicatorTitle}>Sorting Failed</span>
                    <span style={styles.indicatorDesc}>An error occurred during scanning.</span>
                  </div>
                </div>
              ) : (
                <div style={styles.indicatorState}>
                  <div style={{ ...styles.indicatorIcon, color: 'var(--success)', backgroundColor: 'rgba(16,185,129,0.1)' }}>
                    <Clock size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.indicatorTitle}>Awaiting AI Trigger</span>
                    <span style={styles.indicatorDesc}>Waiting for host to trigger sorting.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Host Processing Trigger */}
            {isHost && currentStatus !== 'processing' && (
              <div style={styles.hostTriggerContainer}>
                <p style={styles.hostTriggerNotice}>
                  ★ You are the host. Once all selfies are registered and event photos are uploaded, trigger matching:
                </p>
                <button
                  onClick={handleStartSort}
                  disabled={processPending}
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '8px' }}
                >
                  <Sparkles size={16} />
                  {processPending ? 'Sorting...' : 'Trigger Face Matching'}
                </button>
              </div>
            )}

            {currentStatus === 'completed' && (
              <button
                onClick={handleViewGallery}
                className="btn btn-accent"
                style={{ width: '100%', marginTop: '16px', gap: '8px' }}
              >
                <ImageIcon size={16} />
                <span>View Personal Gallery</span>
              </button>
            )}
          </GlassCard>

          {/* Members Strip Box */}
          <GlassCard padding="lg" style={styles.membersCard}>
            <h4 style={styles.sidebarTitle}>Event Members ({event.members.length})</h4>
            <div style={styles.membersList}>
              {event.members.map((member) => (
                <div key={member.id} style={styles.memberRow}>
                  <div style={styles.avatar}>
                    {member.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.memberUsername}>{member.username}</span>
                  </div>
                  {member.role === 'host' && <span style={styles.hostIndicator}>Host</span>}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN: Tab content uploads & photo grid */}
        <div style={styles.mainContent}>
          {/* Header tabs selector */}
          <div style={styles.tabsRow}>
            <button
              onClick={() => setActiveTab('photos')}
              style={{ ...styles.tabButton, ...(activeTab === 'photos' && styles.tabButtonActive) }}
            >
              <ImageIcon size={16} />
              <span>Event Photos ({event.photo_count})</span>
            </button>

            <button
              onClick={() => setActiveTab('upload-photos')}
              style={{ ...styles.tabButton, ...(activeTab === 'upload-photos' && styles.tabButtonActive) }}
            >
              <Camera size={16} />
              <span>Upload Photos</span>
            </button>

            <button
              onClick={() => setActiveTab('upload-selfies')}
              style={{ ...styles.tabButton, ...(activeTab === 'upload-selfies' && styles.tabButtonActive) }}
            >
              <Users size={16} />
              <span>Register Face (Selfies)</span>
            </button>
          </div>

          {/* Tab Pages rendering */}
          {activeTab === 'photos' ? (
            <div style={{ width: '100%' }}>
              <GlassCard padding="xl">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h4 style={styles.contentTitle}>Group Photo Wall</h4>
                    <p style={styles.contentDesc}>
                      {photos && photos.length > 0 
                        ? `Displaying ${photos.length} photos uploaded to this event.` 
                        : 'Upload group photos to start distributing them using AI.'}
                    </p>
                  </div>
                  {photos && photos.length > 0 && (
                    <button
                      onClick={() => setActiveTab('upload-photos')}
                      className="btn btn-primary"
                      style={{ gap: '6px', height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center' }}
                    >
                      <Plus size={14} /> Add Photos
                    </button>
                  )}
                </div>

                {photosLoading ? (
                  <div style={styles.loadingContainer}>
                    <div style={styles.spinner} />
                    <span>Loading group photos...</span>
                  </div>
                ) : photos && photos.length > 0 ? (
                  <div style={styles.photoGrid}>
                    {photos.map((photo) => {
                      const detectedCount = photo.faces?.length || 0;
                      // Collect usernames of matched users
                      const matchedUsers = photo.faces
                        ?.filter(f => f.matched_username)
                        .map(f => {
                          const isSoft = f.similarity_score !== null && f.similarity_score < 0.60;
                          return `${f.matched_username}${isSoft ? ' (Soft)' : ''}`;
                        }) || [];
                      // Unique usernames
                      const uniqueMatched = Array.from(new Set(matchedUsers));

                      return (
                        <div
                          key={photo.id}
                          style={styles.photoCard}
                          onClick={() => handleOpenPhotoDetail(photo)}
                          className="photo-card-hover animate-fade-in"
                        >
                          <div style={styles.photoImgWrapper}>
                            <img src={photo.url} alt="Group photo" style={styles.photoImg} />
                            
                            {/* Processing Status Badge */}
                            {photo.processing_status !== 'completed' && (
                              <div style={{
                                ...styles.statusOverlay,
                                backgroundColor: photo.processing_status === 'failed' 
                                  ? 'rgba(239, 68, 68, 0.8)' 
                                  : photo.processing_status === 'processing' 
                                    ? 'rgba(6, 182, 212, 0.8)' 
                                    : 'rgba(0, 0, 0, 0.6)'
                              }}>
                                <span style={styles.statusOverlayText}>
                                  {photo.processing_status.toUpperCase()}
                                </span>
                              </div>
                            )}

                            {/* Face Count Badge */}
                            {photo.processing_status === 'completed' && (
                              <div style={styles.faceCountBadge}>
                                <span>👥 {detectedCount} {detectedCount === 1 ? 'face' : 'faces'}</span>
                              </div>
                            )}
                          </div>

                          <div style={styles.photoCardFooter}>
                            {uniqueMatched.length > 0 ? (
                              <div style={styles.matchedUsersContainer}>
                                <span style={styles.matchedLabel}>Matched:</span>
                                <div style={styles.matchedChips}>
                                  {uniqueMatched.map((name, i) => (
                                    <span key={i} style={styles.matchedChip}>
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span style={styles.unmatchedLabel}>
                                {photo.processing_status === 'completed' 
                                  ? 'No members detected' 
                                  : 'Awaiting scan'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '24px' }}>
                    <div style={styles.emptyGallery}>
                      <span style={styles.emptyGalleryIcon}>📸</span>
                      <p style={styles.emptyGalleryText}>Group photo collection is empty</p>
                      <button
                        onClick={() => setActiveTab('upload-photos')}
                        className="btn btn-outline"
                        style={{ marginTop: '16px' }}
                      >
                        <Plus size={16} /> Add Photos
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          ) : activeTab === 'upload-photos' ? (
            <GlassCard padding="xl">
              <h4 style={styles.contentTitle}>Upload Event Group Photos</h4>
              <p style={styles.contentDesc}>Select up to 100 bulk images containing friends to match.</p>
              
              {uploadError && <div style={styles.uploadErrorBanner}>{uploadError}</div>}

              <div style={{ marginTop: '24px' }}>
                <Dropzone
                  onFilesSelected={handleAddPhotosFiles}
                  selectedFiles={photosFiles}
                  onRemoveFile={handleRemovePhotosFile}
                  mode="photos"
                  maxFiles={100}
                  isUploading={uploadLoading}
                  uploadProgress={uploadProgress}
                />

                {photosFiles.length > 0 && !uploadLoading && (
                  <button
                    onClick={() => triggerUpload('photos')}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '24px', height: '46px' }}
                  >
                    Upload Group Photos ({photosFiles.length})
                  </button>
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard padding="xl">
              <h4 style={styles.contentTitle}>Register Your Face (Selfies)</h4>
              <p style={styles.contentDesc}>Upload 2–5 clear selfies. The AI averages these to detect you in group photos.</p>

              {uploadError && <div style={styles.uploadErrorBanner}>{uploadError}</div>}

              <div style={{ marginTop: '24px' }}>
                <Dropzone
                  onFilesSelected={handleAddSelfiesFiles}
                  selectedFiles={selfiesFiles}
                  onRemoveFile={handleRemoveSelfiesFile}
                  mode="selfies"
                  maxFiles={5}
                  isUploading={uploadLoading}
                  uploadProgress={uploadProgress}
                />

                {selfiesFiles.length > 0 && !uploadLoading && (
                  <button
                    onClick={() => triggerUpload('selfies')}
                    className="btn btn-accent"
                    style={{ width: '100%', marginTop: '24px', height: '46px' }}
                    disabled={selfiesFiles.length < 2}
                  >
                    Register Face ({selfiesFiles.length})
                  </button>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Group Photo Advanced Lightbox with Face Overlays */}
      {selectedPhoto && (
        <div style={styles.lightboxOverlay} onClick={handleClosePhotoDetail}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.lightboxBody}>
              {/* Image side */}
              <div style={styles.lightboxImageContainer}>
                <img
                  id="lightbox-target-image"
                  src={selectedPhoto.url}
                  alt="Group detail"
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
                      {/* Name chip tag */}
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
                <h4 style={styles.sidebarTitle}>Photo Scanning Details</h4>
                
                <div style={styles.sidebarSection}>
                  <span style={styles.detailLabel}>File Name</span>
                  <span style={styles.detailValue}>{selectedPhoto.filename}</span>
                </div>
                
                <div style={styles.sidebarSection}>
                  <span style={styles.detailLabel}>Processing Status</span>
                  <span style={{ 
                    ...styles.detailValue,
                    color: selectedPhoto.processing_status === 'completed' ? 'var(--success)' : 'var(--warning)',
                    fontWeight: 'bold'
                  }}>
                    {selectedPhoto.processing_status.toUpperCase()}
                  </span>
                </div>

                <div style={styles.sidebarSection}>
                  <span style={styles.detailLabel}>Faces Detected</span>
                  <span style={styles.detailValue}>{selectedPhoto.face_count}</span>
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
                      <span style={styles.noFacesText}>No faces detected or scanned in this photo.</span>
                    )}
                  </div>
                </div>

                <div style={styles.lightboxActionsRow}>
                  <a
                    href={selectedPhoto.url}
                    download={selectedPhoto.filename}
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
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'color var(--transition-fast)',
  },
  shareBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: 'var(--border-radius-full)',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    color: 'var(--accent-cyan)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    marginBottom: '32px',
  },
  eventName: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  eventDesc: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    marginTop: '6px',
    lineHeight: '22px',
    maxWidth: '700px',
  },
  codeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all var(--transition-fast)',
  },
  codeLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '1px',
  },
  codeText: {
    fontSize: '16px',
    fontWeight: 800,
    color: 'var(--accent-purple)',
    letterSpacing: '1.5px',
  },
  copyIcon: {
    fontSize: '13px',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '32px',
    width: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  statusCard: {
    width: '100%',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '20px',
  },
  indicatorContainer: {
    width: '100%',
  },
  indicatorState: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  indicatorIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorTitle: {
    display: 'block',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  indicatorPercent: {
    display: 'block',
    fontSize: '13px',
    color: 'var(--accent-cyan)',
    fontWeight: 600,
    marginTop: '2px',
  },
  indicatorDesc: {
    display: 'block',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  indicatorBarBg: {
    height: '4px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 'var(--border-radius-full)',
    marginTop: '8px',
    overflow: 'hidden',
  },
  indicatorBarFill: {
    height: '100%',
    backgroundColor: 'var(--accent-cyan)',
    borderRadius: 'var(--border-radius-full)',
    transition: 'width var(--transition-fast)',
  },
  hostTriggerContainer: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.03)',
  },
  hostTriggerNotice: {
    fontSize: '11px',
    color: 'var(--warning)',
    lineHeight: '16px',
    marginBottom: '12px',
    opacity: 0.8,
  },
  membersCard: {
    width: '100%',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.02)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    border: '1px solid rgba(124, 58, 237, 0.25)',
    color: 'var(--accent-purple)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
  },
  memberUsername: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  hostIndicator: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--accent-purple)',
    backgroundColor: 'rgba(124,58,237,0.1)',
    border: '1px solid rgba(124,58,237,0.2)',
    padding: '2px 6px',
    borderRadius: 'var(--border-radius-full)',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    padding: '4px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--border-radius-md)',
    width: 'fit-content',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: 'var(--border-radius-sm)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-primary)',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  },
  contentTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  contentDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
  },
  emptyGallery: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px dashed var(--glass-border)',
    borderRadius: 'var(--border-radius-md)',
    textAlign: 'center' as const,
  },
  emptyGalleryIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  emptyGalleryText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  uploadErrorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: 'var(--error)',
    padding: '10px 16px',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '13px',
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
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
  errorScreen: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    textAlign: 'center' as const,
    gap: '10px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  photoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--border-radius-md)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  photoImgWrapper: {
    position: 'relative' as const,
    height: '160px',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transition: 'transform 0.3s ease',
  },
  statusOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  statusOverlayText: {
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1px',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  faceCountBadge: {
    position: 'absolute' as const,
    bottom: '8px',
    right: '8px',
    backgroundColor: 'rgba(7, 7, 10, 0.75)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff',
    zIndex: 2,
  },
  photoCardFooter: {
    padding: '12px',
    minHeight: '60px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
  },
  matchedUsersContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  matchedLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  matchedChips: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '4px',
  },
  matchedChip: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--accent-cyan)',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap' as const,
  },
  unmatchedLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '12px',
    color: 'var(--text-secondary)',
  },
};
