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

// Helper function to compress images using HTML5 Canvas
async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scale dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85 // compress to 85% JPEG quality
        );
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
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
      
      // Compress all image files in parallel in the browser before sending
      const processedFiles = await Promise.all(
        files.map((file) => compressImage(file))
      );

      processedFiles.forEach((file) => {
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
