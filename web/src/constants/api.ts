export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  ME: `${API_BASE_URL}/api/v1/auth/me`,

  // Events
  EVENTS: `${API_BASE_URL}/api/v1/events`,
  EVENT_DETAIL: (id: string) => `${API_BASE_URL}/api/v1/events/${id}`,
  JOIN_EVENT: `${API_BASE_URL}/api/v1/events/join`,

  // Photos & Selfies
  PHOTOS: (eventId: string) => `${API_BASE_URL}/api/v1/events/${eventId}/photos`,
  SELFIES: (eventId: string) => `${API_BASE_URL}/api/v1/events/${eventId}/selfies`,
  
  // Processing
  PROCESS: (eventId: string) => `${API_BASE_URL}/api/v1/events/${eventId}/process`,
  PROCESS_STATUS: (eventId: string) => `${API_BASE_URL}/api/v1/events/${eventId}/process/status`,
  
  // Gallery
  GALLERY: (eventId: string) => `${API_BASE_URL}/api/v1/events/${eventId}/gallery`,
  GALLERY_DOWNLOAD: (eventId: string) => `${API_BASE_URL}/api/v1/events/${eventId}/gallery/download`,
} as const;

export const QUERY_KEYS = {
  user: ['user'] as const,
  events: ['events'] as const,
  eventDetail: (id: string) => ['event', id] as const,
  eventPhotos: (eventId: string) => ['event-photos', eventId] as const,
  eventSelfies: (eventId: string) => ['event-selfies', eventId] as const,
  processingStatus: (eventId: string) => ['processing-status', eventId] as const,
  gallery: (eventId: string) => ['gallery', eventId] as const,
} as const;
