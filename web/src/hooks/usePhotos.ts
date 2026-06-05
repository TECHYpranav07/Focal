import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, QUERY_KEYS } from '../constants/api';

export interface GalleryPhoto {
  id: string;
  uri: string;
  thumbnail_url?: string;
  full_url: string;
  confidence: number;
  event_id: string;
  created_at: string;
  faces?: FaceMatchDetail[];
}

export interface FaceMatchDetail {
  id: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  matched_user_id: number | null;
  matched_username: string | null;
  similarity_score: number | null;
}

export interface EventPhoto {
  id: string;
  event_id: number;
  uploaded_by: number;
  filename: string;
  file_path: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  face_count: number;
  created_at: string;
  url: string;
  faces: FaceMatchDetail[];
}

// Fetch all event photos
export function useEventPhotos(eventId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.eventPhotos(eventId),
    queryFn: async () => {
      const response = await axios.get<any[]>(
        API_ENDPOINTS.PHOTOS(eventId)
      );
      const data = response.data;
      if (!data) return [];
      
      return data.map((p: any) => ({
        ...p,
        id: String(p.id),
        url: `${API_BASE_URL}/uploads/photos/${p.filename}`,
      })) as EventPhoto[];
    },
    enabled: !!eventId,
  });
}

// Fetch matched gallery photos
export function useGallery(eventId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.gallery(eventId),
    queryFn: async () => {
      const response = await axios.get<any>(
        API_ENDPOINTS.GALLERY(eventId)
      );
      const data = response.data;
      if (!data || !data.photos) return [];
      
      return data.photos.map((p: any) => ({
        id: String(p.photo_id),
        uri: `${API_BASE_URL}/uploads/photos/${p.filename}`,
        full_url: `${API_BASE_URL}/uploads/photos/${p.filename}`,
        confidence: p.best_similarity_score,
        event_id: String(p.event_id),
        created_at: p.matched_at,
        faces: p.faces,
      })) as GalleryPhoto[];
    },
    enabled: !!eventId,
  });
}

// Upload photos / selfies with Axios upload progress tracking
export function useUploadPhotos(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      mode,
      onProgress,
    }: {
      files: File[];
      mode: 'photos' | 'selfies';
      onProgress?: (progress: number) => void;
    }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const url =
        mode === 'selfies'
          ? API_ENDPOINTS.SELFIES(eventId)
          : API_ENDPOINTS.PHOTOS(eventId);

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentage);
          }
        },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.eventDetail(eventId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gallery(eventId) });
    },
  });
}
