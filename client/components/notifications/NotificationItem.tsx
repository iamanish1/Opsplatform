'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationService, Notification } from '@/services/notification.service';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: () => notificationService.markAsRead(notification.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => notificationService.deleteNotification(notification.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      toast.success('Notification deleted');
    },
  });

  return (
    <Card className={notification.read ? 'opacity-75' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{notification.title}</h4>
              {!notification.read && (
                <Badge variant="outline" className="bg-primary text-primary-foreground">
                  New
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
            {!notification.read && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => markReadMutation.mutate()}
                disabled={markReadMutation.isPending}
              >
                Mark as read
              </Button>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

