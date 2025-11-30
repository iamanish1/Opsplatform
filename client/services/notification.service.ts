import apiClient from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export const notificationService = {
  /**
   * Get notifications
   */
  async getNotifications(params?: { read?: boolean; page?: number; limit?: number }): Promise<{
    success: boolean;
    data?: {
      notifications: Notification[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.read !== undefined) queryParams.append('read', params.read.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/api/notifications?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ success: boolean; data?: { count: number } }> {
    const response = await apiClient.get('/api/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/api/notifications/${notificationId}/mark-read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await apiClient.post('/api/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },
};

