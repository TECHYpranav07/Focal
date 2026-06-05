import { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import GlassCard from './GlassCard';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  maxFiles?: number;
  mode?: 'photos' | 'selfies';
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function Dropzone({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  maxFiles = 20,
  mode = 'photos',
  isUploading = false,
  uploadProgress = 0,
}: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      filterAndAddFiles(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      filterAndAddFiles(selected);
    }
  };

  const filterAndAddFiles = (filesList: File[]) => {
    if (isUploading) return;
    
    // Filter only images
    const imageFiles = filesList.filter((file) => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;

    // Constrain files count
    const totalCount = selectedFiles.length + imageFiles.length;
    if (totalCount > maxFiles) {
      const allowedCount = maxFiles - selectedFiles.length;
      onFilesSelected(imageFiles.slice(0, allowedCount));
    } else {
      onFilesSelected(imageFiles);
    }
  };

  const getSizingText = (sizeInBytes: number) => {
    const sizeInKb = sizeInBytes / 1024;
    if (sizeInKb > 1024) {
      return `${(sizeInKb / 1024).toFixed(1)} MB`;
    }
    return `${sizeInKb.toFixed(0)} KB`;
  };

  const openFileDialog = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div style={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {/* Main Drag Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        style={{
          ...styles.dropBox,
          borderColor: isDragActive
            ? 'var(--accent-purple)'
            : 'var(--glass-border)',
          backgroundColor: isDragActive
            ? 'rgba(124, 58, 237, 0.05)'
            : 'rgba(255, 255, 255, 0.01)',
          cursor: isUploading ? 'not-allowed' : 'pointer',
        }}
      >
        <Upload
          size={40}
          style={{
            color: isDragActive ? 'var(--accent-purple)' : 'var(--text-secondary)',
            marginBottom: '16px',
            transition: 'color var(--transition-fast)',
          }}
        />
        <p style={styles.dropText}>
          {isDragActive ? 'Drop your images here' : 'Drag & Drop photos here'}
        </p>
        <p style={styles.subDropText}>
          or <span style={styles.browseText}>browse your computer</span>
        </p>
        <p style={styles.limitText}>
          Supports JPEGs, PNGs, and WebPs (Max {maxFiles} files)
        </p>
      </div>

      {/* Selected Previews Grid */}
      {selectedFiles.length > 0 && (
        <div style={styles.previewsSection}>
          <div style={styles.previewsHeader}>
            <span style={styles.previewsTitle}>Selected Files ({selectedFiles.length})</span>
            {mode === 'selfies' && selectedFiles.length < 2 && (
              <span style={styles.warningBadge}>
                <AlertCircle size={14} /> Upload at least 2 selfies
              </span>
            )}
          </div>
          
          <div style={styles.grid}>
            {selectedFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <GlassCard key={index} padding="none" style={styles.gridItem}>
                  <img
                    src={previewUrl}
                    alt={file.name}
                    style={styles.gridImage}
                    onLoad={() => URL.revokeObjectURL(previewUrl)}
                  />
                  <div style={styles.gridItemOverlay}>
                    <span style={styles.fileName} title={file.name}>
                      {file.name}
                    </span>
                    <span style={styles.fileSize}>{getSizingText(file.size)}</span>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(index);
                      }}
                      style={styles.deleteButton}
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isUploading && (
        <GlassCard padding="md" style={styles.progressCard}>
          <div style={styles.progressHeader}>
            <span style={styles.progressTitle}>Uploading photos...</span>
            <span style={styles.progressPercent}>{uploadProgress}%</span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${uploadProgress}%`,
              }}
            />
          </div>
          <span style={styles.progressNotice}>
            Please stay on this page. Uploading files securely to backend...
          </span>
        </GlassCard>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    width: '100%',
  },
  dropBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    border: '2px dashed var(--glass-border)',
    borderRadius: 'var(--border-radius-lg)',
    textAlign: 'center' as const,
    transition: 'all var(--transition-normal)',
  },
  dropText: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  subDropText: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
  },
  browseText: {
    color: 'var(--accent-purple)',
    fontWeight: 600,
    textDecoration: 'underline',
  },
  limitText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    letterSpacing: '0.3px',
  },
  previewsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  previewsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  warningBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--border-radius-full)',
    backgroundColor: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.2)',
    color: 'var(--warning)',
    fontSize: '12px',
    fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '12px',
    width: '100%',
  },
  gridItem: {
    position: 'relative' as const,
    height: '130px',
    overflow: 'hidden',
    border: '1px solid var(--glass-border)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  gridItemOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.85) 60%)',
    padding: '12px 8px 8px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  fileName: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  deleteButton: {
    position: 'absolute' as const,
    top: '6px',
    right: '6px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    transition: 'background-color var(--transition-fast)',
  },
  progressCard: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    borderColor: 'var(--accent-purple)',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  progressPercent: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--accent-purple)',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 'var(--border-radius-full)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent-purple), #a855f7)',
    borderRadius: 'var(--border-radius-full)',
    transition: 'width var(--transition-fast)',
  },
  progressNotice: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
};
