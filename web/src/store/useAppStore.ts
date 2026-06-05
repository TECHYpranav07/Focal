import { create } from 'zustand';

interface PreviewState {
  isOpen: boolean;
  uri: string;
  confidence?: number;
}

interface AppState {
  activeEventId: string | null;
  setActiveEventId: (id: string | null) => void;
  
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
  
  isJoinModalOpen: boolean;
  setJoinModalOpen: (isOpen: boolean) => void;
  
  preview: PreviewState;
  openPreview: (uri: string, confidence?: number) => void;
  closePreview: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeEventId: localStorage.getItem('facesort_active_event'),
  setActiveEventId: (id) => {
    if (id) {
      localStorage.setItem('facesort_active_event', id);
    } else {
      localStorage.removeItem('facesort_active_event');
    }
    set({ activeEventId: id });
  },
  
  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  
  isJoinModalOpen: false,
  setJoinModalOpen: (isOpen) => set({ isJoinModalOpen: isOpen }),
  
  preview: {
    isOpen: false,
    uri: '',
  },
  openPreview: (uri, confidence) => set({ preview: { isOpen: true, uri, confidence } }),
  closePreview: () => set({ preview: { isOpen: false, uri: '', confidence: undefined } }),
}));
