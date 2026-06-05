import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine localhost
// iOS simulator / web uses localhost directly
const getBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 120000,
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',

    // Events
    EVENTS: '/api/events',
    EVENT_DETAIL: (id: string) => `/api/events/${id}`,
    EVENT_JOIN: '/api/events/join',
    EVENT_MEMBERS: (id: string) => `/api/events/${id}/members`,
    EVENT_PROCESS: (id: string) => `/api/events/${id}/process`,

    // Photos
    UPLOAD_PHOTOS: (eventId: string) => `/api/events/${eventId}/photos`,
    UPLOAD_SELFIES: (eventId: string) => `/api/events/${eventId}/selfies`,
    GALLERY: (eventId: string) => `/api/events/${eventId}/gallery`,
    PHOTO_DOWNLOAD: (photoId: string) => `/api/photos/${photoId}/download`,

    // Processing
    PROCESSING_STATUS: (eventId: string) => `/api/events/${eventId}/status`,
  },
} as const;

export const QUERY_KEYS = {
  user: ['user'] as const,
  events: ['events'] as const,
  event: (id: string) => ['event', id] as const,
  eventMembers: (id: string) => ['event', id, 'members'] as const,
  gallery: (eventId: string) => ['gallery', eventId] as const,
  processingStatus: (eventId: string) => ['processing', eventId] as const,
} as const;
