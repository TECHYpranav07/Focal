import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { API_CONFIG, QUERY_KEYS } from '../constants/api';
import type { EventData } from '../components/EventCard';

interface CreateEventData {
  name: string;
  description?: string;
}

interface CreateEventResponse {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  status: string;
  created_at: string;
}

interface JoinEventResponse {
  event: EventData;
  message: string;
}

interface EventMember {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_host: boolean;
  joined_at: string;
}

interface ProcessingStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

// Fetch all events
export function useEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: async () => {
      const data = await api.get<EventData[]>(API_CONFIG.ENDPOINTS.EVENTS);
      return data;
    },
  });
}

// Fetch single event
export function useEvent(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.event(id),
    queryFn: async () => {
      const data = await api.get<EventData>(API_CONFIG.ENDPOINTS.EVENT_DETAIL(id));
      return data;
    },
    enabled: !!id,
  });
}

// Fetch event members
export function useEventMembers(eventId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.eventMembers(eventId),
    queryFn: async () => {
      const data = await api.get<EventMember[]>(
        API_CONFIG.ENDPOINTS.EVENT_MEMBERS(eventId)
      );
      return data;
    },
    enabled: !!eventId,
  });
}

// Fetch processing status with polling
export function useProcessingStatus(eventId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.processingStatus(eventId),
    queryFn: async () => {
      const data = await api.get<ProcessingStatusResponse>(
        API_CONFIG.ENDPOINTS.PROCESSING_STATUS(eventId)
      );
      return data;
    },
    enabled: !!eventId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data as ProcessingStatusResponse | undefined;
      if (data?.status === 'processing') return 3000;
      if (data?.status === 'pending') return 5000;
      return false;
    },
  });
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await api.post<CreateEventResponse>(
        API_CONFIG.ENDPOINTS.EVENTS,
        data as unknown as Record<string, unknown>
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
    },
  });
}

// Join event
export function useJoinEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await api.post<JoinEventResponse>(
        API_CONFIG.ENDPOINTS.EVENT_JOIN,
        { invite_code: inviteCode }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
    },
  });
}

// Start processing
export function useStartProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await api.post<{ message: string }>(
        API_CONFIG.ENDPOINTS.EVENT_PROCESS(eventId)
      );
      return response;
    },
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.processingStatus(eventId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.event(eventId) });
    },
  });
}

export default useEvents;
