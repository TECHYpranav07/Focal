import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import api, { uploadWithProgress } from '../lib/api';
import { API_CONFIG, QUERY_KEYS } from '../constants/api';
import { useAppStore, SelectedPhoto } from '../lib/store';

export interface GalleryPhoto {
  id: string;
  uri: string;
  thumbnail_url?: string;
  full_url: string;
  confidence: number;
  event_id: string;
  created_at: string;
}

// Fetch gallery photos
export function useGallery(eventId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.gallery(eventId),
    queryFn: async () => {
      const data = await api.get<GalleryPhoto[]>(
        API_CONFIG.ENDPOINTS.GALLERY(eventId)
      );
      return data;
    },
    enabled: !!eventId,
  });
}

// Pick images from device
export function useImagePicker() {
  const addSelectedPhotos = useAppStore((s) => s.addSelectedPhotos);

  const pickImages = async (selectionLimit = 20): Promise<SelectedPhoto[]> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permission to access photos was denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled || !result.assets) {
      return [];
    }

    const photos: SelectedPhoto[] = result.assets.map((asset) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName || undefined,
      fileSize: asset.fileSize || undefined,
      mimeType: asset.mimeType || undefined,
    }));

    addSelectedPhotos(photos);
    return photos;
  };

  const takePhoto = async (): Promise<SelectedPhoto | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permission to access camera was denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      exif: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    const photo: SelectedPhoto = {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName || undefined,
      fileSize: asset.fileSize || undefined,
      mimeType: asset.mimeType || undefined,
    };

    addSelectedPhotos([photo]);
    return photo;
  };

  return { pickImages, takePhoto };
}

// Upload photos mutation
export function useUploadPhotos(eventId: string) {
  const queryClient = useQueryClient();
  const setUploading = useAppStore((s) => s.setUploading);
  const setUploadProgress = useAppStore((s) => s.setUploadProgress);
  const setUploadError = useAppStore((s) => s.setUploadError);
  const clearSelectedPhotos = useAppStore((s) => s.clearSelectedPhotos);

  return useMutation({
    mutationFn: async ({
      photos,
      mode,
    }: {
      photos: SelectedPhoto[];
      mode: 'photos' | 'selfies';
    }) => {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      const formData = new FormData();

      photos.forEach((photo, index) => {
        const fileExtension = photo.uri.split('.').pop() || 'jpg';
        const fileName = photo.fileName || `${mode}_${index}.${fileExtension}`;

        formData.append('files', {
          uri: photo.uri,
          name: fileName,
          type: photo.mimeType || `image/${fileExtension}`,
        } as unknown as Blob);
      });

      const endpoint =
        mode === 'selfies'
          ? API_CONFIG.ENDPOINTS.UPLOAD_SELFIES(eventId)
          : API_CONFIG.ENDPOINTS.UPLOAD_PHOTOS(eventId);

      const result = await uploadWithProgress(endpoint, formData, (progress) => {
        setUploadProgress(progress);
      });

      return result;
    },
    onSuccess: () => {
      setUploading(false);
      setUploadProgress(100);
      clearSelectedPhotos();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.event(eventId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gallery(eventId) });
    },
    onError: (error: Error) => {
      setUploading(false);
      setUploadError(error.message || 'Upload failed');
    },
  });
}

// Download photo
export function useDownloadPhoto() {
  return useMutation({
    mutationFn: async (photoId: string) => {
      const data = await api.get<{ download_url: string }>(
        API_CONFIG.ENDPOINTS.PHOTO_DOWNLOAD(photoId)
      );
      return data;
    },
  });
}

export default useGallery;
