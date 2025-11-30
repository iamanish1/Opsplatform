'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';

export function useNotifications() {
  const { data: unreadCount } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return {
    unreadCount: unreadCount?.data?.count || 0,
  };
}

