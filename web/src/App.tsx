import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { X, Download } from 'lucide-react';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { useAppStore } from './store/useAppStore';
import Navbar from './components/Navbar';
import Login from './views/Login';
import Register from './views/Register';
import Dashboard from './views/Dashboard';
import EventDetail from './views/EventDetail';
import PersonalGallery from './views/PersonalGallery';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuthContext();
  const preview = useAppStore((s) => s.preview);
  const closePreview = useAppStore((s) => s.closePreview);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <span>Syncing session details...</span>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Floating Navbar */}
      <Navbar />

      {/* Main Pages */}
      <main style={styles.main}>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" replace />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/" replace />}
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={user ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/event/:id"
            element={user ? <EventDetail /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/gallery"
            element={user ? <PersonalGallery /> : <Navigate to="/login" replace />}
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* --- GLOBAL GLASS IMAGE LIGHTBOX PREVIEW --- */}
      {preview.isOpen && (
        <div style={styles.lightboxOverlay} onClick={closePreview}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={preview.uri}
              alt="High Definition Match"
              style={styles.lightboxImage}
            />

            {/* Actions overlay panel */}
            <div style={styles.lightboxFooter}>
              {preview.confidence !== undefined && (
                <div style={styles.lightboxConfidence}>
                  <span>AI Match Score: </span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>
                    {Math.round(preview.confidence * 100)}%
                  </strong>
                </div>
              )}

              <div style={styles.lightboxActions}>
                <a
                  href={preview.uri}
                  download="facesort_match.jpg"
                  className="btn btn-accent"
                  style={{ padding: '8px 16px', gap: '6px' }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
                
                <button
                  onClick={closePreview}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', gap: '6px' }}
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>
            </div>
            
            {/* Direct close button top right */}
            <button onClick={closePreview} style={styles.lightboxCloseBtn}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    width: '100vw',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#07070a',
    color: 'var(--text-secondary)',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255,255,255,0.05)',
    borderTopColor: 'var(--accent-purple)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
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
  lightboxImage: {
    width: 'auto',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: 'calc(90vh - 100px)',
    objectFit: 'contain' as const,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  lightboxFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(13, 12, 21, 0.95)',
  },
  lightboxConfidence: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  lightboxActions: {
    display: 'flex',
    gap: '12px',
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
  },
};
