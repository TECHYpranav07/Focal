import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../constants/api';
import { Platform } from 'react-native';

const TOKEN_KEY = 'facesort_auth_token';
const REFRESH_TOKEN_KEY = 'facesort_refresh_token';

// Token storage helpers — SecureStore on native, AsyncStorage-like on web
export const tokenStorage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },
  async removeRefreshToken(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
  async clearAll(): Promise<void> {
    await this.removeToken();
    await this.removeRefreshToken();
  },
};

// Types
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestConfig {
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string | FormData;
  signal?: AbortSignal;
}

// Auth redirect callback — set by the auth provider
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureCallback(callback: () => void) {
  onAuthFailure = callback;
}

// Core API client
async function request<T>(
  endpoint: string,
  options: {
    method?: HttpMethod;
    body?: Record<string, unknown> | FormData;
    headers?: Record<string, string>;
    timeout?: number;
    skipAuth?: boolean;
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = API_CONFIG.TIMEOUT,
    skipAuth = false,
  } = options;

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const config: RequestConfig = {
    method,
    headers: {
      ...headers,
    },
  };

  // Attach JWT token
  if (!skipAuth) {
    const token = await tokenStorage.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Handle body
  if (body) {
    if (body instanceof FormData) {
      config.body = body;
      // Don't set Content-Type for FormData — let the browser set it with boundary
    } else {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
  }

  // Timeout with AbortController
  const controller = new AbortController();
  config.signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Handle 401 — token expired
    if (response.status === 401 && !skipAuth) {
      await tokenStorage.clearAll();
      if (onAuthFailure) {
        onAuthFailure();
      }
      throw { message: 'Session expired. Please log in again.', status: 401 } as ApiError;
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = await response.json();
      } catch {
        // Response body isn't JSON
      }
      throw {
        message: (errorData.detail as string) || (errorData.message as string) || `Request failed with status ${response.status}`,
        status: response.status,
        errors: errorData.errors as Record<string, string[]> | undefined,
      } as ApiError;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as { name?: string }).name === 'AbortError') {
      throw { message: 'Request timed out', status: 408 } as ApiError;
    }
    if ((error as ApiError).status) {
      throw error;
    }
    throw { message: 'Network error. Please check your connection.', status: 0 } as ApiError;
  }
}

// Upload helper with progress tracking
export async function uploadWithProgress(
  endpoint: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<unknown> {
  const token = await tokenStorage.getToken();
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({});
        }
      } else if (xhr.status === 401) {
        tokenStorage.clearAll();
        if (onAuthFailure) onAuthFailure();
        reject({ message: 'Session expired', status: 401 } as ApiError);
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject({
            message: errorData.detail || errorData.message || 'Upload failed',
            status: xhr.status,
          } as ApiError);
        } catch {
          reject({ message: 'Upload failed', status: xhr.status } as ApiError);
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject({ message: 'Network error during upload', status: 0 } as ApiError);
    });

    xhr.addEventListener('timeout', () => {
      reject({ message: 'Upload timed out', status: 408 } as ApiError);
    });

    xhr.timeout = API_CONFIG.UPLOAD_TIMEOUT;
    xhr.send(formData);
  });
}

// Convenient API methods
export const api = {
  get<T>(endpoint: string, options?: { skipAuth?: boolean }) {
    return request<T>(endpoint, { method: 'GET', ...options });
  },
  post<T>(endpoint: string, body?: Record<string, unknown>, options?: { skipAuth?: boolean }) {
    return request<T>(endpoint, { method: 'POST', body, ...options });
  },
  put<T>(endpoint: string, body?: Record<string, unknown>) {
    return request<T>(endpoint, { method: 'PUT', body });
  },
  patch<T>(endpoint: string, body?: Record<string, unknown>) {
    return request<T>(endpoint, { method: 'PATCH', body });
  },
  delete<T>(endpoint: string) {
    return request<T>(endpoint, { method: 'DELETE' });
  },
  upload<T>(endpoint: string, formData: FormData) {
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
    });
  },
};

export default api;
