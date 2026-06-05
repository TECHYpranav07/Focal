import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ENDPOINTS, QUERY_KEYS } from '../constants/api';

export interface EventData {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  status: 'active' | 'processing' | 'completed';
  member_count: number;
  photo_count: number;
  created_at: string;
  is_host: boolean;
  host_id: number;
}

export interface EventMember {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_host: boolean;
  joined_at: string;
  role: 'host' | 'member';
  selfies_uploaded: number;
}

export interface EventDetailResponse extends EventData {
  members: EventMember[];
  host: {
    id: number;
    email: string;
    username: string;
    avatar_url?: string;
  };
}

export interface ProcessingStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

// Fetch all events
export function useEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: async () => {
      const response = await axios.get<EventData[]>(API_ENDPOINTS.EVENTS);
      return response.data;
    },
  });
}

// Fetch event details (event details + members)
export function useEventDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.eventDetail(id),
    queryFn: async () => {
      const response = await axios.get<EventDetailResponse>(
        API_ENDPOINTS.EVENT_DETAIL(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// Polling hook for AI sorting status
export function useProcessingStatus(eventId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.processingStatus(eventId),
    queryFn: async () => {
      const response = await axios.get<ProcessingStatusResponse>(
        API_ENDPOINTS.PROCESS_STATUS(eventId)
      );
      return response.data;
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
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await axios.post(API_ENDPOINTS.EVENTS, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
    },
  });
}

// Join event via invite code
export function useJoinEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await axios.post(API_ENDPOINTS.JOIN_EVENT, {
        invite_code: inviteCode,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
    },
  });
}

// Host trigger AI processing
export function useStartProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await axios.post(API_ENDPOINTS.PROCESS(eventId));
      return response.data;
    },
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.eventDetail(eventId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.processingStatus(eventId) });
    },
  });
}
