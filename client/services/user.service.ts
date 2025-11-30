import apiClient from '@/lib/api';
import { User } from './auth.service';

export const userService = {
  /**
   * Get current user profile
   */
  async getMe(): Promise<{ success: boolean; data?: User }> {
    const response = await apiClient.get('/api/user/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateUser(data: Partial<User>): Promise<{ success: boolean; data?: User }> {
    const response = await apiClient.patch('/api/user', data);
    return response.data;
  },
};

