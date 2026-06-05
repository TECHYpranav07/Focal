import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../constants/api';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('facesort_token'));
  const [loading, setLoading] = useState(true);

  // Configure global Axios headers on mount
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ME);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, { email, password });
      const { access_token } = response.data;
      localStorage.setItem('facesort_token', access_token);
      setToken(access_token);
    } catch (error: any) {
      setLoading(false);
      const detail = error.response?.data?.detail;
      let errMsg = 'Authentication failed';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map((err: any) => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ');
      }
      throw new Error(errMsg);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.REGISTER, {
        username,
        email,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem('facesort_token', access_token);
      setToken(access_token);
    } catch (error: any) {
      setLoading(false);
      const detail = error.response?.data?.detail;
      let errMsg = 'Registration failed';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map((err: any) => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ');
      }
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('facesort_token');
    localStorage.removeItem('facesort_active_event');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
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

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
