'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type User } from '@/services/auth.service';
import { getAuthToken, setAuthToken, removeAuthToken } from '@/lib/auth';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await authService.getAuthStatus();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        removeAuthToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to get auth status:', error);
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.companyLogin({ email, password });
      if (response.success && response.data) {
        setAuthToken(response.data.token);
        setUser(response.data.user);
        router.push('/dashboard');
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [router]);

  const signup = useCallback(async (email: string, password: string, companyName: string) => {
    try {
      const response = await authService.companySignup({ email, password, companyName });
      if (response.success && response.data) {
        setAuthToken(response.data.token);
        setUser(response.data.user);
        router.push('/dashboard');
      } else {
        throw new Error(response.error?.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const loginWithGitHub = useCallback(async () => {
    await authService.initiateGitHubOAuth();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    loginWithGitHub,
    refreshUser,
  };
}

