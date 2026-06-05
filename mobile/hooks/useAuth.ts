import { useCallback, useState } from 'react';
import { useAuthContext } from '../lib/auth';
import type { ApiError } from '../lib/api';

interface UseAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  user: ReturnType<typeof useAuthContext>['user'];
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const auth = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await auth.login({ email, password });
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Login failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [auth]
  );

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      confirmPassword: string
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        await auth.register({
          username,
          email,
          password,
          confirm_password: confirmPassword,
        });
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Registration failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [auth]
  );

  const logout = useCallback(async () => {
    await auth.logout();
  }, [auth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    login,
    register,
    logout,
    isLoading,
    error,
    clearError,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
  };
}

export default useAuth;
