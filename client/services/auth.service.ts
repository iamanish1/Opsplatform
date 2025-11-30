import apiClient from '@/lib/api';
import { setAuthToken, removeAuthToken } from '@/lib/auth';

export interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  githubUsername?: string;
  role: 'STUDENT' | 'COMPANY' | 'ADMIN';
  badge?: 'RED' | 'YELLOW' | 'GREEN';
  onboardingStep?: number;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: {
    code: string;
    message: string;
  };
}

export const authService = {
  /**
   * Initiate GitHub OAuth flow
   */
  async initiateGitHubOAuth(): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    window.location.href = `${apiUrl}/api/auth/github`;
  },

  /**
   * Handle GitHub OAuth callback (called by backend redirect)
   */
  async handleGitHubCallback(code: string): Promise<AuthResponse> {
    const response = await apiClient.get(`/api/auth/github/callback?code=${code}`);
    return response.data;
  },

  /**
   * Get authentication status
   */
  async getAuthStatus(): Promise<{ success: boolean; data?: User }> {
    const response = await apiClient.get('/api/auth/status');
    return response.data;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      removeAuthToken();
    }
  },

  /**
   * Company signup
   */
  async companySignup(data: { email: string; password: string; companyName: string }): Promise<AuthResponse> {
    const response = await apiClient.post('/api/company/signup', data);
    const result = response.data;
    if (result.success && result.data?.token) {
      setAuthToken(result.data.token);
    }
    return result;
  },

  /**
   * Company login
   */
  async companyLogin(data: { email: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post('/api/company/login', data);
    const result = response.data;
    if (result.success && result.data?.token) {
      setAuthToken(result.data.token);
    }
    return result;
  },
};

