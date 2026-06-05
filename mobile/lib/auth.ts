import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import api, { tokenStorage, setAuthFailureCallback } from './api';
import { API_CONFIG } from '../constants/api';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Set the auth failure callback to redirect to login
  useEffect(() => {
    setAuthFailureCallback(() => {
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      router.replace('/(auth)/login');
    });
  }, []);

  // Check stored token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // Validate token by fetching user
      const user = await api.get<User>(API_CONFIG.ENDPOINTS.ME);
      setState({ user, token, isLoading: false, isAuthenticated: true });
    } catch {
      await tokenStorage.clearAll();
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  };

  const login = useCallback(async (data: LoginData) => {
    // Backend might expect form-encoded or JSON — we send JSON
    const response = await api.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.LOGIN,
      {
        email: data.email,
        password: data.password,
      },
      { skipAuth: true }
    );

    await tokenStorage.setToken(response.access_token);
    if (response.refresh_token) {
      await tokenStorage.setRefreshToken(response.refresh_token);
    }

    setState({
      user: response.user,
      token: response.access_token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await api.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.REGISTER,
      {
        username: data.username,
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
      },
      { skipAuth: true }
    );

    await tokenStorage.setToken(response.access_token);
    if (response.refresh_token) {
      await tokenStorage.setRefreshToken(response.refresh_token);
    }

    setState({
      user: response.user,
      token: response.access_token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clearAll();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    router.replace('/(auth)/login');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await api.get<User>(API_CONFIG.ENDPOINTS.ME);
      setState((prev) => ({ ...prev, user }));
    } catch {
      // Silently fail — user will be logged out if 401
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
