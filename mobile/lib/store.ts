import { create } from 'zustand';

// Types for client-side state
export interface SelectedPhoto {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface UploadState {
  eventId: string | null;
  mode: 'photos' | 'selfies';
  selectedPhotos: SelectedPhoto[];
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
}

export interface AppState {
  // Upload state
  upload: UploadState;
  setUploadEventId: (eventId: string) => void;
  setUploadMode: (mode: 'photos' | 'selfies') => void;
  addSelectedPhotos: (photos: SelectedPhoto[]) => void;
  removeSelectedPhoto: (uri: string) => void;
  clearSelectedPhotos: () => void;
  setUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadError: (error: string | null) => void;
  resetUpload: () => void;

  // UI state
  activeEventId: string | null;
  setActiveEventId: (id: string | null) => void;

  // Join event
  joinCode: string;
  setJoinCode: (code: string) => void;
  clearJoinCode: () => void;
}

const initialUploadState: UploadState = {
  eventId: null,
  mode: 'photos',
  selectedPhotos: [],
  isUploading: false,
  uploadProgress: 0,
  uploadError: null,
};

export const useAppStore = create<AppState>((set) => ({
  // Upload state
  upload: { ...initialUploadState },
  setUploadEventId: (eventId) =>
    set((state) => ({ upload: { ...state.upload, eventId } })),
  setUploadMode: (mode) =>
    set((state) => ({ upload: { ...state.upload, mode } })),
  addSelectedPhotos: (photos) =>
    set((state) => ({
      upload: {
        ...state.upload,
        selectedPhotos: [...state.upload.selectedPhotos, ...photos],
      },
    })),
  removeSelectedPhoto: (uri) =>
    set((state) => ({
      upload: {
        ...state.upload,
        selectedPhotos: state.upload.selectedPhotos.filter((p) => p.uri !== uri),
      },
    })),
  clearSelectedPhotos: () =>
    set((state) => ({
      upload: { ...state.upload, selectedPhotos: [], uploadProgress: 0, uploadError: null },
    })),
  setUploading: (isUploading) =>
    set((state) => ({ upload: { ...state.upload, isUploading } })),
  setUploadProgress: (uploadProgress) =>
    set((state) => ({ upload: { ...state.upload, uploadProgress } })),
  setUploadError: (uploadError) =>
    set((state) => ({ upload: { ...state.upload, uploadError } })),
  resetUpload: () => set({ upload: { ...initialUploadState } }),

  // UI state
  activeEventId: null,
  setActiveEventId: (id) => set({ activeEventId: id }),

  // Join event
  joinCode: '',
  setJoinCode: (code) => set({ joinCode: code }),
  clearJoinCode: () => set({ joinCode: '' }),
}));

export default useAppStore;
